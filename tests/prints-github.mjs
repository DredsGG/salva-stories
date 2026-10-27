// Testes da v1.5.0: ícone/fantasma fora dos stories, baixar perfil, player, seleção no Direct, seguidores.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const EXT = process.argv[2];
const ONLY = process.argv[3] || 'all';
const DIR = path.dirname(new URL(import.meta.url).pathname);
const DL = path.join(DIR, 'dl15');
const SHOT = path.join(DIR, 'shotsgh');
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
${['Home', 'Search', 'Explore', 'Reels', 'Messages', 'Notifications', 'Create'].map((l, i) => `<a href="${i === 0 ? '/' : '/x' + i}" style="position:absolute;left:24px;top:${120 + i * 56}px;color:inherit">${icon(l)}</a>`).join('')}
<a href="/eu/" style="position:absolute;left:24px;top:${120 + 7 * 56}px"><img alt="" src="${CDN}foto_n.jpg?stp=small" style="width:24px;height:24px;border-radius:50%;object-fit:cover"></a>
<a href="/s" style="position:absolute;left:24px;bottom:40px;color:inherit">${icon('Settings')}</a></nav>`;
const IGREQ = `<script>window.unfCalls=[];window.require=function(m){if(m==='PolarisSharedAPI')return{unfollowUser:function(id){window.unfCalls.push(String(id));return new Promise(function(r){setTimeout(function(){r({status:'ok',friendship_status:{following:false}})},80)})}};throw new Error('no module '+m)};</script>`;
const shell = (body, extraHead = '') => `<!doctype html><html class="${mode === 'dark' ? '__fb-dark-mode' : '__fb-light-mode'}"><head><meta charset="utf-8"><style>[hidden]{display:none!important}</style>${IGREQ}${extraHead}</head>
<body style="margin:0;background:rgb(${bg});color:${fg};font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">${nav}${body}</body></html>`;

// ───────── perfil simulado: 30 posts em 3 páginas (12 no HTML + 12 + 6 pela rolagem) ─────────
const owner = { username: 'example.profile', pk: '999' };
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
      <div style="display:flex;align-items:center;gap:8px"><h2 style="margin:0 12px 0 0;font-size:20px;font-weight:400">example.profile</h2>
        <button style="height:32px;padding:0 16px;border:0;border-radius:8px;background:rgb(0,149,246);color:#fff;font-weight:600">Follow</button>
        <button style="height:32px;padding:0 16px;border:0;border-radius:8px;background:rgb(54,54,54);color:#fff;font-weight:600">Message</button>
        <div role="button" style="width:32px;height:32px;display:grid;place-items:center">${icon('Options')}</div></div>
      <ul style="display:flex;gap:40px;list-style:none;margin:0;padding:0"><li><span><b>30</b> posts</span></li><li><span><b>1,234</b> followers</span></li><li><span><b>321</b> following</span></li></ul>
      <div><b>Example Profile</b><br>Test page used for these screenshots</div>
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
    <div style="display:flex;align-items:center;gap:10px;height:56px"><b>example.profile</b> · <a href="/p/${CODE}/" style="color:#888">1d</a></div>
    <div style="position:relative;width:470px;height:587px;background:#000;border-radius:4px;overflow:hidden">
      <video id="v" src="${FB}long.mp4" muted playsinline loop style="width:100%;height:100%;object-fit:cover"></video>
      <div style="position:absolute;inset:0"></div>
      <div role="button" aria-label="Audio" style="position:absolute;right:12px;bottom:12px;width:28px;height:28px;border-radius:50%;background:rgba(38,38,38,.8)"></div>
    </div>
    <div style="padding:10px 0">♡ 💬 ➤ <br><b>123 likes</b></div>
  </article></main>
<script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_shortcode_media: { items: [vitem] } } }]] })}</script>
<script>v.play().catch(()=>{});</script>`);

