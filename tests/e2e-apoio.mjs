// v1.8.14: "Apoiar ♥" (regra 16). Item no rodapé do menu, entre "Procurar atualização" e "feito por Dreds"; quadro no
// meio da tela com "De onde você é?" (Brasil → Pix; outro país → GitHub Sponsors), destaque pelo idioma, Voltar, X, Esc,
// clique fora, foco preso, QR lido de volta da imagem igual ao código, R$ 5/10/25/livre iguais à referência do vault,
// "Outro valor", copiar (clipboard), escolha lembrada, nenhuma chamada de rede e prints nos 3 idiomas.
// Uso: node e2e-apoio.mjs $PWD/ext-test   (precisa de jsqr e pngjs)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const SHOT = path.join(DIR, 'shots-apoio'); fs.mkdirSync(SHOT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const REF = {
  livre: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e35204000053039865802BR5918Andre Miller Fleck6009Sao Paulo62070503***63047D61',
  5: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e352040000530398654045.005802BR5918Andre Miller Fleck6009Sao Paulo62070503***6304C8ED',
  10: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e3520400005303986540510.005802BR5918Andre Miller Fleck6009Sao Paulo62070503***6304DCD7',
  25: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e3520400005303986540525.005802BR5918Andre Miller Fleck6009Sao Paulo62070503***63044036',
};
const page = '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#0c1014"><main style="height:100vh"></main></body></html>';
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };

async function launch(locale, lang, dark = true) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'papo-' + lang + '-' + Date.now()), {
    headless: true, channel: 'chromium', locale, viewport: { width: 1280, height: 900 }, colorScheme: dark ? 'dark' : 'light',
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', `--lang=${locale}`],
  });
  const net = [];
  await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
  await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1000);
  await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
  await sw.evaluate((l) => chrome.storage.sync.set({ lang: l }), lang);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://www.instagram.com' });
  const p = await ctx.newPage();
  p.on('request', (req) => { const u = req.url(); if (!/^https:\/\/www\.instagram\.com\/$|^chrome-extension:|^data:/.test(u)) net.push(u); });
  await p.goto('https://www.instagram.com/'); await wait(1500);
  return { ctx, p, net };
}
const dbg = (p) => p.evaluate(() => window.__salvaStoriesApoioDebug());
const menu = (p) => p.evaluate(() => window.__salvaStoriesMenuDebug());
async function decodeQr(p) {
  const d = await dbg(p);
  const q = d.at.qr;
  const buf = await p.screenshot({ clip: { x: q.x - 120, y: q.y - 120, width: 240, height: 240 } });
  const png = PNG.sync.read(buf);
  const res = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return { text: res && res.data, code: d.code };
}
async function openApoio(p) {
  await p.keyboard.press('Alt+s'); await wait(500);
  const m = await menu(p);
  await p.mouse.click(m.at.usup.x, m.at.usup.y); await wait(400);
  return m;
}

