// v1.9.2, regra 13: o registro (que vai no "Relatar bug") sai inteiro em cada idioma, com o número dentro da frase.
// Antes saía "story saved: vídeo salvo" e "publicación guardada: 2 de 2 do carrossel salvos" (o detalhe vinha no idioma da tela).
// Roda as ações com a tela em português e depois em espanhol, lê o registro da extensão e falha se o texto en/es tiver palavra só do
// português, ou se o es tiver palavra só do inglês, ou se o en tiver palavra só do espanhol.
// Uso: node e2e-log-i18n.mjs $PWD/ext-test   (precisa do cdn.mjs rodando)
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const DL = path.join(DIR, 'dl-logi18n');
fs.rmSync(DL, { recursive: true, force: true }); fs.mkdirSync(DL, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CDN = 'https://127.0.0.1/v/t51/';
const user = { username: 'pessoa.teste', pk: '999' };
const R = {}; let ok = true;
const check = (name, cond, info) => { R[name] = cond ? 'ok' : ['FALHOU', info]; if (!cond) ok = false; };

// palavras de um idioma só (minúsculas, palavra inteira)
const SO_PT = ['salvo', 'salva', 'salvos', 'salvas', 'carrossel', 'foto', 'não', 'nao', 'vídeo', 'arquivos', 'falhou', 'publicação', 'puderam', 'agora', 'instantes', 'tente', 'extensão', 'recarregue', 'atualização', 'baixar', 'perfil'];
const SO_PT_PARA_ES = SO_PT.filter((w) => !['salvo', 'salva', 'foto', 'perfil', 'agora'].includes(w)); // "salvo", "salva", "foto" e "perfil" também existem em espanhol
const SO_EN = ['saved', 'story', 'post', 'carousel', 'files', 'file', 'failed', 'could', 'try', 'again', 'moment', 'the', 'of', 'right', 'not', 'download', 'update', 'pending', 'extension', 'reload'];
const SO_ES = ['guardado', 'guardados', 'guardada', 'guardadas', 'publicación', 'historia', 'carrusel', 'archivos', 'archivo', 'falló', 'inténtalo', 'ahora', 'pestañas', 'actualización', 'descargar', 'extensión', 'recarga'];
const palavras = (s) => String(s).toLowerCase().normalize('NFC').split(/[^a-záàâãçéêíóôõúüñ]+/).filter(Boolean);
const tem = (s, lista) => palavras(s).filter((w) => lista.includes(w));

const cand = (n) => ({ candidates: [{ width: 640, height: 800, url: CDN + n + '_n.jpg?stp=big' }] });
const mk = (pk, n) => ({ pk: String(pk), id: pk + '_999', media_type: 1, taken_at: 1792400000 + (pk % 100) * 60, user, image_versions2: cand(n) });
const items = [mk(2001, 'ra'), mk(2002, 'rb')];
const storyPage = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;display:grid;place-items:center;height:100vh">
  <img id="m" src="${CDN}ra_n.jpg?x" style="width:400px;height:711px;object-fit:cover">
  <script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user, items }] } } }]] })}</script></body></html>`;
const CODE = 'DQabcDEFghi';
const car = ['pa', 'pb', 'pc'].map((n, i) => ({ pk: '3700000000000000' + (11 + i), id: '3700000000000000' + (11 + i) + '_999', media_type: 1, image_versions2: { candidates: [{ width: 1440, height: 1800, url: CDN + n + '_n.jpg?stp=big' }] } }));
const post = { pk: '3700000000000000001', id: '3700000000000000001_999', code: CODE, media_type: 8, taken_at: 1792400000, user, carousel_media_count: 3, carousel_media: car };
const modal = (vw) => { const mw = Math.min(900, vw - 560), left = Math.max(0, Math.round((vw - mw - 500) / 2));
  const slides = ['pa', 'pb', 'pc'].map((n, i) => `<li style="position:absolute;left:0;top:0;width:${mw}px;height:100%;list-style:none;transform:translateX(${i * mw}px)"><img src="${CDN}${n}_n.jpg?stp=big" style="width:${mw}px;height:100%;display:block"></li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff">
<div role="dialog" style="position:fixed;inset:0;background:rgba(0,0,0,.65)"><article style="position:absolute;left:${left}px;top:24px;height:1100px;display:flex">
  <div id="vp" style="width:${mw}px;height:1100px;overflow:hidden;position:relative;background:#111"><ul style="position:relative;width:1px;height:1100px;margin:0;padding:0">${slides}</ul></div>
  <div style="width:500px;height:1100px;background:#222">comentários</div></article></div>