// ───────── Direct simulado: 40 conversas, carrega 15 por vez ao rolar e "virtualiza" as linhas longe da tela ─────────
const names = Array.from({ length: 40 }, (_, i) => 'example_chat_' + String(i + 1).padStart(2, '0'));
const inboxPage = shell(`<div style="position:fixed;left:72px;top:0;bottom:0;width:397px;border-right:1px solid #333;display:grid;grid-template-rows:auto 1fr">
  <div style="padding:36px 24px 12px;font-size:20px;font-weight:700">your.account</div>
  <div id="list" style="overflow-y:auto">
    <div style="padding:6px 24px 10px;display:flex;justify-content:space-between"><b>Messages</b><span style="color:#888">Requests</span></div>
    <div id="rows"></div>
    <div id="loader" style="height:60px"></div>
  </div></div>
  <main style="margin-left:470px;display:grid;place-items:center;height:100vh;color:#888">Your messages</main>
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
  function fill(row) { const i = +row.dataset.i; row.setAttribute('role', 'button'); row.innerHTML = '<span style="width:56px;height:56px;border-radius:50%;background:#444;flex:none"></span><div style="flex:1;min-width:0"><div class="nm">' + row.dataset.n + '</div><div style="color:#888;font-size:13px">You: ok! · ' + (i + 1) + 'h</div></div>'; }
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
const mk = (i) => ({ pk: String(70000 + i), pk_id: String(70000 + i), username: 'sample_user_' + String(i).padStart(3, '0'), full_name: 'Sample User ' + i, is_private: i % 5 === 0, is_verified: i % 9 === 0, profile_pic_url: i % 3 ? CDN + 'foto_n.jpg?stp=small' : '' });
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


const sitems = [{ pk: '111', id: '111_999', media_type: 1, taken_at: 1792400000, user: owner, image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'foto_n.jpg?stp=small' }, { width: 1320, height: 2346, url: CDN + 'foto_n.jpg?stp=big' }] } }];
const storyPage = `<!doctype html><html class="__fb-dark-mode"><head><meta charset="utf-8"></head><body style="margin:0;background:#1a1a1a;display:grid;place-items:center;height:100vh;font-family:system-ui,sans-serif;color:#fff">
<div style="position:relative;width:420px;height:747px;border-radius:8px;overflow:hidden"><img id="m" src="${CDN}foto_n.jpg?stp=small" style="width:100%;height:100%;object-fit:cover">
<div style="position:absolute;left:12px;right:12px;top:10px;height:2px;background:rgba(255,255,255,.5)"><div style="width:40%;height:100%;background:#fff"></div></div>
<div style="position:absolute;left:14px;top:24px;font-size:14px;font-weight:600">example.profile <span style="opacity:.7;font-weight:400">2h</span></div></div>
<script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user: owner, items: sitems }] } } }]] })}</script></body></html>`;
// ───────── navegador ─────────
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pgh-' + Date.now()), {
  executablePath: process.env.CHROME_PATH || undefined, channel: 'chromium', headless: true, acceptDownloads: true, downloadsPath: DL,
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
  if (p === `/api/v1/users/${ME}/info/`) { apiHits.info++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { username: 'your.account', follower_count: lists().followers.length, following_count: lists().following.length }, status: 'ok' }) }); }
  if (p === `/api/v1/friendships/${ME}/following/`) { apiHits.fing++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listPage('following', u)) }); }
  if (p === `/api/v1/friendships/${ME}/followers/`) { apiHits.fol++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listPage('followers', u)) }); }
  if (p.startsWith('/api/v1/media/')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [vitem], status: 'ok' }) });
  if (p.startsWith('/stories/')) return route.fulfill({ status: 200, contentType: 'text/html', body: storyPage });
  if (p === '/example.profile/') return route.fulfill({ status: 200, contentType: 'text/html', body: profilePage });
  if (p.startsWith('/p/')) return route.fulfill({ status: 200, contentType: 'text/html', body: postPage });
  if (p.startsWith('/direct/inbox')) return route.fulfill({ status: 200, contentType: 'text/html', body: inboxPage });
  return route.fulfill({ status: 200, contentType: 'text/html', body: shell('<main style="margin-left:420px;padding-top:40px"></main>') });
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


await sw.evaluate(() => chrome.storage.sync.set({ lang: 'en', ghost: false }));
const dbgOf = (fn) => p.evaluate((fn) => window[fn](), fn);
const clickAt = async (pt) => { if (!pt) throw new Error('no pos'); await p.mouse.click(pt.x, pt.y); };
const S = (n, clip) => p.screenshot({ path: path.join(SHOT, n + '.png'), clip });
if (ONLY === 'all' || ONLY === 'story') {
  await p.goto('https://www.instagram.com/stories/example.profile/111/'); await wait(2000);
  await p.mouse.move(640, 430); await wait(600);
  out.storyDbg = await p.evaluate(() => window.__salvaStoriesDebug && window.__salvaStoriesDebug());
  await S('story', { x: 330, y: 20, width: 620, height: 820 });
}
if (ONLY === 'all' || ONLY === 'menu') {
  await p.goto('https://www.instagram.com/'); await wait(1500);
  let d = await dbgOf('__salvaStoriesMenuDebug');
  await p.mouse.click(d.slot.x + 24, d.slot.y + 24); await wait(800);
  await S('menu');
  await p.keyboard.press('Escape');
}
if (ONLY === 'all' || ONLY === 'profile') {
  await p.goto('https://www.instagram.com/example.profile/'); await wait(1500);
  let d = await dbgOf('__salvaStoriesProfileDebug');
  await clickAt(d.at.pill); await wait(600);
  await S('profile', { x: 72, y: 0, width: 1208, height: 600 });
}
if (ONLY === 'all' || ONLY === 'player') {
  await p.goto(`https://www.instagram.com/p/${CODE}/`); await wait(2500);
  const vr = await p.evaluate(() => { const r = document.getElementById('v').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.mouse.move(vr.x + vr.w / 2, vr.y + vr.h / 2); await wait(150); await p.mouse.move(vr.x + vr.w / 2 + 5, vr.y + vr.h / 2 + 5); await wait(600);
  let d = await dbgOf('__salvaStoriesPlayerDebug');
  await clickAt(d.at.speed); await wait(400);
  await S('player', { x: vr.x - 20, y: vr.y - 10, width: vr.w + 40, height: vr.h + 20 });
}
if (ONLY === 'all' || ONLY === 'inbox') {
  await p.goto('https://www.instagram.com/direct/inbox/'); await wait(1600);
  let d = await dbgOf('__salvaStoriesInboxDebug');
  await clickAt(d.at.fab); await wait(500);
  const rowPt = (n) => p.evaluate((n) => { const r = [...document.querySelectorAll('.row')].find((x) => x.dataset.n === n); const b = r.getBoundingClientRect(); return { x: b.left + 100, y: b.top + b.height / 2 }; }, n);
  for (const i of [0, 2, 3, 6]) { await clickAt(await rowPt(names[i])); await wait(200); }
  await p.mouse.move(900, 400); await wait(400);
  await S('inbox', { x: 0, y: 0, width: 640, height: 860 });
}
if (ONLY === 'all' || ONLY === 'follows') {
  await p.goto('https://www.instagram.com/'); await wait(1200);
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('salva-stories:follows'))); await wait(700);
  let d = await dbgOf('__salvaStoriesFollowsDebug');
  await clickAt(d.at.go);
  const t0 = Date.now(); while (Date.now() - t0 < 90000) { d = await dbgOf('__salvaStoriesFollowsDebug'); if (d.hasData && !d.scan) break; await wait(500); }
  scanN = 2; await clickAt(d.at.again); const t1 = Date.now(); await wait(1500);
  while (Date.now() - t1 < 90000) { d = await dbgOf('__salvaStoriesFollowsDebug'); if (d.hasData && !d.scan && Date.now() - t1 > 3000) break; await wait(500); }
  await wait(6000);
  await S('follows');
}
out.logs = logs.slice(0, 30);
console.log(JSON.stringify(out, null, 1));
await ctx.close();
