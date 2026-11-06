// v1.9.0: botões Seguidores e seguindo / Trocar de conta na coluna da barra lateral, abaixo do fantasminha.
// Trocar de conta = abre o diálogo do PRÓPRIO Instagram pelo caminho de quem usa ("Mais" → "Trocar de conta"), sem
// o "Mais" piscar; a extensão nunca lê o armazenamento de contas do Instagram (one_tap_storage_version).
// Instagram simulado: barra lateral com a foto da conta (example.account_a), "Mais" com o item "Trocar de conta" e um
// diálogo de troca falso com 2 contas fictícias (example.account_a / example.account_b).
// Uso: node e2e-sidebar-buttons.mjs $PWD/ext-test
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const AV = 'https://127.0.0.1/v/t51/me_n.jpg';
const AV2 = 'https://127.0.0.1/v/t51/stranger_n.jpg'; // avatar de outra pessoa (post)
const BAD = 'https://127.0.0.1/v/t51/expirada_n.jpg'; // foto que não carrega
let badReq = 0;
const SHOTS = path.join(DIR, 'shots-sidebar'); fs.mkdirSync(SHOTS, { recursive: true });

const page = (q) => `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff;font:14px sans-serif">
<nav id="side" style="${q.get('narrow') ? 'display:none;' : ''}position:fixed;left:0;top:0;width:72px;height:100vh;z-index:5"><div id="col" style="position:absolute;left:12px;top:72px;width:48px;height:calc(100vh - 100px)">
  ${[0, 1, 2, 3].map((i) => `<a href="${i === 0 ? '/' : '/x' + i + '/'}" style="position:absolute;left:12px;top:${110 + i * 56 - 72}px;width:24px;height:24px"><svg width="24" height="24"><rect width="24" height="24" fill="#888"/></svg></a>`).join('')}
  <a href="/example.account_a/" style="position:absolute;left:12px;top:${110 + 4 * 56 - 72}px;width:24px;height:24px"><img src="${q.get('bad') ? BAD : AV}" alt="Foto do perfil de example.account_a" style="width:24px;height:24px;border-radius:50%;display:block"></a>
  <a id="mais" href="#" role="link" style="position:absolute;left:12px;bottom:60px;width:24px;height:24px;cursor:pointer"><svg aria-label="Configurações" width="24" height="24"><rect width="24" height="24" fill="#aaa"/></svg><span style="position:absolute;left:-9999px">Mais</span></a>
</div></nav>
<main style="margin-left:420px;padding-top:30px;height:2000px"><h1>feed</h1></main>
${q.get('narrow') ? `<header style="position:absolute;left:12px;top:200px"><a href="/stranger/"><img src="${AV2}" alt="Foto do perfil de stranger" style="width:24px;height:24px;display:block"></a></header><a id="cap" href="#" style="position:absolute;left:12px;top:300px">legenda… mais</a>` : ''}
<script>
  window.__popMaxOp = -1; window.__popSeen = 0; window.__noSwitch = false; window.__switchCalls = [];
  // "Mais" do Instagram: menu num portal, por cima do canto de baixo da barra; o item "Trocar de conta" abre o diálogo dele
  window.__capClicks = 0; const cap = document.getElementById('cap'); if (cap) cap.addEventListener('click', (e) => { e.preventDefault(); window.__capClicks++; });
  document.getElementById('mais').addEventListener('click', (e) => { e.preventDefault(); const m = document.getElementById('pop'); if (m) { m.remove(); return; }
    // um diálogo alheio no meio da tela, aberto ao mesmo tempo (não pode ser escondido pela extensão)
    if (window.__notice) { const n = document.createElement('div'); n.id = 'notice'; n.setAttribute('role', 'dialog'); n.style.cssText = 'position:fixed;left:600px;top:100px;width:300px;height:100px;background:#444;z-index:70'; n.textContent = 'Ativar notificações?'; document.body.appendChild(n); }
    // menu lento (o React do Instagram pode montar depois)
    const go = () => {
    const d = document.createElement('div'); d.id = 'pop'; d.setAttribute('role', 'dialog');
    d.style.cssText = 'position:fixed;left:12px;bottom:130px;width:266px;height:520px;background:#262626;border-radius:16px;z-index:50';
    const items = ['Configurações', 'Sua atividade', 'Salvo', 'Trocar de conta', 'Sair'].filter((t) => !(window.__noSwitch && t === 'Trocar de conta'));
    d.innerHTML = items.map((t) => '<div role="button" tabindex="0" style="height:52px;padding:0 16px;line-height:52px"><span>' + t + '</span></div>').join('');
    document.body.appendChild(d); window.__popSeen++;
    // mede a opacidade do menu em cada quadro enquanto ele existe (tem de ficar 0 quando quem abriu foi a extensão)
    const tick = () => { if (!d.isConnected) return; window.__popMaxOp = Math.max(window.__popMaxOp, parseFloat(getComputedStyle(d).opacity)); requestAnimationFrame(tick); }; requestAnimationFrame(tick); // só o que é pintado
    [...d.children].forEach((it) => { if (it.textContent === 'Trocar de conta') it.addEventListener('click', () => { d.remove(); openSwitch(); }); });
    };
    if (window.__popDelay) setTimeout(go, window.__popDelay); else go();
  });
  function openSwitch() {
    const s = document.createElement('div'); s.id = 'swdlg'; s.setAttribute('role', 'dialog');
    s.style.cssText = 'position:fixed;left:50%;top:30%;width:400px;margin-left:-200px;background:#262626;border-radius:12px;z-index:60;padding:12px';
    s.innerHTML = '<div>Trocar de conta</div>' + [['111', 'example.account_a', true], ['222', 'example.account_b', false]].map(([id, u, cur]) =>
      '<div role="button" class="acct" data-id="' + id + '" style="height:48px;line-height:48px">' + u + (cur ? ' <b class="cur">✓</b>' : '') + '</div>').join('');
    document.body.appendChild(s);
    // função simulada do Instagram (no de verdade: switchAccountLogin, com a credencial que só ele conhece) + recarga
    s.querySelectorAll('.acct').forEach((a) => a.addEventListener('click', () => { if (a.querySelector('.cur')) return; sessionStorage.setItem('igSwitched', a.dataset.id); location.reload(); }));
  }
</script></body></html>`;

