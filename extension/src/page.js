// Salva Stories — roda no mundo MAIN do instagram.com (precisa ver o React e o fetch da página).
// 1) Guarda os itens de story que o próprio Instagram baixa (sem requisição extra).
// 2) Descobre qual story está na tela (fiber do React → URL → nome do arquivo da imagem).
// 3) Desenha o botão e pede o download para a extensão (bridge.js → service worker).
// 4) Modo fantasma opcional: segura o aviso de "visto".
(() => {
  'use strict';
  if (window.__salvaStories) return;
  window.__salvaStories = true;

  const TAG = '[Salva Stories]';
  const ITEMS = new Map(); // pk -> item enxuto
  const REELS = new Map(); // pk -> lista ordenada de pks do mesmo reel (story de uma pessoa ou destaque)
  let settings = null; // chega do bridge
  let settingsResolve;
  const settingsReady = new Promise((r) => { settingsResolve = r; });
  setTimeout(() => { if (!settings) applySettings({}); }, 4000);

  // idioma da primeira abertura: o do navegador (pt, en ou es; qualquer outro → en). Regra 13.
  const NAV_LANG = (() => { const l = String(navigator.language || 'en').toLowerCase(); return l.startsWith('pt') ? 'pt' : l.startsWith('es') ? 'es' : 'en'; })();
  const DEFAULTS = { ghost: false, hotkey: true, showAll: true, lang: NAV_LANG };

  // ───────────────────────── idiomas (escolhidos pelas bandeiras do menu) ─────────────────────────
  const I18N = {
    pt: {
      saveOne: 'Salvar este story (D)', saveOneA: 'Salvar este story',
      saveAll: 'Salvar todos os stories desta pessoa (Shift+D)', saveAllA: 'Salvar todos os stories desta pessoa',
      ghostOn: 'Modo fantasma ligado', ghostSub: 'Ninguém vê que você assistiu', menu: 'Ajustes (Alt+S)',
      noStory: 'não achei o story na tela', noData: 'não achei os dados do story', noMedia: 'story sem mídia', nothing: 'nada para salvar',
      noReply: 'a extensão não respondeu (recarregue a página)', failed: 'falhou', notSaved: 'Não salvou: ',
      video: 'vídeo salvo', videoMute: 'vídeo salvo (sem som no original)', photo: 'foto salva',
      onlyOne: 'só este story estava carregado — salvo', many: (a, b) => `${a} de ${b} stories salvos`,
    },
    en: {
      saveOne: 'Save this story (D)', saveOneA: 'Save this story',
      saveAll: "Save all of this person's stories (Shift+D)", saveAllA: "Save all of this person's stories",
      ghostOn: 'Ghost mode on', ghostSub: "Nobody sees that you watched", menu: 'Settings (Alt+S)',
      noStory: "couldn't find the story on screen", noData: "couldn't find the story data", noMedia: 'story has no media', nothing: 'nothing to save',
      noReply: "the extension didn't respond (reload the page)", failed: 'failed', notSaved: 'Not saved: ',
      video: 'video saved', videoMute: 'video saved (original has no sound)', photo: 'photo saved',
      onlyOne: 'only this story was loaded — saved', many: (a, b) => `${a} of ${b} stories saved`,
    },
    es: {
      saveOne: 'Guardar esta historia (D)', saveOneA: 'Guardar esta historia',
      saveAll: 'Guardar todas las historias de esta persona (Shift+D)', saveAllA: 'Guardar todas las historias de esta persona',
      ghostOn: 'Modo fantasma activado', ghostSub: 'Nadie ve que la viste', menu: 'Ajustes (Alt+S)',
      noStory: 'no encontré la historia en pantalla', noData: 'no encontré los datos de la historia', noMedia: 'historia sin contenido', nothing: 'nada para guardar',
      noReply: 'la extensión no respondió (recarga la página)', failed: 'falló', notSaved: 'No se guardó: ',
      video: 'video guardado', videoMute: 'video guardado (el original no tiene sonido)', photo: 'foto guardada',
      onlyOne: 'solo esta historia estaba cargada — guardada', many: (a, b) => `${a} de ${b} historias guardadas`,
    },
  };
  function t(key, ...args) {
    const d = I18N[(settings && settings.lang) || NAV_LANG] || I18N.en;
    const v = d[key] !== undefined ? d[key] : I18N.pt[key];
    return typeof v === 'function' ? v(...args) : v;
  }
  function applySettings(s) {
    settings = Object.assign({}, DEFAULTS, s || {});
    settingsResolve();
    render();
  }

  // ───────────────────────── coleta dos itens ─────────────────────────
  function slim(x, username) {
    const user = (x.user && x.user.username) || username || '';
    return {
      pk: String(x.pk),
      media_type: x.media_type,
      has_audio: x.has_audio,
      taken_at: x.taken_at,
      user,
      images: (x.image_versions2 && x.image_versions2.candidates) || [],
      videos: x.video_versions || [],
      dash: x.video_dash_manifest || null,
    };
  }

  function isMedia(o) {
    return o && (o.pk || o.id) && (o.image_versions2 || o.video_versions) && typeof o.media_type === 'number';
  }

  function harvest(root) {
    const seen = new Set();
    let found = 0;
    (function walk(o, depth, ctxUser) {
      if (!o || typeof o !== 'object' || depth > 16 || seen.has(o)) return;
      seen.add(o);
      if (Array.isArray(o)) { for (const v of o) walk(v, depth + 1, ctxUser); return; }
      const user = (o.user && o.user.username) || ctxUser;
      if (Array.isArray(o.items) && o.items.length && o.items.every(isMedia)) {
        const pks = [];
        for (const it of o.items) {
          const s = slim(it, user);
          if (!s.pk || s.pk === 'undefined') continue;
          ITEMS.set(s.pk, s);
          pks.push(s.pk);
          found++;
        }
        for (const pk of pks) REELS.set(pk, pks);
      } else if (isMedia(o)) {
        const s = slim(o, user);
        if (s.pk && s.pk !== 'undefined' && !ITEMS.has(s.pk)) { ITEMS.set(s.pk, s); found++; }
      }
      for (const k in o) {
        const v = o[k];
        if (v && typeof v === 'object') walk(v, depth + 1, user);
      }
    })(root, 0, '');
    return found;
  }

  // ───────────────────────── registro (vai junto no "Relatar bug") ─────────────────────────
  // Só o que a extensão fez: contagens, tipos e erros. Nada da conta (sem usuário, e-mail, token ou cookie).
  const LOG = [];
  // msg pode ser texto (erro cru do navegador/Instagram) ou { pt, en, es }: o relatório mostra no idioma escolhido (regra 13)
  function log(level, msg) {
    const m = msg && typeof msg === 'object' ? { pt: String(msg.pt).slice(0, 240), en: String(msg.en).slice(0, 240), es: String(msg.es).slice(0, 240) } : String(msg).slice(0, 240);
    LOG.push({ t: Date.now(), level: level || 'info', msg: m });
    if (LOG.length > 150) LOG.splice(0, LOG.length - 150);
  }
  // erros dos nossos scripts (o endereço do arquivo é chrome-extension://…/src/x.js)
  addEventListener('error', (e) => {
    const f = String((e && e.filename) || '');
    if (/^(chrome|moz)-extension:\/\//.test(f)) log('error', `${(e.message || 'error').slice(0, 160)} @ ${f.split('/').slice(-2).join('/')}:${e.lineno || 0}`);
  }, true);
  addEventListener('unhandledrejection', (e) => {
    const st = String((e && e.reason && e.reason.stack) || '');
    if (/(chrome|moz)-extension:\/\//.test(st)) log('error', 'promise: ' + String((e.reason && e.reason.message) || e.reason).slice(0, 160));
  });

  const dataListeners = [];
  function emitData(obj) { for (const fn of dataListeners) { try { fn(obj); } catch (_) {} } }
  function parseMaybe(text) {
    if (typeof text !== 'string' || text.indexOf('image_versions2') === -1) return;
    try {
      const t = text.replace(/^for \(;;\);/, '');
      // GraphQL às vezes devolve várias linhas JSON (streaming)
      if (t.indexOf('\n{') !== -1) {
        for (const line of t.split('\n')) { if (line.trim()) { try { const o = JSON.parse(line); harvest(o); emitData(o); } catch (_) {} } }
      } else {
        const o = JSON.parse(t);
        harvest(o);
        emitData(o);
      }
    } catch (_) { /* não é JSON — ignora */ }
  }

  const WATCH = /\/graphql|\/api\/v1\/(feed|media|stories|highlights)/;

  // ───────────────────────── modo fantasma ─────────────────────────
  const SEEN_MARKERS = ['PolarisAPIReelSeenMutation', 'PolarisAPIForceStorySeenMutation', 'viewSeenAt', 'reel_seen', 'ReelSeen', 'StorySeen'];
  const SEEN_URL = /\/api\/v\d\/(stories\/reel\/seen|media\/seen)/;
  function looksSeen(url, method, body) {
    if (String(method || 'GET').toUpperCase() !== 'POST') return false;
    if (SEEN_URL.test(url)) return true;
    if (url.indexOf('/graphql') === -1 || typeof body !== 'string') return false;
    return SEEN_MARKERS.some((m) => body.indexOf(m) !== -1);
  }
  function bodyToText(body) {
    if (typeof body === 'string') return body;
    if (body instanceof URLSearchParams) return body.toString();
    if (body instanceof FormData) { const p = []; for (const [k, v] of body.entries()) if (typeof v === 'string') p.push(k + '=' + v); return p.join('&'); }
    return '';
  }

  // ───────────────────────── ganchos de rede ─────────────────────────
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const first = args[0];
    const req = typeof Request !== 'undefined' && first instanceof Request ? first : null;
    const url = typeof first === 'string' ? first : req ? req.url : String(first || '');
    const opts = args[1] || {};
    const method = opts.method || (req && req.method) || 'GET';
    if (String(method).toUpperCase() === 'POST' && (url.indexOf('/graphql') !== -1 || SEEN_URL.test(url))) {
      let text = bodyToText(opts.body);
      if (!text && req) { try { text = await req.clone().text(); } catch (_) {} }
      if (looksSeen(url, method, text)) {
        await settingsReady;
        if (settings.ghost) {
          console.debug(TAG, 'visto bloqueado (fetch)');
          return new Response('{"status":"ok"}', { status: 200, headers: { 'content-type': 'application/json' } });
        }
      }
    }
    const res = await origFetch.apply(this, args);
    if (WATCH.test(url)) {
      try { res.clone().text().then(parseMaybe, () => {}); } catch (_) {}
    }
    return res;
  };

  const XO = XMLHttpRequest.prototype.open;
  const XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__ssMethod = method;
    this.__ssUrl = String(url);
    return XO.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (body) {
    const url = this.__ssUrl || '';
    const xhr = this;
    if (WATCH.test(url)) {
      xhr.addEventListener('load', () => {
        try {
          if (xhr.responseType === '' || xhr.responseType === 'text') parseMaybe(xhr.responseText);
          else if (xhr.responseType === 'json' && xhr.response) harvest(xhr.response);
        } catch (_) {}
      });
    }
    const text = bodyToText(body);
    if (looksSeen(url, this.__ssMethod, text)) {
      if (settings) {
        if (settings.ghost) { console.debug(TAG, 'visto bloqueado (xhr)'); return; }
      } else {
        settingsReady.then(() => { if (!settings.ghost) XS.call(xhr, body); else console.debug(TAG, 'visto bloqueado (xhr)'); });
        return;
      }
    }
    return XS.call(this, body);
  };

  // Itens que vieram embutidos no HTML (abrir /stories/... direto pela URL)
  function harvestInline() {
    for (const s of document.querySelectorAll('script[type="application/json"]')) {
      const t = s.textContent;
      if (t && t.indexOf('image_versions2') !== -1 && !s.__ssSeen) { try { const o = JSON.parse(t); s.__ssSeen = true; harvest(o); emitData(o); } catch (_) {} }
    }
  }

  // ───────────────────────── story na tela ─────────────────────────
  function fiberOf(el) {
    for (const k in el) if (k.startsWith('__reactFiber$')) return el[k];
    return null;
  }

  // vídeos/imagens grandes que cobrem o centro da tela, do maior para o menor
  function centerMedia() {
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const list = [];
    for (const el of document.querySelectorAll('video, img')) {
      const r = el.getBoundingClientRect();
      if (r.width < 180 || r.height < 280) continue;
      if (r.left > cx || r.right < cx || r.top > cy || r.bottom < cy) continue;
      list.push({ el, area: r.width * r.height });
    }
    return list.sort((a, b) => b.area - a.area).map((x) => x.el);
  }
  function activeMedia() {
    return centerMedia()[0] || null;
  }

  const base = (u) => String(u || '').split('?')[0].split('/').pop();

  function pkFromFiber(el) {
    let f = fiberOf(el);
    for (let d = 0; f && d < 50; d++, f = f.return) {
      const p = f.memoizedProps;
      if (!p || typeof p !== 'object') continue;
      if (p.media && typeof p.media.__id === 'string') {
        const m = p.media.__id.match(/(\d{6,})/);
        if (m) return m[1];
      }
      if (p.media && p.media.pk) return String(p.media.pk);
      const meta = p.coreVideoPlayerMetaData || (p.coreVideoPlayerProps && p.coreVideoPlayerProps.coreVideoPlayerMetaData);
      if (meta && meta.videoFBID) return String(meta.videoFBID);
    }
    return null;
  }

  function pkFromImage(el) {
    if (el.tagName !== 'IMG') return null;
    const b = base(el.currentSrc || el.src);
    if (!b) return null;
    for (const it of ITEMS.values()) if (it.images.some((c) => base(c.url) === b)) return it.pk;
    return null;
  }

  function pkFromUrl() {
    const m = location.pathname.match(/^\/stories\/(?!highlights\/)[^/]+\/(\d+)/);
    return m ? m[1] : null;
  }

  // A URL muda na hora em que o story troca; o DOM pode ficar uns instantes com o anterior
  // (animação). Se algum elemento do centro é o story da URL, ele vence. Senão, o maior.
  function currentPk() {
    const els = centerMedia();
    if (!els.length) return null;
    const urlPk = pkFromUrl();
    const pks = els.map((el) => pkFromFiber(el) || pkFromImage(el));
    if (urlPk && pks.includes(urlPk)) return urlPk;
    return pks.find(Boolean) || urlPk;
  }

  // ───────────────────────── API (plano B) ─────────────────────────
  function appId() {
    const m = document.documentElement.innerHTML.match(/"(?:X-IG-App-ID|appId|APP_ID)"\s*:\s*"(\d{10,})"/);
    return m ? m[1] : '936619743392459';
  }
  function csrf() {
    const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m ? m[1] : '';
  }
  async function fetchItem(pk) {
    const res = await origFetch(`/api/v1/media/${pk}/info/`, {
      credentials: 'include',
      headers: { 'x-ig-app-id': appId(), 'x-csrftoken': csrf(), 'x-requested-with': 'XMLHttpRequest' },
    });
    if (!res.ok) throw new Error('media/info HTTP ' + res.status);
    harvest(await res.json());
    return ITEMS.get(String(pk));
  }
  async function getItem(pk) {
    return ITEMS.get(pk) || (await fetchItem(pk));
  }

  // ───────────────────────── montar o download ─────────────────────────
  const area = (c) => (c.width || 0) * (c.height || 0);
  function pad(n) { return String(n).padStart(2, '0'); }
  function stamp(sec) {
    const d = sec ? new Date(sec * 1000) : new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }
  function extOf(url, fallback) {
    const m = base(url).match(/\.(jpe?g|png|webp|heic|mp4|m4v)$/i);
    return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : fallback;
  }

  function dashJob(item) {
    const doc = new DOMParser().parseFromString(item.dash, 'text/xml');
    let bestV = null, bestA = null;
    for (const rep of doc.querySelectorAll('Representation')) {
      const set = rep.parentElement;
      const kind = (rep.getAttribute('mimeType') || set.getAttribute('mimeType') || set.getAttribute('contentType') || '').toLowerCase();
      const url = rep.querySelector('BaseURL') && rep.querySelector('BaseURL').textContent.trim();
      if (!url) continue;
      const bw = +rep.getAttribute('bandwidth') || 0;
      const px = (+rep.getAttribute('width') || 0) * (+rep.getAttribute('height') || 0);
      const h = +rep.getAttribute('height') || 0;
      if (kind.includes('video')) { if (!bestV || px > bestV.px || (px === bestV.px && bw > bestV.bw)) bestV = { url, px, bw, h }; }
      else if (kind.includes('audio')) { if (!bestA || bw > bestA.bw) bestA = { url, bw }; }
    }
    if (!bestV) return null;
    return { video: bestV.url, height: bestV.h, px: bestV.px, audio: item.has_audio === false ? null : bestA && bestA.url };
  }

  function buildJob(item, order) {
    const name = `${item.user || 'instagram'}_${stamp(item.taken_at)}_${item.pk}`;
    const job = { user: item.user || 'instagram', name, order, sub: 'stories' };
    if (item.media_type === 2) {
      // MP4 progressivo (vídeo + som num arquivo só). O Instagram limita esse arquivo a 720p;
      // quando o DASH tem mais resolução, o service worker junta vídeo + áudio DASH (com o progressivo de reserva).
      const vids = item.videos.slice().sort((a, b) => area(b) - area(a));
      const prog = vids.length && vids[0].url ? vids[0] : null;
      let dash = null;
      try { dash = item.dash ? dashJob(item) : null; } catch (_) { dash = null; }
      // o progressivo costuma vir sem dimensões no GraphQL; o teto conhecido é 720p (720×1280)
      const progArea = prog ? (area(prog) || 720 * 1280) : 0;
      const better = dash && dash.px > progArea * 1.1 ? { url: dash.video, audioUrl: dash.audio, height: dash.height } : null;
      if (prog) {
        return Object.assign(job, { kind: 'url', url: prog.url, ext: 'mp4', type: 'video', audio: item.has_audio !== false, hq: better });
      }
      if (dash) {
        return Object.assign(job, { kind: dash.audio ? 'dash' : 'url', url: dash.video, audioUrl: dash.audio, ext: 'mp4', type: 'video', audio: !!dash.audio });
      }
    }
    const imgs = item.images.slice().sort((a, b) => area(b) - area(a));
    if (!imgs.length) return null;
    return Object.assign(job, { kind: 'url', url: imgs[0].url, ext: extOf(imgs[0].url, 'jpg'), type: 'image' });
  }

  // ───────────────────────── ponte com a extensão ─────────────────────────
  let reqId = 0;
  const pending = new Map();
  window.addEventListener('message', (ev) => {
    if (ev.source !== window || !ev.data || ev.data.__salvaStories !== 'ext') return;
    const d = ev.data;
    if (d.kind === 'settings') applySettings(d.settings);
    if (d.kind === 'result' && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); }
  });
  function askExtension(jobs) {
    return new Promise((resolve) => {
      const id = ++reqId;
      pending.set(id, resolve);
      window.postMessage({ __salvaStories: 'page', kind: 'download', id, jobs }, location.origin);
      setTimeout(() => { if (pending.has(id)) { pending.delete(id); resolve({ ok: false, error: t('noReply') }); } }, 120000);
    });
  }
  window.postMessage({ __salvaStories: 'page', kind: 'hello' }, location.origin);

  async function downloadCurrent() {
    harvestInline();
    const pk = currentPk();
    if (!pk) throw new Error(t('noStory'));
    const item = await getItem(pk);
    if (!item) throw new Error(t('noData') + ' ' + pk);
    const job = buildJob(item, 1);
    if (!job) throw new Error(t('noMedia'));
    const r = await askExtension([job]);
    if (!r.ok) throw new Error(r.error || t('failed'));
    return job.type === 'video' ? (job.audio ? t('video') : t('videoMute')) : t('photo');
  }

  async function downloadAll() {
    harvestInline();
    const pk = currentPk();
    if (!pk) throw new Error(t('noStory'));
    if (!ITEMS.has(pk)) await fetchItem(pk);
    // Usa só o que o próprio Instagram já carregou para o visualizador (nenhuma chamada extra
    // de API em lote — é o tipo de coisa que dispara a checagem de automação).
    const pks = REELS.get(pk) || [pk];
    const jobs = [];
    for (let i = 0; i < pks.length; i++) {
      const it = ITEMS.get(pks[i]);
      const j = it && buildJob(it, i + 1);
      if (j) jobs.push(j);
    }
    if (!jobs.length) throw new Error(t('nothing'));
    const r = await askExtension(jobs);
    if (!r.ok) throw new Error(r.error || t('failed'));
    if (pks.length === 1) return t('onlyOne');
    return t('many', r.count, jobs.length);
  }

  // ───────────────────────── interface ─────────────────────────
  let host, shadow, wrap, btnOne, btnAll, btnMenu, ghostEl, toastEl, labelsLang = null;
  function applyLabels() {
    const lang = (settings && settings.lang) || 'pt';
    if (lang === labelsLang) return;
    labelsLang = lang;
    btnOne.title = t('saveOne'); btnOne.setAttribute('aria-label', t('saveOneA'));
    btnAll.title = t('saveAll'); btnAll.setAttribute('aria-label', t('saveAllA'));
    btnMenu.title = t('menu'); btnMenu.setAttribute('aria-label', t('menu'));
    ghostEl.setAttribute('aria-label', t('ghostOn'));
    ghostEl.querySelector('.tip b').textContent = t('ghostOn');
    ghostEl.querySelector('.tip span').textContent = t('ghostSub');
  }
  const ICON_DL = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>';
  const ICON_ALL = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="12" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/><path d="M9 11v6"/><path d="m6.5 14.5 2.5 2.5 2.5-2.5"/></svg>';
  const ICON_OK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
  // fantasminha: só indica que o modo fantasma está ligado (não é botão)
  const ICON_GHOST = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3a7 7 0 0 0-7 7v10.6l2.33-1.75 2.34 1.75L12 18.85l2.33 1.75 2.34-1.75L19 20.6V10a7 7 0 0 0-7-7z"/><circle cx="9.5" cy="10.5" r="1.25" fill="currentColor" stroke="none"/><circle cx="14.5" cy="10.5" r="1.25" fill="currentColor" stroke="none"/></svg>';
  const ICON_GEAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>';
  const ICON_ERR = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function ensureUI() {
    if (host && host.isConnected) return;
    host = document.createElement('salva-stories');
    host.style.cssText = 'position:fixed;z-index:2147483646;top:0;left:0;display:none;';
    shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap { display:flex; flex-direction:column; gap:10px; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        button { all: unset; box-sizing:border-box; width:44px; height:44px; border-radius:50%; display:grid; place-items:center; cursor:pointer;
          color:#fff; background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.28); backdrop-filter: blur(6px);
          box-shadow: 0 2px 10px rgba(0,0,0,.35); transition: transform .12s ease, background .12s ease; }
        button:hover { background:rgba(0,0,0,.75); transform: scale(1.06); }
        button:focus-visible { outline:2px solid #fff; outline-offset:2px; }
        button.busy svg { animation: spin 1s linear infinite; opacity:.85; }
        button.ok { background:#1f9d55; border-color:#1f9d55; }
        button.err { background:#d93a3a; border-color:#d93a3a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .toast { position:fixed; left:50%; bottom:28px; transform:translateX(-50%); padding:10px 16px; border-radius:10px; background:rgba(20,20,20,.92);
          color:#fff; font-size:14px; line-height:1.3; max-width:80vw; box-shadow:0 4px 18px rgba(0,0,0,.4); opacity:0; transition:opacity .2s; pointer-events:none; }
        .toast.show { opacity:1; }
        .ghost { position:relative; width:44px; height:44px; margin-top:4px; border-radius:50%; display:grid; place-items:center; cursor:default;
          color:#fff; background:rgba(20,10,30,.55); backdrop-filter: blur(6px); box-shadow: 0 2px 14px rgba(150,47,191,.45); user-select:none; }
        .ghost::before { content:""; position:absolute; inset:0; border-radius:50%; padding:1.5px;
          background:linear-gradient(135deg,#962fbf,#d62976 55%,#fa7e1e);
          -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; }
        .ghost svg { filter: drop-shadow(0 0 4px rgba(214,41,118,.7)); animation: float 3.2s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(1px); opacity:.95; } 50% { transform: translateY(-2px); opacity:.7; } }
        @media (prefers-reduced-motion: reduce) { .ghost svg { animation:none; } }
        .tip { position:absolute; left:calc(100% + 12px); top:50%; transform:translate(-6px,-50%); white-space:nowrap; pointer-events:none;
          padding:8px 12px; border-radius:10px; background:rgba(18,12,24,.94); color:#fff; font-size:13px; line-height:1.3;
          box-shadow:0 6px 22px rgba(0,0,0,.45), 0 0 0 1px rgba(214,41,118,.35); opacity:0; transition:opacity .18s ease, transform .18s ease; }
        .tip b { display:block; font-weight:700; background:linear-gradient(90deg,#c77dff,#ff5fa2 55%,#ffb36b); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .tip span { display:block; color:rgba(255,255,255,.7); font-size:11.5px; }
        .tip::after { content:""; position:absolute; right:100%; top:50%; transform:translateY(-50%); border:6px solid transparent; border-right-color:rgba(18,12,24,.94); }
        /* sem espaço à direita (janela estreita): o balão vai para a esquerda */
        .ghost.flip .tip { left:auto; right:calc(100% + 12px); transform:translate(6px,-50%); }
        .ghost.flip .tip::after { right:auto; left:100%; border-right-color:transparent; border-left-color:rgba(18,12,24,.94); }
        .ghost:hover .tip { opacity:1; transform:translate(0,-50%); }
        /* engrenagem: abre o menu (menor e mais discreta que os botões de salvar) */
        button.menu { width:34px; height:34px; margin:2px 0 0 5px; background:rgba(0,0,0,.4); border-color:rgba(255,255,255,.2); }
        button.menu:hover { transform: rotate(45deg) scale(1.06); }
      </style>
      <div class="wrap">
        <button class="one">${ICON_DL}</button>
        <button class="all">${ICON_ALL}</button>
        <div class="ghost" role="img" style="display:none">${ICON_GHOST}<div class="tip"><b></b><span></span></div></div>
        <button class="menu">${ICON_GEAR}</button>
      </div>
      <div class="toast" role="status"></div>`;
    wrap = shadow.querySelector('.wrap');
    btnOne = shadow.querySelector('.one');
    btnAll = shadow.querySelector('.all');
    ghostEl = shadow.querySelector('.ghost');
    btnMenu = shadow.querySelector('.menu');
    labelsLang = null;
    toastEl = shadow.querySelector('.toast');
    for (const ev of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'keydown']) {
      host.addEventListener(ev, (e) => e.stopPropagation());
    }
    btnOne.addEventListener('click', () => run(btnOne, ICON_DL, downloadCurrent));
    btnAll.addEventListener('click', () => run(btnAll, ICON_ALL, downloadAll));
    // o menu (menu.js) abre ao lado da engrenagem
    btnMenu.addEventListener('click', () => {
      const r = btnMenu.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('salva-stories:menu', { detail: { rect: { left: r.left, right: r.right, top: r.top - 60, bottom: r.bottom, width: r.width, height: r.height } } }));
    });
    (document.body || document.documentElement).appendChild(host);
  }

  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  async function run(btn, icon, fn) {
    if (btn.classList.contains('busy')) return;
    btn.classList.remove('ok', 'err');
    btn.classList.add('busy');
    try {
      const msg = await fn();
      btn.classList.remove('busy'); btn.classList.add('ok'); btn.innerHTML = ICON_OK;
      toast(msg);
      log('info', { pt: 'story salvo: ' + msg, en: 'story saved: ' + msg, es: 'historia guardada: ' + msg });
    } catch (e) {
      console.warn(TAG, e);
      { const em = String((e && e.message) || e).replace(/\d{8,}/g, '#').slice(0, 160); log('error', { pt: 'story não salvo: ' + em, en: 'story not saved: ' + em, es: 'historia no guardada: ' + em }); }
      btn.classList.remove('busy'); btn.classList.add('err'); btn.innerHTML = ICON_ERR;
      toast(t('notSaved') + (e && e.message ? e.message : e));
    }
    setTimeout(() => { btn.classList.remove('ok', 'err'); btn.innerHTML = icon; }, 1600);
  }

  function render() {
    const onStories = location.pathname.startsWith('/stories/');
    const el = onStories ? activeMedia() : null;
    if (!el) { if (host) host.style.display = 'none'; return; }
    ensureUI();
    btnAll.style.display = settings && settings.showAll === false ? 'none' : '';
    ghostEl.style.display = settings && settings.ghost ? '' : 'none';
    applyLabels();
    const r = el.getBoundingClientRect();
    const w = 44;
    // fora do card, à direita; se não couber, dentro do card
    let left = r.right + 14;
    if (left + w > innerWidth - 8) left = r.right - w - 12;
    const top = Math.max(8, r.top + 72);
    host.style.left = Math.round(left) + 'px';
    host.style.top = Math.round(top) + 'px';
    host.style.display = 'block';
    const tipW = (ghostEl.querySelector('.tip') || {}).offsetWidth || 220;
    ghostEl.classList.toggle('flip', innerWidth - (left + w) < tipW + 24);
  }

  setInterval(render, 300);
  addEventListener('resize', render);

  addEventListener('keydown', (e) => {
    if (!settings || !settings.hotkey || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== 'd' && e.key !== 'D') return;
    // tecla digitada dentro do menu (shadow DOM fechado: daqui de fora o alvo aparece como o próprio <salva-stories-menu>)
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (t && (t.tagName === 'SALVA-STORIES-MENU' || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!location.pathname.startsWith('/stories/') || !host || host.style.display === 'none') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) run(btnAll, ICON_ALL, downloadAll);
    else run(btnOne, ICON_DL, downloadCurrent);
  }, true);

  // ───────────────────────── API para os outros módulos (mesmo mundo MAIN) ─────────────────────────
  Object.defineProperty(window, Symbol.for('salvaStories.api'), {
    value: Object.freeze({
      items: ITEMS,
      getItem, fetchItem, buildJob, askExtension, harvest, harvestInline, slim, stamp,
      onData: (fn) => { dataListeners.push(fn); },
      settings: () => settings,
      whenSettings: () => settingsReady,
      appId, csrf, fiberOf, pkFromFiber, log, logs: () => LOG.slice(), itemCount: () => ITEMS.size, ITEMS_HAS: (pk) => ITEMS.has(String(pk)),
      lang: () => (settings && settings.lang) || NAV_LANG,
    }),
  });
  // depuração pelo console: __salvaStoriesDebug()
  window.__salvaStoriesDebug = () => ({ items: ITEMS.size, reels: new Set(REELS.values()).size, current: currentPk(), settings });
})();
