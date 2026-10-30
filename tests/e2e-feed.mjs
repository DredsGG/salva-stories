// v1.8.8: (1) botões de salvar nos posts da página inicial (feed): ao lado do post que está à vista, D salva a foto/vídeo
// da tela, Shift+D o carrossel inteiro, troca de post ao rolar, sem "todas" em post único, desligar no menu;
// (2) o menu "Mais" do Instagram, aberto por cima do nosso ícone da barra lateral e do fantasminha, esconde os dois
// até fechar.
// Uso: node e2e-feed.mjs $PWD/ext-test
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CDN = 'https://127.0.0.1/v/t51/';
const user = { username: 'pessoa.teste', pk: '999' };
const cand = (n) => ({ candidates: [{ width: 640, height: 800, url: CDN + n + '_n.jpg?stp=small' }, { width: 1440, height: 1800, url: CDN + n + '_n.jpg?stp=big' }] });
const car = { pk: '3700000000000000001', id: '3700000000000000001_999', code: 'DQabcDEFghi', media_type: 8, taken_at: 1792400000, user, carousel_media_count: 3,
  carousel_media: [
    { pk: '3700000000000000011', id: '3700000000000000011_999', media_type: 1, image_versions2: cand('a') },
    { pk: '3700000000000000012', id: '3700000000000000012_999', media_type: 2, has_audio: true, image_versions2: cand('bthumb'), video_versions: [{ type: 101, url: 'https://127.0.0.1/o1/v/t2/f2/m78/b.mp4?x=1' }] },
    { pk: '3700000000000000013', id: '3700000000000000013_999', media_type: 1, image_versions2: cand('c') },
  ] };
const single = { pk: '3700000000000000099', id: '3700000000000000099_999', code: 'DQsingle123', media_type: 1, taken_at: 1792500000, user, image_versions2: cand('s') };
const reel = { pk: '3700000000000000077', id: '3700000000000000077_999', code: 'DQreelxyz12', media_type: 2, has_audio: true, taken_at: 1792600000, user, image_versions2: cand('r'), video_versions: [{ type: 101, url: 'https://127.0.0.1/o1/v/t2/f2/m78/r.mp4?x=1' }] };
// fundo como no HTML do Instagram (o post fica no nível 17: require → __bbox → … → edges → node → media)
const feedData = { data: { xdt_api__v1__feed__timeline__connection: { edges: [{ node: { media: car } }, { node: { media: single } }, { node: { media: reel } }] } } };
const inline = JSON.stringify({ require: [['ScheduledServerJS', 'handle', null, [{ __bbox: { require: [['RelayPrefetchedStreamCache', 'next', [], ['adp_x', { __bbox: { complete: true, result: feedData } }]]] } }]]] });
const W = 470, H = 588;
const head = (href) => `<header style="height:56px;display:flex;align-items:center;gap:8px"><img src="${CDN}av_n.jpg" style="width:32px;height:32px;border-radius:50%;background:#555"><a href="/pessoa.teste/">pessoa.teste</a> · <a href="${href}"><time>1 d</time></a></header>`;
const foot = (href) => `<footer style="height:120px"><a href="/pessoa.teste/">pessoa.teste</a> legenda <a href="${href}comments/">Ver comentários</a></footer>`;
// como o Instagram (medido em 28/10/2026): 1º <li> espaçador sem mídia, cada <li> parado em translateX(n × largura) e a janela rola
const carSlides = `<li style="position:absolute;left:0;top:0;width:1px;height:${H}px;list-style:none;transform:translateX(${3 * W - 1}px)"></li>` + car.carousel_media.map((m, i) => `<li style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;list-style:none;transform:translateX(${i * W}px)">${m.media_type === 2 ? `<video style="width:${W}px;height:${H}px;background:#246;display:block" muted></video>` : `<img src="${CDN}${i === 0 ? 'a' : 'c'}_n.jpg?stp=small" style="width:${W}px;height:${H}px;display:block;background:#c36">`}</li>`).join('');
const feed = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff;font:14px sans-serif">
<nav id="side" style="position:fixed;left:0;top:0;width:72px;height:100vh;z-index:5"><div id="col" style="position:absolute;left:12px;top:72px;width:48px;height:calc(100vh - 100px)">
  ${[0, 1, 2, 3, 4].map((i) => `<a href="${i === 0 ? '/' : '/x' + i + '/'}" style="position:absolute;left:12px;top:${110 + i * 56 - 72}px;width:24px;height:24px"><svg width="24" height="24"><rect width="24" height="24" fill="#888"/></svg></a>`).join('')}
  <div id="mais" role="button" style="position:absolute;left:12px;bottom:60px;width:24px;height:24px;cursor:pointer"><svg width="24" height="24"><rect width="24" height="24" fill="#aaa"/></svg></div>
