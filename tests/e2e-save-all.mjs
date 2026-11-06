// "Salvar todos" com fila (v1.8.15): stories (botão e Shift+D) e carrossel de post.
// Cobre: reel de 25 itens (confirmação acima de 20; Cancelar não baixa nada; Salvar baixa 25 sem duplicar; intervalo medido entre
// downloads >= 0,5 s e sorteado; progresso no botão; data-ss-busy 1 durante e 0 depois; Esc no meio para e o que já baixou fica;
// segundo clique durante a fila não duplica), reel de 8 (começa sem confirmação), 15 itens sem dado capturado (no máximo 10 pedidos
// de plano B, nunca 2 em menos de 3 s, aviso dos que faltaram), versão URGENTE (a fila espera e volta), carrossel de 10 (mesma
// fila) e os 3 idiomas da confirmação.
// Uso: node e2e-save-all.mjs $PWD/ext-test   (precisa do cdn.mjs rodando, como o e2e.mjs; leva uns 3 min)
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const SHOT = path.join(DIR, 'shots-saveall');
const DL = path.join(DIR, 'dl-saveall');
fs.rmSync(DL, { recursive: true, force: true }); fs.mkdirSync(DL, { recursive: true }); fs.mkdirSync(SHOT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CDN = 'https://127.0.0.1/v/t51/';
const user = { username: 'pessoa.teste', pk: '999' };
const ONLY = process.env.ONLY || ''; // ex.: ONLY=4 roda só o bloco 4
const R = {}; let ok = true;
const check = (name, cond, info) => { R[name] = cond ? 'ok' : ['FALHOU', info]; if (!cond) ok = false; };

// ───────── dados simulados ─────────
const cand = (i) => ({ candidates: [{ width: 720, height: 1280, url: CDN + 'foto_n.jpg?stp=small&i=' + i }, { width: 1320, height: 2346, url: CDN + 'foto_n.jpg?stp=big&i=' + i }] });
const item = (i) => ({ pk: String(1000 + i), id: `${1000 + i}_999`, media_type: 1, taken_at: 1792400000 + i * 60, user, image_versions2: cand(i) });
const stub = (i) => ({ pk: String(1000 + i), id: `${1000 + i}_999`, media_type: 1, taken_at: 1792400000 + i * 60, user }); // listado sem a mídia
const other = { id: '555', user: { username: 'outra.pessoa', pk: '555' }, items: [{ ...item(900), user: { username: 'outra.pessoa', pk: '555' }, image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'outra_n.jpg?stp=big' }] } }] }; // arquivo com outro nome: o Instagram real não repete nomes de imagem // outro reel, completo, no mesmo payload (a página real sempre traz mídia junto da lista)
const storyPage = (items, extra = []) => `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;display:grid;place-items:center;height:100vh">
  <img id="m" src="${CDN}foto_n.jpg?stp=small" style="width:400px;height:711px;object-fit:cover">
  <script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user, items }, ...extra] } } }]] })}</script></body></html>`;
