// Regra 14 revisada (27/10, 20h), com a página do Instagram aberta o tempo todo (sem recarregar):
// - confere ao abrir e ao voltar para a aba, no máximo 1 vez a cada 10 min (o botão do rodapé força);
// - Release mais novo → quadro "Nova versão" no meio da tela, na hora;
// - X adia: volta depois de 1 h (relógio adiantado) e na próxima abertura;
// - Release "URGENTE" → quadro sem X, Esc não fecha, downloads recusados, trabalhos longos pausados,
//   tarefa pausada não segura a recarga; Release resolvido → quadro some e tudo volta.
// Uso: node e2e-update14.mjs $PWD/ext-test
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let REL = null; let hits = 0;
const page = '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff"><main style="height:100vh"></main></body></html>';
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pupd-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1400, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
});
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
await ctx.route('https://api.github.com/**', (r) => { hits++; return r.fulfill({ status: 200, contentType: 'application/json', headers: { etag: '"e' + hits + '"' }, body: JSON.stringify(REL) }); });
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1200);
const VER = await sw.evaluate(() => chrome.runtime.getManifest().version);
REL = { tag_name: 'v' + VER, name: 'v' + VER, body: '', assets: [] };
await wait(800);
await sw.evaluate((v) => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: v } }), VER);
await sw.evaluate(() => chrome.storage.local.remove('ss.update'));
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const dbg = (p) => p.evaluate(() => window.__salvaStoriesOnboardDebug());
const age = (min) => sw.evaluate((m) => chrome.storage.local.get('ss.update').then((r) => chrome.storage.local.set({ 'ss.update': Object.assign({}, r['ss.update'], { procuradoEm: Date.now() - m * 60000 }) })), min);
const backToTab = (p) => p.evaluate(() => window.dispatchEvent(new Event('focus')));

const p = await ctx.newPage();
await p.clock.install();
hits = 0;
await p.goto('https://www.instagram.com/'); await wait(2500);
let d = await dbg(p);
check('abrir: confere sozinho (1 pedido) e sem versão nova não mostra nada', hits === 1 && d.open === null, { hits, open: d.open });

// sai Release novo; voltar para a aba antes de 10 min não confere de novo
REL = { tag_name: 'v9.9.9', name: 'v9.9.9', body: '- Botões mais rápidos.\n- Corrige o player.', assets: [] };
await backToTab(p); await wait(800);
check('voltar para a aba antes de 10 min: não confere (trava)', hits === 1, { hits });
await age(11); await backToTab(p); await wait(1500);
d = await dbg(p);
check('voltar depois de 10 min: confere e mostra o quadro sem recarregar', hits === 2 && d.open === 'update' && /9\.9\.9/.test(d.title || ''), { hits, d });
await p.screenshot({ path: path.join(DIR, 'shots-u14', 'normal.png') });
check('quadro no meio da tela', d.rect && Math.abs(d.rect.cx - d.rect.vw / 2) <= 2 && Math.abs(d.rect.cy - d.rect.vh / 2) <= 2, d.rect);
check('resumo do que mudou + Atualizar + X', d.items && d.items.length === 2 && d.at && d.at.next && d.hasX, d);

// X adia 1 h
if (!d.at || !d.at.close) { console.log(JSON.stringify(R, null, 1)); console.log('FALHOU (sem quadro)'); await ctx.close(); process.exit(1); }
await p.mouse.click(d.at.close.x, d.at.close.y); await wait(400);
d = await dbg(p);
check('X fecha (adia)', d.open === null && d.snoozeUntil > 0, d);
await age(11); await backToTab(p); await wait(1500);
d = await dbg(p);
check('dentro da 1 h não volta, mesmo conferindo de novo', d.open === null, d);
await p.clock.fastForward('01:00:30'); await wait(800);
d = await dbg(p);
check('depois de 1 h volta sozinho', d.open === 'update', d);
await p.keyboard.press('Escape'); await wait(300);
check('Esc também só adia', (await dbg(p)).open === null, null);
await p.reload(); await wait(2500);
check('próxima abertura: aparece de novo', (await dbg(p)).open === 'update', await dbg(p));

// Release URGENTE
REL = { tag_name: 'v9.9.10', name: 'v9.9.10 URGENTE', body: '- Corrige um erro grave.', assets: [] };
await age(11); await backToTab(p); await wait(1500);
d = await dbg(p);
await p.screenshot({ path: path.join(DIR, 'shots-u14', 'urgente.png') });
check('URGENTE: quadro sem X', d.open === 'update' && !d.hasX && /urgente/i.test(d.title || '') && d.upd.urgente, d);
await p.keyboard.press('Escape'); await wait(300);
check('URGENTE: Esc não fecha', (await dbg(p)).open === 'update', null);
const pausa = await p.evaluate(async () => {
  const K = window[Symbol.for('salvaStories.kit')], API = window[Symbol.for('salvaStories.api')];
  const r = await API.askExtension([{ kind: 'url', url: 'https://scontent.cdninstagram.com/x.jpg', name: 'x', user: 'x', ext: 'jpg', type: 'image' }]);
  const slept = await Promise.race([K.sleep(10).then(() => 'rodou'), new Promise((res) => setTimeout(() => res('pausado'), 1500))]);
  window.__late = 'esperando'; K.sleep(10).then(() => { window.__late = 'voltou'; });
  document.documentElement.dataset.ssBusy = '1';
  return { dl: r, slept, paused: document.documentElement.dataset.ssPaused };
});
check('URGENTE: download recusado com aviso', pausa.dl && pausa.dl.ok === false && /urgente/i.test(pausa.dl.error || ''), pausa.dl);
check('URGENTE: trabalho longo pausa', pausa.slept === 'pausado' && pausa.paused === '1', pausa);
const tabId = await sw.evaluate(() => chrome.tabs.query({ url: 'https://www.instagram.com/*' }).then((t) => t[0].id));
const busy = await sw.evaluate((id) => chrome.tabs.sendMessage(id, { type: 'salva-stories:busy?' }), tabId);
check('tarefa pausada não segura a recarga da extensão', busy && busy.busy === false, busy);

// atualizou (Release resolvido): quadro some e o trabalho pausado continua
REL = { tag_name: 'v' + VER, name: 'v' + VER, body: '', assets: [] };
await sw.evaluate(() => chrome.storage.local.get('ss.update').then((r) => chrome.storage.local.set({ 'ss.update': Object.assign({}, r['ss.update'], { procuradoEm: 0, etag: null }) })));
await backToTab(p); await wait(2500);
d = await dbg(p);
const late = await p.evaluate(() => window.__late);
check('resolvido: quadro some, pausa acaba e o trabalho volta', d.open === null && !d.paused && late === 'voltou', { d, late });

// botão do rodapé força conferir mesmo dentro dos 10 min
const before = hits;
await p.evaluate(() => window.postMessage({ __salvaStories: 'page', kind: 'updCmd', cmd: 'check' }, location.origin)); await wait(1200);
check('"Procurar atualização" confere na hora (sem trava)', hits === before + 1, { before, hits });

// tutorial e novidades também no meio
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: '0.0.1' } }));
await p.reload(); await wait(2500);
d = await dbg(p);
check('novidades no meio da tela', d.open === 'news' && Math.abs(d.rect.cx - d.rect.vw / 2) <= 2 && Math.abs(d.rect.cy - d.rect.vh / 2) <= 2, d);

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