</div></nav>
<main style="margin-left:420px;padding-top:30px;padding-bottom:900px">
 <article id="a1" style="width:${W}px">${head('/p/DQabcDEFghi/')}<div><div id="vp1" style="width:${W}px;height:${H}px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;position:relative"><ul id="ul" style="position:relative;width:1px;height:${H}px;margin:0;padding:0">${carSlides}</ul></div></div>${foot('/p/DQabcDEFghi/')}</article>
 <article id="a2" style="width:${W}px">${head('/p/DQsingle123/')}<div id="vp2" style="width:${W}px;height:${H}px;overflow:hidden"><img src="${CDN}s_n.jpg?stp=small" style="width:${W}px;height:${H}px;display:block;background:#396"></div>${foot('/p/DQsingle123/')}</article>
 <article id="a3" style="width:${W}px">${head('/reel/DQreelxyz12/')}<div id="vp3" style="width:${W}px;height:${H}px;overflow:hidden"><video style="width:${W}px;height:${H}px;display:block;background:#642" muted></video></div>${foot('/reel/DQreelxyz12/')}</article>
</main>
<script type="application/json">${inline}</script>
<script>
  window.go=(i)=>{document.getElementById('vp1').scrollLeft=i*${W};};
  // "Mais" do Instagram: menu por cima do canto de baixo da barra (fora da coluna, como um portal)
  document.getElementById('mais').addEventListener('click',()=>{const m=document.getElementById('pop'); if(m){m.remove();return;}
    const d=document.createElement('div'); d.id='pop'; d.setAttribute('role','dialog');
    d.style.cssText='position:fixed;left:12px;bottom:130px;width:266px;height:520px;background:#262626;border-radius:16px;z-index:50';
    d.innerHTML=['Configurações','Sua atividade','Salvo','Trocar de conta','Sair'].map(t=>'<div style="height:52px;padding:0 16px;line-height:52px">'+t+'</div>').join('');
    document.body.appendChild(d);});
