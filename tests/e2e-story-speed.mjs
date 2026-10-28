// v1.8.9: (1) velocidade nos stories de vídeo: botão na pilha de botões, lista vertical ao passar o mouse
// (2× · 1,5× · 1× · 0,5×), vale para o vídeo da vez e para os próximos (o Instagram cria um <video> novo a cada story),
// volta sozinha se o Instagram zerar, fica apagada em story de foto, lembra depois de recarregar e some com a chave do menu;
// (2) fantasminha sempre à vista (aceso = modo fantasma ligado, apagado = desligado); clique liga/desliga, no story e na
// barra lateral da página inicial.
// Uso: node e2e-story-speed.mjs $PWD/ext-test   (precisa de media/long.webm)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WEBM = fs.readFileSync(path.join(DIR, 'media', 'long.webm'));
const CDN = 'https://127.0.0.1/v/t51/';
const user = { username: 'example.profile', pk: '999' };
const items = [
  { pk: '222', id: '222_999', media_type: 2, has_audio: true, taken_at: 1792400000, user, image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'v_n.jpg' }] }, video_versions: [{ type: 101, url: 'https://127.0.0.1/o1/v/t2/f2/m78/a.mp4' }] },
  { pk: '333', id: '333_999', media_type: 1, taken_at: 1792400100, user, image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'foto_n.jpg?stp=small' }] } },
  { pk: '444', id: '444_999', media_type: 2, has_audio: true, taken_at: 1792400200, user, image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'v2_n.jpg' }] }, video_versions: [{ type: 101, url: 'https://127.0.0.1/o1/v/t2/f2/m78/b.mp4' }] },
];
const inline = JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user, items }] } } }]] });
// "Instagram": um card por vez no meio; vídeo novo a cada story (sempre em 1×)
const story = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#111;height:100vh;overflow:hidden">
<div id="card" style="position:absolute;left:calc(50% - 300px);top:60px;width:600px;height:1060px"></div>
<script type="application/json">${inline}</script>
<script>
  const card = document.getElementById('card');
  window.show = (i) => {
    const pk = ['222', '333', '444'][i];
    history.replaceState(null, '', '/stories/example.profile/' + pk + '/');
    card.innerHTML = i === 1
      ? '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" style="width:600px;height:1060px;display:block;background:#c36">'
      : '<video src="/v.webm?' + i + '" muted autoplay playsinline style="width:600px;height:1060px;display:block;background:#246"></video>';
  };
  show(0);
</script></body></html>`;
const sidebar = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000">
<nav style="position:fixed;left:0;top:0;width:72px;height:100vh"><div style="position:absolute;left:12px;top:72px;width:48px;height:calc(100vh - 100px)">
  ${[0, 1, 2, 3, 4].map((i) => `<a href="${i === 0 ? '/' : '/x' + i + '/'}" style="position:absolute;left:12px;top:${38 + i * 56}px;width:24px;height:24px"><svg width="24" height="24"><rect width="24" height="24" fill="#888"/></svg></a>`).join('')}
</div></nav><main style="margin-left:300px;height:100vh"></main></body></html>`;

const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pspd-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1700, height: 1200 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR', '--autoplay-policy=no-user-gesture-required'],
});
await ctx.route('https://www.instagram.com/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/v.webm') return r.fulfill({ status: 200, contentType: 'video/webm', body: WEBM });
  if (u.pathname.startsWith('/stories/')) return r.fulfill({ status: 200, contentType: 'text/html', body: story });
  return r.fulfill({ status: 200, contentType: 'text/html', body: sidebar });
});
await ctx.route('https://127.0.0.1/**', (r) => r.fulfill({ status: 404, body: '' }));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1000);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
const p = await ctx.newPage();
const st = () => p.evaluate(() => { const d = window.__salvaStoriesDebug(); const v = document.querySelector('#card video'); return { rate: v ? v.playbackRate : null, isVid: !!v, storyRate: d.storyRate, at: d.at, ls: localStorage.getItem('salvaStories.storyRate') }; });
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const click = async (b) => { await p.mouse.move(b.x, b.y, { steps: 3 }); await wait(150); await p.mouse.down(); await wait(100); await p.mouse.up(); };

