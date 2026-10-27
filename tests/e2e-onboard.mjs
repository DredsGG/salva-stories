// Tutorial de primeiro uso e quadro de novidades (regra 12): instalação nova, atualização simulada, "?" do menu, Esc.
// Uso: CHROME_PATH=... node e2e-onboard.mjs $PWD/ext-test   (instagram.com simulado por rota; não precisa da CDN)
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const SHOT = path.join(DIR, 'shots-onboard'); fs.mkdirSync(SHOT, { recursive: true });
const LANG = process.env.UI_LANG || 'pt';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const page = `<!doctype html><html class="__fb-dark-mode"><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#f5f5f5;font-family:system-ui;height:100vh">
<nav style="position:fixed;left:0;top:0;bottom:0;width:72px;border-right:1px solid #262626"></nav><main style="margin-left:420px;padding-top:40px"></main></body></html>`;

const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pob-' + Date.now()), {
  executablePath: process.env.CHROME_PATH || undefined, headless: true, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new'],
});
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tag_name: 'v0.0.1', body: '', assets: [] }) }));
await ctx.route('https://github.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/zip', body: Buffer.from('PK\x05\x06' + '\0'.repeat(18), 'binary') }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1200);
await sw.evaluate((l) => chrome.storage.sync.set({ lang: l }), LANG);
const p = await ctx.newPage();
const dbg = () => p.evaluate(() => window.__salvaStoriesOnboardDebug());

// 1) instalação nova → tutorial
out.storeAfterInstall = await sw.evaluate(() => chrome.storage.local.get('ss.onboard').then((r) => r['ss.onboard']));
await p.goto('https://www.instagram.com/'); await wait(2500);
let d = await dbg(); out.fresh = { open: d.open, title: d.title };
await p.screenshot({ path: path.join(SHOT, `tutorial-1-${LANG}.png`) });
await p.mouse.click(d.at.next.x, d.at.next.y); await wait(250);
d = await dbg(); out.afterNext = d.step;
await p.screenshot({ path: path.join(SHOT, `tutorial-2-${LANG}.png`) });
await p.keyboard.press('Escape'); await wait(200);
out.afterEsc = (await dbg()).open;
// 2) recarregar: não aparece de novo
await p.reload(); await wait(2800);
out.afterReload = (await dbg()).open;
// 3) "?" do menu reabre
let m = await p.evaluate(() => window.__salvaStoriesMenuDebug());
await p.keyboard.press('Alt+s'); await wait(700);
m = await p.evaluate(() => window.__salvaStoriesMenuDebug());
out.helpBtn = !!(m.at && m.at.help);
await p.screenshot({ path: path.join(SHOT, `menu-help-${LANG}.png`) });
await p.mouse.click(m.at.help.x, m.at.help.y); await wait(500);
d = await dbg(); out.reopened = { open: d.open, step: d.step, menuOpen: (await p.evaluate(() => window.__salvaStoriesMenuDebug())).open };
// passa por todos os passos até "Entendi"
for (let i = 0; i < 6 && d.open; i++) { await p.mouse.click(d.at.next.x, d.at.next.y); await wait(200); d = await dbg(); }
out.closedByOk = d.open === null;
// 4) atualização simulada: visto = versão anterior → novidades uma vez
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: '1.6.3' } }));
await p.reload(); await wait(2800);
d = await dbg(); out.update = { open: d.open, title: d.title, items: d.items && d.items.length };
await p.screenshot({ path: path.join(SHOT, `novidades-${LANG}.png`) });
await p.mouse.click(d.at.close.x, d.at.close.y); await wait(200);
out.newsClosedByX = (await dbg()).open === null;
await p.reload(); await wait(2800);
out.newsOnlyOnce = (await dbg()).open === null;
out.storeEnd = await sw.evaluate(() => chrome.storage.local.get('ss.onboard').then((r) => r['ss.onboard']));
// 6) Release mais novo simulado: o aviso aparece sozinho na página, sem abrir o menu
const setUpd = (o) => sw.evaluate((o) => chrome.storage.local.set({ 'ss.update': Object.assign({ procuradoEm: Date.now(), disponivel: true, dispensada: null, notas: '### Install\n**Chrome, Edge:** download the zip.\n\n- Faster saves.\n- Fixed the player.', zip: 'https://github.com/DredsGG/salva-stories/releases/download/v9.9.9/x.zip', pagina: 'https://github.com/DredsGG/salva-stories/releases/tag/v9.9.9' }, o) }), o);
await setUpd({ ultima: '9.9.9' });
await p.reload(); await wait(2800);
d = await dbg(); out.updShown = { open: d.open, title: d.title, items: d.items, menuOpen: (await p.evaluate(() => window.__salvaStoriesMenuDebug())).open };
await p.screenshot({ path: path.join(SHOT, `update-${LANG}.png`) });
await p.keyboard.press('Escape'); await wait(200);
out.updEscCloses = (await dbg()).open === null;
await p.reload(); await wait(2800);
out.updBackAfterReload = (await dbg()).open === 'update';
d = await dbg(); await p.mouse.click(d.at.next.x, d.at.next.y); await wait(1500);
d = await dbg(); out.updApply = { note: !!d.note, done: d.updDone };
out.zipDownloaded = await sw.evaluate(() => new Promise((r) => chrome.downloads.search({ orderBy: ['-startTime'], limit: 1 }, (x) => r(x[0] && x[0].url.slice(0, 60)))));
await p.screenshot({ path: path.join(SHOT, `update-applied-${LANG}.png`) });
await p.mouse.click(d.at.close.x, d.at.close.y); await wait(400);
out.dismissedStored = await sw.evaluate(() => chrome.storage.local.get('ss.update').then((r) => r['ss.update'].dispensada));
await p.reload(); await wait(2800);
out.updHiddenAfterX = (await dbg()).open === null;
await setUpd({ ultima: '9.9.10', dispensada: '9.9.9' });
await p.reload(); await wait(2800);
out.updNewerShowsAgain = (await dbg()).title;
// instalação nova com versão nova esperando: tutorial primeiro, aviso depois de fechar
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'pendente', visto: '' } }));
await p.reload(); await wait(2800);
out.tutorialFirst = (await dbg()).open;
await p.keyboard.press('Escape'); await wait(900);
out.updAfterTutorial = (await dbg()).open;
console.log(JSON.stringify(out, null, 1));
const ok = out.storeAfterInstall && out.storeAfterInstall.tutorial === 'pendente' && out.fresh.open === 'tutorial' && out.afterNext === 1 && out.afterEsc === null
  && out.afterReload === null && out.helpBtn && out.reopened.open === 'tutorial' && out.reopened.step === 0 && !out.reopened.menuOpen && out.closedByOk
  && out.update.open === 'news' && out.update.items >= 3 && out.newsClosedByX && out.newsOnlyOnce
  && out.updShown.open === 'update' && !out.updShown.menuOpen && out.updShown.items && out.updShown.items.length === 2 && out.updEscCloses && out.updBackAfterReload
  && out.updApply.note && /github\.com/.test(out.zipDownloaded || '') && out.dismissedStored === '9.9.9' && out.updHiddenAfterX && /9\.9\.10/.test(out.updNewerShowsAgain || '')
  && out.tutorialFirst === 'tutorial' && out.updAfterTutorial === 'update';
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close();
process.exit(ok ? 0 : 1);
