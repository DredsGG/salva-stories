// Salva Stories — "Baixar perfil": baixa os posts de um perfil (fotos, vídeos e carrosséis) em pastas organizadas.
// Sem requisição própria à API: a extensão rola a grade do perfil e o PRÓPRIO Instagram carrega as páginas
// (GraphQL PolarisProfilePostsTabContentQuery_connection, 12 posts por vez); o page.js entrega cada resposta
// aqui pelo api.onData. Os arquivos saem direto da CDN pelo service worker.
(() => {
  'use strict';
  if (window.__salvaStoriesProfile) return;
  window.__salvaStoriesProfile = true;
  const API = () => window[Symbol.for('salvaStories.api')];
  const K = () => window[Symbol.for('salvaStories.kit')];

  const T = {
    pt: {
      btn: 'Baixar perfil', title: (u) => `Baixar perfil de @${u}`, posts: (n) => `${n} posts`,
      how: 'Quantos posts', all: 'Todos', last: (n) => `Últimos ${n}`, photos: 'Fotos', videos: 'Vídeos', start: 'Baixar',
      where: (p) => `Vai para Downloads/${p}`, loading: 'Carregando os posts…', loaded: (a, b) => b ? `${a} de ${b} posts carregados` : `${a} posts carregados`,
      saving: (a, b) => `Salvando ${a} de ${b} arquivos`, cancel: 'Cancelar', close: 'Fechar', canceled: 'Cancelado.',
      done: (n, p) => `Pronto: ${n} arquivos em Downloads/${p}`, none: 'Nenhum post para baixar (perfil privado ou sem posts).',
      slow: 'O ritmo é calmo de propósito (como uma pessoa rolando), para não chamar atenção do Instagram.',
      failed: (n) => `${n} arquivos falharam`, pause: (s) => `Pausa para não chamar atenção do Instagram: ${s} s…`, again: 'Baixar de novo', private: 'Este perfil é privado e você não o segue.',
    },
    en: {
      btn: 'Download profile', title: (u) => `Download @${u}'s profile`, posts: (n) => `${n} posts`,
      how: 'How many posts', all: 'All', last: (n) => `Latest ${n}`, photos: 'Photos', videos: 'Videos', start: 'Download',
      where: (p) => `Saved to Downloads/${p}`, loading: 'Loading posts…', loaded: (a, b) => b ? `${a} of ${b} posts loaded` : `${a} posts loaded`,
      saving: (a, b) => `Saving ${a} of ${b} files`, cancel: 'Cancel', close: 'Close', canceled: 'Canceled.',
      done: (n, p) => `Done: ${n} files in Downloads/${p}`, none: 'No posts to download (private profile or no posts).',
      slow: 'The pace is calm on purpose (like a person scrolling), so Instagram does not flag it.',
      failed: (n) => `${n} files failed`, pause: (s) => `Short break so Instagram doesn't flag it: ${s} s…`, again: 'Download again', private: "This profile is private and you don't follow it.",
    },
    es: {
      btn: 'Descargar perfil', title: (u) => `Descargar el perfil de @${u}`, posts: (n) => `${n} publicaciones`,
      how: 'Cuántas publicaciones', all: 'Todas', last: (n) => `Últimas ${n}`, photos: 'Fotos', videos: 'Videos', start: 'Descargar',
      where: (p) => `Se guarda en Descargas/${p}`, loading: 'Cargando publicaciones…', loaded: (a, b) => b ? `${a} de ${b} publicaciones cargadas` : `${a} publicaciones cargadas`,
      saving: (a, b) => `Guardando ${a} de ${b} archivos`, cancel: 'Cancelar', close: 'Cerrar', canceled: 'Cancelado.',
      done: (n, p) => `Listo: ${n} archivos en Descargas/${p}`, none: 'No hay publicaciones para descargar (perfil privado o vacío).',
      slow: 'El ritmo es tranquilo a propósito (como una persona desplazándose), para que Instagram no lo marque.',
      failed: (n) => `${n} archivos fallaron`, pause: (s) => `Pausa para que Instagram no lo marque: ${s} s…`, again: 'Descargar de nuevo', private: 'Este perfil es privado y no lo sigues.',
    },
  };
  let t = (k) => k;

  // ───────── posts que o Instagram carregou, por perfil ─────────
  const POSTS = new Map(); // username(lower) -> Map(pk -> node)
  const MORE = new Map(); // username(lower) -> has_next_page
  const CONN = 'xdt_api__v1__feed__user_timeline_graphql_connection';
  function findConn(o, depth = 0) {
    if (!o || typeof o !== 'object' || depth > 14) return null;
    if (o[CONN]) return o[CONN];
    for (const k in o) { const v = o[k]; if (v && typeof v === 'object') { const r = findConn(v, depth + 1); if (r) return r; } }
    return null;
  }
  function onData(obj) {
    const conn = findConn(obj);
    if (!conn || !Array.isArray(conn.edges)) return;
    // a resposta pertence ao perfil aberto (posts em collab trazem outro autor no node.user)
    const here = (profileUser() || '').toLowerCase();
    let owner = null;
    for (const e of conn.edges) {
      const n = e && e.node;
      if (!n || !n.pk) continue;
      owner = here || ((n.user && n.user.username) || (n.owner && n.owner.username) || '').toLowerCase();
      if (!owner) continue;
      if (!POSTS.has(owner)) POSTS.set(owner, new Map());
      POSTS.get(owner).set(String(n.pk), n);
    }
    if (owner && conn.page_info) MORE.set(owner, !!conn.page_info.has_next_page);
    if (owner) bump(owner);
  }
  let waiters = [];
  function bump(owner) { const w = waiters; waiters = []; for (const f of w) f(owner); }
  const nextData = (ms) => new Promise((r) => { const to = setTimeout(() => r(null), ms); waiters.push((o) => { clearTimeout(to); r(o); }); });

  // ───────── qual perfil está aberto ─────────
  const RESERVED = new Set(['explore', 'reels', 'reel', 'p', 'tv', 'stories', 'direct', 'accounts', 'about', 'developer', 'legal', 'privacy', 'emails', 'challenge', 'web', 'api', 'graphql', 'session', 'login', 'signup', 'nametag', 'directory', 'lite', 'ar', 'threads', 'your_activity', 'notifications', 'oauth', 'support', 'blog', 'press']);
  function profileUser() {
    const m = location.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
    if (!m || RESERVED.has(m[1].toLowerCase())) return null;
    return m[1];
  }
  function header() {
    const hs = [...document.querySelectorAll('header')].filter((h) => h.querySelector('h2, h1') && h.getBoundingClientRect().height > 120);
    return hs[0] || null;
  }
  // contagem de posts do cabeçalho ("32.109 posts", "1,234 posts", "12 publicações")
  function postCount(h) {
    for (const el of h.querySelectorAll('li, span, div')) {
      const txt = (el.innerText || '').trim();
      const m = txt.match(/^([\d.,\s]+)\s*(posts?|publicaç(?:ões|ão)|publicaciones?)$/i);
      if (m) return parseInt(m[1].replace(/[^\d]/g, ''), 10);
    }
    return null;
  }
  // linha de botões do cabeçalho (Seguir / Mensagem / Editar perfil…): pega a de baixo, com altura de botão
  // linha de botões do cabeçalho (Seguir / Mensagem / Editar perfil…). Prefere a linha que tem um desses textos;
  // senão, a linha de botões mais baixa do cabeçalho. Funciona no layout antigo (ao lado do nome) e no novo (abaixo da bio).
  const ACTION_TXT = /^(seguir|seguindo|seguir de volta|follow|following|follow back|siguiendo|seguir también|enviar mensagem|mensagem|message|enviar mensaje|mensaje|editar perfil|edit profile|ver arquivo|view archive|solicitado|requested)$/i;
  function actionsRow(h) {
    const hr = h.getBoundingClientRect();
    const all = [...h.querySelectorAll('button, [role="button"], a')].filter((b) => !b.closest('salva-stories-profile'))
      .map((b) => ({ b, r: b.getBoundingClientRect(), txt: (b.innerText || '').trim() }))
      .filter((x) => x.r.height >= 26 && x.r.height <= 52 && x.r.width >= 26 && x.r.top >= hr.top && x.r.bottom <= hr.bottom + 4);
    if (!all.length) return null;
    const named = all.filter((x) => ACTION_TXT.test(x.txt));
    const ref = named.length ? named[named.length - 1] : all.filter((x) => x.txt).sort((a, b) => b.r.top - a.r.top)[0];
    if (!ref) return null;
    const row = all.filter((x) => Math.abs((x.r.top + x.r.height / 2) - (ref.r.top + ref.r.height / 2)) < 8).map((x) => x.r);
    return { top: ref.r.top, height: ref.r.height, right: Math.max(...row.map((r) => r.right)), left: Math.min(...row.map((r) => r.left)), hr };
  }

  // ───────── interface ─────────
  const CSS = `
  .pill { position: fixed; display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 12px; border-radius: 10px; border: 0; cursor: pointer;
    color: #fff; font: 600 14px var(--font); background: var(--grad); box-shadow: 0 4px 16px -4px rgba(214,41,118,.6); transition: filter .15s, transform .1s; white-space: nowrap; }
  .pill:hover { filter: brightness(1.08); } .pill:active { transform: scale(.97); }
  .pill .ring { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.22); }
  .pill.busy .ring svg { animation: bob 1s ease-in-out infinite; }
  @keyframes bob { 50% { transform: translateY(2px); } }
  .card { position: fixed; width: 360px; background: var(--bg); color: var(--fg); border: 1px solid var(--sep); border-radius: 16px; box-shadow: var(--shadow);
    animation: pop .16s cubic-bezier(.2,.9,.3,1.2); overflow: hidden; }
  @keyframes pop { from { opacity: 0; transform: translateY(-6px) scale(.97); } }
  .ch { display: flex; align-items: center; gap: 10px; padding: 14px 12px 12px 16px; border-bottom: 1px solid var(--sep); }
  .ch h3 { margin: 0; font-size: 15px; font-weight: 700; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cb { padding: 14px 16px 6px; display: grid; gap: 12px; }
  .lbl { font-size: 12px; font-weight: 600; color: var(--sub); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { height: 32px; padding: 0 12px; border-radius: 99px; border: 1px solid var(--sep); background: transparent; color: var(--fg); font: 600 13px var(--font); cursor: pointer; }
  .chip.on { border-color: transparent; background: var(--grad); color: #fff; }
  .checks { display: flex; gap: 16px; }
  .checks label { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; font-weight: 600; }
  .checks input { width: 17px; height: 17px; accent-color: #d62976; margin: 0; }
  .note { font-size: 12.5px; color: var(--sub); }
  .prog { display: grid; gap: 8px; }
  .cf { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px 14px; }
  .cf .go { margin-left: auto; }
  `;
  let ui = null, busy = false, cancelFlag = false, lastUser = null, choice = { limit: 0, photos: true, videos: true };

  function ensureUI() {
    if (ui && ui.host.isConnected) return;
    ui = K().makeHost('salva-stories-profile', CSS, `
      <button class="pill" type="button" hidden><span class="ring">${K().ICON.dl}</span><span class="lb"></span></button>
      <div class="card" hidden role="dialog"></div>`);
    ui.$('.pill').addEventListener('click', () => (ui.$('.card').hidden ? openCard() : (!busy && closeCard())));
    addEventListener('pointerdown', (e) => { if (ui && !ui.$('.card').hidden && !busy && !e.composedPath().includes(ui.host)) closeCard(); }, true);
  }

  function place() {
    const s = API() && API().settings();
    const user = profileUser();
    const h = user && header();
    if (!s || s.profileBtn === false || !user || !h) {
      if (ui && !busy) { ui.$('.pill').hidden = true; ui.$('.card').hidden = true; }
      return;
    }
    ensureUI();
    t = K().tr(T);
    ui.refreshMode();
    if (lastUser && lastUser.toLowerCase() !== user.toLowerCase() && !busy) ui.$('.card').hidden = true;
    lastUser = user;
    const pill = ui.$('.pill');
    pill.querySelector('.lb').textContent = t('btn');
    const row = actionsRow(h);
    const w = pill.offsetWidth || 150;
    let x, y;
    const ph = row ? Math.max(32, Math.min(44, Math.round(row.height))) : 40; // mesma altura dos botões do Instagram
    pill.style.height = ph + 'px';
    if (row && row.right + 10 + w < innerWidth - 12) { x = row.right + 10; y = row.top + (row.height - ph) / 2; }
    else if (row) { x = row.left; y = row.top + row.height + 10; }
    else { const r = h.getBoundingClientRect(); x = r.right - w; y = r.top + 8; }
    pill.style.left = Math.round(x) + 'px';
    pill.style.top = Math.round(y) + 'px';
    pill.hidden = y < -40 || y > innerHeight; // some quando o cabeçalho sai da tela
    if (!ui.$('.card').hidden) positionCard();
  }

  function positionCard() {
    const p = ui.$('.pill').getBoundingClientRect(), c = ui.$('.card');
    const w = 360, h = c.offsetHeight || 300;
    let x = Math.min(p.left, innerWidth - w - 12), y = p.bottom + 10;
    if (y + h > innerHeight - 12) y = Math.max(12, p.top - h - 10);
    c.style.left = Math.round(x) + 'px'; c.style.top = Math.round(y) + 'px';
  }

  const folderOf = (user) => { const s = API().settings() || {}; return `${s.folder || 'Instagram Stories'}/${s.perUser === false ? '' : user + '/'}perfil`; };

  function openCard() {
    const user = profileUser(); if (!user) return;
    const h = header(); const total = h ? postCount(h) : null;
    const c = ui.$('.card');
    const lim = [0, 500, 100, 50];
    c.innerHTML = `
      <div class="ch"><h3>${K().esc(t('title', user))}</h3><button class="x" type="button" aria-label="${K().esc(t('close'))}">${K().ICON.x}</button></div>
      <div class="cb">
        ${total != null ? `<div class="muted">${K().esc(t('posts', K().nf(total)))}</div>` : ''}
        <div><div class="lbl">${K().esc(t('how'))}</div><div class="chips">${lim.filter((n) => !n || !total || n < total).map((n) => `<button class="chip${choice.limit === n ? ' on' : ''}" data-n="${n}">${K().esc(n ? t('last', n) : t('all'))}</button>`).join('')}</div></div>
        <div class="checks"><label><input type="checkbox" data-k="photos" ${choice.photos ? 'checked' : ''}>${K().esc(t('photos'))}</label><label><input type="checkbox" data-k="videos" ${choice.videos ? 'checked' : ''}>${K().esc(t('videos'))}</label></div>
        <div class="note">${K().esc(t('where', folderOf(user)))}<br>${K().esc(t('slow'))}</div>
        <div class="prog" hidden><div class="st"></div><div class="bar"><i></i></div></div>
      </div>
      <div class="cf">${K().signature(K().version())}<button class="btn pri go" type="button">${K().ICON.dl}${K().esc(t('start'))}</button></div>`;
    c.hidden = false;
    c.querySelector('.x').addEventListener('click', () => { if (busy) cancelFlag = true; else closeCard(); });
    for (const ch of c.querySelectorAll('.chip')) ch.addEventListener('click', () => { choice.limit = +ch.dataset.n; for (const o of c.querySelectorAll('.chip')) o.classList.toggle('on', o === ch); });
    for (const cb of c.querySelectorAll('.checks input')) cb.addEventListener('change', () => { choice[cb.dataset.k] = cb.checked; c.querySelector('.go').disabled = !choice.photos && !choice.videos; });
    c.querySelector('.go').addEventListener('click', () => (busy ? (cancelFlag = true) : run(user)));
    positionCard();
  }
  function closeCard() { if (ui) ui.$('.card').hidden = true; }

  function setProgress(text, frac) {
    const c = ui.$('.card');
    c.querySelector('.prog').hidden = false;
    c.querySelector('.st').textContent = text;
    c.querySelector('.bar i').style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%';
    positionCard();
  }

  // ───────── execução ─────────
  async function collect(user, want) {
    const key = user.toLowerCase();
    API().harvestInline(); // primeiros posts embutidos no HTML da página
    const startY = scrollY;
    let still = 0, pagesSeen = 0;
    for (;;) {
      if (cancelFlag) break;
      const have = POSTS.has(key) ? POSTS.get(key).size : 0;
      setProgress(have ? t('loaded', K().nf(Math.min(have, want || have)), want ? K().nf(want) : null) : t('loading'), want ? have / want : 0.08 + Math.min(.8, have / 2000));
      if (want && have >= want) break;
      if (MORE.has(key) && MORE.get(key) === false) break;
      // rola até o fim da grade: o Instagram busca a próxima página sozinho
      scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      const got = await nextData(6000);
      const now = POSTS.has(key) ? POSTS.get(key).size : 0;
      still = now > have ? 0 : still + 1;
      if (still >= 4) break; // 4 rolagens seguidas sem nada novo: acabou (ou o Instagram parou de mandar)
      // ritmo de gente: 3–6 s por página e uma pausa longa a cada 40 páginas (~480 posts)
      pagesSeen++;
      if (pagesSeen % 40 === 0) {
        for (let s = Math.round(K().jitter(90, 150)); s > 0 && !cancelFlag; s--) { setProgress(t('pause', s), want ? have / want : 0.5); await K().sleep(1000); }
      } else await K().sleep(K().jitter(3000, 6000));
      void got;
    }
    scrollTo({ top: startY, behavior: 'instant' });
    const list = [...(POSTS.get(key) || new Map()).values()].sort((a, b) => (b.taken_at || 0) - (a.taken_at || 0));
    return want ? list.slice(0, want) : list;
  }

  function jobsFor(user, posts) {
    const api = API(), jobs = [];
    for (const n of posts) {
      const parts = Array.isArray(n.carousel_media) && n.carousel_media.length ? n.carousel_media : [n];
      const date = api.stamp(n.taken_at).slice(0, 10);
      parts.forEach((m, i) => {
        const slimmed = api.slim(Object.assign({}, m, { taken_at: m.taken_at || n.taken_at, user: m.user || n.user }), user);
        if (!slimmed.pk || slimmed.pk === 'undefined') slimmed.pk = String(n.pk) + '_' + i;
        const isVid = slimmed.media_type === 2;
        if ((isVid && !choice.videos) || (!isVid && !choice.photos)) return;
        const job = api.buildJob(slimmed, i + 1);
        if (!job) return;
        job.user = user;
        job.name = `${date}_${n.code || n.pk}${parts.length > 1 ? '_' + String(i + 1).padStart(2, '0') : ''}`;
        job.sub = 'perfil/' + (isVid ? 'videos' : 'fotos');
        jobs.push(job);
      });
    }
    return jobs;
  }

  async function run(user) {
    busy = true; cancelFlag = false;
    K().busy(true);
    const c = ui.$('.card'), go = c.querySelector('.go');
    ui.$('.pill').classList.add('busy');
    go.innerHTML = K().esc(t('cancel')); go.className = 'btn sec go';
    for (const el of c.querySelectorAll('.chip, .checks input')) el.disabled = true;
    try {
      const posts = await collect(user, choice.limit);
      if (cancelFlag) { setProgress(t('canceled'), 0); return; }
      const jobs = jobsFor(user, posts);
      if (!jobs.length) { setProgress(t('none'), 0); return; }
      let ok = 0, fail = 0;
      for (let i = 0; i < jobs.length; i += 10) { // lotes pequenos: vídeos em alta passam pelo remux e levam tempo
        if (cancelFlag) break;
        setProgress(t('saving', K().nf(i), K().nf(jobs.length)), i / jobs.length);
        const batch = jobs.slice(i, i + 10);
        const r = await API().askExtension(batch);
        ok += (r && r.count) || 0; fail += batch.length - ((r && r.count) || 0);
      }
      API().log(fail ? 'warn' : 'info', `baixar perfil: ${posts.length} posts, ${ok} arquivos ok, ${fail} falhas${cancelFlag ? ', cancelado' : ''}`);
      if (cancelFlag) setProgress(t('canceled') + ' ' + t('done', K().nf(ok), folderOf(user)), ok / jobs.length);
      else setProgress(t('done', K().nf(ok), folderOf(user)) + (fail ? ' · ' + t('failed', K().nf(fail)) : ''), 1);
    } catch (e) {
      API().log('error', 'baixar perfil: ' + String((e && e.message) || e).slice(0, 160));
      throw e;
    } finally {
      busy = false;
      K().busy(false);
      ui.$('.pill').classList.remove('busy');
      go.innerHTML = K().ICON.dl + K().esc(t('again')); go.className = 'btn pri go';
      for (const el of c.querySelectorAll('.chip, .checks input')) el.disabled = false;
    }
  }

  // ───────── ligações ─────────
  const start = () => {
    if (!API() || !K()) return setTimeout(start, 50);
    API().onData(onData);
    setInterval(place, 400);
    addEventListener('resize', place);
    addEventListener('scroll', place, { passive: true });
  };
  start();
  const __box = (el) => { if (!el || el.hidden) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  window.__salvaStoriesProfileDebug = () => ({ user: profileUser(), posts: Object.fromEntries([...POSTS].map(([k, v]) => [k, v.size])), more: Object.fromEntries(MORE), busy,
    status: ui && ui.$('.st') ? ui.$('.st').textContent : null,
    at: ui ? { pill: __box(ui.$('.pill')), go: __box(ui.$('.go')), chips: ui.$$('.chip').map(__box) } : null });
})();
