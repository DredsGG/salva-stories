// Troca de pessoa nos stories: o card novo entra deslizando e crescendo (~0,5 s), como no Instagram.
// Os botões não podem aparecer em posição intermediária: somem enquanto o card se mexe e voltam só no lugar final,
// antes do fim da desaceleração (curva parecida com a do Instagram: 0,8 s, quase parado nos últimos ~0,3 s).
// Uso: CHROME_PATH=... node e2e-flick.mjs $PWD/ext-test
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CDN = 'https://127.0.0.1/v/t51/';
const user = { username: 'example.profile', pk: '999' };
const items = [{ pk: '111', id: '111_999', media_type: 1, taken_at: 1792400000, user, image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'foto_n.jpg?stp=small' }] } }];
const inline = JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user, items }] } } }]] });
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#111;height:100vh;overflow:hidden">
<img id="m" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" style="position:absolute;left:calc(50% - 300px);top:60px;width:600px;height:1060px;background:#c36;transform-origin:center">
<script type="application/json">${inline}</script>
<script>window.slide=()=>{const m=document.getElementById('m');m.style.transition='none';m.style.transform='translateX(420px) scale(.74)';m.offsetWidth;m.style.transition='transform .8s cubic-bezier(.2,.8,.2,1)';m.style.transform='none';};</script></body></html>`;
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pfl-' + Date.now()), {
  executablePath: process.env.CHROME_PATH || undefined, headless: true, viewport: { width: 1700, height: 1200 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new'],
});
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1000);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
const p = await ctx.newPage();
await p.goto('https://www.instagram.com/stories/example.profile/111/'); await wait(1500);
const final0 = await p.evaluate(() => { const h = document.querySelector('salva-stories'); return { left: h.style.left, top: h.style.top, op: h.style.opacity, disp: h.style.display }; });
const res = [];
for (let k = 0; k < 3; k++) {
  const samples = await p.evaluate(async () => {
    const out = []; const t0 = performance.now(); let stop = false;
    const tick = () => { const h = document.querySelector('salva-stories'); out.push({ t: Math.round(performance.now() - t0), left: h.style.left, top: h.style.top, op: getComputedStyle(h).opacity }); if (!stop) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); window.slide(); await new Promise((r) => setTimeout(r, 1500)); stop = true; return out;
  });
  // posições em que os botões estavam visíveis (opacidade > 0.05)
  const visPos = [...new Set(samples.filter((s) => parseFloat(s.op) > 0.05).map((s) => s.left + ',' + s.top))];
  const hidden = samples.some((s) => parseFloat(s.op) < 0.05);
  const end = samples[samples.length - 1];
  const back = samples.find((x, i) => i > 0 && parseFloat(x.op) > 0.95 && samples.slice(0, i).some((y) => parseFloat(y.op) < 0.05));
  res.push({ visPos, hidden, end: end.left + ',' + end.top + ' op ' + end.op, backAfterAnimMs: back ? back.t - 800 : null });
}
console.log(JSON.stringify({ final0, res }, null, 1));
const ok = res.every((r) => r.visPos.length === 1 && r.visPos[0] === final0.left + ',' + final0.top && r.hidden && r.end.startsWith(final0.left + ',' + final0.top) && r.end.endsWith('op 1') && r.backAfterAnimMs !== null && r.backAfterAnimMs <= 0);
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
