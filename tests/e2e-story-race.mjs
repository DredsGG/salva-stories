// v1.9.2: o D (e o botão "salvar este") salva o item da tela NO MOMENTO DO APERTO, e depois do clique num botão nosso o foco volta para
// a página (as setas ← → do Instagram continuam passando o story).
// Visto ao vivo em 07/11/2026: D no fim do 5º story (foto) salvou o 6º (vídeo), que entrou um instante antes do aperto.
// Cobre, com o story trocando em 0, 50, 150 e 400 ms DEPOIS do keydown (salva o que estava na tela) e em 0, 50, 150 e 400 ms ANTES do
// keydown (janela de 500 ms da animação de entrada: salva o anterior; 900 ms antes já é o novo), a troca entre o pointerdown e o
// pointerup do botão, o mesmo no post (carrossel) e no feed, e as setas depois do clique.
// Uso: node e2e-story-race.mjs $PWD/ext-test   (precisa do cdn.mjs rodando)
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const DL = path.join(DIR, 'dl-race');
fs.rmSync(DL, { recursive: true, force: true }); fs.mkdirSync(DL, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CDN = 'https://127.0.0.1/v/t51/';
const user = { username: 'pessoa.teste', pk: '999' };
const R = {}; let ok = true;
const check = (name, cond, info) => { R[name] = cond ? 'ok' : ['FALHOU', info]; if (!cond) ok = false; };

const item = (pk, name) => ({ pk: String(pk), id: pk + '_999', media_type: 1, taken_at: 1792400000 + (pk % 100) * 60, user, image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + name + '_n.jpg?stp=big' }] } });
const items = [item(2001, 'ra'), item(2002, 'rb')];
const storyPage = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;display:grid;place-items:center;height:100vh">
  <img id="m" src="${CDN}ra_n.jpg?x" style="width:400px;height:711px;object-fit:cover">
  <script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user, items }] } } }]] })}</script>
  <script>
    window.arrows = 0;
    document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') window.arrows++; }); // o Instagram ouve as setas no documento
    window.go = (pk, name) => { history.pushState(null, '', '/stories/pessoa.teste/' + pk + '/'); document.getElementById('m').src = '${CDN}' + name + '_n.jpg?x'; };
    window.go2 = () => window.go(2002, 'rb'); window.go1 = () => window.go(2001, 'ra');
    window.afterKey = null; // troca agendada para DEPOIS do keydown (listener no fim da fila: roda depois do nosso)
    window.addEventListener('keydown', (e) => { if ((e.key === 'd' || e.key === 'D') && window.afterKey != null) { const ms = window.afterKey; window.afterKey = null; setTimeout(window.go2, ms); } }, true);
  </script></body></html>`;
// post aberto (modal) com carrossel de 3 fotos
const CODE = 'DQabcDEFghi';
const cand = (n) => ({ candidates: [{ width: 640, height: 800, url: CDN + n + '_n.jpg?stp=small' }, { width: 1440, height: 1800, url: CDN + n + '_n.jpg?stp=big' }] });
const car = ['pa', 'pb', 'pc'].map((n, i) => ({ pk: '3700000000000000' + (11 + i), id: '3700000000000000' + (11 + i) + '_999', media_type: 1, image_versions2: cand(n) }));
const post = { pk: '3700000000000000001', id: '3700000000000000001_999', code: CODE, media_type: 8, taken_at: 1792400000, user, carousel_media_count: 3, carousel_media: car };
const names = ['pa', 'pb', 'pc'];
const modal = (vw) => { const mw = Math.min(900, vw - 560), left = Math.max(0, Math.round((vw - mw - 500) / 2));
  const slides = names.map((n, i) => `<li style="position:absolute;left:0;top:0;width:${mw}px;height:100%;list-style:none;transform:translateX(${i * mw}px);transition:transform .35s ease"><img src="${CDN}${n}_n.jpg?stp=small" style="width:${mw}px;height:100%;display:block;background:#c36"></li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff">
<div role="dialog" style="position:fixed;inset:0;background:rgba(0,0,0,.65)"><article style="position:absolute;left:${left}px;top:24px;height:1100px;display:flex">
  <div id="vp" style="width:${mw}px;height:1100px;overflow:hidden;position:relative;background:#111"><ul id="ul" style="position:relative;width:1px;height:1100px;margin:0;padding:0">${slides}</ul></div>
  <div id="panel" style="width:500px;height:1100px;background:#222">comentários</div></article></div>
<script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_api__v1__media__shortcode__web_info: { items: [post] } } }]] })}</script>
<script>window.go=(i)=>{[...document.querySelectorAll('#ul li')].forEach((li,k)=>{li.style.transition='none';li.style.transform='translateX('+((k-i)*${mw})+'px)';});history.replaceState(null,'','?img_index='+(i+1));};
window.arrows = 0; document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') window.arrows++; });</script></body></html>`; };

async function abrir(vw, pages) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'prace-' + Date.now()), {
    headless: true, channel: 'chromium', viewport: { width: vw, height: 1200 }, locale: 'pt-BR', acceptDownloads: true, downloadsPath: DL,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR', '--ignore-certificate-errors',
      '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'],
  });
  await ctx.route('https://www.instagram.com/**', (r) => {
    const u = new URL(r.request().url());
    const html = u.pathname.startsWith('/stories/') ? pages.story : u.pathname.startsWith('/p/') ? pages.post : null;
    return r.fulfill({ status: 200, contentType: 'text/html', body: html || '<html><body style="background:#000"></body></html>' });
  });
  await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1000);
  await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
  await sw.evaluate(() => { self.__calls = []; const orig = chrome.downloads.download.bind(chrome.downloads); chrome.downloads.download = (o, cb) => { self.__calls.push(o.filename); return orig(o, cb); }; });
  const p = await ctx.newPage();
  const calls = () => sw.evaluate(() => self.__calls.slice());
  const last = async (n0) => { for (let i = 0; i < 30; i++) { const c = await calls(); if (c.length > n0) return c[c.length - 1]; await wait(100); } return null; };
  return { ctx, p, calls, last };
}
const story = (f) => f && /_(\d{4})\.jpg$/.exec(f) && /_(\d{4})\.jpg$/.exec(f)[1];