const ctx = await chromium.launchPersistentContext(path.join(DIR, 'psb-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1400, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
});
await ctx.route('https://www.instagram.com/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/' || u.pathname === '/explore/') return r.fulfill({ status: 200, contentType: 'text/html', body: page(u.searchParams) });
  return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
});
await ctx.route('https://127.0.0.1/**', (r) => { if (r.request().url() === BAD) badReq++; return r.request().url() === AV || r.request().url() === AV2 ? r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(path.join(DIR, 'media', 'avatar-sm.jpg')) }) : r.fulfill({ status: 404, body: '' }); });
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
await ctx.route('https://www.instagram.com/api/**', (r) => r.fulfill({ status: 404, body: '{}' }));
await ctx.addCookies([{ name: 'ds_user_id', value: '111', domain: '.instagram.com', path: '/', secure: true }]);
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1000);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => chrome.storage.sync.set({ ghost: true, lang: 'pt' }));
// análise de seguidores como a 1.8.15 gravou (por id da conta: ss.follows.<id> e .day) — tem de continuar igual
const FIX = { v: 1, at: 1793900000000, me: { username: 'example.account_a' }, followers: [['1', 'f.one', 'F One', 0, ''], ['2', 'f.two', 'F Two', 0, '']], following: [['1', 'f.one', 'F One', 0, ''], ['3', 'g.three', 'G Three', 0, '']], prev: null, history: [], ignore: ['3'] };
const today = new Date().toISOString().slice(0, 10);
await sw.evaluate(({ FIX, today }) => chrome.storage.local.set({ 'ss.follows.111': FIX, 'ss.follows.111.day': { d: today, n: 37 } }), { FIX, today });
const keys = () => sw.evaluate(() => chrome.storage.local.get(null).then((o) => Object.keys(o).filter((k) => k.startsWith('ss.follows')).sort()));
const keysBefore = await keys();
// o chrome.storage devolve as chaves do objeto em ordem alfabética: compara em forma canônica
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((q) => [q, x[q]])) : x));

