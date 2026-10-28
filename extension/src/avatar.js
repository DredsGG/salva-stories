// Salva Stories — foto do perfil em tamanho grande (v1.8.11).
// No cabeçalho de um perfil: sem story, o clique na foto abre ela grande; com story, o clique continua abrindo o story
// e SEGURAR (~0,45 s) abre a foto grande. Segurar funciona sempre. No próprio perfil, o clique continua sendo do
// Instagram (trocar foto); só segurar abre.
// A foto vem na resolução original, sem pedido novo: a resposta do perfil que o próprio Instagram carrega traz
// hd_profile_pic_url_info (até 1080×1080; o page.js guarda por usuário). Sem ela, mostra a da tela e avisa.
(() => {
  'use strict';
  if (window.__salvaStoriesAvatar) return;
  window.__salvaStoriesAvatar = true;
  const API = () => window[Symbol.for('salvaStories.api')];
  const K = () => window[Symbol.for('salvaStories.kit')];
  const HOLD_MS = 450;

  const T = {
    pt: {
      title: (u) => `Foto de perfil de @${u}`, save: 'Salvar', saved: (p) => `Salvo em Downloads/${p}`, failed: 'Não salvou: ',
      open: 'Abrir em nova aba', close: 'Fechar (Esc)', low: 'Resolução da tela: o Instagram ainda não mandou a foto grande. Recarregue a página para tentar de novo.',
      size: (w, h) => `${w} × ${h} px`, loading: 'Carregando a foto grande…',
    },
    en: {
      title: (u) => `@${u}'s profile picture`, save: 'Save', saved: (p) => `Saved to Downloads/${p}`, failed: 'Not saved: ',
      open: 'Open in a new tab', close: 'Close (Esc)', low: "Screen resolution: Instagram hasn't sent the large picture yet. Reload the page to try again.",
      size: (w, h) => `${w} × ${h} px`, loading: 'Loading the large picture…',
    },
    es: {
      title: (u) => `Foto de perfil de @${u}`, save: 'Guardar', saved: (p) => `Guardado en Descargas/${p}`, failed: 'No se guardó: ',
      open: 'Abrir en una pestaña nueva', close: 'Cerrar (Esc)', low: 'Resolución de pantalla: Instagram aún no envió la foto grande. Recarga la página para intentarlo de nuevo.',
      size: (w, h) => `${w} × ${h} px`, loading: 'Cargando la foto grande…',
    },
  };
  let t = (k) => k;

  // ───────── foto do cabeçalho do perfil ─────────
  const RESERVED = new Set(['explore', 'reels', 'reel', 'p', 'tv', 'stories', 'direct', 'accounts', 'about', 'developer', 'legal', 'privacy', 'emails', 'challenge', 'web', 'api', 'graphql', 'session', 'login', 'signup', 'nametag', 'directory', 'lite', 'ar', 'threads', 'your_activity', 'notifications', 'oauth', 'support', 'blog', 'press']);
  function profileUser() {
    const m = location.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
    if (!m || RESERVED.has(m[1].toLowerCase())) return null;
    return m[1];
  }
  const enabled = () => { const s = API() && API().settings(); return !!s && s.avatarZoom !== false; };
  // a maior imagem redonda/quadrada (77–200 px) no topo da página do perfil, dentro de um link ou botão
  function avatarImg() {
    if (!profileUser()) return null;
    const root = document.querySelector('main') || document.body;
    let best = null;
    for (const img of root.querySelectorAll('img')) {
      const r = img.getBoundingClientRect();
      if (r.width < 77 || r.width > 220 || Math.abs(r.width - r.height) > 4 || r.top > 420 || r.bottom < 0) continue;
      if (!img.closest('a, [role="link"], [role="button"]')) continue;
      if (img.closest('li')) continue; // destaques de story ficam numa lista e são menores
      if (!best || r.width > best.getBoundingClientRect().width) best = img;
    }
    return best;
  }
  // com story: a foto fica num botão com o anel (canvas); sem story: num link para o próprio perfil
  function hasStory(img) {
    const btn = img.closest('[role="button"]');
    return !!(btn && btn.querySelector('canvas'));
  }
  const ownProfile = () => !!document.querySelector('main a[href*="/accounts/edit"]');
  // o anel do story (canvas) fica por cima da foto, então vale a área: dentro do botão/link da foto ou do retângulo dela
  function inAvatar(e) {
    const img = avatarImg();
    if (!img) return null;
    const t = e.target;
    if (t && t.closest && t.closest('salva-stories-avatar')) return null;
    const box = img.closest('[role="button"]') || img.closest('a, [role="link"]');
    if (box && t && (box === t || box.contains(t))) return img;
    const r = img.getBoundingClientRect();
    return e.clientX >= r.left - 8 && e.clientX <= r.right + 8 && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8 && t !== document.documentElement && t !== document.body ? img : null;
  }

  // ───────── segurar / clicar ─────────
  let holdTimer = 0, held = false, downAt = null;
  addEventListener('pointerdown', (e) => {
    held = false;
    if (e.button !== 0 || !enabled()) return;
    const img = inAvatar(e);
    if (!img) return;
    downAt = { x: e.clientX, y: e.clientY };
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { held = true; open(img); }, HOLD_MS);
  }, true);
  const cancelHold = () => { clearTimeout(holdTimer); downAt = null; };
  addEventListener('pointerup', cancelHold, true);
  addEventListener('pointercancel', cancelHold, true);
  addEventListener('pointermove', (e) => { if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 10) cancelHold(); }, true);
  addEventListener('contextmenu', (e) => { if (held) e.preventDefault(); }, true);
  addEventListener('click', (e) => {
    if (!enabled()) return;
    const img = inAvatar(e);
    if (!img) { held = false; return; }
    if (held) { e.preventDefault(); e.stopPropagation(); held = false; return; } // segurou: o clique não abre o story
    if (hasStory(img) || ownProfile()) return; // story (ou o próprio perfil): o clique é do Instagram
    e.preventDefault(); e.stopPropagation();
    open(img);
  }, true);

  // ───────── quadro com a foto grande ─────────
  const CSS = `
  .ov { position: fixed; inset: 0; width: 100vw; height: 100vh; display: grid; place-items: center; background: rgba(0,0,0,.78); backdrop-filter: blur(3px);
    animation: fade .15s ease; }
  @keyframes fade { from { opacity: 0; } }
  .box { display: grid; gap: 10px; justify-items: center; animation: pop .18s cubic-bezier(.2,.9,.3,1.2); }
  @keyframes pop { from { opacity: 0; transform: scale(.94); } }
  .pic { position: relative; width: var(--side); height: var(--side); border-radius: 14px; overflow: hidden; background: #111;
    box-shadow: 0 18px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08); }
  .pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .abar { display: flex; align-items: center; gap: 10px; width: var(--side); color: #fff; font: 13px/1.3 var(--font); }
  .abar .who { flex: 1; min-width: 0; }
  .abar b { display: block; color: #fff; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .abar span { color: rgba(255,255,255,.65); font-size: 12px; }
  .abar .btn.sec { background: rgba(255,255,255,.12); color: #fff; }
  .abar .btn.sec:hover { background: rgba(255,255,255,.2); }
  .ic { width: 36px; padding: 0; }
  .low { width: var(--side); color: #ffd28a; font: 12px/1.35 var(--font); }
  .x2 { position: fixed; top: 18px; right: 18px; width: 40px; height: 40px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: #fff; background: rgba(255,255,255,.12); }
  .x2:hover { background: rgba(255,255,255,.22); }
  `;
  const ICON_OPEN = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>';
  let ui = null, cur = null;

  function ensureUI() {
    if (ui && ui.host.isConnected) return;
    ui = K().makeHost('salva-stories-avatar', CSS, `<div class="ov" hidden role="dialog" aria-modal="true">
      <button class="x2" type="button"></button>
      <div class="box"><div class="pic"><img alt=""></div>
        <div class="abar"><div class="who"><b></b><span class="sz"></span></div>
          <button class="btn sec ic op" type="button">${ICON_OPEN}</button>
          <button class="btn pri sv" type="button"></button></div>
        <div class="low" hidden></div></div></div>`);
    ui.$('.x2').innerHTML = K().ICON.x;
    ui.$('.x2').addEventListener('click', close);
    ui.$('.ov').addEventListener('click', (e) => { if (e.target === ui.$('.ov')) close(); });
    ui.$('.sv').addEventListener('click', save);
    ui.$('.op').addEventListener('click', () => { if (cur) window.open(cur.url, '_blank', 'noopener'); });
    ui.$('.pic img').addEventListener('load', sizeLabel);
  }
  const isOpen = () => !!(ui && !ui.$('.ov').hidden);
  function close() { if (ui) ui.$('.ov').hidden = true; cur = null; }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  addEventListener('popstate', close);

  function sizeLabel() {
    const im = ui.$('.pic img');
    if (!cur || !im.naturalWidth) return;
    ui.$('.sz').textContent = cur.hd && im.src !== cur.url ? t('loading') : t('size', im.naturalWidth, im.naturalHeight);
  }
  function open(img) {
    const user = profileUser();
    if (!user) return;
    ensureUI();
    t = K().tr(T);
    ui.refreshMode();
    const hd = API().avatar(user);
    const low = img.currentSrc || img.src;
    cur = { user, url: hd ? hd.url : low, hd: !!hd };
    const side = Math.max(240, Math.min(innerWidth - 80, innerHeight - 170, 720));
    ui.$('.box').style.setProperty('--side', side + 'px');
    ui.$('.who b').textContent = t('title', user);
    ui.$('.sv').innerHTML = K().ICON.dl + K().esc(t('save'));
    ui.$('.op').title = t('open'); ui.$('.op').setAttribute('aria-label', t('open'));
    ui.$('.x2').title = t('close'); ui.$('.x2').setAttribute('aria-label', t('close'));
    ui.$('.low').hidden = !!hd;
    ui.$('.low').textContent = hd ? '' : t('low');
    const im = ui.$('.pic img');
    im.alt = t('title', user);
    // mostra a da tela na hora e troca pela grande quando ela chega
    im.src = low;
    ui.$('.sz').textContent = hd ? t('loading') : '';
    if (hd) { const pre = new Image(); pre.onload = () => { if (cur && cur.url === hd.url) { im.src = hd.url; } }; pre.src = hd.url; }
    ui.$('.ov').hidden = false;
    ui.$('.sv').focus({ preventScroll: true });
    API().log('info', { pt: 'foto de perfil aberta' + (hd ? ' (alta)' : ' (tela)'), en: 'profile picture opened' + (hd ? ' (full size)' : ' (screen size)'), es: 'foto de perfil abierta' + (hd ? ' (alta)' : ' (pantalla)') });
  }
  async function save() {
    if (!cur) return;
    const base = (cur.url.split('?')[0].split('/').pop() || '').split('_')[0].replace(/\D/g, '').slice(0, 20);
    const ext = /\.png(\?|$)/i.test(cur.url) ? 'png' : /\.webp(\?|$)/i.test(cur.url) ? 'webp' : 'jpg';
    const job = { kind: 'url', url: cur.url, user: cur.user, name: `${cur.user}_foto-de-perfil${base ? '_' + base : ''}`, ext, type: 'image', sub: 'perfil', order: 1 };
    const btn = ui.$('.sv');
    btn.disabled = true;
    try {
      const r = await API().askExtension([job]);
      if (!r || !r.ok) throw new Error((r && r.error) || 'erro');
      const s = API().settings() || {};
      ui.toast(t('saved', `${s.folder || 'Instagram Stories'}/${s.perUser === false ? '' : cur.user + '/'}perfil`));
    } catch (e) {
      ui.toast(t('failed') + String((e && e.message) || e).slice(0, 120));
    } finally { btn.disabled = false; }
  }

  // depuração: __salvaStoriesAvatarDebug()
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  window.__salvaStoriesAvatarDebug = () => {
    const img = avatarImg();
    return { user: profileUser(), avatar: box(img), story: img ? hasStory(img) : null, own: ownProfile(), open: isOpen(), cur, hd: profileUser() && API() ? API().avatar(profileUser()) : null,
      shown: isOpen() ? { src: ui.$('.pic img').src, nat: ui.$('.pic img').naturalWidth, size: ui.$('.sz').textContent, low: !ui.$('.low').hidden } : null,
      at: isOpen() ? { save: box(ui.$('.sv')), open: box(ui.$('.op')), close: box(ui.$('.x2')), pic: box(ui.$('.pic')) } : null };
  };
})();
