// Testes da v1.5.0: ícone/fantasma fora dos stories, baixar perfil, player, seleção no Direct, seguidores.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const EXT = process.argv[2];
const ONLY = process.argv[3] || 'all';
const DIR = path.dirname(new URL(import.meta.url).pathname);
const DL = path.join(DIR, 'dl15');
const SHOT = path.join(DIR, 'shots15');
fs.rmSync(DL, { recursive: true, force: true }); fs.mkdirSync(DL, { recursive: true }); fs.mkdirSync(SHOT, { recursive: true });
const CDN = 'https://127.0.0.1/v/t51/';
const FB = 'https://127.0.0.1/o1/v/t2/f2/m78/';
const ME = '4242';
const out = {};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mode = process.env.MODE || 'dark';

const icon = (label) => `<svg aria-label="${label}" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const bg = mode === 'dark' ? '0,0,0' : '255,255,255';
const fg = mode === 'dark' ? '#f5f5f5' : '#000';
const nav = `<nav style="position:fixed;left:0;top:0;bottom:0;width:72px;border-right:1px solid ${mode === 'dark' ? '#262626' : '#dbdbdb'};z-index:5;background:rgb(${bg})">
<a href="/" style="position:absolute;left:24px;top:28px">${icon('Instagram')}</a>
${['Página inicial', 'Pesquisa', 'Explorar', 'Reels', 'Mensagens', 'Notificações', 'Criar'].map((l, i) => `<a href="${i === 0 ? '/' : '/x' + i}" style="position:absolute;left:24px;top:${120 + i * 56}px;color:inherit">${icon(l)}</a>`).join('')}
<a href="/eu/" style="position:absolute;left:24px;top:${120 + 7 * 56}px"><img alt="" src="${CDN}foto_n.jpg?stp=small" style="width:24px;height:24px;border-radius:50%;object-fit:cover"></a>
<a href="/s" style="position:absolute;left:24px;bottom:40px;color:inherit">${icon('Configurações')}</a></nav>`;
const IGREQ = `<script>window.unfCalls=[];window.require=function(m){if(m==='PolarisSharedAPI')return{unfollowUser:function(id){window.unfCalls.push(String(id));return new Promise(function(r){setTimeout(function(){r({status:'ok',friendship_status:{following:false}})},80)})}};throw new Error('no module '+m)};</script>`;
const shell = (body, extraHead = '') => `<!doctype html><html class="${mode === 'dark' ? '__fb-dark-mode' : '__fb-light-mode'}"><head><meta charset="utf-8"><style>[hidden]{display:none!important}</style>${IGREQ}${extraHead}</head>
<body style="margin:0;background:rgb(${bg});color:${fg};font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">${nav}${body}</body></html>`;

// ───────── perfil simulado: 30 posts em 3 páginas (12 no HTML + 12 + 6 pela rolagem) ─────────
const owner = { username: 'pessoa.teste', pk: '999' };
function node(i) {
  const pk = String(5000 + i), code = 'C' + String(i).padStart(10, 'x');
  const t = 1792400000 - i * 86400;
  if (i % 7 === 3) return { pk, code, taken_at: t, media_type: 8, user: owner, image_versions2: { candidates: [{ width: 320, height: 320, url: CDN + 'foto_n.jpg?stp=small' }] },
    carousel_media: [
      { pk: pk + '1', media_type: 1, image_versions2: { candidates: [{ width: 1080, height: 1350, url: CDN + 'foto_n.jpg?stp=big' }] } },
      { pk: pk + '2', media_type: 2, has_audio: true, image_versions2: { candidates: [{ width: 640, height: 640, url: CDN + 'thumb.jpg' }] }, video_versions: [{ type: 101, url: FB + 'prog.mp4?c=' + i }] }] };
  if (i % 4 === 1) return { pk, code, taken_at: t, media_type: 2, has_audio: true, user: owner, image_versions2: { candidates: [{ width: 640, height: 640, url: CDN + 'thumb.jpg' }] }, video_versions: [{ type: 101, url: FB + 'prog.mp4?v=' + i }] };
  return { pk, code, taken_at: t, media_type: 1, user: owner, image_versions2: { candidates: [{ width: 320, height: 320, url: CDN + 'foto_n.jpg?stp=small' }, { width: 1440, height: 1800, url: CDN + 'foto_n.jpg?stp=big' }] } };
}
const conn = (from, n, more) => ({ data: { xdt_api__v1__feed__user_timeline_graphql_connection: { edges: Array.from({ length: n }, (_, k) => ({ node: node(from + k) })), page_info: { end_cursor: 'c' + (from + n), has_next_page: more } } } });
const profilePage = shell(`<main style="margin-left:72px;display:grid;justify-items:center">
  <header style="width:935px;display:flex;gap:80px;padding:40px 20px 44px;box-sizing:border-box;border-bottom:1px solid #333">
    <img src="${CDN}foto_n.jpg?stp=small" style="width:150px;height:150px;border-radius:50%;object-fit:cover;margin-left:50px">
    <section style="display:grid;gap:18px;align-content:start">
      <div style="display:flex;align-items:center;gap:8px"><h2 style="margin:0 12px 0 0;font-size:20px;font-weight:400">pessoa.teste</h2>
        <button style="height:32px;padding:0 16px;border:0;border-radius:8px;background:rgb(0,149,246);color:#fff;font-weight:600">Seguir</button>
        <button style="height:32px;padding:0 16px;border:0;border-radius:8px;background:rgb(54,54,54);color:#fff;font-weight:600">Enviar mensagem</button>
        <div role="button" style="width:32px;height:32px;display:grid;place-items:center">${icon('Opções')}</div></div>
      <ul style="display:flex;gap:40px;list-style:none;margin:0;padding:0"><li><span>30 posts</span></li><li><span><b>1.234</b> seguidores</span></li><li><span><b>321</b> seguindo</span></li></ul>
      <div><b>Pessoa Teste</b><br>Perfil simulado para o teste</div>
    </section></header>
  <div id="grid" style="width:935px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding-top:4px"></div>
