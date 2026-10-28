// Print da página do GitHub: post aberto (modal) com os botões do Salva Stories ao lado. Conteúdo gerado, conta fictícia.
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2], OUT = process.argv[3];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const W = 560, H = 700;
const slide = (i) => `<li style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;list-style:none;transform:translateX(${i * W}px)"><img class="g" data-i="${i}" style="width:${W}px;height:${H}px;display:block"></li>`;
const bar = (w) => `<div style="height:10px;width:${w}px;border-radius:5px;background:#363636;margin:10px 0"></div>`;
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:repeating-linear-gradient(90deg,#2b2b2b 0 300px,#202020 300px 304px);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#f5f5f5">
<div role="dialog" style="position:fixed;inset:0;background:rgba(0,0,0,.72)">
 <svg style="position:absolute;right:22px;top:20px" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>
 <article style="position:absolute;left:150px;top:40px;height:${H}px;display:flex;border-radius:6px;overflow:hidden">
  <div id="vp" style="width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#111"><ul style="position:relative;width:1px;height:${H}px;margin:0;padding:0">${[0,1,2].map(slide).join('')}</ul>
   <div style="position:absolute;bottom:16px;left:0;right:0;display:flex;gap:5px;justify-content:center"><i style="width:6px;height:6px;border-radius:50%;background:#fff"></i><i style="width:6px;height:6px;border-radius:50%;background:#ffffff66"></i><i style="width:6px;height:6px;border-radius:50%;background:#ffffff66"></i></div>
   <div style="position:absolute;right:12px;top:${H / 2 - 13}px;width:26px;height:26px;border-radius:50%;background:#ffffffcc"></div></div>
  <div style="width:400px;height:${H}px;background:#000;border-left:1px solid #262626;padding:16px;box-sizing:border-box">
   <div style="display:flex;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid #262626"><span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#962fbf,#fa7e1e)"></span><b style="font-size:14px">placeholder.account</b></div>
   ${bar(300)}${bar(240)}${bar(270)}<div style="height:18px"></div>${bar(200)}${bar(250)}${bar(180)}</div>
 </article></div>
<script>for (const img of document.querySelectorAll('img.g')) { const c = document.createElement('canvas'); c.width = ${W}; c.height = ${H}; const x = c.getContext('2d'); const cols = [['#962fbf','#fa7e1e'],['#1f6feb','#3fb950'],['#d62976','#feda75']][img.dataset.i]; const g = x.createLinearGradient(0,0,${W},${H}); g.addColorStop(0,cols[0]); g.addColorStop(1,cols[1]); x.fillStyle = g; x.fillRect(0,0,${W},${H}); x.fillStyle='rgba(255,255,255,.18)'; x.beginPath(); x.arc(${W/2},${H/2-30},120,0,7); x.fill(); img.src = c.toDataURL('image/png'); }</script></body></html>`;
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pshot-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1280, height: 780 }, deviceScaleFactor: 2,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new'],
});
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1200);
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'en' }));
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
const p = await ctx.newPage();
await p.goto('https://www.instagram.com/p/DQabcDEFghi/?img_index=1'); await wait(1800);
const d = await p.evaluate(() => window.__salvaStoriesDebug().at);
console.log(JSON.stringify(d));
await p.screenshot({ path: OUT, clip: { x: 120, y: 20, width: 1080, height: 740 } });
await ctx.close();