// carrossel de 10 fotos no post aberto (modal), no mesmo molde do e2e-post
const CODE = 'DQabcDEFghi';
const car = Array.from({ length: 10 }, (_, i) => ({ pk: '37000000000000001' + String(i).padStart(2, '0'), id: '37000000000000001' + String(i).padStart(2, '0') + '_999', media_type: 1, image_versions2: cand(i) }));
const post = { pk: '3700000000000000001', id: '3700000000000000001_999', code: CODE, media_type: 8, taken_at: 1792400000, user, carousel_media_count: 10, carousel_media: car };
const modal = (vw) => { const mw = Math.min(900, vw - 560), left = Math.max(0, Math.round((vw - mw - 500) / 2));
  const slides = car.map((m, i) => `<li style="position:absolute;left:0;top:0;width:${mw}px;height:100%;list-style:none;transform:translateX(${i * mw}px)"><img src="${CDN}foto_n.jpg?stp=small" style="width:${mw}px;height:100%;display:block;background:#c36"></li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff">
<div role="dialog" style="position:fixed;inset:0;background:rgba(0,0,0,.65)"><article style="position:absolute;left:${left}px;top:24px;height:1100px;display:flex">
  <div id="vp" style="width:${mw}px;height:1100px;overflow:hidden;position:relative;background:#111"><ul id="ul" style="position:relative;width:1px;height:1100px;margin:0;padding:0">${slides}</ul></div>
  <div id="panel" style="width:500px;height:1100px;background:#222">comentários</div></article></div>
<script type="application/json">${JSON.stringify({ require: [['x', { data: { xdt_api__v1__media__shortcode__web_info: { items: [post] } } }]] })}</script></body></html>`; };

// ───────── ambiente ─────────
let planBHits = [];
async function abrir({ vw = 1400, pages = {}, lang } = {}) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'psa-' + Date.now()), {
    headless: true, channel: 'chromium', viewport: { width: vw, height: 1200 }, locale: 'pt-BR', acceptDownloads: true, downloadsPath: DL,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR', '--ignore-certificate-errors',
      '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'],
  });
  planBHits = [];
  await ctx.route('https://www.instagram.com/**', (r) => {
    const u = new URL(r.request().url());
    const mi = /^\/api\/v1\/media\/(\d+)\/info\/?$/.exec(u.pathname);
    if (mi) { planBHits.push({ t: Date.now(), pk: mi[1] }); const i = Number(mi[1]) - 1000; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [item(i)] }) }); }
    if (pages[u.pathname]) return r.fulfill({ status: 200, contentType: 'text/html', body: pages[u.pathname] });
    return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body style="background:#000"></body></html>' });
  });
  await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1000);
  await sw.evaluate((lang) => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }).then(() => lang && chrome.storage.sync.set({ lang })), lang || null);
  await sw.evaluate(() => { self.__calls = []; const orig = chrome.downloads.download.bind(chrome.downloads); chrome.downloads.download = (o, cb) => { self.__calls.push({ t: Date.now(), f: o.filename }); return orig(o, cb); }; });
  const p = await ctx.newPage();
  const calls = () => sw.evaluate(() => self.__calls.slice());
  const dbg = () => p.evaluate(() => window.__salvaStoriesSaveAllDebug());
  const until = async (fn, ms = 20000, step = 100) => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await wait(step); } };
  const btnPos = async () => { const d = await p.evaluate(() => window.__salvaStoriesDebug()); return d && d.at && d.at.all; };
  // amostra o estado de 100 em 100 ms enquanto a fila roda (progresso do botão e a marca de ocupado)
  const sampler = () => { const S = []; let stop = false; const run = (async () => { while (!stop) { try { const d = await dbg(); S.push({ t: Date.now(), running: d.running, busy: d.busy, text: d.btnText, done: d.done }); } catch (_) {} await wait(100); } })(); return { S, end: async () => { stop = true; await run; return S; } }; };
  return { ctx, sw, p, calls, dbg, until, btnPos, sampler };
}
const gaps = (cs) => cs.slice(1).map((c, i) => c.t - cs[i].t);

const stories25 = storyPage(Array.from({ length: 25 }, (_, i) => item(i)));
const stories8 = storyPage(Array.from({ length: 8 }, (_, i) => item(i)));
const stories15stub = storyPage(Array.from({ length: 15 }, (_, i) => stub(i)), [other]);
const URL25 = '/stories/pessoa.teste/1000/';