// ───────── stories ─────────
{
  const { ctx, p, calls, last } = await abrir(1400, { story: storyPage });
  const start = async () => { await p.goto('https://www.instagram.com/stories/pessoa.teste/2001/'); await wait(1500); await p.evaluate(() => window.go1()); await wait(900); };
  // troca DEPOIS do keydown
  for (const d of [0, 50, 150, 400]) {
    await start();
    const n0 = (await calls()).length;
    await p.evaluate((d) => { window.afterKey = d; }, d);
    await p.keyboard.press('d');
    const f = await last(n0);
    check(`story trocou ${d} ms DEPOIS do keydown: salva o da tela no aperto (2001)`, story(f) === '2001', f);
    await wait(700);
  }
  // troca ANTES do keydown (animação de entrada): vale o anterior até 500 ms; depois vale o novo
  for (const [d, esperado, quando] of [[0, '2001', 'na hora'], [50, '2001', '50 ms'], [150, '2001', '150 ms'], [400, '2001', '400 ms'], [900, '2002', '900 ms']]) {
    await start();
    const n0 = (await calls()).length;
    await p.evaluate(() => window.go2());
    if (d) await wait(d);
    await p.keyboard.press('d');
    const f = await last(n0);
    check(`story trocou ${quando} ANTES do keydown: salva ${esperado === '2001' ? 'o anterior (2001)' : 'o novo (2002)'}`, story(f) === esperado, f);
    await wait(700);
  }
  // botão "salvar este": troca entre o pointerdown e o pointerup
  await start();
  {
    const n0 = (await calls()).length;
    const at = (await p.evaluate(() => window.__salvaStoriesDebug())).at;
    await p.mouse.move(at.one.x, at.one.y); await p.mouse.down();
    await p.evaluate(() => window.go2()); await wait(300);
    await p.mouse.up();
    const f = await last(n0);
    check('botão: o story troca entre o pointerdown e o pointerup, salva o do pointerdown (2001)', story(f) === '2001', f);
  }
  // foco: depois do clique do mouse no botão, as setas chegam ao Instagram
  await start();
  {
    const at = (await p.evaluate(() => window.__salvaStoriesDebug())).at;
    await p.evaluate(() => { window.arrows = 0; });
    await p.mouse.click(at.one.x, at.one.y); await wait(500);
    await p.keyboard.press('ArrowRight'); await wait(200);
    check('foco: depois de "salvar este" a seta → chega ao Instagram', (await p.evaluate(() => window.arrows)) === 1, await p.evaluate(() => window.arrows));
    await wait(1700);
    const at2 = (await p.evaluate(() => window.__salvaStoriesDebug())).at;
    await p.mouse.click(at2.all.x, at2.all.y); await wait(500);
    await p.keyboard.press('ArrowRight'); await wait(200);
    check('foco: depois de "salvar todos" a seta → chega ao Instagram', (await p.evaluate(() => window.arrows)) === 2, await p.evaluate(() => window.arrows));
    const g = await p.evaluate(() => window.__salvaStoriesDebug());
    await p.mouse.click(g.at.ghost.x, g.at.ghost.y); await wait(300);
    await p.keyboard.press('ArrowRight'); await wait(200);
    check('foco: depois do fantasminha a seta → chega ao Instagram', (await p.evaluate(() => window.arrows)) === 3, await p.evaluate(() => window.arrows));
  }
  await ctx.close();
}

// ───────── post (modal) ─────────
{
  const { ctx, p, calls, last } = await abrir(1718, { post: modal(1718) });
  const start = async () => { await p.goto(`https://www.instagram.com/p/${CODE}/?img_index=1`); await wait(1200); await p.evaluate(() => window.go(0)); await wait(500); };
  const idx = (f) => f && (/_(\d\d)\.jpg$/.exec(f) || [])[1];
  await start();
  {
    const n0 = (await calls()).length;
    const at = (await p.evaluate(() => window.__salvaStoriesDebug())).at;
    await p.mouse.move(at.one.x, at.one.y); await p.mouse.down();
    await p.evaluate(() => window.go(1)); await wait(300);
    await p.mouse.up();
    const f = await last(n0);
    check('post: a foto troca entre o pointerdown e o pointerup, salva a do pointerdown (_01)', idx(f) === '01', f);
  }
  await wait(1700);
  {
    const n0 = (await calls()).length;
    await p.evaluate(() => window.go(1)); await wait(500);
    await p.evaluate(() => { window.addEventListener('keydown', (e) => { if (e.key === 'd') setTimeout(() => window.go(2), 50); }, true); });
    await p.keyboard.press('d');
    const f = await last(n0);
    check('post: a foto troca 50 ms depois do keydown, salva a da tela no aperto (_02)', idx(f) === '02', f);
  }
  await start();
  {
    const at = (await p.evaluate(() => window.__salvaStoriesDebug())).at;
    await p.evaluate(() => { window.arrows = 0; });
    await p.mouse.click(at.one.x, at.one.y); await wait(500);
    await p.keyboard.press('ArrowRight'); await wait(200);
    check('post: depois do clique em "salvar esta" a seta → chega ao Instagram', (await p.evaluate(() => window.arrows)) === 1, await p.evaluate(() => window.arrows));
  }
  await ctx.close();
}

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
