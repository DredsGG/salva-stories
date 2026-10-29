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
  const POSTS = new Map(); // código do post (/p/{code}/) -> { code, pk, user, taken_at, parts: [itens enxutos, na ordem do carrossel] }
  const POST_PK = new Map(); // pk do post -> código
  let settings = null; // chega do bridge
  let settingsResolve;
  const settingsReady = new Promise((r) => { settingsResolve = r; });
  setTimeout(() => { if (!settings) applySettings({}); }, 4000);

  // idioma da primeira abertura: o do navegador (pt, en ou es; qualquer outro → en). Regra 13.
  const NAV_LANG = (() => { const l = String(navigator.language || 'en').toLowerCase(); return l.startsWith('pt') ? 'pt' : l.startsWith('es') ? 'es' : 'en'; })();
  const DEFAULTS = { ghost: false, hotkey: true, showAll: true, postBtn: true, storySpeed: true, lang: NAV_LANG };

  // ───────────────────────── idiomas (escolhidos pelas bandeiras do menu) ─────────────────────────
  const I18N = {
    pt: {
      saveOne: 'Salvar este story (D)', saveOneA: 'Salvar este story',
      saveAll: 'Salvar todos os stories desta pessoa (Shift+D)', saveAllA: 'Salvar todos os stories desta pessoa',
      ghostOn: 'Modo fantasma ligado', ghostSub: 'Ninguém vê que você assistiu', ghostClick: 'Clique para desligar', ghostOffA: 'Desligar o modo fantasma', ghostOffDone: 'Modo fantasma desligado: quem postou vê que você assistiu.', ghostOffT: 'Modo fantasma desligado', ghostOffSub: 'Quem postou vê que você assistiu', ghostOnClick: 'Clique para ligar', ghostOnA: 'Ligar o modo fantasma', ghostOnDone: 'Modo fantasma ligado: ninguém vê que você assistiu.', menu: 'Ajustes (Alt+S)',
      count: (i, n) => i ? `Item ${i} de ${n} do carrossel` : `Carrossel com ${n} itens`,
      speed: 'Velocidade do vídeo', speedPhoto: 'Velocidade (só em story de vídeo)', speedSet: (r) => 'Velocidade: ' + r,
      noStory: 'não achei o story na tela', noData: 'não achei os dados do story', noMedia: 'story sem mídia', nothing: 'nada para salvar',
      noReply: 'a extensão não respondeu (recarregue a página)', failed: 'falhou', notSaved: 'Não salvou: ',
      video: 'vídeo salvo', videoMute: 'vídeo salvo (sem som no original)', photo: 'foto salva',
      onlyOne: 'só este story estava carregado — salvo', many: (a, b) => `${a} de ${b} stories salvos`,
      savePhoto: 'Salvar esta foto (D)', savePhotoA: 'Salvar esta foto', saveVideo: 'Salvar este vídeo (D)', saveVideoA: 'Salvar este vídeo',
      savePost: 'Salvar todas do carrossel (Shift+D)', savePostA: 'Salvar todas do carrossel',
      noPost: 'não achei os dados do post (recarregue a página)', urgent: 'atualização urgente pendente: atualize a extensão para voltar a baixar', postMany: (a, b) => `${a} de ${b} do carrossel salvos`,
    },
    en: {
      saveOne: 'Save this story (D)', saveOneA: 'Save this story',
      saveAll: "Save all of this person's stories (Shift+D)", saveAllA: "Save all of this person's stories",
      ghostOn: 'Ghost mode on', ghostSub: "Nobody sees that you watched", ghostClick: 'Click to turn it off', ghostOffA: 'Turn off ghost mode', ghostOffDone: 'Ghost mode off: the poster sees that you watched.', ghostOffT: 'Ghost mode off', ghostOffSub: 'The poster sees that you watched', ghostOnClick: 'Click to turn it on', ghostOnA: 'Turn on ghost mode', ghostOnDone: 'Ghost mode on: nobody sees that you watched.', menu: 'Settings (Alt+S)',
      count: (i, n) => i ? `Item ${i} of ${n} in the carousel` : `Carousel with ${n} items`,
      speed: 'Video speed', speedPhoto: 'Speed (video stories only)', speedSet: (r) => 'Speed: ' + r,
      noStory: "couldn't find the story on screen", noData: "couldn't find the story data", noMedia: 'story has no media', nothing: 'nothing to save',
      noReply: "the extension didn't respond (reload the page)", failed: 'failed', notSaved: 'Not saved: ',
      video: 'video saved', videoMute: 'video saved (original has no sound)', photo: 'photo saved',
      onlyOne: 'only this story was loaded — saved', many: (a, b) => `${a} of ${b} stories saved`,
      savePhoto: 'Save this photo (D)', savePhotoA: 'Save this photo', saveVideo: 'Save this video (D)', saveVideoA: 'Save this video',
      savePost: 'Save the whole carousel (Shift+D)', savePostA: 'Save the whole carousel',
      noPost: "couldn't find the post data (reload the page)", urgent: 'urgent update pending: update the extension to download again', postMany: (a, b) => `${a} of ${b} carousel items saved`,
    },
    es: {
      saveOne: 'Guardar esta historia (D)', saveOneA: 'Guardar esta historia',
      saveAll: 'Guardar todas las historias de esta persona (Shift+D)', saveAllA: 'Guardar todas las historias de esta persona',
      ghostOn: 'Modo fantasma activado', ghostSub: 'Nadie ve que la viste', ghostClick: 'Haz clic para desactivarlo', ghostOffA: 'Desactivar el modo fantasma', ghostOffDone: 'Modo fantasma desactivado: quien publicó ve que la viste.', ghostOffT: 'Modo fantasma desactivado', ghostOffSub: 'Quien publicó ve que la viste', ghostOnClick: 'Haz clic para activarlo', ghostOnA: 'Activar el modo fantasma', ghostOnDone: 'Modo fantasma activado: nadie ve que la viste.', menu: 'Ajustes (Alt+S)',
      count: (i, n) => i ? `Elemento ${i} de ${n} del carrusel` : `Carrusel con ${n} elementos`,
      speed: 'Velocidad del video', speedPhoto: 'Velocidad (solo en historias de video)', speedSet: (r) => 'Velocidad: ' + r,
      noStory: 'no encontré la historia en pantalla', noData: 'no encontré los datos de la historia', noMedia: 'historia sin contenido', nothing: 'nada para guardar',
      noReply: 'la extensión no respondió (recarga la página)', failed: 'falló', notSaved: 'No se guardó: ',
      video: 'video guardado', videoMute: 'video guardado (el original no tiene sonido)', photo: 'foto guardada',
      onlyOne: 'solo esta historia estaba cargada — guardada', many: (a, b) => `${a} de ${b} historias guardadas`,
      savePhoto: 'Guardar esta foto (D)', savePhotoA: 'Guardar esta foto', saveVideo: 'Guardar este video (D)', saveVideoA: 'Guardar este video',
      savePost: 'Guardar todo el carrusel (Shift+D)', savePostA: 'Guardar todo el carrusel',
      noPost: 'no encontré los datos de la publicación (recarga la página)', urgent: 'actualización urgente pendiente: actualiza la extensión para volver a descargar', postMany: (a, b) => `${a} de ${b} del carrusel guardados`,
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

  // post do feed/perfil (foto, vídeo ou carrossel): guarda pelo código da URL, com as partes na ordem do carrossel
  function notePost(o, user) {
    if (typeof o.code !== 'string' || !o.code || !(o.pk || o.id)) return;
    const car = Array.isArray(o.carousel_media) && o.carousel_media.length ? o.carousel_media : null;
    if (!car && !isMedia(o)) return;
    const old = POSTS.get(o.code);
    if (old && old.parts.length >= (car ? car.length : 1)) return;
    const owner = (o.user && o.user.username) || (o.owner && o.owner.username) || user || '';
    const parts = (car || [o]).map((m, i) => {
      const s = slim(Object.assign({}, m, { taken_at: m.taken_at || o.taken_at, user: m.user || o.user }), owner);
      if (!s.pk || s.pk === 'undefined') s.pk = String(o.pk || o.id) + '_' + i;
      return s;
    });
    const pk = String(o.pk || o.id).split('_')[0];
    POSTS.set(o.code, { code: o.code, pk, user: owner, taken_at: o.taken_at, parts });
    POST_PK.set(pk, o.code);
  }

  // foto de perfil em alta (a resposta do perfil traz hd_profile_pic_url_info com o tamanho original, até 1080×1080;
  // medido em 28/10/2026). Guarda por usuário para a foto grande do perfil (avatar.js).
  const AVATARS = new Map(); // username(lower) -> { url, w, h }
  function noteAvatar(o) {
    const hd = o.hd_profile_pic_url_info;
    if (!hd || typeof hd.url !== 'string' || typeof o.username !== 'string') return;
    const key = o.username.toLowerCase(), old = AVATARS.get(key);
    if (old && old.url === hd.url) return;
    AVATARS.set(key, { url: hd.url, w: hd.width || 0, h: hd.height || 0, at: Date.now() });
  }
  function scanAvatars(text) {
    if (typeof text !== 'string' || text.indexOf('hd_profile_pic_url_info') === -1) return;
    const walk = (o, d) => {
      if (!o || typeof o !== 'object' || d > 40) return;
      if (Array.isArray(o)) { for (const v of o) walk(v, d + 1); return; }
      noteAvatar(o);
      for (const k in o) { const v = o[k]; if (v && typeof v === 'object') walk(v, d + 1); }
    };
    const t = text.replace(/^for \(;;\);/, '');
    for (const line of t.indexOf('\n{') !== -1 ? t.split('\n') : [t]) { if (line.trim()) { try { walk(JSON.parse(line), 0); } catch (_) {} } }
  }

  function harvest(root) {
    const seen = new Set();
    let found = 0;
    (function walk(o, depth, ctxUser) {
      if (!o || typeof o !== 'object' || depth > 24 || seen.has(o)) return; // feed da página inicial no HTML: o post fica no nível 17 (medido em 28/10/2026)
      seen.add(o);
      if (Array.isArray(o)) { for (const v of o) walk(v, depth + 1, ctxUser); return; }
      const user = (o.user && o.user.username) || ctxUser;
      notePost(o, user);
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
    scanAvatars(text);
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
          else if (xhr.responseType === 'json' && xhr.response) { harvest(xhr.response); try { scanAvatars(JSON.stringify(xhr.response)); } catch (_) {} }
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
      if (t && !s.__ssAv && t.indexOf('hd_profile_pic_url_info') !== -1) { s.__ssAv = true; scanAvatars(t); }
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

  // ───────────────────────── post aberto (/p/{code}/, no modal ou na página) ─────────────────────────
  const POST_RE = /^\/(?:[A-Za-z0-9._]{1,30}\/)?p\/([A-Za-z0-9_-]{5,})/;
  const postCode = () => { const m = location.pathname.match(POST_RE); return m ? m[1] : null; };
  const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  // os 11 primeiros caracteres do código são o id da mídia (o código longo de conta privada traz mais coisa depois)
  function codeToPk(code) {
    let id = 0n;
    for (const c of String(code).slice(0, 11)) { const i = ALPH.indexOf(c); if (i < 0) return null; id = id * 64n + BigInt(i); }
    return id ? id.toString() : null;
  }
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  // maior ancestral com o mesmo retângulo da mídia (o "slide": imagem + camadas do Instagram por cima)
  function slideOf(el) {
    const r = el.getBoundingClientRect();
    let box = el;
    for (let a = el.parentElement, d = 0; a && d < 14; a = a.parentElement, d++) {
      const q = a.getBoundingClientRect();
      if (Math.abs(q.left - r.left) > 4 || Math.abs(q.top - r.top) > 4 || Math.abs(q.width - r.width) > 4 || Math.abs(q.height - r.height) > 4) break;
      box = a;
    }
    return box;
  }
  // janela da mídia: no carrossel, o ancestral que recorta os slides (não se mexe quando a foto passa); fora dele, o próprio slide
  function viewportOf(box) {
    const w = box.getBoundingClientRect().width;
    for (let a = box.parentElement, d = 0; a && d < 6; a = a.parentElement, d++) {
      const q = a.getBoundingClientRect();
      if (q.width < 50) continue; // a <ul> do carrossel tem 1 px de largura
      const ov = getComputedStyle(a).overflowX;
      if (ov !== 'visible' && q.width >= 200 && q.width <= w * 1.2) return a;
      if (q.width > w * 1.2) break;
    }
    return box;
  }
  // mídia do post na tela: { vp (janela), right (borda direita do cartão, com o painel de comentários), carousel }
  function postView() {
    const scope = document.querySelector('div[role="dialog"]') || document.querySelector('main') || document.body;
    let best = null;
    for (const el of scope.querySelectorAll('img, video')) {
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.height < 150 || r.bottom < 60 || r.top > innerHeight - 60 || r.right < 0 || r.left > innerWidth) continue;
      if (el.closest('a[href*="/p/"], a[href*="/reel/"]')) continue; // miniaturas da grade ("Mais posts de…")
      const box = slideOf(el);
      const vpEl = viewportOf(box);
      const v = rectOf(vpEl);
      const cx = v.left + v.width / 2, cy = Math.min(Math.max(v.top + v.height / 2, 2), innerHeight - 2);
      const hit = document.elementFromPoint(cx, cy);
      if (!hit || !vpEl.contains(hit)) continue; // coberta por outra coisa (modal por cima, etc.)
      const vis = (Math.min(v.bottom, innerHeight) - Math.max(v.top, 0)) * v.width;
      if (!best || vis > best.vis) best = { vpEl, v, vis };
    }
    if (!best) return null;
    const v = best.v;
    // painel ao lado (comentários): o que está logo à direita da mídia, na mesma altura
    let right = v.right;
    const hy = Math.min(Math.max(v.top + Math.min(v.height / 2, 200), 2), innerHeight - 2);
    const hx = v.right + 24;
    // o que está logo à direita da mídia, tirando o que é nosso (os botões já podem estar ali e não podem esconder o
    // painel; antes disso, eles ficavam por cima dos comentários, como no post aberto pelo Direct em 29/10/2026)
    const hit = hx < innerWidth - 2 ? document.elementsFromPoint(hx, hy).find((e) => !/^SALVA-STORIES/.test(e.tagName)) : null;
    if (hit && hit !== document.body && hit !== document.documentElement && !best.vpEl.contains(hit)) {
      let p = hit;
      while (p.parentElement && p.parentElement !== scope && p.parentElement !== document.body && p.parentElement.getBoundingClientRect().left >= v.right - 2) p = p.parentElement;
      const q = p.getBoundingClientRect();
      if (q.left >= v.right - 2 && q.left <= v.right + 40 && q.width < innerWidth * 0.6) right = Math.max(right, q.right);
    }
    const carousel = best.vpEl.querySelectorAll('li').length > 1;
    return { vpEl: best.vpEl, v, right, carousel };
  }
  // página inicial (feed): cada post é um <article>; o código vem do link da data (/p/{code}/ ou /reel/{code}/).
  // O post "da vez" é o que tem a mídia mais à vista; os botões ficam à direita dele, como no post aberto.
  const FEED_LINK_RE = /\/(?:[A-Za-z0-9._]{1,30}\/)?(?:p|reels?)\/(?!audio\/)([A-Za-z0-9_-]{5,})/; // /reels/audio/{id}/ é o áudio, não o post
  const onFeed = () => location.pathname === '/';
  function articleCode(art) {
    const tm = art.querySelector('a[href] time');
    const links = tm ? [tm.closest('a'), ...art.querySelectorAll('a[href]')] : art.querySelectorAll('a[href]');
    for (const l of links) { const m = (l.getAttribute('href') || '').match(FEED_LINK_RE); if (m) return m[1]; }
    return null;
  }
  function feedView() {
    let best = null;
    for (const art of document.querySelectorAll('main article')) {
      const ar = art.getBoundingClientRect();
      if (ar.bottom < 60 || ar.top > innerHeight - 60 || ar.width < 200) continue;
      let el = null, ov = -1;
      for (const m of art.querySelectorAll('img, video')) {
        const r = m.getBoundingClientRect();
        if (r.width < 200 || r.height < 150) continue;
        // no carrossel os outros slides ficam fora da janela, ao lado: vale o que está mais dentro do post
        const o = Math.min(r.right, ar.right) - Math.max(r.left, ar.left);
        if (o > ov) { ov = o; el = m; }
      }
      if (!el) continue;
      const vpEl = viewportOf(slideOf(el));
      const v = rectOf(vpEl);
      const vis = (Math.min(v.bottom, innerHeight) - Math.max(v.top, 0)) * v.width;
      if (vis <= 0 || (best && vis <= best.vis)) continue;
      const cy = (Math.max(v.top, 0) + Math.min(v.bottom, innerHeight)) / 2;
      const hit = document.elementFromPoint(v.left + v.width / 2, cy);
      if (!hit || !vpEl.contains(hit)) continue; // coberta (menu, aviso do Instagram por cima)
      const code = articleCode(art);
      if (!code) continue;
      best = { vpEl, v, vis, right: v.right, carousel: vpEl.querySelectorAll('li').length > 1, code };
    }
    return best;
  }
  // post dos botões: o aberto (/p/{code}/) ou, na página inicial, o do feed que está à vista
  function curPost() {
    const code = postCode();
    if (code) return { code, pv: postView() };
    const fv = onFeed() ? feedView() : null;
    return fv ? { code: fv.code, pv: fv } : { code: null, pv: null };
  }
  // qual parte do carrossel está na tela: a mídia mais dentro da janela, pelo nome do arquivo (foto) ou pelo fiber (vídeo); senão img_index
  function postIndex(post, vpEl) {
    if (post.parts.length < 2) return 0;
    let liIdx = 0;
    if (vpEl) {
      const v = vpEl.getBoundingClientRect();
      let el = null, ov = 0;
      for (const m of vpEl.querySelectorAll('img, video')) {
        const r = m.getBoundingClientRect();
        if (r.width < 100) continue;
        const o = Math.min(r.right, v.right) - Math.max(r.left, v.left);
        if (o > ov) { ov = o; el = m; }
      }
      if (el && ov > v.width * 0.6) {
        if (el.tagName === 'IMG') {
          const b = base(el.currentSrc || el.src);
          const i = b ? post.parts.findIndex((p) => p.images.some((c) => base(c.url) === b)) : -1;
          if (i >= 0) return i;
        }
        const pk = pkFromFiber(el);
        const i = pk ? post.parts.findIndex((p) => p.pk === pk) : -1;
        if (i >= 0) return i;
        // carrossel do Instagram (feed e post aberto, medido em 28/10/2026): cada <li> fica parado em translateX(n × largura)
        // e a janela rola por baixo; o n do <li> na tela é a posição no carrossel (o 1º <li> sem mídia é só um espaçador)
        const li = el.closest('li');
        const m = li && /translateX\((-?[\d.]+)px\)/.exec(li.style.transform || '');
        const w = li && li.getBoundingClientRect().width;
        if (m && w > 50) { const n = Math.round(parseFloat(m[1]) / w); if (n >= 0 && n < post.parts.length) liIdx = n; }
      }
    }
    // post aberto: o Instagram põe ?img_index= na URL; no feed não tem, vale o <li>
    const n = parseInt(new URLSearchParams(location.search).get('img_index') || '', 10);
    return n >= 1 && n <= post.parts.length ? n - 1 : liIdx;
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
    // regra 14 d: versão urgente pendente → nada é baixado até atualizar
    const kit = window[Symbol.for('salvaStories.kit')];
    if (kit && kit.urgent && kit.urgent()) return Promise.resolve({ ok: false, count: 0, error: t('urgent') });
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

  // dados do post: o que o Instagram já carregou (modal, grade, HTML); só se faltar, o mesmo plano B dos stories (1 pedido)
  async function postData(code) {
    harvestInline();
    const pk = codeToPk(code);
    const find = () => POSTS.get(code) || (pk && POST_PK.has(pk) ? POSTS.get(POST_PK.get(pk)) : null);
    if (find()) return find();
    if (pk) { try { await fetchItem(pk); } catch (_) {} }
    return find();
  }
  // mesmo lugar e nome do "Baixar perfil" (perfil/fotos|videos/AAAA-MM-DD_{code}_NN), para não duplicar
  function postJob(post, i) {
    const job = buildJob(post.parts[i], i + 1);
    if (!job) return null;
    job.user = post.user || post.parts[i].user || 'instagram';
    job.name = `${stamp(post.taken_at).slice(0, 10)}_${post.code}${post.parts.length > 1 ? '_' + pad(i + 1) : ''}`;
    job.sub = 'perfil/' + (job.type === 'video' ? 'videos' : 'fotos');
    return job;
  }
  async function downloadPostCurrent() {
    const { code, pv } = curPost();
    const post = code && (await postData(code));
    if (!post) throw new Error(t('noPost'));
    const job = postJob(post, postIndex(post, pv && pv.vpEl));
    if (!job) throw new Error(t('noMedia'));
    const r = await askExtension([job]);
    if (!r.ok) throw new Error(r.error || t('failed'));
    return job.type === 'video' ? (job.audio ? t('video') : t('videoMute')) : t('photo');
  }
  async function downloadPostAll() {
    const { code } = curPost();
    const post = code && (await postData(code));
    if (!post) throw new Error(t('noPost'));
    const jobs = post.parts.map((_, i) => postJob(post, i)).filter(Boolean);
    if (!jobs.length) throw new Error(t('nothing'));
    const r = await askExtension(jobs);
    if (!r.ok) throw new Error(r.error || t('failed'));
    return t('postMany', r.count, jobs.length);
  }

  // ───────────────────────── interface ─────────────────────────
  let mode = 'story'; // 'story' | 'photo' | 'video' (post aberto)
  let host, shadow, wrap, btnOne, btnAll, btnMenu, ghostEl, spdEl, btnRate, cntEl, toastEl, labelsLang = null;
  // ───────── velocidade do story de vídeo ─────────
  // Medido ao vivo (28/10/2026): o Instagram passa para o próximo story quando o vídeo termina (evento ended), então
  // 2× termina e avança na metade do tempo e 0,5× toca até o fim. Foto não tem velocidade (o relógio de 5 s é do Instagram).
  const RATES = [2, 1.5, 1, 0.5];
  const RATE_KEY = 'salvaStories.storyRate';
  let storyRate = 1;
  try { const r = parseFloat(localStorage.getItem(RATE_KEY)); if (RATES.includes(r)) storyRate = r; } catch (_) {}
  const rateLabel = (r) => String(r).replace('.', (settings && settings.lang) === 'en' ? '.' : ',') + '×';
  function applyStoryRate(el) {
    if (el && el.tagName === 'VIDEO' && Math.abs((el.playbackRate || 1) - storyRate) > 0.01) { try { el.playbackRate = storyRate; } catch (_) {} }
  }
  function setStoryRate(r) {
    storyRate = r;
    try { localStorage.setItem(RATE_KEY, String(r)); } catch (_) {}
    if (location.pathname.startsWith('/stories/')) applyStoryRate(activeMedia());
    speedLabels();
  }
  function speedLabels() {
    if (!spdEl) return;
    btnRate.textContent = rateLabel(storyRate);
    btnRate.classList.toggle('on', storyRate !== 1);
    const off = spdEl.classList.contains('off');
    btnRate.title = off ? t('speedPhoto') : t('speed');
    btnRate.setAttribute('aria-label', t('speed') + ': ' + rateLabel(storyRate));
    for (const b of spdEl.querySelectorAll('.rates button')) { const r = parseFloat(b.dataset.r); b.textContent = rateLabel(r); b.classList.toggle('sel', r === storyRate); b.setAttribute('aria-checked', String(r === storyRate)); }
  }
  // liga/desliga o modo fantasma (mesmo caminho da chave do menu: a ponte grava e avisa todos os módulos)
  function setGhost(on) {
    if (settings) settings.ghost = on;
    window.postMessage({ __salvaStories: 'page', kind: 'set', patch: { ghost: on } }, location.origin);
    ghostLabels();
  }
  // fantasminha sempre na pilha do story: aceso = ligado, apagado = desligado; o texto acompanha o estado
  let ghostShown = null;
  function ghostLabels() {
    if (!ghostEl) return;
    const on = !!(settings && settings.ghost);
    const key = on + ':' + ((settings && settings.lang) || 'pt');
    if (key === ghostShown) return;
    ghostShown = key;
    ghostEl.classList.toggle('off', !on);
    ghostEl.setAttribute('aria-pressed', String(on));
    ghostEl.setAttribute('aria-label', t(on ? 'ghostOffA' : 'ghostOnA'));
    ghostEl.querySelector('.tip b').textContent = t(on ? 'ghostOn' : 'ghostOffT');
    ghostEl.querySelector('.tip span').textContent = t(on ? 'ghostSub' : 'ghostOffSub');
    ghostEl.querySelector('.tip i').textContent = t(on ? 'ghostClick' : 'ghostOnClick');
  }
  function applyLabels() {
    const lang = ((settings && settings.lang) || 'pt') + ':' + mode;
    if (lang === labelsLang) return;
    labelsLang = lang;
    const one = mode === 'photo' ? 'savePhoto' : mode === 'video' ? 'saveVideo' : 'saveOne';
    const all = mode === 'story' ? 'saveAll' : 'savePost';
    btnOne.title = t(one); btnOne.setAttribute('aria-label', t(one + 'A'));
    btnAll.title = t(all); btnAll.setAttribute('aria-label', t(all + 'A'));
    btnMenu.title = t('menu'); btnMenu.setAttribute('aria-label', t('menu'));
    ghostShown = null; ghostLabels();
    speedLabels();
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
        button svg { pointer-events:none; } /* o ícone é trocado (ok/erro) durante o clique: o alvo é sempre o botão */
        button:focus-visible { outline:2px solid #fff; outline-offset:2px; }
        button.busy svg { animation: spin 1s linear infinite; opacity:.85; }
        button.ok { background:#1f9d55; border-color:#1f9d55; }
        button.err { background:#d93a3a; border-color:#d93a3a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .toast { position:fixed; left:50%; bottom:28px; transform:translateX(-50%); padding:10px 16px; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; border-radius:10px; background:rgba(20,20,20,.92);
          color:#fff; font-size:14px; line-height:1.3; max-width:80vw; box-shadow:0 4px 18px rgba(0,0,0,.4); opacity:0; transition:opacity .2s; pointer-events:none; }
        .toast.show { opacity:1; }
        .ghost { position:relative; width:44px; height:44px; margin-top:4px; border-radius:50%; display:grid; place-items:center; cursor:pointer; outline:none;
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
        .tip i { display:block; margin-top:4px; font-style:normal; color:rgba(255,255,255,.55); font-size:11px; }
        .ghost:hover { background:rgba(40,16,52,.75); }
        .ghost.off { background:rgba(0,0,0,.45); box-shadow:0 2px 10px rgba(0,0,0,.35); }
        .ghost.off::before { background:rgba(255,255,255,.28); }
        .ghost.off svg { filter:none; animation:none; opacity:.5; }
        .ghost.off:hover svg { opacity:.85; }
        .ghost.off .tip b { background:none; color:#fff; }
        .ghost:focus-visible { outline:2px solid #fff; outline-offset:2px; }
        /* velocidade do story de vídeo: botão com a velocidade; passando o mouse, a lista vertical abre ao lado */
        .spd { position:relative; }
        /* contador do carrossel (foto da vez / total), logo abaixo de "salvar todas" */
        .cnt { box-sizing:border-box; width:44px; height:24px; margin-top:-4px; border-radius:12px; display:grid; place-items:center; color:#fff;
          font:700 12px/1 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; letter-spacing:-.2px; background:rgba(0,0,0,.55);
          border:1px solid rgba(255,255,255,.28); backdrop-filter: blur(6px); box-shadow:0 2px 10px rgba(0,0,0,.35); user-select:none; white-space:nowrap; }
        button.rate { font-size:13px; font-weight:700; letter-spacing:-.2px; }
        button.rate.on { background:rgba(214,41,118,.8); border-color:rgba(255,255,255,.5); }
        .spd.off button.rate { opacity:.45; cursor:default; }
        .spd.off button.rate:hover { transform:none; background:rgba(0,0,0,.55); }
        .rates { position:absolute; left:calc(100% + 10px); top:50%; transform:translate(-6px,-50%); display:flex; flex-direction:column; gap:6px; padding:6px;
          border-radius:24px; background:rgba(18,12,24,.86); backdrop-filter: blur(6px); box-shadow:0 6px 22px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.14);
          opacity:0; pointer-events:none; transition:opacity .15s ease, transform .15s ease; }
        .rates::before { content:""; position:absolute; right:100%; top:0; bottom:0; width:14px; } /* ponte: o mouse passa do botão para a lista sem fechar */
        .spd:not(.off):hover .rates, .spd.open:not(.off) .rates { opacity:1; pointer-events:auto; transform:translate(0,-50%); }
        .rates button { width:48px; height:34px; border-radius:17px; font-size:13px; font-weight:700; background:transparent; border-color:transparent; box-shadow:none; backdrop-filter:none; }
        .rates button:hover { background:rgba(255,255,255,.14); transform:none; }
        .rates button.sel { background:#fff; color:#111; }
        .spd.flip .rates { left:auto; right:calc(100% + 10px); transform:translate(6px,-50%); }
        .spd.flip .rates::before { right:auto; left:100%; }
        .spd.flip:not(.off):hover .rates, .spd.flip.open:not(.off) .rates { transform:translate(0,-50%); }
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
        <div class="cnt" role="status" style="display:none"></div>
        <div class="spd" style="display:none"><button class="rate">1×</button><div class="rates" role="menu">${RATES.map((r) => `<button role="menuitemradio" data-r="${r}">${r}×</button>`).join('')}</div></div>
        <div class="ghost" role="button" tabindex="0" style="display:none">${ICON_GHOST}<div class="tip"><b></b><span></span><i></i></div></div>
        <button class="menu">${ICON_GEAR}</button>
      </div>
      <div class="toast" role="status"></div>`;
    wrap = shadow.querySelector('.wrap');
    btnOne = shadow.querySelector('.one');
    btnAll = shadow.querySelector('.all');
    ghostEl = shadow.querySelector('.ghost');
    btnMenu = shadow.querySelector('.menu');
    spdEl = shadow.querySelector('.spd');
    cntEl = shadow.querySelector('.cnt');
    btnRate = shadow.querySelector('.rate');
    // fantasminha: clique (ou Enter) desliga o modo fantasma, nos stories e fora deles (o da barra lateral está no menu.js)
    const ghostToggle = () => { const on = !(settings && settings.ghost); setGhost(on); toast(t(on ? 'ghostOnDone' : 'ghostOffDone')); };
    ghostEl.addEventListener('click', ghostToggle);
    ghostEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ghostToggle(); } });
    btnRate.addEventListener('click', () => { if (!spdEl.classList.contains('off')) spdEl.classList.toggle('open'); });
    spdEl.addEventListener('mouseleave', () => spdEl.classList.remove('open'));
    for (const b of spdEl.querySelectorAll('.rates button')) {
      b.addEventListener('click', () => { setStoryRate(parseFloat(b.dataset.r)); spdEl.classList.remove('open'); toast(t('speedSet', rateLabel(storyRate))); });
    }
    labelsLang = null;
    toastEl = shadow.querySelector('.toast');
    for (const ev of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'keydown']) {
      host.addEventListener(ev, (e) => e.stopPropagation());
    }
    btnOne.addEventListener('click', () => run(btnOne, ICON_DL, mode === 'story' ? downloadCurrent : downloadPostCurrent));
    btnAll.addEventListener('click', () => run(btnAll, ICON_ALL, mode === 'story' ? downloadAll : downloadPostAll));
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
      if (mode === 'story') log('info', { pt: 'story salvo: ' + msg, en: 'story saved: ' + msg, es: 'historia guardada: ' + msg });
      else log('info', { pt: 'post salvo: ' + msg, en: 'post saved: ' + msg, es: 'publicación guardada: ' + msg });
    } catch (e) {
      console.warn(TAG, e);
      { const em = String((e && e.message) || e).replace(/\d{8,}/g, '#').slice(0, 160); const w = mode === 'story' ? ['story não salvo: ', 'story not saved: ', 'historia no guardada: '] : ['post não salvo: ', 'post not saved: ', 'publicación no guardada: ']; log('error', { pt: w[0] + em, en: w[1] + em, es: w[2] + em }); }
      btn.classList.remove('busy'); btn.classList.add('err'); btn.innerHTML = ICON_ERR;
      toast(t('notSaved') + (e && e.message ? e.message : e));
    }
    setTimeout(() => { btn.classList.remove('ok', 'err'); btn.innerHTML = icon; }, 1600);
  }

  // Posição dos botões. O Instagram anima a troca de pessoa nos stories (o card novo vem deslizando e crescendo
  // de um lado, o antigo encolhe para o outro, ~0,5 s). Medir no meio da animação fazia os botões pularem para
  // o meio e voltarem (medido ao vivo em 27/10/2026). Agora: enquanto o card se mexe, os botões somem num fade
  // curto e ficam parados; quando o card para (~120 ms sem mudar), vão para o lugar certo e voltam a aparecer.
  let lastRect = null, stableSince = 0, placed = null, visible = false, lastSeen = 0, rest = null;
  const near = (a, b, d) => Math.abs(a - b) <= d;
  function setVisible(on) {
    if (!host || (visible === on && host.style.opacity === (on ? '1' : '0'))) return;
    visible = on;
    host.style.opacity = on ? '1' : '0';
    host.style.pointerEvents = on ? 'auto' : 'none';
  }
  // post aberto: os botões ficam fora do cartão (mídia + comentários), à direita, alinhados ao topo; sem espaço, dentro da
  // foto no canto de cima. A janela do carrossel não se mexe quando a foto passa, então os botões ficam parados.
  let postSeen = 0, postCodeShown = null;
  function hideAll() { if (host) { setVisible(false); host.style.display = 'none'; } placed = null; lastRect = null; }
  // quantas fotos/vídeos o carrossel tem e qual está na tela. Total: os dados do post; senão, os pontinhos do Instagram
  // ("Go to slide N", um por item, medido em 28/10/2026). Item da vez: o mesmo cálculo do "salvar esta".
  function carouselCount(pv, post) {
    if (!(pv.carousel || (post && post.parts.length > 1))) { cntEl.style.display = 'none'; return; }
    let total = post && post.parts.length > 1 ? post.parts.length : 0, idx = 0;
    // os pontinhos do PRÓPRIO post: dentro do mesmo <article> (feed) ou diálogo; sem subir até a lista do feed
    const box = pv.vpEl.closest('article, [role="dialog"]') || pv.vpEl.parentElement;
    const dots = box ? [...box.querySelectorAll('button[aria-label^="Go to slide"], button[aria-label^="Ir para o slide"], button[aria-label^="Ir a la diapositiva"]')] : [];
    if (!total && dots.length > 1) total = dots.length;
    if (total > 1) {
      if (post && post.parts.length > 1) idx = postIndex(post, pv.vpEl) + 1;
      else { const cur = dots.findIndex((b) => b.getAttribute('aria-current') === 'step' || b.getAttribute('aria-current') === 'true'); idx = cur >= 0 ? cur + 1 : 0; }
    }
    if (total > 1) {
      const txt = (idx ? idx + '/' : '') + total;
      if (cntEl.textContent !== txt) { cntEl.textContent = txt; cntEl.title = t('count', idx, total); cntEl.setAttribute('aria-label', cntEl.title); }
      cntEl.style.display = '';
    } else cntEl.style.display = 'none';
  }
  let inlineTry = -1e9;
  function renderPost(code, given) {
    const now = performance.now();
    const pv = given || postView();
    if (!pv) {
      // carregando ou trocando: segura um instante no lugar antes de sumir
      if (!(host && postCodeShown === code && now - postSeen < 1200)) { hideAll(); postCodeShown = null; }
      else setVisible(false);
      return;
    }
    ensureUI();
    if (!host.style.transition) host.style.transition = 'opacity .1s ease';
    postSeen = now; postCodeShown = code;
    // foto ou vídeo na tela (para o texto do botão)
    const v = pv.v;
    let cur = null, ov = 0;
    for (const m of pv.vpEl.querySelectorAll('img, video')) {
      const r = m.getBoundingClientRect();
      if (r.width < 100) continue;
      const o = Math.min(r.right, v.right) - Math.max(r.left, v.left);
      if (o > ov) { ov = o; cur = m; }
    }
    if (!POSTS.has(code) && now - inlineTry > 2000) { inlineTry = now; harvestInline(); } // feed/post que veio no HTML
    const post = POSTS.get(code);
    mode = cur && cur.tagName === 'VIDEO' ? 'video' : 'photo';
    btnAll.style.display = pv.carousel || (post && post.parts.length > 1) ? '' : 'none';
    carouselCount(pv, post);
    ghostEl.style.display = 'none';
    spdEl.style.display = 'none';
    applyLabels();
    const box = { left: v.left, top: v.top, width: pv.right - v.left, height: v.height };
    const moved = !lastRect || !near(box.left, lastRect.left, 1) || !near(box.top, lastRect.top, 1) || !near(box.width, lastRect.width, 1) || !near(box.height, lastRect.height, 1);
    lastRect = box;
    if (moved) stableSince = now;
    const w = 44;
    let left = pv.right + 14, top = v.top + 16;
    // fora do cartão só se o lugar estiver livre: o que fica embaixo (tirando o que é nosso) tem de ser o fundo, um
    // contêiner que abraça a mídia inteira. Se for outra coisa (painel de comentários que não deu para medir, coluna
    // de sugestões), os botões vão para dentro da foto. Visto no post aberto pelo Direct em 29/10/2026.
    const freeAt = (x, y) => {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return true;
      const hit = document.elementsFromPoint(x, y).find((e) => !/^SALVA-STORIES/.test(e.tagName));
      if (!hit || hit === document.body || hit === document.documentElement) return true;
      const q = hit.getBoundingClientRect();
      return q.left <= v.left + 1 && q.right >= x;
    };
    const outsideOk = left + w <= innerWidth - 8 && freeAt(left + w / 2, Math.max(top, 0) + 22) && freeAt(left + w / 2, Math.max(top, 0) + 76);
    if (!outsideOk) { left = v.right - w - 12; top = v.top + 12; }
    top = Math.max(8, Math.min(top, v.bottom - 120));
    if (v.bottom < 130 || v.top > innerHeight - 130) { setVisible(false); return; }
    // modal abrindo ou página rolando: espera parar (45 ms) para não arrastar os botões junto
    if (now - stableSince < 45) { setVisible(false); return; }
    if (!placed || !near(placed.left, left, 2) || !near(placed.top, top, 2)) {
      host.style.left = Math.round(left) + 'px';
      host.style.top = Math.round(top) + 'px';
    }
    placed = { left, top, code };
    host.style.display = 'block';
    setVisible(true);
  }

  const now0 = () => performance.now();
  function render() {
    const onStories = location.pathname.startsWith('/stories/');
    const code = !onStories && settings && settings.postBtn !== false ? postCode() : null;
    if (code) return renderPost(code);
    const fv = !onStories && settings && settings.postBtn !== false && onFeed() ? feedView() : null;
    if (fv) return renderPost(fv.code, fv);
    if (mode !== 'story' && onFeed() && host && now0() - postSeen < 250) { setVisible(false); return; } // entre um post e outro, sem piscar
    if (mode !== 'story') { mode = 'story'; hideAll(); rest = null; postCodeShown = null; }
    const el = onStories ? activeMedia() : null;
    const now = performance.now();
    if (!el) {
      // sem mídia por um instante (troca de story, carregando): só esconde; some de vez fora dos stories
      if (host) { setVisible(false); if (!onStories || now - lastSeen > 1500) { host.style.display = 'none'; placed = null; lastRect = null; } }
      return;
    }
    ensureUI();
    if (!host.style.transition) host.style.transition = 'opacity .1s ease';
    lastSeen = now;
    btnAll.style.display = settings && settings.showAll === false ? 'none' : '';
    ghostEl.style.display = '';
    cntEl.style.display = 'none';
    ghostLabels();
    // velocidade: vale para o vídeo da vez (o Instagram cria um <video> novo a cada story e volta para 1×)
    const isVid = el.tagName === 'VIDEO';
    spdEl.style.display = settings && settings.storySpeed === false ? 'none' : '';
    if (spdEl.classList.contains('off') === isVid) { spdEl.classList.toggle('off', !isVid); spdEl.classList.remove('open'); speedLabels(); }
    if (isVid && !(settings && settings.storySpeed === false)) applyStoryRate(el);
    applyLabels();
    const r = el.getBoundingClientRect();
    const moved = !lastRect || !near(r.left, lastRect.left, 1) || !near(r.top, lastRect.top, 1) || !near(r.width, lastRect.width, 1) || !near(r.height, lastRect.height, 1);
    lastRect = { left: r.left, top: r.top, width: r.width, height: r.height };
    if (moved) stableSince = now;
    const w = 44;
    // fora do card, à direita; se não couber, dentro do card
    const posOf = (q) => {
      let x = q.left + q.width + 14;
      if (x + w > innerWidth - 8) x = q.left + q.width - w - 12;
      return { left: x, top: Math.max(8, q.top + 72) };
    };
    if (r.height < innerHeight * 0.45) { setVisible(false); return; }
    // O card de story sempre para no mesmo lugar (para o mesmo tamanho de janela). Guardado esse lugar, o card que
    // chega deslizando já mostra os botões no ponto final quando está perto (≤ 48 px e tamanho ±7%), sem esperar o
    // fim da desaceleração do Instagram (que se arrasta ~0,3 s quase parado). O card que sai some assim que se afasta.
    const stable = now - stableSince >= 45;
    if (stable) rest = { left: r.left, top: r.top, width: r.width, height: r.height, vw: innerWidth, vh: innerHeight };
    const nearRest = rest && rest.vw === innerWidth && rest.vh === innerHeight && near(r.left, rest.left, 48) && near(r.top, rest.top, 48)
      && Math.abs(r.width / rest.width - 1) < 0.07;
    if (!stable && !nearRest) { setVisible(false); return; }
    const { left, top } = posOf(stable ? r : rest);
    if (!placed || !near(placed.left, left, 2) || !near(placed.top, top, 2)) {
      host.style.left = Math.round(left) + 'px';
      host.style.top = Math.round(top) + 'px';
      placed = { left, top };
    }
    host.style.display = 'block';
    setVisible(true);
    const tipW = (ghostEl.querySelector('.tip') || {}).offsetWidth || 220;
    ghostEl.classList.toggle('flip', innerWidth - (left + w) < tipW + 24);
    spdEl.classList.toggle('flip', innerWidth - (left + w) < 80);
  }

  // confere a cada quadro nos stories (para seguir a animação) e devagar fora deles
  let lastTick = 0;
  (function loop(t) {
    const fast = location.pathname.startsWith('/stories/');
    const post = !fast && (POST_RE.test(location.pathname) || onFeed());
    if (t - lastTick >= (fast ? 15 : post ? 40 : 400)) { lastTick = t; try { render(); } catch (_) {} }
    requestAnimationFrame(loop);
  })(0);
  setInterval(() => { if (document.hidden) render(); }, 1000); // aba em segundo plano: o requestAnimationFrame para
  addEventListener('resize', render);

  addEventListener('keydown', (e) => {
    if (!settings || !settings.hotkey || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== 'd' && e.key !== 'D') return;
    // tecla digitada dentro do menu (shadow DOM fechado: daqui de fora o alvo aparece como o próprio <salva-stories-menu>)
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (t && (t.tagName === 'SALVA-STORIES-MENU' || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const onPost = mode !== 'story' && (POST_RE.test(location.pathname) || (onFeed() && !!postCodeShown));
    if (!(location.pathname.startsWith('/stories/') || onPost) || !host || host.style.display === 'none' || host.style.opacity === '0') return;
    if (onPost && e.shiftKey && btnAll.style.display === 'none') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) run(btnAll, ICON_ALL, onPost ? downloadPostAll : downloadAll);
    else run(btnOne, ICON_DL, onPost ? downloadPostCurrent : downloadCurrent);
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
      avatar: (user) => { harvestInline(); return AVATARS.get(String(user || '').toLowerCase()) || null; },
      avatarCount: () => AVATARS.size,
    }),
  });
  // depuração pelo console: __salvaStoriesDebug()
  const __box = (el) => { if (!el || el.style.display === 'none') return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  window.__salvaStoriesDebug = () => ({ items: ITEMS.size, reels: new Set(REELS.values()).size, posts: POSTS.size, current: currentPk(), settings, mode,
    post: (() => { const cp = curPost(); const c = cp.code; const p = c && POSTS.get(c); const pv = cp.pv; return c ? { code: c, loaded: !!p, parts: p ? p.parts.length : 0, index: p ? postIndex(p, pv && pv.vpEl) : null, view: pv ? { left: Math.round(pv.v.left), right: Math.round(pv.right), top: Math.round(pv.v.top), carousel: pv.carousel } : null } : null; })(),
    at: host && host.style.display !== 'none' ? { opacity: host.style.opacity, left: host.style.left, top: host.style.top, one: __box(btnOne), all: __box(btnAll), title: btnOne.title, ghost: __box(ghostEl), count: cntEl && cntEl.style.display !== 'none' ? cntEl.textContent : null, ghostOff: ghostEl ? ghostEl.classList.contains('off') : null, rate: spdEl && spdEl.style.display !== 'none' ? __box(btnRate) : null, rateOff: spdEl ? spdEl.classList.contains('off') : null, rateText: btnRate ? btnRate.textContent : null, rates: spdEl ? Object.fromEntries([...spdEl.querySelectorAll('.rates button')].map((b) => [b.dataset.r, __box(b)])) : null, ratesOpen: spdEl ? getComputedStyle(spdEl.querySelector('.rates')).opacity : null } : null, storyRate });
})();