// ───────── 1) reel de 25: confirmação, Cancelar, Salvar, progresso, intervalo, ocupado ─────────
if (!ONLY || ONLY.includes('1')) {
  const { ctx, p, calls, dbg, until, sampler, sw } = await abrir({ pages: { [URL25]: stories25 } });
  await p.goto('https://www.instagram.com' + URL25); await wait(1500);
  await p.keyboard.press('Shift+D');
  let d = await until(async () => { const x = await dbg(); return x.confirm ? x : null; }, 4000);
  check('25 itens: a confirmação aparece (Shift+D)', !!d && /^Salvar 25 arquivos\?$/.test(d.confirm.title) && /^Leva cerca de \d+ s\./.test(d.confirm.sub) && d.confirm.okText === 'Salvar' && d.confirm.noText === 'Cancelar', d);
  check('25 itens: a confirmação mostra o tempo estimado (> 20 s)', !!d && Number((/(\d+) s/.exec(d.confirm.sub) || [])[1]) > 20, d && d.confirm.sub);
  await wait(1500);
  check('25 itens: nada baixa enquanto a pergunta está aberta', (await calls()).length === 0, await calls());
  await p.screenshot({ path: path.join(SHOT, 'confirmacao.png') });
  await p.mouse.click(d.confirm.no.x, d.confirm.no.y); await wait(500);
  d = await dbg(); await wait(2500);
  check('Cancelar: a pergunta some, nada baixa e a aba não fica ocupada', !d.confirm && !d.pending && (await calls()).length === 0 && d.busy === '0', { d, c: (await calls()).length });

  // pelo botão (não só pelo Shift+D): clica, confirma com Salvar
  const bp = await (async () => (await p.evaluate(() => window.__salvaStoriesDebug())).at.all)();
  await p.mouse.click(bp.x, bp.y);
  d = await until(async () => { const x = await dbg(); return x.confirm ? x : null; }, 4000);
  check('25 itens: o botão também pergunta', !!d, d);
  const sm = sampler();
  const tStart = Date.now();
  await p.mouse.click(d.confirm.ok.x, d.confirm.ok.y);
  await until(async () => (await dbg()).running, 4000);
  await wait(4000);
  await p.screenshot({ path: path.join(SHOT, 'progresso.png') });
  const midBusy = (await dbg()).busy;
  const fim = await until(async () => (await calls()).length >= 25, 90000, 300);
  await wait(1500);
  const S = await sm.end();
  const cs = await calls();
  const g = gaps(cs);
  const names = cs.map((c) => c.f);
  check('Salvar baixa os 25, na ordem, sem duplicar', !!fim && cs.length === 25 && new Set(names).size === 25 && names.every((n, i) => n.endsWith('_' + (1000 + i) + '.jpg')), { n: cs.length, uniq: new Set(names).size });
  check('intervalo entre downloads >= 0,5 s (24 intervalos medidos)', g.length === 24 && Math.min(...g) >= 500, { min: Math.min(...g), g });
  check('intervalo sorteado (não é sempre o mesmo) e razoável (< 3 s)', Math.max(...g) - Math.min(...g) > 100 && Math.max(...g) < 3000, { min: Math.min(...g), max: Math.max(...g) });
  const texts = [...new Set(S.map((s) => s.text).filter((x) => /^\d+\/25$/.test(x || '')))];
  check('progresso no botão (k/25, subindo)', texts.length >= 8, texts);
  check('data-ss-busy = 1 durante a fila', midBusy === '1' && S.filter((s) => s.running).every((s) => s.busy === '1'), { midBusy, bad: S.filter((s) => s.running && s.busy !== '1').slice(0, 3) });
  d = await dbg();
  check('data-ss-busy = 0 depois e o botão volta ao normal', d.busy === '0' && !d.pending && !/\d\/25/.test(d.btnText || ''), d);
  check('aviso final no idioma (25 de 25)', /25 de 25 stories salvos/.test(d.toast || ''), d.toast);
  R.tempoTotal = Math.round((Date.now() - tStart) / 1000) + ' s';
  await ctx.close();
}

// ───────── 2) Esc no meio e segundo clique durante a fila (reel de 25) ─────────
if (!ONLY || ONLY.includes('2')) {
  const { ctx, p, calls, dbg, until, sampler } = await abrir({ pages: { [URL25]: stories25 } });
  await p.goto('https://www.instagram.com' + URL25); await wait(1500);
  await p.keyboard.press('Shift+D');
  let d = await until(async () => { const x = await dbg(); return x.confirm ? x : null; }, 4000);
  await p.mouse.click(d.confirm.ok.x, d.confirm.ok.y);
  await until(async () => (await dbg()).done >= 5, 30000);
  const sm = sampler();
  await p.keyboard.press('Escape');
  const noEsc = await calls();
  await wait(4000);
  const S = await sm.end();
  let cs = await calls();
  d = await dbg();
  check('Esc no meio: a fila para (os arquivos já baixados ficam, o resto não sai)', cs.length >= 5 && cs.length <= noEsc.length + 1 && cs.length < 25, { n: cs.length, noEsc: noEsc.length });
  check('Esc: aba livre (ocupado 0), sem fila e aviso "Cancelado"', d.busy === '0' && !d.pending && /^Cancelado: \d+ de 25 salvos$/.test(d.toast || ''), d);
  await wait(2500);
  check('Esc: depois de parar, nenhum download novo', (await calls()).length === cs.length, { a: cs.length, b: (await calls()).length });
  // novo clique no botão durante a fila (outro reel limpo: recarrega)
  await p.goto('https://www.instagram.com' + URL25); await wait(1500);
  const before = (await calls()).length;
  await p.keyboard.press('Shift+D');
  d = await until(async () => { const x = await dbg(); return x.confirm ? x : null; }, 4000);
  await p.mouse.click(d.confirm.ok.x, d.confirm.ok.y);
  await until(async () => (await dbg()).done >= 3, 30000);
  const bp = (await p.evaluate(() => window.__salvaStoriesDebug())).at.all;
  await p.mouse.click(bp.x, bp.y); // segundo clique (cancela; nunca monta outra fila por cima)
  await wait(400);
  const atClick = (await calls()).length - before;
  await wait(4000);
  const run2 = (await calls()).slice(before);
  d = await dbg();
  check('segundo clique durante a fila: cancela, sem duplicar nem recomeçar', run2.length >= 3 && run2.length <= atClick + 1 && new Set(run2.map((c) => c.f)).size === run2.length && !d.pending && d.busy === '0', { n: run2.length, atClick, d });
  // Shift+D durante a fila também só cancela
  await p.goto('https://www.instagram.com' + URL25); await wait(1500);
  const b2 = (await calls()).length;
  await p.keyboard.press('Shift+D');
  d = await until(async () => { const x = await dbg(); return x.confirm ? x : null; }, 4000);
  await p.mouse.click(d.confirm.ok.x, d.confirm.ok.y);
  await until(async () => (await dbg()).done >= 2, 30000);
  await p.keyboard.press('Shift+D'); await wait(4000);
  const run3 = (await calls()).slice(b2);
  check('Shift+D durante a fila: cancela, sem fila nova', run3.length >= 2 && run3.length < 8 && !(await dbg()).pending, run3.length);
  await ctx.close();
}

