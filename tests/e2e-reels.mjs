// Player no Reels (v1.8.1): ao passar para o próximo reel com o mouse parado em cima da barra, pausar e mutar
// têm de agir no vídeo que está na tela, não no anterior; e a barra não pode ficar "travada" sem aparecer.
// Uso: node e2e-reels.mjs $PWD/ext-test
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MP4 = fs.readFileSync(path.join(DIR, 'media', 'long.webm'));
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000">
<div id="sc" style="position:fixed;inset:0;overflow-y:scroll;scroll-snap-type:y mandatory">
 <div style="height:100vh;display:grid;place-items:center;scroll-snap-align:start"><video id="v1" src="/v.mp4" muted loop autoplay playsinline style="width:480px;height:800px;background:#234"></video></div>
 <div style="height:100vh;display:grid;place-items:center;scroll-snap-align:start"><video id="v2" src="/v.mp4?2" muted loop autoplay playsinline style="width:480px;height:800px;background:#432"></video></div>
</div></body></html>`;
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'preels-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1300, height: 900 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--autoplay-policy=no-user-gesture-required'],
});
await ctx.route('https://www.instagram.com/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/v.mp4') return r.fulfill({ status: 200, contentType: 'video/webm', body: MP4 });
  return r.fulfill({ status: 200, contentType: 'text/html', body: page });
});
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(800);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
// este teste mede o player sozinho: sem o "Som ligado no Reels" (que tem teste próprio, e2e-reels-sound.mjs)
await sw.evaluate(() => chrome.storage.sync.set({ reelsSound: false }));
const p = await ctx.newPage();
await p.goto('https://www.instagram.com/reels/AAAA/'); await wait(1500);
const click = async (x, y) => { await p.mouse.move(x, y); await p.mouse.down(); await wait(120); await p.mouse.up(); };
const st = () => p.evaluate(() => { const d = window.__salvaStoriesPlayerDebug(); const a = document.getElementById('v1'), b = document.getElementById('v2'); return { shown: d.shown, overBar: d.overBar, pp: d.at && d.at.pp, mu: d.at && d.at.mute, v1: { paused: a.paused, muted: a.muted }, v2: { paused: b.paused, muted: b.muted } }; });
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
// mouse no vídeo 1, depois em cima da barra
await p.mouse.move(650, 500); await wait(400);
let s = await st();
check('barra aparece no reel 1', s.shown, s);
await p.mouse.move(s.pp.x, s.pp.y, { steps: 4 }); await wait(300);
// passa para o reel 2 sem mexer o mouse (como a roda/seta do Reels)
await p.evaluate(() => document.getElementById('sc').scrollTo(0, innerHeight)); await wait(700);
s = await st();
await click(s.pp.x, s.pp.y); await wait(400);
s = await st();
check('pause age no reel da tela (2), não no anterior', s.v2.paused === true && s.v1.paused === false, s);
// como gente: leva o mouse até o alto-falante, espera o controle de volume abrir e só então clica no mesmo ponto
const muAt = s.mu;
await p.mouse.move(muAt.x, muAt.y, { steps: 5 }); await wait(500);
const muHover = (await st()).mu;
await click(muAt.x, muAt.y); await wait(300);
s = await st();
check('alto-falante não sai de baixo do mouse quando o volume abre', Math.abs(muHover.x - muAt.x) <= 2, { muAt, muHover });
check('alto-falante desmuta o reel da tela', s.v2.muted === false, s);
await wait(400); await click(muAt.x, muAt.y); await wait(300);
s = await st();
check('alto-falante muta de novo', s.v2.muted === true, s);
await click(s.pp.x, s.pp.y); await wait(400);
s = await st();
check('play volta a tocar o reel da tela', s.v2.paused === false, s);
// barra some com o mouse em cima (saiu do vídeo por rolagem) e tem de voltar ao mexer no vídeo
await p.evaluate(() => document.getElementById('sc').scrollTo(0, innerHeight * 0.5)); await wait(600);
await p.evaluate(() => document.getElementById('sc').scrollTo(0, 0)); await wait(600);
await p.mouse.move(640, 400, { steps: 3 }); await wait(400);
s = await st();
check('barra não trava: aparece de novo no reel 1', s.shown, s);
await p.mouse.move(s.pp.x, s.pp.y, { steps: 3 }); await wait(300);
await click(s.pp.x, s.pp.y); await wait(400);
s = await st();
check('pause no reel 1', s.v1.paused === true, s);
// mouse parado em cima do pause por 3 s: a barra não pode sumir, e o clique tem de pausar (não atravessar para o vídeo)
await click(s.pp.x, s.pp.y); await wait(300); // volta a tocar o reel 1
s = await st();
await p.mouse.move(s.pp.x, s.pp.y, { steps: 3 }); await wait(3200);
const parado = await st();
check('mouse parado na barra 3 s: barra continua', parado.shown === true, parado);
await p.mouse.down(); await wait(120); await p.mouse.up(); await wait(400);
s = await st();
check('clique depois de 3 s parado: pausa', s.v1.paused === true, s);
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
