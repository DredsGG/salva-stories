// v1.12.0: a logo do Instagram E o item "Página inicial" da barra lateral, clicados em QUALQUER página, levam ao início numa carga nova
// (em "/": sobe e recarrega; fora de "/": location.assign("/"), não a navegação SPA do Instagram). Reels e Mensagens não são tocados.
// (v1.11.0: na página inicial, a logo do Instagram (o link para "/" com <svg aria-label="Instagram">, no alto da barra
// lateral) sobe e recarrega a página. Barra lateral simulada como a real (medida em 12/11/2026), com um "Instagram"
// simulado que faz o que o de verdade faz: na página inicial, o clique na logo só sobe a página; fora dela, vai para "/"
// sem recarregar (pushState). Uso: node e2e-logo-reload.mjs $PWD/ext-test
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const icon = (l) => `<svg aria-label="${l}" width="24" height="24"><rect width="24" height="24" fill="#888"/></svg>`;
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff;font:14px sans-serif">
<nav style="position:fixed;left:0;top:0;width:72px;height:100vh;z-index:5">
  <a id="logo" href="/" role="link" style="position:absolute;left:12px;top:24px;width:48px;height:56px;display:grid;place-items:center">${icon('Instagram')}<span style="position:absolute;left:-9999px">Instagram</span></a>
  <a id="home" href="/" role="link" style="position:absolute;left:12px;top:241px;width:48px;height:56px;display:grid;place-items:center">${icon('Página inicial')}<span style="position:absolute;left:-9999px">Página inicial</span></a>
  <a href="/explore/" role="link" style="position:absolute;left:12px;top:297px;width:48px;height:56px;display:grid;place-items:center">${icon('Explorar')}</a>
  <a id="reels" href="/reels/" role="link" style="position:absolute;left:12px;top:353px;width:48px;height:56px;display:grid;place-items:center">${icon('Reels')}</a>
  <a id="msgs" href="/direct/inbox/" role="link" style="position:absolute;left:12px;top:409px;width:48px;height:56px;display:grid;place-items:center">${icon('Mensagens')}</a>
</nav>
<main style="margin-left:120px;height:4000px"><h1>feed</h1></main>
<script>
  // conta as cargas da página (e se foram recarga) nesta aba
  const nav = performance.getEntriesByType('navigation')[0];
  sessionStorage.setItem('loads', String(+(sessionStorage.getItem('loads') || 0) + 1));
  if (nav && nav.type === 'reload') sessionStorage.setItem('reloads', String(+(sessionStorage.getItem('reloads') || 0) + 1));
  window.__igHandled = 0;
  // o "Instagram": link para "/" com clique normal → sobe (na inicial) ou vai para "/" sem recarregar; com tecla ou outro botão, fica com o navegador
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); window.__igHandled++;
    const to = a.getAttribute('href');
    if (location.pathname === to) scrollTo(0, 0); else history.pushState({}, '', to);
  });
</script></body></html>`;

const ctx = await chromium.launchPersistentContext(path.join(DIR, 'plr-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1400, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
});
// Story aberto (como no print do André de 12/11/2026): sem barra lateral, logo "Instagram" no alto à esquerda (link para "/")
// e o X ("Fechar") no alto à direita. O "Instagram" simulado fecha o Story sem recarregar (pushState para "/").
const story = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#1a1a1a;color:#fff;font:14px sans-serif;height:100vh">
<a id="slogo" href="/" role="link" style="position:absolute;left:12px;top:10px;width:80px;height:30px;display:block">${icon('Instagram')}</a>
<div id="sclose" role="button" tabindex="0" style="position:absolute;right:12px;top:10px;width:32px;height:32px;cursor:pointer"><svg aria-label="Fechar" width="24" height="24"><path d="M4 4l16 16M20 4 4 20" stroke="#fff"/></svg></div>
<div style="position:absolute;left:600px;top:20px;width:420px;height:740px;background:#333"></div>
<script>
  const nav = performance.getEntriesByType('navigation')[0];
  sessionStorage.setItem('loads', String(+(sessionStorage.getItem('loads') || 0) + 1));
  window.__igHandled = 0;
  document.addEventListener('click', (e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (e.target.closest('#slogo, #sclose')) { e.preventDefault(); window.__igHandled++; history.pushState({}, '', '/'); } });
</script></body></html>`;
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: new URL(r.request().url()).pathname.startsWith('/stories/') ? story : page }));
await ctx.route('https://127.0.0.1/**', (r) => r.fulfill({ status: 404, body: '' }));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(800);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'pt' }));
const p = await ctx.newPage();
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const st = () => p.evaluate(() => ({ loads: +(sessionStorage.getItem('loads') || 0), reloads: +(sessionStorage.getItem('reloads') || 0), y: Math.round(scrollY), path: location.pathname, ig: window.__igHandled }));
const at = (id) => p.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, id);
const toast = () => p.evaluate(() => { const d = window.__salvaStoriesMenuDebug(); return d.side && d.side.toast; });