// ───────── 3) reel de 8: começa sem confirmação; versão URGENTE: a fila espera e volta ─────────
if (!ONLY || ONLY.includes('3')) {
  const URL8 = '/stories/pessoa.teste/1000/';
  const { ctx, p, calls, dbg, until, sampler, sw } = await abrir({ pages: { [URL8]: stories8 } });
  await p.goto('https://www.instagram.com' + URL8); await wait(1500);
  await p.keyboard.press('Shift+D');
  await wait(600);
  let d = await dbg();
  check('8 itens: começa direto, sem confirmação', !d.confirm && d.pending && d.total === 8, d);
  const fim = await until(async () => (await calls()).length >= 8, 40000, 300);
  await wait(800);
  let cs = await calls();
  check('8 itens: baixou os 8, intervalo >= 0,5 s', !!fim && cs.length === 8 && Math.min(...gaps(cs)) >= 500, { n: cs.length, g: gaps(cs) });
  // URGENTE (o mesmo aviso que o bridge manda à página): a fila espera e, ao atualizar/liberar, continua
  await p.goto('https://www.instagram.com' + URL8); await wait(1500);
  const base = (await calls()).length;
  await p.keyboard.press('Shift+D');
  await until(async () => (await dbg()).done >= 2, 20000);
  await p.evaluate(() => window.postMessage({ __salvaStories: 'ext', kind: 'upd', state: { urgente: true, disponivel: true } }, location.origin));
  await wait(1200);
  const paused = (await calls()).length - base;
  await wait(3500);
  const still = (await calls()).length - base;
  d = await dbg();
  check('URGENTE: a fila para (nenhum download novo enquanto pendente)', still <= paused && still < 8 && d.pending, { paused, still, d });
  await p.evaluate(() => window.postMessage({ __salvaStories: 'ext', kind: 'upd', state: { urgente: false, disponivel: false } }, location.origin));
  const back = await until(async () => (await calls()).length - base >= 8, 40000, 300);
  check('URGENTE liberado: a fila volta sozinha e termina os 8', !!back, (await calls()).length - base);
  // recusa de download em URGENTE (service worker) continua valendo para o D de um arquivo só
  await sw.evaluate(() => chrome.storage.local.set({ 'ss.update': { urgente: true, ultima: '9.9.9', disponivel: true } }));
  await wait(1200);
  const b3 = (await calls()).length;
  await p.goto('https://www.instagram.com' + URL8); await wait(1500);
  await p.keyboard.press('d'); await wait(2500);
  check('URGENTE (service worker): o D de um arquivo continua recusado', (await calls()).length === b3, (await calls()).length - b3);
  await ctx.close();
}

