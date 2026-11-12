// v1.11.0: a barra do player não aparece por cima de um diálogo do Instagram. Como no Instagram real (medido em
// 12/11/2026): por cima do <video> fica uma camada DIV[role=presentation] do tamanho dele; o diálogo "Compartilhar" tem
// um fundo escuro de TELA INTEIRA que fica fora do role=dialog, e o quadro do diálogo (role=dialog) no meio.
// Uso: node e2e-player-cover.mjs $PWD/ext-test   (na 1.10.0 tem de falhar; na 1.11.0, passar)
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const W = 470, H = 588, VL = 420, VT = 30; // vídeo em (420,30)–(890,618)
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff;font:14px sans-serif">
<main style="position:absolute;left:${VL}px;top:${VT}px"><article style="width:${W}px">
  <div id="media" style="position:relative;width:${W}px;height:${H}px"><div style="position:absolute;inset:0"><video id="v" muted style="width:${W}px;height:${H}px;display:block;background:#246"></video></div>
  <div role="presentation" style="position:absolute;inset:0"></div></div>
  <a href="/p/DQvideo1234/">post</a></article></main>
<script>
  // "Compartilhar": fundo escuro de tela inteira (sem role) + quadro role=dialog no meio, por cima de parte do vídeo
  window.openShare = () => { const b = document.createElement('div'); b.id = 'back'; b.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100';
    b.innerHTML = '<div role="dialog" id="dlg" style="position:fixed;left:600px;top:150px;width:420px;height:400px;background:#262626;border-radius:12px">Compartilhar</div>'; document.body.appendChild(b); };
  window.closeShare = () => { const b = document.getElementById('back'); if (b) b.remove(); };
  // diálogo sem fundo (balão) cobrindo só o canto de cima à esquerda do vídeo
  window.openPop = () => { const d = document.createElement('div'); d.id = 'pop'; d.setAttribute('role', 'dialog');
    d.style.cssText = 'position:fixed;left:${VL}px;top:${VT}px;width:200px;height:200px;background:#333;z-index:100'; document.body.appendChild(d); };
</script></body></html>`;

const ctx = await chromium.launchPersistentContext(path.join(DIR, 'ppc-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1400, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
});
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
await ctx.route('https://127.0.0.1/**', (r) => r.fulfill({ status: 404, body: '' }));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(800);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'pt' }));
const p = await ctx.newPage();
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const shown = () => p.evaluate(() => window.__salvaStoriesPlayerDebug().shown);
// passa o mouse por um caminho até o ponto (dispara vários pointermove) e espera o quadro da barra
const hover = async (x, y) => { await p.mouse.move(x - 30, y - 10, { steps: 3 }); await p.mouse.move(x, y, { steps: 6 }); await wait(500); };
const away = async () => { await p.mouse.move(1300, 850, { steps: 4 }); await wait(2900); };

await p.goto('https://www.instagram.com/'); await wait(1500);
const ver = await p.evaluate(() => window.__salvaStoriesMenuDebug && window.__salvaStoriesMenuDebug().version);
// 0) sem diálogo: o mouse no vídeo mostra a barra (a camada de cima é do próprio vídeo)
await hover(650, 300);
check('sem diálogo: hover no vídeo mostra a barra', await shown(), null);
await away();
check('mouse fora do vídeo: a barra some', !(await shown()), null);

// 1) "Compartilhar" aberto: mouse na parte do vídeo coberta só pelo fundo escuro e na parte sob o quadro
await p.evaluate(() => window.openShare()); await wait(300);
await hover(470, 100);
const s1 = await shown();
await hover(700, 300);
const s2 = await shown();
check('diálogo aberto: mouse no vídeo atrás (só o fundo escuro por cima): a barra não aparece', !s1, { s1 });
check('diálogo aberto: mouse no vídeo atrás do quadro do diálogo: a barra não aparece', !s2, { s2 });
await p.evaluate(() => window.closeShare()); await away();

// 2) barra já aberta e o diálogo abre (sem mexer o mouse): a barra some
await hover(650, 300);
const before = await shown();
await p.evaluate(() => window.openShare()); await wait(700);
check('barra aberta e o diálogo abre: a barra some', before && !(await shown()), { before, after: await shown() });

// 3) diálogo fecha: o hover volta a mostrar a barra
await p.evaluate(() => window.closeShare()); await wait(300);
await hover(660, 320);
check('diálogo fechado: o hover volta a mostrar a barra', await shown(), null);
await away();

// 4) diálogo cobrindo só parte do vídeo: o hover na parte de fora mostra a barra; na parte coberta, não
await p.evaluate(() => window.openPop()); await wait(300);
await hover(500, 100);
const covered = await shown();
await away();
await hover(800, 450);
const outside = await shown();
check('parte do vídeo coberta pelo diálogo: a barra não aparece', !covered, { covered });
check('parte do vídeo fora do diálogo: o hover ali mostra a barra', outside, { outside });

console.log('versão em teste:', ver);
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