await p.goto('https://www.instagram.com/'); await wait(1500);
const logo = await at('logo'), home = await at('home'), reels = await at('reels'), msgs = await at('msgs');
const BOTOES = [['logo', logo], ['Página inicial', home]];
let a, b; // usados também na parte do Story, mais abaixo
const fora = async (path) => { await p.evaluate((x) => history.pushState({}, '', x), path); await wait(300); };
const clique = async (q, opt) => { await Promise.all([p.waitForEvent('load', { timeout: 6000 }).catch(() => null), p.mouse.click(q.x, q.y, opt)]); await wait(1200); };

// 1) na inicial: rola, clica → sobe e recarrega (o mesmo para a logo e para o item "Página inicial")
for (const [nome, q] of BOTOES) {
  await p.evaluate(() => scrollTo(0, 1500)); await wait(200);
  const a = await st(); await clique(q); const b = await st();
  check('em "/": ' + nome + ' sobe e recarrega (1 recarga)', b.reloads === a.reloads + 1 && b.loads === a.loads + 1 && b.y === 0, { a, b });
}

// 2) fora de "/" (perfil, post, Reels, Explorar): uma carga nova de "/", no topo (não a navegação do Instagram)
for (const [nome, q] of BOTOES) for (const path of ['/instagram/', '/p/DQabcDEFghi/', '/reels/', '/explore/']) {
  await fora(path); await p.evaluate(() => scrollTo(0, 600)); await wait(200);
  const a = await st(); await clique(q); const b = await st();
  check('em ' + path + ': ' + nome + ' abre "/" numa carga nova, no topo (sem passar pelo Instagram)', b.path === '/' && b.loads === a.loads + 1 && b.reloads === a.reloads && b.ig === 0 && b.y === 0, { a, b });
}

// 3) Ctrl+clique e clique do meio: ficam com o navegador (nova aba), sem recarregar nem navegar, dentro e fora de "/"
for (const [nome, q] of BOTOES) for (const path of ['/', '/explore/']) {
  await fora(path);
  let a = await st(); let pages = ctx.pages().length;
  await p.keyboard.down('Control'); await p.mouse.click(q.x, q.y); await p.keyboard.up('Control'); await wait(1300);
  let b = await st();
  check('Ctrl+clique em ' + nome + ' (' + path + '): não intercepta (nova aba, sem recarga nem navegação)', b.loads === a.loads && b.path === a.path && ctx.pages().length === pages + 1, { a, b, pages: ctx.pages().length });
  for (const o of ctx.pages()) if (o !== p) await o.close();
  pages = ctx.pages().length; a = await st();
  await p.mouse.click(q.x, q.y, { button: 'middle' }); await wait(1300);
  b = await st();
  check('clique do meio em ' + nome + ' (' + path + '): não intercepta (nova aba, sem recarga nem navegação)', b.loads === a.loads && b.path === a.path && ctx.pages().length === pages + 1, { a, b, pages: ctx.pages().length });
  for (const o of ctx.pages()) if (o !== p) await o.close();
}

// 4) trabalho longo rodando: nem recarrega nem navega, e avisa (nos 3 idiomas)
for (const [nome, q] of BOTOES) for (const path of ['/', '/explore/']) {
  await fora(path); await p.evaluate(() => { document.documentElement.dataset.ssBusy = '1'; scrollTo(0, 900); }); await wait(200);
  const a = await st(); await p.mouse.click(q.x, q.y); await wait(1200); const b = await st();
  check('data-ss-busy=1 em ' + path + ': ' + nome + ' nem recarrega nem navega', b.loads === a.loads && b.path === a.path && b.ig === a.ig, { a, b });
  check('data-ss-busy=1 em ' + path + ': ' + nome + ' avisa "Termine ou cancele…"', (await toast()) === 'Termine ou cancele o que está rodando antes de recarregar', await toast());
  await p.evaluate(() => { document.documentElement.dataset.ssBusy = '0'; });
}
await fora('/'); await p.evaluate(() => { document.documentElement.dataset.ssBusy = '1'; });
for (const [lang, txt] of [['es', 'Termina o cancela lo que se está ejecutando antes de recargar'], ['en', 'Finish or cancel what is running before reloading']]) {
  await sw.evaluate((l) => chrome.storage.sync.set({ lang: l }), lang); await wait(700);
  await p.mouse.click(home.x, home.y); await wait(500);
  check('aviso da Página inicial em ' + lang, (await toast()) === txt, await toast());
}
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'pt' })); await wait(700);
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '0'; });