await ctx.addInitScript(() => { window.__lsReads = []; const o = Storage.prototype.getItem, k = Storage.prototype.key;
  Storage.prototype.getItem = function (x) { window.__lsReads.push(String(x)); return o.call(this, x); };
  Storage.prototype.key = function (i) { window.__lsReads.push('key#' + i); return k.call(this, i); }; });
const p = await ctx.newPage();
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const md = () => p.evaluate(() => { const d = window.__salvaStoriesMenuDebug(); return { mode: d.anchorMode, slot: d.slot, nav: d.navHidden ? null : d.slot && { x: d.slot.x + 24, y: d.slot.y + 24 }, navHidden: d.navHidden, ghost: d.ghostBadge, side: d.side, v: d.version }; });
const clickAt = async (pt) => { await p.mouse.move(pt.x, pt.y, { steps: 2 }); await p.mouse.down(); await wait(60); await p.mouse.up(); };
const exists = (id) => p.evaluate((id) => !!document.getElementById(id), id);

await p.goto('https://www.instagram.com/'); await wait(1500);
let m = await md();
// 1) ordem e alinhamento: ícone → fantasminha → Seguidores → Trocar conta, mesmo centro, passo de 52 px
const col = m.nav && m.ghost && m.side && m.side.fol && m.side.acc ? [m.nav, m.ghost, m.side.fol, m.side.acc] : null;
check('4 itens na coluna, na ordem, alinhados (passo 52 px)', m.mode === 'sidebar' && !!col && col.every((b) => Math.abs(b.x - col[0].x) <= 1)
  && Math.abs(col[1].y - col[0].y - 52) <= 1 && Math.abs(col[2].y - col[1].y - 52) <= 1 && Math.abs(col[3].y - col[2].y - 52) <= 1, m);
check('balões no hover em pt', m.side && m.side.tipFol === 'Seguidores e seguindo' && m.side.tipAcc === 'Trocar de conta', m.side);
check('Trocar conta: foto da conta atual (lida do DOM)', m.side && m.side.avatar === true, m.side);
await p.screenshot({ path: path.join(SHOTS, 'coluna.png'), clip: { x: 0, y: 300, width: 400, height: 360 } });
// a extensão nunca toca no armazenamento de contas do Instagram

// 2) Seguidores abre a janela de follows.js (a mesma do menu → Ferramentas), com a análise da conta 111
await clickAt(m.side.fol); await wait(1200);
let fd = await p.evaluate(() => window.__salvaStoriesFollowsDebug());
check('Seguidores abre a janela de seguidores', fd.open === true, fd);
check('janela lê a análise já salva da conta 111 (sem perda)', fd.hasData === true && fd.nFol === 2 && fd.nFing === 2 && fd.savedAt === FIX.at, fd);
await p.keyboard.press('Escape'); await wait(400);
fd = await p.evaluate(() => window.__salvaStoriesFollowsDebug());
if (fd.open) { await p.evaluate(() => window.dispatchEvent(new CustomEvent('salva-stories:follows'))); await wait(300); }
await p.screenshot({ path: path.join(SHOTS, 'depois-seguidores.png') });

// 3) Trocar conta: abre o diálogo do Instagram pelo "Mais", sem o "Mais" aparecer
m = await md();
await p.evaluate(() => { window.__popMaxOp = -1; window.__popSeen = 0; });
await clickAt(m.side.acc); await wait(900);
let st = await p.evaluate(() => ({ dlg: !!document.getElementById('swdlg'), pop: !!document.getElementById('pop'), seen: window.__popSeen, maxOp: window.__popMaxOp,
  accts: [...document.querySelectorAll('#swdlg .acct')].map((a) => ({ id: a.dataset.id, cur: !!a.querySelector('.cur'), txt: a.textContent.trim() })) }));