<script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_api__v1__media__shortcode__web_info: { items: [post] } } }]] })}</script></body></html>`; };

async function rodar(lang) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'plog-' + lang + '-' + Date.now()), {
    headless: true, channel: 'chromium', viewport: { width: 1718, height: 1200 }, locale: 'pt-BR', acceptDownloads: true, downloadsPath: DL,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR', '--ignore-certificate-errors',
      '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'],
  });
  await ctx.route('https://www.instagram.com/**', (r) => {
    const u = new URL(r.request().url());
    const body = u.pathname.startsWith('/stories/') ? storyPage : u.pathname.startsWith('/p/') ? modal(1718) : '<html><body style="background:#000"></body></html>';
    return r.fulfill({ status: 200, contentType: 'text/html', body });
  });
  await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1000);
  await sw.evaluate((lang) => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }).then(() => chrome.storage.sync.set({ lang })), lang);
  const p = await ctx.newPage();
  const logs = () => p.evaluate(() => window[Symbol.for('salvaStories.api')].logs().map((l) => l.msg));
  await p.goto('https://www.instagram.com/stories/pessoa.teste/2001/'); await wait(1500);
  await p.keyboard.press('d'); await wait(1200);                       // "story salvo: foto salva"
  await p.keyboard.press('Shift+D'); await wait(4500);                  // "story salvo: 2 de 2 stories salvos"
  const todos = [...(await logs())];                                   // o registro é da página: ler antes de navegar
  await p.goto(`https://www.instagram.com/p/${CODE}/?img_index=1`); await wait(1500);
  await p.keyboard.press('d'); await wait(1200);                       // "post salvo: foto salva"
  await p.keyboard.press('Shift+D'); await wait(6000);                  // "post salvo: 3 de 3 do carrossel salvos"
  // versão URGENTE pendente: o D é recusado e o erro vai para o registro
  await sw.evaluate(() => chrome.storage.local.set({ 'ss.update': { urgente: true, ultima: '9.9.9', disponivel: true } }));
  await wait(1500);
  await p.keyboard.press('d'); await wait(1200);
  const L = todos.concat(await logs());
  await ctx.close();
  return L;
}

for (const lang of ['pt', 'es']) {
  const L = (await rodar(lang)).filter((m) => m && typeof m === 'object');
  R[`[${lang}] linhas de registro`] = L.length;
  check(`[${lang}] o registro tem as linhas esperadas (foto, 2 de 2, post, 3 de 3, recusa)`, L.length >= 5, L);
  const j = L.map((m) => m.pt + ' | ' + m.en + ' | ' + m.es);
  check(`[${lang}] a linha dos 2 stories leva o número dentro da frase nos 3 idiomas`, L.some((m) => /2 de 2/.test(m.pt) && /2 of 2/.test(m.en) && /2 de 2/.test(m.es)), j);
  check(`[${lang}] a linha dos 3 do carrossel leva o número dentro da frase nos 3 idiomas`, L.some((m) => /3 de 3/.test(m.pt) && /3 of 3/.test(m.en) && /3 de 3/.test(m.es)), j);
  check(`[${lang}] a recusa em URGENTE sai nos 3 idiomas`, L.some((m) => /urgente/i.test(m.pt) && /urgent/i.test(m.en) && /urgente/i.test(m.es)), j);
  const mistura = [];
  for (const m of L) {
    const a = tem(m.en, SO_PT); if (a.length) mistura.push({ idioma: 'en', so_pt: a, texto: m.en });
    const b = tem(m.es, SO_PT_PARA_ES); if (b.length) mistura.push({ idioma: 'es', so_pt: b, texto: m.es });
    const c = tem(m.es, SO_EN); if (c.length) mistura.push({ idioma: 'es', so_en: c, texto: m.es });
    const d = tem(m.en, SO_ES); if (d.length) mistura.push({ idioma: 'en', so_es: d, texto: m.en });
    for (const k of ['pt', 'en', 'es']) if (/undefined|\[object/.test(m[k])) mistura.push({ idioma: k, texto: m[k] });
  }
  check(`[${lang}] nenhuma linha en/es tem palavra de outro idioma (nem "undefined")`, mistura.length === 0, mistura);
}

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