// 5) chave desligada: nenhum dos dois é interceptado (voltam a ser só do Instagram)
await sw.evaluate(() => chrome.storage.sync.set({ logoReload: false })); await wait(800);
for (const [nome, q] of BOTOES) {
  await p.evaluate(() => scrollTo(0, 900)); await wait(200);
  let a = await st(); await p.mouse.click(q.x, q.y); await wait(1200); let b = await st();
  check('chave desligada em "/": ' + nome + ' fica com o Instagram (sobe, sem recarga)', b.loads === a.loads && b.ig === a.ig + 1 && b.y === 0, { a, b });
  await fora('/explore/'); a = await st(); await p.mouse.click(q.x, q.y); await wait(1200); b = await st();
  check('chave desligada fora de "/": ' + nome + ' fica com o Instagram (navegação dele, sem carga nova)', b.loads === a.loads && b.path === '/' && b.ig === a.ig + 1, { a, b });
}
await sw.evaluate(() => chrome.storage.sync.set({ logoReload: true })); await wait(800);

// 6) Reels e Mensagens não são afetados: seguem a navegação do Instagram, sem recarregar
for (const [nome, q, dest] of [['Reels', reels, '/reels/'], ['Mensagens', msgs, '/direct/inbox/']]) {
  await fora('/'); const a = await st(); await p.mouse.click(q.x, q.y); await wait(1200); const b = await st();
  check(nome + ': não é afetado (navegação do Instagram, sem recarga)', b.loads === a.loads && b.path === dest && b.ig === a.ig + 1, { a, b });
}

// 6b) dentro do Story: a logo e o X saem do Story e abrem o início numa carga nova (não o fechar do Instagram)
for (const [nome, id] of [['logo', 'slogo'], ['X', 'sclose']]) {
  await p.goto('https://www.instagram.com/stories/pessoa.teste/1/'); await wait(1200);
  a = await st(); const q = await at(id);
  await Promise.all([p.waitForEvent('load', { timeout: 8000 }).catch(() => null), p.mouse.click(q.x, q.y)]); await wait(1200);
  b = await st();
  check(`Story: ${nome} abre o início numa carga nova, no topo`, b.path === '/' && b.loads === a.loads + 1 && b.y === 0 && a.ig === 0, { a, b });
}
// Story com trabalho longo: não sai e avisa
await p.goto('https://www.instagram.com/stories/pessoa.teste/1/'); await wait(1200);
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '1'; });
a = await st(); { const q = await at('sclose'); await p.mouse.click(q.x, q.y); } await wait(900);
b = await st();
check('Story com data-ss-busy=1: o X não sai e avisa', b.loads === a.loads && b.path.startsWith('/stories/') && b.ig === a.ig && (await toast()) === 'Termine ou cancele o que está rodando antes de recarregar', { a, b, toast: await toast() });
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '0'; });
// Story com a chave desligada: o X fica com o Instagram (fecha sem recarregar)
await sw.evaluate(() => chrome.storage.sync.set({ logoReload: false })); await wait(800);
a = await st(); { const q = await at('sclose'); await p.mouse.click(q.x, q.y); } await wait(900);
b = await st();
check('Story com a chave desligada: o X fica com o Instagram', b.loads === a.loads && b.ig === a.ig + 1 && b.path === '/', { a, b });
await sw.evaluate(() => chrome.storage.sync.set({ logoReload: true })); await wait(800);
await p.goto('https://www.instagram.com/'); await wait(1200);

// 7) a chave aparece no menu → Ferramentas, ligada
await p.keyboard.press('Alt+s'); await wait(500);
const row = await p.evaluate(() => { const d = window.__salvaStoriesMenuDebug(); return { row: d.logoRow, on: d.S.logoReload }; });
check('chave "Logo e Página inicial recarregam o início" no menu, ligada por padrão', !!row.row && row.on === true, row);

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