check('Trocar conta abre o diálogo do Instagram (2 contas, a atual marcada)', st.dlg && st.accts.length === 2 && st.accts[0].cur && !st.accts[1].cur, st);
// maxOp: maior opacidade num quadro pintado; -1 = o menu nem chegou a ser pintado
check('o "Mais" abriu e fechou sem aparecer (nenhum quadro com ele visível)', st.seen === 1 && st.maxOp <= 0 && !st.pop, st);
const lsReads = await p.evaluate(() => window.__lsReads);
check('nada lido de one_tap_storage_version / nonce (vigiado desde antes dos scripts)', !lsReads.some((k) => /one_tap|nonce|^key#/i.test(k)), lsReads);
{ const src = fs.readdirSync(path.join(EXT, 'src'), { recursive: true }).filter((f) => f.endsWith('.js')).map((f) => [f, fs.readFileSync(path.join(EXT, 'src', f), 'utf8')]);
  const hit = src.filter(([, t]) => /one_tap|nonce/i.test(t)).map(([f]) => f);
  check('código da extensão sem one_tap / nonce', src.length > 10 && hit.length === 0, hit); }
st = await p.evaluate(() => ({ op: getComputedStyle(document.getElementById('swdlg')).opacity, stuck: [...document.querySelectorAll('[role=dialog]')].filter((d) => d.style.opacity === '0').length }));
check('diálogo de troca visível de verdade, nenhum diálogo preso invisível', st.op === '1' && st.stuck === 0, st);
await p.screenshot({ path: path.join(SHOTS, 'dialogo-instagram.png') });
// clique na outra conta (no diálogo do Instagram) chama a função dele e recarrega; os botões voltam
await p.click('#swdlg .acct[data-id="222"]'); await p.waitForLoadState('load'); await wait(1500);
st = await p.evaluate(() => ({ sw: sessionStorage.getItem('igSwitched'), dlg: !!document.getElementById('swdlg') }));
m = await md();
check('diálogo do Instagram (simulado): conta B chama a função dele, recarrega e os botões voltam', st.sw === '222' && !st.dlg && !!(m.side && m.side.fol && m.side.acc), { st, side: m.side });

// 3b) clique duplo: um "Mais" só e um diálogo só
await p.evaluate(() => { window.__popSeen = 0; });
await clickAt(m.side.acc); await wait(80); await p.mouse.down(); await wait(40); await p.mouse.up(); await wait(1000);
st = await p.evaluate(() => ({ dlgs: document.querySelectorAll('#swdlg').length, seen: window.__popSeen }));
check('clique duplo: abre um diálogo só', st.dlgs === 1 && st.seen === 1, st);
await p.evaluate(() => document.querySelectorAll('#swdlg').forEach((d) => d.remove())); await wait(700);
// 3c) menu lento (600 ms) + diálogo alheio no meio da tela aberto junto
await p.evaluate(() => { window.__popSeen = 0; window.__popMaxOp = -1; window.__popDelay = 600; window.__notice = true; });
m = await md(); await clickAt(m.side.acc); await wait(1600);
st = await p.evaluate(() => ({ dlg: !!document.getElementById('swdlg'), seen: window.__popSeen, maxOp: window.__popMaxOp, notice: getComputedStyle(document.getElementById('notice')).opacity }));
check('menu lento: o diálogo abre e o "Mais" não aparece', st.dlg && st.seen === 1 && st.maxOp <= 0, st);
check('diálogo alheio no meio da tela continua visível', st.notice === '1', st);
await p.evaluate(() => { document.getElementById('swdlg').remove(); document.getElementById('notice').remove(); window.__popDelay = 0; window.__notice = false; }); await wait(700);
m = await md();

// 4) trabalho longo rodando: não abre nada e avisa
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '1'; window.__popSeen = 0; });
await clickAt(m.side.acc); await wait(400);
m = await md();
st = await p.evaluate(() => ({ dlg: !!document.getElementById('swdlg'), seen: window.__popSeen }));
check('ocupado (data-ss-busy=1): não abre o "Mais" nem o diálogo', !st.dlg && st.seen === 0, st);
check('ocupado: aviso "Termine ou cancele…"', m.side.toast === 'Termine ou cancele o que está rodando antes de trocar', m.side);
await p.screenshot({ path: path.join(SHOTS, 'ocupado.png'), clip: { x: 0, y: 300, width: 700, height: 360 } });
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '0'; });

// 5) item "Trocar de conta" ausente: aviso, registro no log e o "Mais" fechado
await p.evaluate(() => { window.__noSwitch = true; window.__popSeen = 0; window.__popMaxOp = -1; });
await clickAt(m.side.acc); await wait(3200);
m = await md();
st = await p.evaluate(() => ({ dlg: !!document.getElementById('swdlg'), pop: !!document.getElementById('pop'), seen: window.__popSeen, maxOp: window.__popMaxOp,
  log: (window[Symbol.for('salvaStories.api')].logs().slice(-1)[0] || {}) }));
