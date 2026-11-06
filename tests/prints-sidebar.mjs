// Print do README (v1.9.0): coluna da barra lateral com Seguidores e Trocar de conta, balão em inglês e o diálogo de troca
// (simulado, contas fictícias example.account_a / example.account_b). Uso: node prints-sidebar.mjs $PWD/ext-test
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'shotsgh'); fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const AV = 'https://127.0.0.1/v/t51/me_n.jpg';
const icon = (label) => `<svg aria-label="${label}" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#f5f5f5" stroke-width="2"/></svg>`;
const acct = (u, cur) => `<div role="button" style="display:flex;align-items:center;gap:12px;height:60px;padding:0 20px"><img src="${AV}" style="width:44px;height:44px;border-radius:50%"><span style="flex:1;font-weight:600">${u}</span>${cur ? '<span style="width:22px;height:22px;border-radius:50%;background:#f5f5f5;color:#000;display:grid;place-items:center;font-size:13px">✓</span>' : ''}</div>`;
const page = `<!doctype html><html class="__fb-dark-mode"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#000;color:#f5f5f5;font:14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
<nav style="position:fixed;left:0;top:0;bottom:0;width:72px;border-right:1px solid #262626;background:#000">
  ${['Home', 'Reels', 'Messages', 'Search', 'Notifications'].map((l, i) => `<a href="${i === 0 ? '/' : '/x' + i + '/'}" style="position:absolute;left:24px;top:${60 + i * 56}px">${icon(l)}</a>`).join('')}
  <a href="/example.account_a/" style="position:absolute;left:24px;top:${60 + 5 * 56}px"><img src="${AV}" alt="Profile picture of example.account_a" style="width:24px;height:24px;border-radius:50%;display:block"></a>
  <a id="mais" href="#" role="link" style="position:absolute;left:24px;bottom:30px">${icon('Settings')}<span style="position:absolute;left:-9999px">More</span></a>
</nav>
<script>
  document.getElementById('mais').addEventListener('click', (e) => { e.preventDefault(); const m = document.getElementById('pop'); if (m) { m.remove(); return; }
    const d = document.createElement('div'); d.id = 'pop'; d.setAttribute('role', 'dialog'); d.style.cssText = 'position:fixed;left:12px;bottom:80px;width:240px;background:#262626;border-radius:16px';
    d.innerHTML = ['Settings', 'Saved', 'Switch accounts', 'Log out'].map((t) => '<div role="button" style="height:48px;line-height:48px;padding:0 16px">' + t + '</div>').join('');
    document.body.appendChild(d);
    [...d.children].forEach((it) => { if (it.textContent === 'Switch accounts') it.addEventListener('click', () => { d.remove(); openSwitch(); }); }); });
  function openSwitch() { const s = document.createElement('div'); s.setAttribute('role', 'dialog');
    s.style.cssText = 'position:fixed;left:330px;top:90px;width:380px;background:#262626;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.6)';
    s.innerHTML = '<div style="text-align:center;font-weight:700;padding:14px;border-bottom:1px solid #363636">Switch accounts</div>' + ${JSON.stringify(acct('example.account_a', true) + acct('example.account_b', false))} + '<div style="margin:10px 20px 18px;padding:10px;border-radius:8px;background:#363636;text-align:center;font-weight:600">Log into an existing account</div>';
    document.body.appendChild(s); }
</script></body></html>`;
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pps-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 760, height: 700 }, deviceScaleFactor: 2, locale: 'en-US', colorScheme: 'dark',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=en-US'],
});
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
await ctx.route('https://127.0.0.1/**', (r) => (r.request().url() === AV ? r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(path.join(DIR, 'media', 'avatar-sm.jpg')) }) : r.fulfill({ status: 404, body: '' })));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(800);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => chrome.storage.sync.set({ ghost: true, lang: 'en' }));
const p = await ctx.newPage();
await p.goto('https://www.instagram.com/'); await wait(1500);
let d = await p.evaluate(() => window.__salvaStoriesMenuDebug().side);
await p.mouse.click(d.acc.x, d.acc.y); await wait(1200);
d = await p.evaluate(() => window.__salvaStoriesMenuDebug().side);
await p.mouse.move(d.acc.x, d.acc.y); await wait(500);
await p.screenshot({ path: path.join(OUT, 'salva-stories-sidebar-buttons.png') });
console.log('ok', JSON.stringify(d));
await ctx.close();
