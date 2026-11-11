// Gera o print do README (docs/salva-stories-auto-reels.png): o botão Auto aceso na barra do player, num Reels simulado (vídeo de teste, nenhum dado de conta).
// Uso: node prints-auto-reels.mjs $PWD/ext-test <pasta de saída>
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WEBM = fs.readFileSync(path.join(DIR, 'media', 'short.webm')); // 3 s: cada volta dura 3 s
const OUT = process.argv[3] || DIR;
const reel = (i, photo) => `<div class="rl" style="height:100vh;display:grid;place-items:center;scroll-snap-align:start"><div style="position:relative;width:480px;height:800px">
  ${photo ? `<img id="v${i}" src="/p${i}.png" style="width:480px;height:800px;background:#345;display:block">` : `<video id="v${i}" src="/v.webm?${i}" muted autoplay playsinline style="width:480px;height:800px;background:#234;display:block"></video>`}
  <div role="button" class="snd" style="position:absolute;right:12px;top:12px;width:28px;height:28px;border-radius:50%;background:#0008;cursor:pointer"><svg aria-label="O áudio está silenciado" width="16" height="16"></svg></div></div></div>`;
const page = (photo, nobtn) => `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000">
<div id="sc" style="position:fixed;inset:0;overflow-y:scroll;scroll-snap-type:y mandatory">${[1, 2, 3].map((i) => reel(i, photo)).join('')}</div>
${nobtn ? '' : '<div id="nx" role="button" aria-label="Navegar para o próximo reel" style="position:fixed;right:40px;top:50%;width:44px;height:44px;background:#555;border-radius:50%;cursor:pointer"></div>'}
<div id="pv" role="button" aria-label="Navegar para o reel anterior" style="position:fixed;right:40px;top:44%;width:44px;height:44px;background:#555;border-radius:50%"></div>
<input id="txt" style="position:fixed;left:10px;bottom:10px;width:200px">
<script>
  window.igMuted = true; window.nextClicks = 0; window.laps = 0;
  const sc = document.getElementById('sc');
  const activeV = () => [...document.querySelectorAll('video, img[id^=v]')].find((v) => { const r = v.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
  window.activeIdx = () => { const v = activeV(); return v ? Number(v.id.slice(1)) : 0; };
  const label = () => document.querySelectorAll('.snd svg').forEach((s) => s.setAttribute('aria-label', igMuted ? 'O áudio está silenciado' : 'O áudio está em reprodução'));
  document.querySelectorAll('.snd').forEach((b) => b.addEventListener('click', () => { igMuted = !igMuted; const v = activeV(); if (v && v.tagName === 'VIDEO') v.muted = igMuted; label(); }));
  const nx = document.getElementById('nx'); if (nx) nx.addEventListener('click', () => { window.nextClicks++; sc.scrollTo(0, sc.scrollTop + innerHeight); });
  document.querySelectorAll('video').forEach((v) => v.addEventListener('ended', () => { if (v === activeV()) window.laps++; v.currentTime = 0; v.play().catch(() => {}); })); // como o Instagram: volta ao 0 e toca
  let last = null;
  setInterval(() => { const v = activeV(); if (v && v !== last) { last = v; if (v.tagName === 'VIDEO') { v.currentTime = 0; v.muted = igMuted; v.play().catch(() => {}); } label(); if (!location.search.includes('keepurl')) history.replaceState(null, '', '/reels/r' + v.id.slice(1) + '/'); } }, 100);
  window.openDialog = () => { const d = document.createElement('div'); d.setAttribute('role', 'dialog'); d.id = 'dlg'; d.style.cssText = 'position:fixed;right:0;top:0;width:360px;height:100vh;background:#222'; document.body.appendChild(d); };
  window.closeDialog = () => { const d = document.getElementById('dlg'); if (d) d.remove(); };
</script></body></html>`;

async function abrir(pages) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pauto-' + Date.now()), {
    headless: true, channel: 'chromium', viewport: { width: 1300, height: 900 },
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--autoplay-policy=no-user-gesture-required'],
  });
  await ctx.route('https://www.instagram.com/**', (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === '/v.webm') return r.fulfill({ status: 200, contentType: 'video/webm', body: WEBM });
    if (/^\/p\d\.png$/.test(u.pathname)) return r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
    const key = u.search.includes('photo') ? 'photo' : u.search.includes('nobtn') ? 'nobtn' : 'base';
    return r.fulfill({ status: 200, contentType: 'text/html', body: pages[key] });
  });
  await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1200);
  await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
  const p = await ctx.newPage();
  const st = () => p.evaluate(() => ({ idx: window.activeIdx(), next: window.nextClicks, laps: window.laps, path: location.pathname }));
  const setAuto = (on) => sw.evaluate((on) => chrome.storage.sync.set({ autoReels: on }), on);
  const pd = () => p.evaluate(() => window.__salvaStoriesPlayerDebug());
  return { ctx, sw, p, st, setAuto, pd };
}
const PAGES = { base: page(false, false) };
const { ctx, sw, p, setAuto } = await abrir(PAGES);
await setAuto(true);
await p.setViewportSize({ width: 900, height: 900 });
await p.goto('https://www.instagram.com/reels/r1/'); await wait(1500);
await p.mouse.click(450, 300); await wait(800);
await p.mouse.move(450, 450); await wait(300); await p.mouse.move(460, 460); await wait(700);
await p.screenshot({ path: path.join(OUT, 'salva-stories-auto-reels.png'), clip: { x: 150, y: 0, width: 600, height: 860 } });
await ctx.close();
console.log('print ok');