check('sem o item: aviso "Não achei o Trocar de conta do Instagram"', m.side.toast === 'Não achei o Trocar de conta do Instagram' && !st.dlg, { side: m.side, st });
check('sem o item: o "Mais" que abrimos fecha e não aparece', st.seen === 1 && !st.pop && st.maxOp <= 0, st);
check('sem o item: registrado no log', st.log.level === 'warn' && /Trocar de conta/.test(st.log.msg && st.log.msg.pt), st.log);
await p.evaluate(() => { window.__noSwitch = false; });
// sem o "Mais" na página
await p.evaluate(() => { window.__mais = document.getElementById('mais'); window.__mais.remove(); });
await wait(4700); // o aviso anterior some
await clickAt(m.side.acc); await wait(400);
m = await md();
check('sem o "Mais": mesmo aviso', m.side.toast === 'Não achei o Trocar de conta do Instagram', m.side);
await p.evaluate(() => document.getElementById('col').appendChild(window.__mais)); await wait(700);

// 6) idiomas en/es (balão e aviso)
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'en' })); await wait(800);
m = await md();
check('en: balões', m.side.tipFol === 'Followers and following' && m.side.tipAcc === 'Switch accounts', m.side);
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'es' })); await wait(800);
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '1'; });
m = await md(); await clickAt(m.side.acc); await wait(300); m = await md();
check('es: balões e aviso', m.side.tipFol === 'Seguidores y seguidos' && m.side.tipAcc === 'Cambiar de cuenta' && m.side.toast === 'Termina o cancela lo que se está ejecutando antes de cambiar', m.side);
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '0'; });
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'pt' })); await wait(800);

// 7) menu "Mais" da pessoa por cima: os 4 somem e voltam
const mais = await p.evaluate(() => { const r = document.getElementById('mais').getBoundingClientRect(); return { x: r.left + 12, y: r.top + 12 }; });
await p.mouse.click(mais.x, mais.y); await wait(300);
m = await md();
check('"Mais" aberto por cima: ícone, fantasminha e os 2 botões somem', m.navHidden === true && !m.ghost && !m.side.fol && !m.side.acc, m);
await p.mouse.click(mais.x, mais.y); await wait(300);
m = await md();
check('"Mais" fechado: voltam', m.navHidden === false && !!m.ghost && !!m.side.fol && !!m.side.acc, m);

// 8) chave do menu → Ferramentas desliga os dois (clique de verdade na linha)
await p.keyboard.press('Alt+s'); await wait(500);
let row = await p.evaluate(() => window.__salvaStoriesMenuDebug().sideRow);
// a linha pode estar abaixo da dobra do painel: rola até ela
if (row && (row.y > 880 || row.y < 10)) { await p.mouse.move(row.x, 300); await p.mouse.wheel(0, row.y - 450); await wait(300); row = await p.evaluate(() => window.__salvaStoriesMenuDebug().sideRow); }
await clickAt(row); await wait(600);
const after = await sw.evaluate(() => chrome.storage.sync.get('sideBtns'));
await p.keyboard.press('Escape'); await wait(400);
m = await md();
check('chave "Botões na barra lateral" desliga os dois (ícone e fantasminha ficam)', after.sideBtns === false && !m.side.fol && !m.side.acc && m.navHidden === false && !!m.ghost, { after, m });
await sw.evaluate(() => chrome.storage.sync.set({ sideBtns: true })); await wait(800);
m = await md();
check('ligada de novo: voltam', !!m.side.fol && !!m.side.acc, m.side);