</main>
<script type="application/json">${JSON.stringify({ require: [['x', conn(0, 12, true)]] })}</script>
<script>
  let page = 1, busy = false, more = true;
  const add = (n) => { for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.style.cssText = 'aspect-ratio:1;background:#2a2a2a'; grid.appendChild(d); } };
  add(12);
  addEventListener('scroll', async () => {
    if (busy || !more || innerHeight + scrollY < document.documentElement.scrollHeight - 300) return;
    busy = true;
    const r = await fetch('/graphql/query', { method: 'POST', body: 'fb_api_req_friendly_name=PolarisProfilePostsTabContentQuery_connection&page=' + page });
    const j = await r.json(); page++;
    const e = j.data.xdt_api__v1__feed__user_timeline_graphql_connection;
    add(e.edges.length); more = e.page_info.has_next_page; busy = false;
  });
</script>`);

// ───────── post com vídeo (player) ─────────
const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const CODE = 'DPlayerTst1';
let vpk = 0n; for (const c of CODE) vpk = vpk * 64n + BigInt(ALPH.indexOf(c));
const vitem = { pk: vpk.toString(), code: CODE, media_type: 2, has_audio: true, taken_at: 1792300000, user: owner, image_versions2: { candidates: [{ width: 720, height: 720, url: CDN + 'thumb.jpg' }] }, video_versions: [{ type: 101, url: FB + 'prog.mp4?player=1' }] };
const postPage = shell(`<main style="margin-left:72px;display:grid;justify-items:center;padding-top:30px">
  <article style="width:470px;border-bottom:1px solid #333;padding-bottom:12px">
    <div style="display:flex;align-items:center;gap:10px;height:56px"><b>pessoa.teste</b> · <a href="/p/${CODE}/" style="color:#888">1 d</a></div>
    <div style="position:relative;width:470px;height:587px;background:#000;border-radius:4px;overflow:hidden">
      <video id="v" src="${FB}long.mp4" muted playsinline loop style="width:100%;height:100%;object-fit:cover"></video>
      <div style="position:absolute;inset:0"></div>
      <div role="button" aria-label="Ativar áudio" style="position:absolute;right:12px;bottom:12px;width:28px;height:28px;border-radius:50%;background:rgba(38,38,38,.8)"></div>
    </div>
    <div style="padding:10px 0">♡ 💬 ➤ <br><b>123 curtidas</b></div>
  </article></main>
<script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_shortcode_media: { items: [vitem] } } }]] })}</script>
<script>v.play().catch(()=>{});</script>`);

// ───────── Direct simulado: 40 conversas, carrega 15 por vez ao rolar e "virtualiza" as linhas longe da tela ─────────
const names = Array.from({ length: 40 }, (_, i) => ['ana.souza', 'bruno.dev', 'carla_m', 'diego.f', 'eduarda', 'felipe.r', 'gabi.art', 'henrique', 'isa.l', 'joao.p'][i % 10] + (i >= 10 ? '_' + i : ''));
const inboxPage = shell(`<div style="position:fixed;left:72px;top:0;bottom:0;width:397px;border-right:1px solid #333;display:grid;grid-template-rows:auto 1fr">
  <div style="padding:36px 24px 12px;font-size:20px;font-weight:700">voce.mesmo</div>
  <div id="list" style="overflow-y:auto">
    <div style="padding:6px 24px 10px;display:flex;justify-content:space-between"><b>Mensagens</b><span style="color:#888">Pedidos</span></div>
    <div id="rows"></div>
    <div id="loader" style="height:60px"></div>
  </div></div>
  <main style="margin-left:470px;display:grid;place-items:center;height:100vh;color:#888">Suas mensagens</main>
  <div id="menu" role="menu" hidden style="position:fixed;background:#262626;border-radius:12px;padding:8px;z-index:10;width:220px"></div>
  <div id="dlg" role="dialog" hidden style="position:fixed;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:11"><div style="background:#262626;border-radius:12px;width:400px;text-align:center;padding:20px">
    <b>Excluir conversa?</b><div style="display:grid;margin-top:16px"><button id="ok" style="height:48px;background:none;border:0;color:rgb(237,73,86);font-weight:700">Excluir</button><button id="no" style="height:48px;background:none;border:0;color:#fff">Cancelar</button></div></div></div>