</script></body></html>`;

const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pfeed-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1400, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
});
await ctx.route('https://www.instagram.com/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/') return r.fulfill({ status: 200, contentType: 'text/html', body: feed });
  return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
});
await ctx.route('https://127.0.0.1/**', (r) => r.fulfill({ status: 404, body: '' }));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1000);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => chrome.storage.sync.set({ ghost: true }));
await sw.evaluate(() => { self.__calls = []; const orig = chrome.downloads.download.bind(chrome.downloads); chrome.downloads.download = (o, cb) => { self.__calls.push(o.filename); return orig(o, cb); }; });
const calls = async (n) => { for (let i = 0; i < 40; i++) { const c = await sw.evaluate(() => self.__calls.slice()); if (c.length >= n) return c; await wait(150); } return sw.evaluate(() => self.__calls.slice()); };
const clear = () => sw.evaluate(() => { self.__calls.length = 0; });
const p = await ctx.newPage();
const st = (vp) => p.evaluate((vp) => { const d = window.__salvaStoriesDebug(); const h = document.querySelector('salva-stories'); const q = document.getElementById(vp).getBoundingClientRect(); return { disp: h && h.style.display, op: h && h.style.opacity, left: h && h.style.left, top: h && h.style.top, title: d.at && d.at.title, all: d.at && d.at.all, code: d.post && d.post.code, vp: { right: Math.round(q.right), top: Math.round(q.top) } }; }, vp);
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };

await p.goto('https://www.instagram.com/'); await wait(1200);
if (process.env.DBG) { console.log(JSON.stringify(await p.evaluate(() => { const d = window.__salvaStoriesDebug(); return { posts: d.posts, post: d.post, count: d.at && d.at.count }; }))); }
let s = await st('vp1');
check('feed: botões à direita do 1º post, no topo da foto', s.disp === 'block' && s.op === '1' && s.left === (s.vp.right + 14) + 'px' && s.top === (s.vp.top + 16) + 'px' && s.code === 'DQabcDEFghi', s);
check('feed carrossel: texto "foto" e botão "todas"', /foto/i.test(s.title || '') && !!s.all, s);
check('contador do carrossel: 1/3', (await p.evaluate(() => window.__salvaStoriesDebug().at.count)) === '1/3', await p.evaluate(() => window.__salvaStoriesDebug().at));
await p.keyboard.press('d');
let c = await calls(1);
check('D no feed salva a foto da tela (_01) em perfil/fotos', c.length === 1 && /pessoa\.teste\/perfil\/fotos\/2026-10-\d\d_DQabcDEFghi_01\.jpg$/.test(c[0]), c);
await p.evaluate(() => window.go(1)); await wait(500);
check('contador acompanha: 2/3', (await p.evaluate(() => window.__salvaStoriesDebug().at.count)) === '2/3', await p.evaluate(() => window.__salvaStoriesDebug().at.count));
await clear(); await p.keyboard.press('d'); c = await calls(1);
check('passou para o vídeo do carrossel: D salva o _02.mp4', c.length === 1 && /perfil\/videos\/2026-10-\d\d_DQabcDEFghi_02\.mp4$/.test(c[0]), c);
await clear(); await p.keyboard.press('Shift+D'); c = await calls(3);
check('Shift+D salva o carrossel inteiro na ordem', c.length === 3 && /_01\.jpg$/.test(c[0]) && /_02\.mp4$/.test(c[1]) && /_03\.jpg$/.test(c[2]), c);
// clique de verdade no botão (não só a tecla)
await clear(); s = await st('vp1');
const one = await p.evaluate(() => window.__salvaStoriesDebug().at.one);
await p.mouse.move(one.x, one.y, { steps: 3 }); await p.mouse.down(); await wait(100); await p.mouse.up();
c = await calls(1);
const at1 = await p.evaluate((o) => ({ top: document.elementFromPoint(o.x, o.y).tagName, dbg: window.__salvaStoriesDebug().at }), one);
check('clique no botão salva', c.length === 1 && /_02\.mp4$/.test(c[0]), { c, one, at1 });
// player no vídeo do carrossel: passar para a foto seguinte esconde a barra (não vai junto para a esquerda; 29/10/2026)
await p.evaluate(() => window.go(1)); await wait(400);
{ const vr = await p.evaluate(() => { const r = document.getElementById('vp1').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(vr.x - 40, vr.y, { steps: 3 }); await p.mouse.move(vr.x, vr.y, { steps: 3 }); await wait(400);
  const pd0 = await p.evaluate(() => window.__salvaStoriesPlayerDebug());
  await p.evaluate(() => window.go(2)); await wait(500);
  const pd = await p.evaluate(() => { const d = window.__salvaStoriesPlayerDebug(); const h = document.querySelector('salva-stories-player'); return { shown: d.shown, at: d.at && d.at.pp }; });
  const vp = await p.evaluate(() => { const r = document.getElementById('vp1').getBoundingClientRect(); return { left: r.left, right: r.right }; });
  check('carrossel: barra do player aparece no vídeo', pd0.shown === true, pd0.shown);
  check('carrossel: passou para a foto, a barra some (não vai junto)', !pd.shown || (pd.at && pd.at.x >= vp.left && pd.at.x <= vp.right), { pd, vp }); }
await p.evaluate(() => window.go(0)); await wait(300);
// rola até o 2º post (foto única)
await p.evaluate(() => document.getElementById('a2').scrollIntoView({ block: 'center' })); await wait(700);
s = await st('vp2');
check('foto única: sem contador', (await p.evaluate(() => window.__salvaStoriesDebug().at.count)) === null, null);
check('rolou: botões vão para o 2º post, sem "todas"', s.disp === 'block' && s.op === '1' && s.left === (s.vp.right + 14) + 'px' && s.code === 'DQsingle123' && !s.all, s);
await clear(); await p.keyboard.press('d'); c = await calls(1);
check('post único do feed: nome sem _NN', c.length === 1 && /perfil\/fotos\/2026-10-\d\d_DQsingle123\.jpg$/.test(c[0]), c);
// 3º post: reel (link /reel/)
await p.evaluate(() => document.getElementById('a3').scrollIntoView({ block: 'center' })); await wait(700);
s = await st('vp3');
check('reel no feed: texto "vídeo"', s.code === 'DQreelxyz12' && /v[ií]deo/i.test(s.title || ''), s);
await clear(); await p.keyboard.press('d'); c = await calls(1);
check('reel no feed: salva o .mp4', c.length === 1 && /perfil\/videos\/2026-10-\d\d_DQreelxyz12\.mp4$/.test(c[0]), c);
// durante a rolagem os botões não arrastam junto (somem e voltam no lugar)
const during = await p.evaluate(async () => { const out = []; for (let i = 0; i < 8; i++) { scrollBy(0, -30); await new Promise((r) => requestAnimationFrame(r)); const h = document.querySelector('salva-stories'); out.push(getComputedStyle(h).opacity); } return out; });
await wait(500);
s = await st('vp3');
check('rolando: some; parou: volta no lugar', during.some((o) => parseFloat(o) < 0.5) && s.op === '1' && s.top === (Math.max(8, Math.min(s.vp.top + 16, s.vp.top + 588 - 120))) + 'px', { during, s });
// desligar no menu
await sw.evaluate(() => chrome.storage.sync.set({ postBtn: false })); await wait(700);
s = await st('vp3');
check('desligado no menu: some do feed', s.disp === 'none' || s.op === '0', s);
await sw.evaluate(() => chrome.storage.sync.set({ postBtn: true })); await wait(700);
await p.evaluate(() => scrollTo(0, 0)); await wait(500);

// ── menu "Mais" por cima do nosso ícone ──
const md = () => p.evaluate(() => { const d = window.__salvaStoriesMenuDebug(); return { mode: d.anchorMode, slot: d.slot, navHidden: d.navHidden, ghost: d.ghostBadge }; });
let m = await md();
check('ícone na barra lateral e fantasminha visíveis', m.mode === 'sidebar' && m.navHidden === false && !!m.ghost, m);
const pop = await p.evaluate(() => { const r = document.getElementById('pop'); return !!r; });
const mais = await p.evaluate(() => { const r = document.getElementById('mais').getBoundingClientRect(); return { x: r.left + 12, y: r.top + 12 }; });
await p.mouse.click(mais.x, mais.y); await wait(300);
m = await md();
const cover = await p.evaluate(() => { const r = document.getElementById('pop').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; });
check('"Mais" aberto por cima: ícone e fantasminha somem em até 300 ms', !pop && m.navHidden === true && !m.ghost, { m, cover });
await p.screenshot({ path: path.join(DIR, 'shots-feed', 'mais-aberto.png') });
await p.mouse.click(mais.x, mais.y); await wait(300);
m = await md();
const efp = await p.evaluate((m) => document.elementsFromPoint(m.slot.x + 24, m.slot.y + 24).slice(0, 4).map((e) => e.tagName + '#' + e.id), m);
check('"Mais" fechado: voltam', m.navHidden === false && !!m.ghost, { m, efp, pop: await p.evaluate(() => !!document.getElementById('pop')) });
// Esc fecha o menu do IG (aqui: o próprio teste remove) → volta pelo intervalo também
await p.mouse.click(mais.x, mais.y); await wait(300);
await p.evaluate(() => document.getElementById('pop').remove()); await wait(700);
m = await md();
check('menu some sem clique (intervalo de 500 ms): voltam', m.navHidden === false && !!m.ghost, m);
await p.screenshot({ path: path.join(DIR, 'shots-feed', 'feed.png') });

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