await p.goto('https://www.instagram.com/stories/example.profile/222/'); await wait(1500);
let s = await st();
check('story de vídeo: botão de velocidade em 1× na pilha', !!s.at && !!s.at.rate && s.at.rateText === '1×' && s.at.rateOff === false && s.at.rate.y > s.at.all.y, s.at);
check('lista fechada sem o mouse em cima', s.at.ratesOpen === '0', s.at.ratesOpen);
await p.mouse.move(s.at.rate.x, s.at.rate.y, { steps: 4 }); await wait(300);
s = await st();
check('mouse em cima: lista vertical abre ao lado', s.at.ratesOpen === '1' && s.at.rates['2'].x > s.at.rate.x && s.at.rates['2'].y < s.at.rates['0.5'].y && s.at.rates['2'].x === s.at.rates['0.5'].x, s.at.rates);
await click(s.at.rates['2']); await wait(300);
s = await st();
check('2×: o vídeo toca em 2× e o botão mostra 2×', s.rate === 2 && s.at.rateText === '2×' && s.ls === '2', s);
await p.evaluate(() => { document.querySelector('#card video').playbackRate = 1; }); await wait(200);
check('Instagram volta para 1×: a extensão reaplica 2×', (await st()).rate === 2, null);
await p.evaluate(() => window.show(1)); await wait(600);
s = await st();
check('story de foto: botão apagado e lista não abre', s.at.rateOff === true && !s.isVid, s.at);
await p.mouse.move(s.at.rate.x + 2, s.at.rate.y + 2, { steps: 2 }); await wait(300);
check('foto: passar o mouse não abre a lista', (await st()).at.ratesOpen === '0', null);
await p.evaluate(() => window.show(2)); await wait(700);
s = await st();
check('próximo story de vídeo (vídeo novo): já entra em 2×', s.rate === 2 && s.at.rateOff === false, s);
await p.reload(); await wait(1500);
s = await st();
check('recarregou: lembra 2×', s.rate === 2 && s.at.rateText === '2×', s);
await p.mouse.move(s.at.rate.x, s.at.rate.y, { steps: 3 }); await wait(300);
s = await st();
await click(s.at.rates['0.5']); await wait(300);
s = await st();
check('0,5× (texto com vírgula em português)', s.rate === 0.5 && s.at.rateText === '0,5×', s);
await p.mouse.move(s.at.rate.x, s.at.rate.y, { steps: 3 }); await wait(300);
s = await st(); await click(s.at.rates['1']); await wait(300);
check('volta para 1×', (await st()).rate === 1, null);
await sw.evaluate(() => chrome.storage.sync.set({ storySpeed: false })); await wait(600);
check('chave "Velocidade nos stories" desligada: botão some', !(await st()).at.rate, (await st()).at);
await sw.evaluate(() => chrome.storage.sync.set({ storySpeed: true })); await wait(600);
await p.mouse.move(10, 10); await p.screenshot({ path: path.join(DIR, 'shots-speed', 'story-1x.png') });

// fantasminha no story: sempre à vista; aceso = ligado, apagado = desligado; clique alterna
await sw.evaluate(() => chrome.storage.sync.set({ ghost: false })); await wait(700);
s = await st();
check('modo fantasma desligado: fantasminha na pilha, apagado', !!s.at.ghost && s.at.ghostOff === true, s.at);
await p.mouse.move(s.at.ghost.x, s.at.ghost.y, { steps: 3 }); await wait(400);
await p.screenshot({ path: path.join(DIR, 'shots-speed', 'ghost-off-hover.png') });
await click(s.at.ghost); await wait(700);
let g = await sw.evaluate(() => chrome.storage.sync.get('ghost').then((r) => r.ghost));
s = await st();
check('clique no fantasminha apagado: liga e acende', g === true && !!s.at.ghost && s.at.ghostOff === false, { g, at: s.at });
await wait(300); await p.screenshot({ path: path.join(DIR, 'shots-speed', 'ghost-hover.png') });
await click(s.at.ghost); await wait(700);
g = await sw.evaluate(() => chrome.storage.sync.get('ghost').then((r) => r.ghost));
s = await st();
check('clique de novo: desliga, apaga e continua à vista', g === false && !!s.at.ghost && s.at.ghostOff === true, { g, at: s.at });
await p.mouse.move(s.at.rate.x, s.at.rate.y, { steps: 3 }); await wait(400);
await p.screenshot({ path: path.join(DIR, 'shots-speed', 'story-rates.png') });

// fantasminha da barra lateral (página inicial)
await p.goto('https://www.instagram.com/'); await wait(1500);
const md = () => p.evaluate(() => { const d = window.__salvaStoriesMenuDebug(); return { mode: d.anchorMode, ghost: d.ghostBadge, off: d.ghostOff, S: d.S.ghost, open: d.open }; });
let m = await md();
check('página inicial com o modo desligado: fantasminha apagado abaixo do ícone', m.mode === 'sidebar' && !!m.ghost && m.off === true, m);
await click(m.ghost); await wait(800);
let g2 = await sw.evaluate(() => chrome.storage.sync.get('ghost').then((r) => r.ghost));
m = await md();
check('clique no fantasminha da barra: liga, acende e não abre o menu', g2 === true && !!m.ghost && m.off === false && m.S === true && !m.open, { g2, m });
await p.screenshot({ path: path.join(DIR, 'shots-speed', 'sidebar-on.png') });
await click(m.ghost); await wait(800);
g2 = await sw.evaluate(() => chrome.storage.sync.get('ghost').then((r) => r.ghost));
m = await md();
check('clique de novo na barra: desliga e fica apagado à vista', g2 === false && !!m.ghost && m.off === true && m.S === false, { g2, m });
await p.screenshot({ path: path.join(DIR, 'shots-speed', 'sidebar-off.png') });
// a página de fato volta a mandar o "visto" / deixa de mandar: o estado chega no page.js
const pg = await p.evaluate(() => window.__salvaStoriesDebug().settings.ghost);
check('page.js acompanha o estado (bloqueio do "visto")', pg === false, pg);

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