<script>
  const NAMES = ${JSON.stringify(names)};
  window.actions = [];
  const menu = document.getElementById('menu'), dlg = document.getElementById('dlg'), rowsBox = document.getElementById('rows'), list = document.getElementById('list');
  let target = null, loaded = 0, loading = false;
  function make(i) {
    const n = NAMES[i];
    const row = document.createElement('div');
    row.className = 'row'; row.dataset.i = i; row.dataset.n = n;
    row.style.cssText = 'position:relative;height:72px;display:flex;align-items:center;gap:12px;padding:0 24px;cursor:pointer;box-sizing:border-box';
    row.__reactFiber$test = { memoizedProps: { onClick() {} }, return: { memoizedProps: { x: 1 }, return: { memoizedProps: { threadKeyForSelection: '34028236692093846346' + (100 + i) }, return: null } } };
    fill(row);
    row.addEventListener('mouseover', () => {
      if (!row.getAttribute('role') || row.querySelector('[aria-haspopup]')) return;
      const b = document.createElement('div'); b.setAttribute('role', 'button'); b.setAttribute('aria-haspopup', 'dialog');
      b.style.cssText = 'position:absolute;right:16px;top:20px;width:32px;height:32px;display:grid;place-items:center';
      b.innerHTML = '<svg aria-label="Mais opções" width="24" height="24" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>';
      b.addEventListener('click', (e) => { e.stopPropagation(); target = row; const r = b.getBoundingClientRect();
        menu.innerHTML = ['Marcar como não lida', 'Pin', 'Silenciar', 'Excluir'].map((t) => '<div role="menuitem" tabindex="0" style="padding:10px 12px;border-radius:8px">' + t + '</div>').join('');
        menu.style.left = r.left + 'px'; menu.style.top = r.bottom + 'px'; menu.hidden = false;
        for (const it of menu.children) it.addEventListener('click', () => { menu.hidden = true; const a = it.textContent;
          if (a === 'Excluir') { dlg.hidden = false; return; } window.actions.push(a + ':' + target.dataset.n); }); });
      row.appendChild(b);
    });
    row.addEventListener('mouseleave', () => { const b = row.querySelector('[aria-haspopup]'); if (b) b.remove(); });
    row.addEventListener('click', () => window.actions.push('open:' + row.dataset.n));
    return row;
  }
  function fill(row) { const i = +row.dataset.i; row.setAttribute('role', 'button'); row.innerHTML = '<span style="width:56px;height:56px;border-radius:50%;background:#444;flex:none"></span><div style="flex:1;min-width:0"><div class="nm">' + row.dataset.n + '</div><div style="color:#888;font-size:13px">Você: ok! · ' + (i + 1) + ' h</div></div>'; }
  function more() { const n = Math.min(15, NAMES.length - loaded); for (let k = 0; k < n; k++) rowsBox.appendChild(make(loaded + k)); loaded += n; }
  more();
  // virtualização: linha longe da área visível perde o conteúdo e o role (como o Instagram recicla)
  function virt() { const lr = list.getBoundingClientRect(); for (const r of rowsBox.children) { const b = r.getBoundingClientRect(); const far = b.bottom < lr.top - 300 || b.top > lr.bottom + 300; if (far && r.getAttribute('role')) { r.removeAttribute('role'); r.innerHTML = ''; } else if (!far && !r.getAttribute('role')) fill(r); } }
  list.addEventListener('scroll', () => { virt(); if (!loading && loaded < NAMES.length && list.scrollTop + list.clientHeight > list.scrollHeight - 200) { loading = true; setTimeout(() => { more(); loading = false; virt(); }, 400); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.hidden = true; });
  document.getElementById('ok').onclick = () => { dlg.hidden = true; window.actions.push('Excluir:' + target.dataset.n); target.remove(); virt(); };
  document.getElementById('no').onclick = () => { dlg.hidden = true; };
</script>`);

// ───────── seguidores simulados ─────────
const mk = (i) => ({ pk: String(70000 + i), pk_id: String(70000 + i), username: 'conta_' + String(i).padStart(3, '0') + (i % 9 === 0 ? '.oficial' : ''), full_name: ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fábio', 'Gil', 'Helena', 'Ivo'][i % 9] + ' ' + ['Lima', 'Souza', 'Prado', 'Reis'][i % 4], is_private: i % 5 === 0, is_verified: i % 9 === 0, profile_pic_url: i % 3 ? CDN + 'foto_n.jpg?stp=small' : '' });
let scanN = 1;
const lists = () => scanN === 1
  ? { following: Array.from({ length: 130 }, (_, i) => mk(i)), followers: Array.from({ length: 120 }, (_, i) => mk(i + 40)) } // 90 mútuos, 40 não seguem de volta, 30 você não segue
  : { following: Array.from({ length: 130 }, (_, i) => mk(i)), followers: Array.from({ length: 118 }, (_, i) => mk(i + 45)).concat([mk(300), mk(301)]) }; // 5 deixaram, 2+3 novos
const listPage = (kind, url) => {
  const all = lists()[kind];
  const count = +url.searchParams.get('count') || 12, from = +(url.searchParams.get('max_id') || 0);
  const users = all.slice(from, from + count);
  const next = from + count < all.length ? String(from + count) : null;
  return { users, big_list: !!next, page_size: count, next_max_id: next, status: 'ok' };
};

// ───────── navegador ─────────
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'p15-' + Date.now()), {
  executablePath: process.env.CHROME_PATH || undefined, headless: true, acceptDownloads: true, downloadsPath: DL,
  viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required',
    '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'],
});
await ctx.addCookies([{ name: 'ds_user_id', value: ME, domain: '.instagram.com', path: '/', secure: true }, { name: 'csrftoken', value: 'tok', domain: '.instagram.com', path: '/', secure: true }]);
let gqlPage = 0, apiHits = { fing: 0, fol: 0, info: 0 };
await ctx.route('https://www.instagram.com/**', async (route) => {
  const u = new URL(route.request().url());
  const p = u.pathname;
  if (p === '/graphql/query') { gqlPage++; const j = gqlPage === 1 ? conn(12, 12, true) : conn(24, 6, false); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) }); }
  if (p === `/api/v1/users/${ME}/info/`) { apiHits.info++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { username: 'voce.mesmo', follower_count: lists().followers.length, following_count: lists().following.length }, status: 'ok' }) }); }
  if (p === `/api/v1/friendships/${ME}/following/`) { apiHits.fing++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listPage('following', u)) }); }
  if (p === `/api/v1/friendships/${ME}/followers/`) { apiHits.fol++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listPage('followers', u)) }); }
  if (p.startsWith('/api/v1/media/')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [vitem], status: 'ok' }) });
  if (p === '/pessoa.teste/') return route.fulfill({ status: 200, contentType: 'text/html', body: profilePage });
  if (p.startsWith('/p/')) return route.fulfill({ status: 200, contentType: 'text/html', body: postPage });
  if (p.startsWith('/direct/inbox')) return route.fulfill({ status: 200, contentType: 'text/html', body: inboxPage });
  return route.fulfill({ status: 200, contentType: 'text/html', body: shell('<main style="margin-left:420px;padding-top:40px">Feed simulado</main>') });
});
let ghHits = 0;
await ctx.route('https://api.github.com/**', (r) => { ghHits++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tag_name: 'v9.9.9', html_url: 'https://github.com/DredsGG/salva-stories/releases/tag/v9.9.9', body: '### Install\n1. Download the zip.\n2. Open chrome://extensions.\n\n\nNew: download whole profiles faster.\n- Fixed the player on reels.\n- Unfollow with one confirmation.', assets: [{ name: 'salva-stories-v9.9.9.zip', browser_download_url: 'https://github.com/DredsGG/salva-stories/releases/download/v9.9.9/salva-stories-v9.9.9.zip' }] }) }); });
await ctx.route('https://github.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/zip', body: Buffer.from('PK\x05\x06' + '\0'.repeat(18), 'binary') }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(800);
await sw.evaluate(() => { self.__calls = []; const orig = chrome.downloads.download.bind(chrome.downloads); chrome.downloads.download = (o, cb) => { self.__calls.push(o.filename); return orig(o, cb); }; });
const p = await ctx.newPage();
const logs = []; p.on('console', (m) => { if (/Salva|Error|error/.test(m.text())) logs.push(m.text().slice(0, 200)); }); p.on('pageerror', (e) => logs.push('PAGEERR ' + e.message));
const downloads = async (n) => { const names = await sw.evaluate(() => self.__calls.slice()); const st = await sw.evaluate((n) => new Promise((r) => chrome.downloads.search({ orderBy: ['-startTime'], limit: n }, (d) => r(d.map((x) => x.state + (x.error ? ' ' + x.error : ''))))), n); return names.slice(-n).reverse().map((f, i) => f + ' | ' + (st[i] || '?')); };

// 1) menu: ícone do cabeçalho + fantasma fora dos stories
if (ONLY === 'all' || ONLY === 'menu') {
  await sw.evaluate(() => chrome.storage.sync.set({ ghost: true }));
  await p.goto('https://www.instagram.com/'); await wait(1500);
  let d = await p.evaluate(() => window.__salvaStoriesMenuDebug());
  out.menuSlot = d.slot; out.ghostBadge = d.ghostBadge;
  if (d.ghostBadge) { await p.mouse.move(d.ghostBadge.x, d.ghostBadge.y); await wait(400); }
  await p.screenshot({ path: path.join(SHOT, `ghost-sidebar-${mode}.png`), clip: { x: 0, y: 0, width: 420, height: 720 } });
  await p.mouse.click(d.slot.x + 24, d.slot.y + 24); await wait(600);
  d = await p.evaluate(() => window.__salvaStoriesMenuDebug());
  out.menuOpen = d.open; out.followsTool = d.at && d.at.follows;
  await p.screenshot({ path: path.join(SHOT, `menu-${mode}.png`) });
  await sw.evaluate(() => chrome.storage.sync.set({ ghost: false }));
  await wait(400);
  out.ghostBadgeAfterOff = (await p.evaluate(() => window.__salvaStoriesMenuDebug())).ghostBadge;
  await p.keyboard.press('Escape');
}

// 2) baixar perfil
const dbgOf = (fn) => p.evaluate((fn) => window[fn](), fn);
const clickAt = async (pt) => { if (!pt) throw new Error('sem posição'); await p.mouse.click(pt.x, pt.y); };
if (ONLY === 'all' || ONLY === 'profile') {
  await p.goto('https://www.instagram.com/pessoa.teste/'); await wait(1500);
  let d = await dbgOf('__salvaStoriesProfileDebug');
  out.profilePill = d.at && d.at.pill;
  await p.screenshot({ path: path.join(SHOT, `profile-btn-${mode}.png`), clip: { x: 72, y: 0, width: 1208, height: 300 } });
  await clickAt(d.at.pill); await wait(500);
  await p.screenshot({ path: path.join(SHOT, `profile-card-${mode}.png`), clip: { x: 72, y: 0, width: 1208, height: 600 } });
  d = await dbgOf('__salvaStoriesProfileDebug');
  out.profileChips = d.at.chips.length;
  await clickAt(d.at.go); await wait(300);
  const t0 = Date.now();
  let shotMid = false;
  while (Date.now() - t0 < 120000) { d = await dbgOf('__salvaStoriesProfileDebug'); if (!shotMid && d.busy && Date.now() - t0 > 2500) { shotMid = true; await p.screenshot({ path: path.join(SHOT, `profile-progress-${mode}.png`), clip: { x: 72, y: 0, width: 1208, height: 600 } }); } if (!d.busy && Date.now() - t0 > 3000) break; await wait(500); }
  out.profileDebug = { posts: d.posts, more: d.more, status: d.status }; out.profileSecs = Math.round((Date.now() - t0) / 1000);
  await p.screenshot({ path: path.join(SHOT, `profile-done-${mode}.png`), clip: { x: 72, y: 0, width: 1208, height: 600 } });
  await wait(2500);
  const dl = await downloads(80);
  out.profileFiles = dl.length; out.profileSample = dl.slice(0, 3).concat(dl.slice(-3));
  out.profileFolders = [...new Set(dl.map((x) => x.split('/').slice(0, 4).join('/')))];
  out.gqlPages = gqlPage;
}

// 3) player
if (ONLY === 'all' || ONLY === 'player') {
  await p.goto(`https://www.instagram.com/p/${CODE}/`); await wait(2500);
  const vr = await p.evaluate(() => { const r = document.getElementById('v').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.mouse.move(vr.x + vr.w / 2, vr.y + vr.h / 2); await wait(150); await p.mouse.move(vr.x + vr.w / 2 + 5, vr.y + vr.h / 2 + 5); await wait(600);
  let d = await dbgOf('__salvaStoriesPlayerDebug');
  out.playerShown = d.shown;
  const vid = () => p.evaluate(() => { const v = document.getElementById('v'); return { t: +v.currentTime.toFixed(1), paused: v.paused, rate: v.playbackRate, muted: v.muted, vol: +v.volume.toFixed(2) }; });
  out.p0 = await vid();
  await p.screenshot({ path: path.join(SHOT, `player-${mode}.png`), clip: { x: vr.x - 20, y: vr.y - 10, width: vr.w + 40, height: vr.h + 20 } });
  await clickAt(d.at.pp); await wait(300); out.pAfterPause = await vid();
  await clickAt(d.at.fwd); await wait(200); out.pAfterFwd = await vid();
  await clickAt(d.at.back); await wait(200); out.pAfterBack = await vid();
  await clickAt(d.at.speed); await wait(300);
  d = await dbgOf('__salvaStoriesPlayerDebug');
  await p.screenshot({ path: path.join(SHOT, `player-speed-${mode}.png`), clip: { x: vr.x - 20, y: vr.y - 10, width: vr.w + 40, height: vr.h + 20 } });
  const two = d.at.rates.find((r) => r.r === '2'); await clickAt(two); await wait(200); out.pAfterRate = await vid();
  // volume: passa o mouse no botão de som para abrir a régua e clica no meio dela
  await clickAt(d.at.mute); await wait(200); out.pAfterUnmute = await vid();
  d = await dbgOf('__salvaStoriesPlayerDebug');
  await p.mouse.move(d.at.mute.x, d.at.mute.y); await wait(350);
  await p.mouse.click(d.at.mute.x + 17 + 4 + 35, d.at.mute.y); await wait(200); out.pAfterVol = await vid();
  // seek: clica a 75% da linha
  d = await dbgOf('__salvaStoriesPlayerDebug');
  const seekW = await p.evaluate(() => null);
  await clickAt(d.at.pp); await wait(200); // volta a tocar
  await p.screenshot({ path: path.join(SHOT, `player-playing-${mode}.png`), clip: { x: vr.x - 20, y: vr.y - 10, width: vr.w + 40, height: vr.h + 20 } });
  await clickAt(d.at.dl); await wait(3000);
  out.playerDownload = await downloads(1);
  // o mouse saindo do vídeo esconde a barra
  await p.mouse.move(1200, 100); await wait(800); out.playerHiddenAfterLeave = !(await dbgOf('__salvaStoriesPlayerDebug')).shown;
}

// 4) Direct
if (ONLY === 'all' || ONLY === 'inbox') {
  await p.goto('https://www.instagram.com/direct/inbox/'); await wait(1600);
  let d = await dbgOf('__salvaStoriesInboxDebug');
  out.inboxRowsInDom = d.rows.length;
  await clickAt(d.at.fab); await wait(500);
  d = await dbgOf('__salvaStoriesInboxDebug');
  // "Todas" precisa carregar as 40 (só 15 vêm de início)
  await clickAt(d.at.all);
  let t0 = Date.now(); let shot = false;
  while (Date.now() - t0 < 90000) { await wait(500); d = await dbgOf('__salvaStoriesInboxDebug'); if (!shot && d.busy && Date.now() - t0 > 2000) { shot = true; await p.screenshot({ path: path.join(SHOT, `inbox-loading-${mode}.png`), clip: { x: 0, y: 0, width: 640, height: 860 } }); } if (!d.busy && Date.now() - t0 > 1500) break; }
  out.inboxAllSelected = d.selected; out.inboxAllSecs = Math.round((Date.now() - t0) / 1000);
  await p.screenshot({ path: path.join(SHOT, `inbox-all-${mode}.png`), clip: { x: 0, y: 0, width: 640, height: 860 } });
  await clickAt(d.at.all); await wait(300); out.inboxAfterNone = (await dbgOf('__salvaStoriesInboxDebug')).selected;
  // marca a 1ª (visível) e a última (lá embaixo, fora do DOM depois de voltar ao topo)
  const rowPt = (n) => p.evaluate((n) => { const r = [...document.querySelectorAll('.row')].find((x) => x.dataset.n === n); if (!r) return null; r.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect(); return { x: b.left + 100, y: b.top + b.height / 2 }; }, n);
  let pt = await rowPt(names[0]); await wait(300); pt = await rowPt(names[0]); await clickAt(pt); await wait(200);
  pt = await rowPt(names[39]); await wait(700); pt = await rowPt(names[39]); await wait(700); out.lastPt = pt; out.selBeforeLast = (await dbgOf('__salvaStoriesInboxDebug')).selected; await p.screenshot({ path: path.join(SHOT, 'inbox-last-dbg.png'), clip: { x: 0, y: 0, width: 640, height: 860 } }); await clickAt(pt); await wait(300); out.selAfterLast = (await dbgOf('__salvaStoriesInboxDebug')).selected;
  await p.evaluate(() => { document.getElementById('list').scrollTop = 0; }); await wait(600);
  out.lastRowInDomAfterTop = await p.evaluate((n) => { const r = [...document.querySelectorAll('.row')].find((x) => x.dataset.n === n); return !!(r && r.getAttribute('role')); }, names[39]);
  await wait(3800); // a linha de progresso do "Todas" some e a barra desce
  d = await dbgOf('__salvaStoriesInboxDebug'); out.inboxTwoSelected = d.selected;
  await clickAt(d.at.acts.unread); await wait(300);
  t0 = Date.now(); while (Date.now() - t0 < 60000) { d = await dbgOf('__salvaStoriesInboxDebug'); if (!d.busy && Date.now() - t0 > 1500) break; await wait(300); }
  out.inboxActions1 = await p.evaluate(() => window.actions.slice());
  out.inboxDbg1 = { status: d.status, last: d.lastResult, items: d.lastItems, sel: d.selected, action: d.lastAction, acts: d.at.acts };
  // excluir 2 (com uma confirmação só)
  for (const n of [names[2], names[3]]) { pt = await rowPt(n); await wait(250); pt = await rowPt(n); await wait(250); await clickAt(pt); await wait(150); }
  d = await dbgOf('__salvaStoriesInboxDebug');
  await clickAt(d.at.acts.del); await wait(500);
  d = await dbgOf('__salvaStoriesInboxDebug');
  await clickAt(d.at.ok); await wait(200);
  t0 = Date.now(); while (Date.now() - t0 < 60000) { d = await dbgOf('__salvaStoriesInboxDebug'); if (!d.busy && Date.now() - t0 > 1500) break; await wait(300); }
  out.inboxActions2 = await p.evaluate(() => window.actions.slice());
  out.inboxRowsLeft = await p.evaluate(() => document.querySelectorAll('.row').length);
}

// 5) seguidores
if (ONLY === 'all' || ONLY === 'follows') {
  await p.goto('https://www.instagram.com/'); await wait(1200);
  // abre pelo menu (Ferramentas → Seguidores e seguindo)
  let m = await dbgOf('__salvaStoriesMenuDebug');
  await p.mouse.click(m.slot.x + 24, m.slot.y + 24); await wait(600);
  m = await dbgOf('__salvaStoriesMenuDebug');
  if (m.at && m.at.follows) { await p.mouse.click(m.at.follows.x, m.at.follows.y); } else { await p.evaluate(() => window.dispatchEvent(new CustomEvent('salva-stories:follows'))); out.followsViaEvent = true; }
  await wait(700);
  let d = await dbgOf('__salvaStoriesFollowsDebug');
  out.followsOpen = d.open;
  await p.screenshot({ path: path.join(SHOT, `follows-intro-${mode}.png`) });
  await clickAt(d.at.go);
  const t0 = Date.now();
  await wait(3500);
  await p.screenshot({ path: path.join(SHOT, `follows-progress-${mode}.png`) });
  while (Date.now() - t0 < 90000) { d = await dbgOf('__salvaStoriesFollowsDebug'); if (d.hasData && !d.scan) break; await wait(500); }
  out.follows1 = { at: !!d.at, nFol: d.nFol, nFing: d.nFing, secs: Math.round((Date.now() - t0) / 1000) };
  await wait(600);
  await p.screenshot({ path: path.join(SHOT, `follows-result-${mode}.png`) });
  scanN = 2;
  const firstAt = (await p.evaluate(() => window.__salvaStoriesFollowsDebug())).at;
  void firstAt;
  d = await dbgOf('__salvaStoriesFollowsDebug');
  const at1 = await p.evaluate(() => { const x = window.__salvaStoriesFollowsDebug(); return x && x.at; });
  void at1;
  const stamp1 = await p.evaluate(() => window.__salvaStoriesFollowsDebug().hasData && window.__salvaStoriesFollowsDebug());
  await clickAt(d.at.again);
  const t1 = Date.now();
  await wait(1500);
  while (Date.now() - t1 < 90000) { d = await dbgOf('__salvaStoriesFollowsDebug'); if (d.hasData && !d.scan && Date.now() - t1 > 3000) break; await wait(500); }
  out.follows2 = { nFol: d.nFol, nFing: d.nFing, secs: Math.round((Date.now() - t1) / 1000) };
  await wait(600);
  await p.screenshot({ path: path.join(SHOT, `follows-result2-${mode}.png`) });
  await clickAt(d.at.cards.lost); await wait(400);
  await p.screenshot({ path: path.join(SHOT, `follows-lost-${mode}.png`) });
  d = await dbgOf('__salvaStoriesFollowsDebug');
  await clickAt(d.at.cards.notBack); await wait(300);
  d = await dbgOf('__salvaStoriesFollowsDebug');
  await clickAt(d.at.search); await p.keyboard.type('oficial'); await wait(400);
  await p.screenshot({ path: path.join(SHOT, `follows-search-${mode}.png`) });
  out.apiHits = { ...apiHits };
  out.stored = await sw.evaluate((me) => chrome.storage.local.get('ss.follows.' + me).then((r) => { const x = r['ss.follows.' + me]; return x && { fol: x.followers.length, fing: x.following.length, prev: x.prev && x.prev.followers.length, hist: x.history.length, kb: Math.round(JSON.stringify(x).length / 1024) }; }), ME);
  void stamp1;
}

// 6) deixar de seguir (usa os dados da análise da seção 5)
if (ONLY === 'all' || ONLY === 'follows') {
  let d = await dbgOf('__salvaStoriesFollowsDebug');
  // aba "Não te seguem de volta"
  await clickAt(d.at.cards.notBack); await wait(500);
  d = await dbgOf('__salvaStoriesFollowsDebug');
  await clickAt(d.at.search); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await wait(2500);
  d = await dbgOf('__salvaStoriesFollowsDebug');
  out.avatarsNotBack = d.avatars;
  // marca 2 na mão, depois "Selecionar todas"
  await clickAt(d.at.ck[0]); await wait(150); await clickAt(d.at.ck[1]); await wait(200);
  d = await dbgOf('__salvaStoriesFollowsDebug'); out.unfManual = d.selected;
  await p.screenshot({ path: path.join(SHOT, `unfollow-select-${mode}.png`) });
  await clickAt(d.at.uall); await wait(300);
  d = await dbgOf('__salvaStoriesFollowsDebug'); out.unfAll = d.selected;
  await clickAt(d.at.ugo); await wait(500);
  await p.screenshot({ path: path.join(SHOT, `unfollow-confirm-${mode}.png`) });
  d = await dbgOf('__salvaStoriesFollowsDebug');
  await clickAt(d.at.dlgOk); await wait(1500);
  d = await dbgOf('__salvaStoriesFollowsDebug'); out.unfBusyDuring = d.busyFlag;
  await p.screenshot({ path: path.join(SHOT, `unfollow-running-${mode}.png`) });
  const t0 = Date.now(); while (Date.now() - t0 < 120000) { d = await dbgOf('__salvaStoriesFollowsDebug'); if (d.unf && d.unf.state === 'idle') break; await wait(500); }
  out.unfResult = { unf: d.unf, unfollowed: d.unfollowed, busyAfter: d.busyFlag, calls: (await p.evaluate(() => window.unfCalls.length)) };
  await wait(500);
  await p.screenshot({ path: path.join(SHOT, `unfollow-done-${mode}.png`) });
  out.storedAfterUnf = await sw.evaluate((me) => chrome.storage.local.get(null).then((r) => ({ fing: r['ss.follows.' + me] && r['ss.follows.' + me].following.length, day: r['ss.follows.' + me + '.day'] })), ME);
  await p.keyboard.press('Escape');
}

// 7) atualização + relatar bug no menu
if (ONLY === 'all' || ONLY === 'upd') {
  await p.goto('https://www.instagram.com/'); await wait(1500);
  out.realGithub = await sw.evaluate(() => chrome.storage.local.get('ss.update').then((r) => { const u = r['ss.update'] || {}; return { ultima: u.ultima, disponivel: u.disponivel, zip: !!u.zip, erro: u.erro }; }));
  await sw.evaluate(() => chrome.storage.local.get('ss.update').then((r) => chrome.storage.local.set({ 'ss.update': Object.assign({}, r['ss.update'] || {}, { procuradoEm: Date.now(), ultima: '9.9.9', disponivel: true, dispensada: null, notas: '### Install\n1. Download the zip.\n2. Open chrome://extensions.\n\n\nNew: download whole profiles faster.\n- Fixed the player on reels.\n- Unfollow with one confirmation.', zip: 'https://github.com/DredsGG/salva-stories/releases/download/v9.9.9/salva-stories-v9.9.9.zip', pagina: 'https://github.com/DredsGG/salva-stories/releases/tag/v9.9.9' }) })));
  await wait(500);
  let m = await dbgOf('__salvaStoriesMenuDebug');
  out.swOk = m.swOk;
  await p.mouse.click(m.slot.x + 24, m.slot.y + 24); await wait(1200);
  m = await dbgOf('__salvaStoriesMenuDebug');
  out.upd = { ultima: m.upd.ultima, disponivel: m.upd.disponivel, inst: m.upd.instalacao, erro: m.upd.erro, ghHits };
  await p.screenshot({ path: path.join(SHOT, `update-card-${mode}.png`) });
  // Atualizar → baixa o zip
  if (m.at.ugo) { await p.mouse.click(m.at.ugo.x, m.at.ugo.y); await wait(2500); }
  out.updDownloads = await sw.evaluate(() => new Promise((r) => chrome.downloads.search({ orderBy: ['-startTime'], limit: 2 }, (d) => r(d.map((x) => x.url.slice(0, 80) + ' ' + x.state)))));
  m = await dbgOf('__salvaStoriesMenuDebug');
  out.afterApply = { open: m.open, pages: ctx.pages().map((x) => x.url().slice(0, 60)) };
  if (!m.open) { await p.mouse.click(m.slot.x + 24, m.slot.y + 24); await wait(800); m = await dbgOf('__salvaStoriesMenuDebug'); }
  await p.screenshot({ path: path.join(SHOT, `update-downloaded-${mode}.png`) });
  // Relatar bug
  out.beforeBug = { open: m.open, ubug: m.at && m.at.ubug, afterApply: out.afterApply };
  await p.screenshot({ path: path.join(SHOT, 'dbg-before-bug.png') });
  out.elAt = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && e.tagName; }, [m.at.ubug.x, m.at.ubug.y]);
  await p.mouse.click(m.at.ubug.x, m.at.ubug.y); await wait(400);
  m = await dbgOf('__salvaStoriesMenuDebug');
  out.afterBug = { open: m.open, stack: await p.evaluate(() => window.__ssCloseStack) };
  if (!m.at) { console.log(JSON.stringify(out, null, 1)); await p.screenshot({ path: path.join(SHOT, 'dbg-bug.png') }); process.exit(0); }
  await p.mouse.click(m.at.bwhat.x, m.at.bwhat.y); await p.keyboard.type('O botão de baixar sumiu no story (teste dd)'); await wait(300);
  m = await dbgOf('__salvaStoriesMenuDebug');
  out.bugUrlLen = m.bugUrl && m.bugUrl.length; out.bugUrlStart = m.bugUrl && decodeURIComponent(m.bugUrl).slice(0, 200);
  out.bugHasLog = !!(m.bugUrl && decodeURIComponent(m.bugUrl).includes('Log'));
  await p.screenshot({ path: path.join(SHOT, `bug-card-${mode}.png`) });
  const [gh] = await Promise.all([ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null), p.mouse.click(m.at.bgh.x, m.at.bgh.y)]);
  out.bugOpened = gh ? gh.url().slice(0, 90) : null;
  if (gh) await gh.close();
  out.downloadsAfterTyping = await sw.evaluate(() => new Promise((r) => chrome.downloads.search({ orderBy: ['-startTime'], limit: 5 }, (d) => r(d.length))));
}

out.logs = logs.slice(0, 30);
console.log(JSON.stringify(out, null, 1));
await ctx.close();
