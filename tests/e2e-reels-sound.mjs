// Som no Reels (v1.8.7). A página imita o Instagram: um estado global "mudo" que só muda pelo botão de som de cada
// reel, e todo reel que entra na tela herda esse estado. Confere: o som já vem ligado ao entrar no Reels (depois de
// um clique na página), continua ao passar de reel, o nosso alto-falante muda o estado do Instagram, mutar é
// respeitado até sair do Reels, voltar ao Reels liga de novo, e o ajuste desligado não mexe em nada.
// Uso: node e2e-reels-sound.mjs $PWD/ext-test   (precisa de media/long.webm)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WEBM = fs.readFileSync(path.join(DIR, 'media', 'long.webm'));
const reel = (i) => `<div class="rl" style="height:100vh;display:grid;place-items:center;scroll-snap-align:start"><div style="position:relative;width:480px;height:800px">
  <video id="v${i}" src="/v.webm?${i}" muted loop autoplay playsinline style="width:480px;height:800px;background:#234;display:block"></video>
  <div role="button" class="snd" style="position:absolute;right:12px;top:12px;width:28px;height:28px;border-radius:50%;background:#0008;cursor:pointer"><svg aria-label="O áudio está silenciado" width="16" height="16"></svg></div></div></div>`;
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000">
<div id="sc" style="position:fixed;inset:0;overflow-y:scroll;scroll-snap-type:y mandatory">${[1, 2, 3].map(reel).join('')}</div>
<script>
  // "Instagram": estado global de som; o botão de cada reel troca o estado e o reel na tela segue o estado
  window.igMuted = true;
  const label = () => document.querySelectorAll('.snd svg').forEach((s) => s.setAttribute('aria-label', igMuted ? 'O áudio está silenciado' : 'O áudio está em reprodução'));
  const activeV = () => [...document.querySelectorAll('video')].find((v) => { const r = v.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
  document.querySelectorAll('.snd').forEach((b) => b.addEventListener('click', () => { igMuted = !igMuted; const v = activeV(); if (v) v.muted = igMuted; label(); }));
  let last = null;
  setInterval(() => { const v = activeV(); if (v && v !== last) { last = v; v.muted = igMuted; v.play().catch(() => {}); label(); } }, 100);
</script></body></html>`;
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'prsnd-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1300, height: 900 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--autoplay-policy=no-user-gesture-required'],
});
await ctx.route('https://www.instagram.com/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/v.webm') return r.fulfill({ status: 200, contentType: 'video/webm', body: WEBM });
  if (u.pathname.startsWith('/reels/')) return r.fulfill({ status: 200, contentType: 'text/html', body: page });
  return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body style="background:#000"></body></html>' });
});
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1200);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
const p = await ctx.newPage();
const st = () => p.evaluate(() => { const v = [...document.querySelectorAll('video')].find((x) => { const r = x.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; }); const d = window.__salvaStoriesPlayerDebug(); return { id: v && v.id, muted: v && v.muted, igMuted: window.igMuted, userMuted: d.reelsUserMuted, mu: d.at && d.at.mute, shown: d.shown }; });
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const click = async (x, y) => { await p.mouse.move(x, y); await p.mouse.down(); await wait(120); await p.mouse.up(); };

await p.goto('https://www.instagram.com/reels/AAAA/'); await wait(1500);
let s = await st();
check('antes de qualquer clique na página: não força som (o navegador não deixa)', s.muted === true, s);
await click(640, 300); await wait(900); // um clique qualquer na página (ativação do usuário)
s = await st();
check('depois do clique: som ligado pelo botão do Instagram', s.id === 'v1' && s.muted === false && s.igMuted === false, s);
await p.evaluate(() => document.getElementById('sc').scrollTo(0, innerHeight)); await wait(900);
s = await st();
check('próximo reel continua com som', s.id === 'v2' && s.muted === false && s.igMuted === false, s);
// muta pelo nosso alto-falante: o estado do Instagram muda junto e é respeitado
await p.mouse.move(650, 500); await wait(400);
s = await st();
await p.mouse.move(s.mu.x, s.mu.y, { steps: 4 }); await wait(400);
await click(s.mu.x, s.mu.y); await wait(500);
s = await st();
check('nosso alto-falante muta pelo estado do Instagram', s.muted === true && s.igMuted === true && s.userMuted === true, s);
await p.evaluate(() => document.getElementById('sc').scrollTo(0, innerHeight * 2)); await wait(900);
s = await st();
check('mutou: o próximo reel fica mudo (respeita a escolha)', s.id === 'v3' && s.muted === true, s);
// desmuta pelo nosso alto-falante: volta a valer para os próximos
await p.mouse.move(650, 500); await wait(400);
s = await st();
await p.mouse.move(s.mu.x, s.mu.y, { steps: 4 }); await wait(400);
await click(s.mu.x, s.mu.y); await wait(500);
await p.evaluate(() => document.getElementById('sc').scrollTo(0, innerHeight)); await wait(900);
s = await st();
check('desmutou pelo nosso alto-falante: o reel anterior/próximo vem com som', s.id === 'v2' && s.muted === false && s.igMuted === false, s);
// muta pelo botão do próprio Instagram (clique real): respeita
await p.evaluate(() => document.querySelectorAll('.snd')[1].scrollIntoView({ block: 'center' })); await wait(300);
const b = await p.evaluate(() => { const r = document.querySelectorAll('.snd')[1].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await click(b.x, b.y); await wait(600);
await p.evaluate(() => document.getElementById('sc').scrollTo(0, innerHeight * 2)); await wait(900);
s = await st();
check('mutou pelo botão do Instagram: continua mudo no próximo', s.id === 'v3' && s.muted === true && s.userMuted === true, s);
// sai do Reels e volta: som ligado de novo
await p.evaluate(() => history.pushState(null, '', '/explore/')); await wait(600);
await p.evaluate(() => history.pushState(null, '', '/reels/BBBB/')); await wait(1200);
s = await st();
check('voltou ao Reels: som ligado de novo', s.muted === false && s.igMuted === false && s.userMuted === false, s);
// ajuste desligado: não mexe
await sw.evaluate(() => chrome.storage.sync.set({ reelsSound: false })); await wait(500);
await p.reload(); await wait(1500); await click(640, 300); await wait(1000);
s = await st();
check('ajuste "Som ligado no Reels" desligado: fica como o Instagram deixar', s.muted === true && s.igMuted === true, s);
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