// 9) sem espaço na coluna (janela baixa): os 2 vão para o canto; ícone e fantasminha seguem na barra
await p.setViewportSize({ width: 1400, height: 650 }); await wait(900);
m = await md();
check('janela baixa: botões no canto, ícone e fantasminha na barra', m.mode === 'sidebar' && m.side.corner === true && m.side.fol && m.side.acc && m.side.fol.x > 1300 && m.side.acc.y < m.side.fol.y && !!m.ghost && m.ghost.x < 100, m);
// sem barra lateral (janela estreita): tudo na pilha do botão flutuante do canto
await p.setViewportSize({ width: 700, height: 900 }); await p.evaluate(() => { document.getElementById('side').style.display = 'none'; }); await wait(900);
m = await md();
const nav2 = await p.evaluate(() => window.__salvaStoriesMenuDebug().anchorMode);
const navBox = await p.evaluate(() => { const d = window.__salvaStoriesMenuDebug(); return d.ghostBadge; });
check('janela estreita: tudo no canto, na mesma pilha (fantasminha, Seguidores, Trocar conta acima do botão)', nav2 === 'fab' && m.side.fol && m.side.acc && navBox
  && Math.abs(m.side.fol.x - navBox.x) <= 1 && Math.abs(m.side.acc.x - navBox.x) <= 1 && Math.abs(navBox.y - m.side.fol.y - 56) <= 1 && Math.abs(m.side.fol.y - m.side.acc.y - 56) <= 1, { m, navBox });
await p.screenshot({ path: path.join(SHOTS, 'estreita.png') });
await p.evaluate(() => { document.getElementById('side').style.display = ''; }); await p.setViewportSize({ width: 1400, height: 900 }); await wait(900);

// 9b) estreita desde o início: foto de outra pessoa (post) não vira a da conta; o "mais" de uma legenda não é o menu
await p.setViewportSize({ width: 700, height: 900 }); await p.goto('https://www.instagram.com/?narrow=1'); await wait(1500);
m = await md();
check('estreita: não pega a foto de outra pessoa', m.mode === 'fab' && !!m.side.acc && m.side.avatar === false, m.side);
await p.evaluate(() => { window.__popSeen = 0; });
await clickAt(m.side.acc); await wait(500); m = await md();
st = await p.evaluate(() => ({ cap: window.__capClicks, seen: window.__popSeen }));
check('estreita: sem "Mais", avisa sem clicar em nada da página', m.side.toast === 'Não achei o Trocar de conta do Instagram' && st.cap === 0 && st.seen === 0, { side: m.side, st });
await p.setViewportSize({ width: 1400, height: 900 });
// 9c) foto que não carrega: ícone de pessoa e um pedido só (sem laço a cada 500 ms)
badReq = 0; await p.goto('https://www.instagram.com/?bad=1'); await wait(3500);
m = await md();
check('foto que falha: ícone de pessoa, sem pedir de novo', m.side.avatar === false && badReq <= 2, { badReq, side: m.side });

// 10) story aberto: nada na coluna (os botões ficam só na barra lateral)
await p.goto('https://www.instagram.com/stories/pessoa.teste/1/'); await wait(1200);
m = await md();
check('no story: os 2 botões não aparecem', !m.side.fol && !m.side.acc, m.side);

// 11) dados de seguidores por conta: outra conta (cookie 222) começa vazia e grava na chave dela; a da 111 fica intacta
await ctx.addCookies([{ name: 'ds_user_id', value: '222', domain: '.instagram.com', path: '/', secure: true }]);
await p.goto('https://www.instagram.com/'); await wait(1500);
await p.evaluate(() => window.dispatchEvent(new CustomEvent('salva-stories:follows'))); await wait(1000);
fd = await p.evaluate(() => window.__salvaStoriesFollowsDebug());
check('conta 222: análise vazia (não herda a da 111)', fd.open === true && fd.hasData === false, fd);
await p.evaluate(() => window[Symbol.for('salvaStories.kit')].lset('ss.follows.222', { v: 1, at: 1, me: null, followers: [], following: [], prev: null, history: [], ignore: ['9'] }));
await wait(300);
const keysAfter = await keys();
const k111 = await sw.evaluate(() => chrome.storage.local.get(['ss.follows.111', 'ss.follows.111.day']));
check('chaves por conta: a 111 intacta (análise, ignorados e limite do dia), a 222 separada', canon(k111['ss.follows.111']) === canon(FIX)
  && k111['ss.follows.111.day'].n === 37 && keysAfter.includes('ss.follows.222') && keysAfter.includes('ss.follows.111'), { keysBefore, keysAfter, k111, FIX });

console.log('chaves de storage (seguidores) antes:', JSON.stringify(keysBefore));
console.log('chaves de storage (seguidores) depois:', JSON.stringify(keysAfter));
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