// ── 1) português ──
{
  const { ctx, p, net } = await launch('pt-BR', 'pt');
  const m0 = await (async () => { await p.keyboard.press('Alt+s'); await wait(500); return menu(p); })();
  check('rodapé: "Apoiar" entre "Procurar atualização" e "feito por Dreds"', m0.open && m0.at.usup && m0.at.usup.y > m0.at.uchk.y && m0.at.usup.y < m0.at.dreds.y, m0.at);
  await p.mouse.click(m0.at.usup.x, m0.at.usup.y); await wait(400);
  let d = await dbg(p);
  check('abre no passo "De onde você é?", com Brasil destacado (PT)', d.open && d.step === 'where' && d.rec === 'br', d);
  check('quadro no meio da tela', Math.abs((d.at.box.left + d.at.box.right) / 2 - 640) <= 2 && Math.abs((d.at.box.top + d.at.box.bottom) / 2 - 450) <= 3, d.at.box);
  await p.screenshot({ path: path.join(SHOT, 'pt-1-onde.png') });
  // foco preso: Tab várias vezes continua dentro
  for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
  d = await dbg(p);
  check('foco preso no quadro (Tab)', d.open && !!d.focus, d.focus);
  await p.mouse.click(d.at.br.x, d.at.br.y); await wait(400);
  d = await dbg(p);
  check('Brasil: R$ 10 escolhido e código igual à referência', d.step === 'br' && d.code === REF[10], d);
  let q = await decodeQr(p);
  check('QR de R$ 10 lido de volta = código', q.text === REF[10], q);
  check('texto alternativo do QR', d.qrAlt === 'QR Code Pix de R$ 10', d.qrAlt);
  await p.screenshot({ path: path.join(SHOT, 'pt-2-pix.png') });
  for (const v of [5, 25]) {
    await p.mouse.click(d.at['v' + v].x, d.at['v' + v].y); await wait(300);
    q = await decodeQr(p);
    check(`R$ ${v}: código e QR iguais à referência`, q.code === REF[v] && q.text === REF[v], q);
  }
  d = await dbg(p);
  await p.mouse.click(d.at.other.x, d.at.other.y); await wait(300);
  d = await dbg(p);
  q = await decodeQr(p);
  check('Outro valor vazio = livre (referência) + aviso', q.code === REF.livre && q.text === REF.livre && /digita o valor/.test(d.msg), { q, msg: d.msg });
  await p.keyboard.type('12,50'); await wait(300);
  q = await decodeQr(p);
  check('Outro valor 12,50 → 540512.50, QR lido igual', q.code.includes('540512.50') && q.text === q.code, q);
  await p.keyboard.press('Control+a'); await p.keyboard.type('0,50'); await wait(300);
  d = await dbg(p);
  check('valor fora do limite: aviso e sem código', /entre R\$ 1 e R\$ 10\.000/.test(d.msg) && !d.code, d);
  await p.keyboard.press('Control+a'); await p.keyboard.type('12,50'); await wait(300);
  d = await dbg(p);
  await p.mouse.click(d.at.copy.x, d.at.copy.y); await wait(400);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  check('Copiar código Pix → área de transferência', clip === d.code && clip.includes('540512.50'), clip);
  await p.mouse.click(d.at.copyKey.x, d.at.copyKey.y); await wait(300);
  check('copiar a chave', (await p.evaluate(() => navigator.clipboard.readText())) === 'fa525dad-afca-4683-845d-eee7225a53e3', null);
  // fecha e reabre: volta no mesmo passo e valor
  await p.keyboard.press('Escape'); await wait(300);
  d = await dbg(p);
  const mAfter = await menu(p);
  check('Esc fecha o quadro (e o menu continua aberto)', !d.open && mAfter.open, { d: d.open, menu: mAfter.open });
  await p.mouse.click(mAfter.at.usup.x, mAfter.at.usup.y); await wait(400);
  d = await dbg(p);
  check('reabre no mesmo lugar (Brasil, 12,50)', d.step === 'br' && d.pick === 'other' && d.otherTxt === '12,50' && d.code.includes('540512.50'), d);
  await p.mouse.click(d.at.back.x, d.at.back.y); await wait(300);
  d = await dbg(p);
  await p.mouse.click(d.at.world.x, d.at.world.y); await wait(300);
  d = await dbg(p);
  const href = await p.evaluate(() => null);
  check('Outro país: botão do GitHub Sponsors', d.step === 'world' && !!d.at.open, d);
  await p.screenshot({ path: path.join(SHOT, 'pt-3-sponsors.png') });
  const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null), p.mouse.click(d.at.open.x, d.at.open.y)]);
  check('abre https://github.com/sponsors/DredsGG em aba nova', pop && /^https:\/\/github\.com\/sponsors\/DredsGG/.test(pop.url() || (await pop.waitForEvent('framenavigated').then((f) => f.url()).catch(() => ''))), pop && pop.url());
  if (pop) await pop.close();
  await p.bringToFront(); await wait(300);
  d = await dbg(p);
  await p.mouse.click(30, 30); await wait(300);
  check('clique fora fecha', !(await dbg(p)).open, null);
  check('nenhuma chamada de rede da página durante o Apoiar', net.filter((u) => !/github\.com\/sponsors/.test(u)).length === 0, net);
  void href;
  await ctx.close();
}
// ── 2) inglês e espanhol: destaque em "outro país", textos traduzidos, prints ──
for (const [locale, lang, title, where] of [['en-US', 'en', 'Support Salva Stories', 'Where are you from?'], ['es-ES', 'es', 'Apoyar Salva Stories', '¿De dónde eres?']]) {
  const { ctx, p } = await launch(locale, lang);
  await openApoio(p);
  let d = await dbg(p);
  const txt = await p.evaluate(() => document.querySelector('salva-stories-apoio') && true);
  check(`${lang}: abre com "outro país" destacado`, d.open && d.step === 'where' && d.rec === 'world', d);
  await p.screenshot({ path: path.join(SHOT, `${lang}-1-onde.png`) });
  await p.mouse.click(d.at.br.x, d.at.br.y); await wait(400);
  const q = await decodeQr(p);
  check(`${lang}: Brasil continua clicável, QR igual`, q.text === q.code && q.code === REF[10], q);
  await p.screenshot({ path: path.join(SHOT, `${lang}-2-pix.png`) });
  d = await dbg(p);
  await p.mouse.click(d.at.back.x, d.at.back.y); await wait(300);
  d = await dbg(p);
  await p.mouse.click(d.at.world.x, d.at.world.y); await wait(300);
  await p.screenshot({ path: path.join(SHOT, `${lang}-3-sponsors.png`) });
  void txt; void title; void where;
  await ctx.close();
}
// ── 3) tema claro (QR legível também no claro) ──
{
  const { ctx, p } = await launch('pt-BR', 'pt', false);
  await openApoio(p);
  const d = await dbg(p);
  await p.mouse.click(d.at.br.x, d.at.br.y); await wait(400);
  const q = await decodeQr(p);
  check('tema claro: QR lido igual', q.text === q.code, q);
  await p.screenshot({ path: path.join(SHOT, 'pt-claro-pix.png') });
  await ctx.close();
}
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
