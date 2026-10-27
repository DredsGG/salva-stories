// Regra 13: idioma da primeira abertura vem do navegador (pt, en, es; outro → en), seletor PT · EN · ES no menu e no
// tutorial, e tudo troca junto (menu, rodapé, tutorial, novidades, registro do "Relatar bug").
// Uso: CHROME_PATH=... node e2e-lang.mjs $PWD/ext-test
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const SHOT = path.join(DIR, 'shots-lang'); fs.mkdirSync(SHOT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const page = `<!doctype html><html class="__fb-dark-mode"><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#eee;font-family:system-ui;height:100vh"><main style="margin-left:420px;padding-top:40px"></main></body></html>`;
const EXPECT = { 'pt-BR': 'pt', 'en-US': 'en', 'es-ES': 'es', 'de-DE': 'en', 'pt-PT': 'pt', 'es-419': 'es' };
const TUT = { pt: 'Como usar o Salva Stories', en: 'How to use Salva Stories', es: 'Cómo usar Salva Stories' };
const MENU_SEC = { pt: 'Downloads', en: 'Downloads', es: 'Descargas' };
const out = {}; let ok = true;
const check = (k, cond, info) => { out[k] = cond ? 'ok' : ['FALHOU', info]; if (!cond) ok = false; };

async function launch(locale) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'plang-' + locale + '-' + Date.now()), {
    executablePath: process.env.CHROME_PATH || undefined, headless: true, locale, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', `--lang=${locale}`],
  });
  await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
  await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tag_name: 'v0.0.1', body: '', assets: [] }) }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1500);
  return { ctx, sw };
}

// 1) primeira abertura em cada idioma de navegador
for (const [locale, want] of Object.entries(EXPECT)) {
  const { ctx, sw } = await launch(locale);
  const stored = await sw.evaluate(() => chrome.storage.sync.get('lang').then((r) => r.lang || null));
  const p = await ctx.newPage();
  await p.goto('https://www.instagram.com/'); await wait(2600);
  const d = await p.evaluate(() => window.__salvaStoriesOnboardDebug());
  const menuLang = await p.evaluate(() => window.__salvaStoriesMenuDebug().S.lang);
  check(`first-${locale}`, stored === null && menuLang === want && d.open === 'tutorial' && d.title === TUT[want], { stored, menuLang, title: d.title, nav: await p.evaluate(() => navigator.language) });
  if (locale === 'de-DE') await p.screenshot({ path: path.join(SHOT, 'tutorial-de-navegador.png') });
  await ctx.close();
}

// 2) trocar entre os três: pelo tutorial e pelas bandeiras do menu
const { ctx, sw } = await launch('pt-BR');
const p = await ctx.newPage();
await p.goto('https://www.instagram.com/'); await wait(2600);
for (const l of ['en', 'es', 'pt']) {
  const at = await p.evaluate((l) => { const h = document.querySelector('salva-stories-onboard'); return h ? null : l; }, l); void at;
  await p.evaluate((l) => window.postMessage({ __salvaStories: 'page', kind: 'set', patch: { lang: l } }, location.origin), l); await wait(500);
  await p.evaluate(() => window[Symbol.for('salvaStories.onboard')].tutorial()); await wait(300);
  const d = await p.evaluate(() => window.__salvaStoriesOnboardDebug());
  check(`tutorial-${l}`, d.title === TUT[l], d.title);
  await p.keyboard.press('Escape');
}
// bandeiras do menu
await p.keyboard.press('Alt+s'); await wait(600);
for (const l of ['es', 'en', 'pt']) {
  const m0 = await p.evaluate(() => window.__salvaStoriesMenuDebug());
  const pos = await p.evaluate((l) => window.__salvaStoriesMenuDebug().at && window.__salvaStoriesMenuDebug().at.es && l, l);
  void pos; void m0;
  await p.evaluate((l) => window.postMessage({ __salvaStories: 'page', kind: 'set', patch: { lang: l } }, location.origin), l); await wait(500);
  const m = await p.evaluate(() => window.__salvaStoriesMenuDebug());
  check(`menu-${l}`, m.S.lang === l && m.open, { lang: m.S.lang, open: m.open });
  if (l === 'es') await p.screenshot({ path: path.join(SHOT, 'menu-es.png') });
}
// clique de verdade na bandeira ES
let m = await p.evaluate(() => window.__salvaStoriesMenuDebug());
await p.evaluate((l) => window.postMessage({ __salvaStories: 'page', kind: 'set', patch: { lang: 'pt' } }, location.origin)); await wait(500);
m = await p.evaluate(() => window.__salvaStoriesMenuDebug());
await p.mouse.click(m.at.langFoot.es.x, m.at.langFoot.es.y); await wait(600);
m = await p.evaluate(() => window.__salvaStoriesMenuDebug());
check('flag-click-es', m.S.lang === 'es', m.S.lang); console.log('after flag', JSON.stringify({open: m.open, at: !!m.at}));
if (!m.at) { await p.keyboard.press('Alt+s'); await wait(600); m = await p.evaluate(() => window.__salvaStoriesMenuDebug()); }
check('saved-es', (await sw.evaluate(() => chrome.storage.sync.get('lang').then((r) => r.lang))) === 'es');
// registro do "Relatar bug" no idioma escolhido
await p.evaluate(() => window[Symbol.for('salvaStories.api')].log('info', { pt: 'teste registro', en: 'log test', es: 'prueba registro' }));
await p.mouse.click(m.at.ubug.x, m.at.ubug.y); await wait(400);
m = await p.evaluate(() => window.__salvaStoriesMenuDebug());
const body = decodeURIComponent(m.bugUrl || '');
check('bug-log-es', body.includes('prueba registro') && !body.includes('teste registro'), body.slice(-200));
await p.screenshot({ path: path.join(SHOT, 'bug-es.png') });
// novidades no idioma escolhido
await p.keyboard.press('Escape');
await p.evaluate(() => window[Symbol.for('salvaStories.onboard')].news('1.6.3')); await wait(300);
const n = await p.evaluate(() => window.__salvaStoriesOnboardDebug());
check('news-es', n.open === 'news' && /Novedades/.test(n.title) && n.items.length >= 5, n);
await p.screenshot({ path: path.join(SHOT, 'news-es.png') });
await ctx.close();
console.log(JSON.stringify(out, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