// ───────── 4) 15 itens sem dado capturado: plano B limitado ─────────
if (!ONLY || ONLY.includes('4')) {
  const URL15 = '/stories/pessoa.teste/1000/';
  const { ctx, p, calls, dbg, until, sampler } = await abrir({ pages: { [URL15]: stories15stub } });
  await p.goto('https://www.instagram.com' + URL15); await wait(1500);
  await p.keyboard.press('Shift+D');
  await wait(600);
  let d = await dbg();
  check('15 itens sem dado: sem confirmação (15 <= 20), fila rodando', !d.confirm && d.pending && d.total === 15, d);
  const fim = await until(async () => !(await dbg()).pending, 120000, 500);
  await wait(500);
  d = await dbg();
  const cs = await calls();
  const hits = planBHits.map((h) => h.t);
  const gp = gaps(planBHits);
  check('plano B: no máximo 10 pedidos por clique (e usou os 10)', !!fim && planBHits.length === 10, planBHits.length);
  check('plano B: nunca 2 pedidos em menos de 3 s', gp.length === 9 && Math.min(...gp) >= 3000, gp);
  check('plano B: só baixou o que chegou (10 arquivos), o resto ficou de fora', cs.length === 10, cs.length);
  check('aviso dos que faltaram (5), em português', /5 não puderam ser salvos agora, tente de novo em instantes/.test(d.toast || ''), d.toast);
  check('aba livre depois', d.busy === '0' && !d.pending, d);
  await ctx.close();
}

// ───────── 5) carrossel de 10 (post): a mesma fila ─────────
if (!ONLY || ONLY.includes('5')) {
  const { ctx, p, calls, dbg, until, sampler } = await abrir({ vw: 1718, pages: { ['/p/' + CODE + '/']: modal(1718) } });
  await p.goto(`https://www.instagram.com/p/${CODE}/?img_index=1`); await wait(1200);
  const sm = sampler();
  await p.keyboard.press('Shift+D');
  await wait(600);
  let d = await dbg();
  check('carrossel de 10: fila rodando, sem confirmação', d.pending && !d.confirm && d.total === 10, d);
  const bp = await (async () => (await p.evaluate(() => window.__salvaStoriesDebug())).at.all)();
  const fim = await until(async () => (await calls()).length >= 10, 40000, 300);
  await wait(1500);
  const S = await sm.end();
  const cs = await calls();
  check('carrossel de 10: baixou os 10 na ordem (_01 a _10), sem duplicar', !!fim && cs.length === 10 && cs.every((c, i) => c.f.endsWith(`_${CODE}_${String(i + 1).padStart(2, '0')}.jpg`)), cs.map((c) => c.f.split('/').pop()));
  check('carrossel: intervalo >= 0,5 s', Math.min(...gaps(cs)) >= 500, gaps(cs));
  const texts = [...new Set(S.map((s) => s.text).filter((x) => /^\d+\/10$/.test(x || '')))];
  check('carrossel: progresso k/10 no botão', texts.length >= 4, texts);
  check('carrossel: ocupado 1 durante e 0 depois', S.filter((s) => s.running).every((s) => s.busy === '1') && (await dbg()).busy === '0', S.filter((s) => s.running && s.busy !== '1').slice(0, 2));
  d = await dbg();
  check('carrossel: aviso final', /10 de 10 do carrossel/.test(d.toast || ''), d.toast);
  // D de um arquivo só continua igual: um download, sem fila, sem demora
  const b = (await calls()).length;
  await p.keyboard.press('d'); await wait(1200);
  const one = (await calls()).slice(b);
  check('D único no post: 1 arquivo, na hora, sem fila', one.length === 1 && !(await dbg()).pending, one.length);
  await ctx.close();
}

// ───────── 6) os 3 idiomas da confirmação ─────────
for (const [lang, title, sub, ok1, no1] of (!ONLY || ONLY.includes('6') ? [['en', /^Save 25 files\?$/, /^It takes about \d+ s\./, 'Save', 'Cancel'], ['es', /^¿Guardar 25 archivos\?$/, /^Tarda unos \d+ s\./, 'Guardar', 'Cancelar']] : [])) {
  const { ctx, p, dbg, until, calls } = await abrir({ pages: { [URL25]: stories25 }, lang });
  await p.goto('https://www.instagram.com' + URL25); await wait(1500);
  await p.keyboard.press('Shift+D');
  const d = await until(async () => { const x = await dbg(); return x.confirm ? x : null; }, 4000);
  check(`idioma ${lang}: confirmação traduzida`, !!d && title.test(d.confirm.title) && sub.test(d.confirm.sub) && d.confirm.okText === ok1 && d.confirm.noText === no1, d && d.confirm);
  await p.keyboard.press('Escape'); await wait(500);
  check(`idioma ${lang}: Esc fecha a pergunta e nada baixa`, !(await dbg()).confirm && (await calls()).length === 0, await dbg());
  await ctx.close();
}

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
