// Botões no post aberto (v1.8.0): mesmo visual dos stories, fora do cartão do post, à direita.
// Cobre: modal com carrossel (foto, vídeo, foto), troca de foto sem os botões se mexerem, D salva a foto/vídeo da tela,
// Shift+D salva o carrossel inteiro na ordem, nomes iguais ao "Baixar perfil", post único (sem "todas"),
// post aberto direto pela URL (cartão no meio da página), janela estreita (botões dentro da foto) e o desligar no menu.
// Uso: node e2e-post.mjs $PWD/ext-test
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CDN = 'https://127.0.0.1/v/t51/';
const user = { username: 'pessoa.teste', pk: '999' };
const CODE = 'DQabcDEFghi';
const cand = (n) => ({ candidates: [{ width: 640, height: 800, url: CDN + n + '_n.jpg?stp=small' }, { width: 1440, height: 1800, url: CDN + n + '_n.jpg?stp=big' }] });
const post = { pk: '3700000000000000001', id: '3700000000000000001_999', code: CODE, media_type: 8, taken_at: 1792400000, user, carousel_media_count: 3,
  carousel_media: [
    { pk: '3700000000000000011', id: '3700000000000000011_999', media_type: 1, image_versions2: cand('a') },
    { pk: '3700000000000000012', id: '3700000000000000012_999', media_type: 2, has_audio: true, image_versions2: cand('bthumb'), video_versions: [{ type: 101, url: 'https://127.0.0.1/o1/v/t2/f2/m78/b.mp4?x=1' }] },
    { pk: '3700000000000000013', id: '3700000000000000013_999', media_type: 1, image_versions2: cand('c') },
  ] };
const single = { pk: '3700000000000000099', id: '3700000000000000099_999', code: 'DQsingle123', media_type: 1, taken_at: 1792500000, user, image_versions2: cand('s') };
const inline = JSON.stringify({ require: [['x', { data: { xdt_api__v1__media__shortcode__web_info: { items: [post] } } }], ['y', { data: { items: [single] } }]] });
const grid = Array.from({ length: 6 }, (_, i) => `<a href="/p/DQgrid${i}abcd/" style="display:inline-block;width:300px;height:400px;margin:4px;background:#333"><img src="${CDN}g${i}_n.jpg" style="width:300px;height:400px"></a>`).join('');
const slides = (n) => post.carousel_media.map((m, i) => `<li style="position:absolute;left:0;top:0;width:${n}px;height:100%;list-style:none;transform:translateX(${i * n}px);transition:transform .35s ease">${m.media_type === 2 ? `<video style="width:${n}px;height:100%;background:#246;display:block" muted></video>` : `<img src="${CDN}${i === 0 ? 'a' : 'c'}_n.jpg?stp=small" style="width:${n}px;height:100%;display:block;background:#c36">`}</li>`).join('');
// modal: mídia 900 + painel 500, centrado, com a grade do perfil atrás
const modal = (vw, late = false, gap = false) => { const mw = Math.min(900, vw - 560), left = Math.max(0, Math.round((vw - mw - 500) / 2)); return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff">
<main style="padding:40px 200px">${grid}</main>
<div role="dialog" style="position:fixed;inset:0;background:rgba(0,0,0,.65)"><article style="position:absolute;left:${left}px;top:24px;height:1100px;display:flex">
  <div id="vp" style="width:${mw}px;height:1100px;overflow:hidden;position:relative;background:#111"><ul id="ul" style="position:relative;width:1px;height:1100px;margin:0;padding:0">${slides(mw)}</ul></div>
  ${gap ? `<div id="phead" style="position:absolute;left:${mw}px;top:0;width:500px;height:60px;background:#333">@pessoa · Seguir</div><div id="panel" style="position:absolute;left:${mw + 60}px;top:60px;width:440px;height:1040px;background:#222">comentários</div>` : `<div id="panel" style="width:500px;height:1100px;background:#222${late ? ';visibility:hidden' : ''}"><div style="padding:16px">comentários</div></div>`}</article></div>
${late ? '<script>setTimeout(() => { document.getElementById(\'panel\').style.visibility = \'visible\'; }, 700);</script>' : ''}
<script type="application/json">${inline}</script>
<script>window.cur=0;window.go=(i)=>{window.cur=i;const lis=[...document.querySelectorAll('#ul li')];lis.forEach((li,k)=>li.style.transform='translateX('+((k-i)*${mw})+'px)');history.replaceState(null,'','?img_index='+(i+1));};</script></body></html>`; };
// post aberto direto: cartão no meio da página (mídia 450×600 + painel 335), grade embaixo
const standalone = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff">
<main style="padding-bottom:1600px"><div id="card" style="margin:50px auto 0;width:785px;display:flex"><div style="width:450px;height:600px;overflow:hidden"><img src="${CDN}s_n.jpg?stp=small" style="width:450px;height:600px;display:block;background:#396"></div>
<div style="width:335px;height:600px;background:#222"></div></div><div style="width:950px;margin:30px auto">${grid}</div></main>
<script type="application/json">${inline}</script></body></html>`;

async function run(vw) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'ppost-' + Date.now()), {
    headless: true, channel: 'chromium', viewport: { width: vw, height: 1200 }, locale: 'pt-BR',
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
  });
  await ctx.route('https://www.instagram.com/**', (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.startsWith('/p/' + CODE)) return r.fulfill({ status: 200, contentType: 'text/html', body: modal(vw, u.searchParams.has('late'), u.searchParams.has('gap')) });
    if (u.pathname.startsWith('/p/DQsingle123')) return r.fulfill({ status: 200, contentType: 'text/html', body: standalone });
    return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
  });
  await ctx.route('https://127.0.0.1/**', (r) => r.fulfill({ status: 404, body: '' }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1000);
  await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
  await sw.evaluate(() => { self.__calls = []; const orig = chrome.downloads.download.bind(chrome.downloads); chrome.downloads.download = (o, cb) => { self.__calls.push(o.filename); return orig(o, cb); }; });
  const calls = async (n) => { for (let i = 0; i < 40; i++) { const c = await sw.evaluate(() => self.__calls.slice()); if (c.length >= n) return c; await wait(150); } return sw.evaluate(() => self.__calls.slice()); };
  const p = await ctx.newPage();
  return { ctx, sw, p, calls };
}
const host = (p) => p.evaluate(() => { const d = window.__salvaStoriesDebug && window.__salvaStoriesDebug(); const h = document.querySelector('salva-stories'); const r = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { left: Math.round(q.left), right: Math.round(q.right), top: Math.round(q.top) }; }; return { disp: h && h.style.display, op: h && h.style.opacity, left: h && h.style.left, top: h && h.style.top, title: d && d.at && d.at.title, all: d && d.at && d.at.all, post: d && d.post, vp: r('#vp') || r('#card > div'), panel: r('#panel') || r('#card > div + div') }; });
const R = {}; let ok = true;
const check = (name, cond, info) => { R[name] = cond ? 'ok' : ['FALHOU', info]; if (!cond) ok = false; };

// ── 1) modal com carrossel, janela larga ──
{
  const { ctx, p, calls, sw } = await run(1718);
  await p.goto(`https://www.instagram.com/p/${CODE}/?img_index=1`); await wait(900);
  let h = await host(p);
  check('modal: botões visíveis à direita do painel', h.disp === 'block' && h.op === '1' && h.left === (h.panel.right + 14) + 'px' && h.top === (h.vp.top + 16) + 'px', h);
  check('modal: texto "foto" e botão "todas"', /foto/i.test(h.title || '') && !!h.all, h);
  await p.keyboard.press('d');
  let c = await calls(1);
  check('D salva a foto 1 com nome do perfil', c.length === 1 && /pessoa\.teste\/perfil\/fotos\/2026-10-\d\d_DQabcDEFghi_01\.jpg$/.test(c[0]), c);
  // troca para o vídeo: os botões não podem se mexer nem piscar
  const samples = await p.evaluate(async () => { const out = []; let stop = false; const tick = () => { const h = document.querySelector('salva-stories'); out.push(h.style.left + ',' + h.style.top + ',' + getComputedStyle(h).opacity); if (!stop) requestAnimationFrame(tick); }; requestAnimationFrame(tick); window.go(1); await new Promise((r) => setTimeout(r, 700)); stop = true; return out; });
  const pos = [...new Set(samples.map((s) => s.split(',').slice(0, 2).join(',')))];
  const minOp = Math.min(...samples.map((s) => parseFloat(s.split(',')[2])));
  check('trocar de foto: botões parados e sem piscar', pos.length === 1 && minOp > 0.95, { pos, minOp });
  h = await host(p);
  check('no vídeo o texto vira "vídeo"', /v[ií]deo/i.test(h.title || ''), h);
  await sw.evaluate(() => { self.__calls.length = 0; });
  await p.keyboard.press('d');
  c = await calls(1);
  check('D no vídeo salva o _02.mp4 em videos', c.length === 1 && /perfil\/videos\/2026-10-\d\d_DQabcDEFghi_02\.mp4$/.test(c[0]), c);
  await p.evaluate(() => window.go(2)); await wait(500);
  await sw.evaluate(() => { self.__calls.length = 0; });
  await p.keyboard.press('Shift+D');
  c = await calls(3);
  check('Shift+D salva o carrossel inteiro na ordem', c.length === 3 && /_01\.jpg$/.test(c[0]) && /_02\.mp4$/.test(c[1]) && /_03\.jpg$/.test(c[2]), c);
  // desligar no menu: os botões somem
  await sw.evaluate(() => chrome.storage.sync.set({ postBtn: false })); await wait(700);
  h = await host(p);
  check('desligado no menu: some', h.disp === 'none' || h.op === '0', h);
  await sw.evaluate(() => chrome.storage.sync.set({ postBtn: true })); await wait(700);
  h = await host(p);
  check('religado: volta', h.disp === 'block' && h.op === '1', h);
  // post aberto direto, foto única
  await p.goto('https://www.instagram.com/p/DQsingle123/'); await wait(900);
  h = await host(p);
  check('post direto: à direita do cartão, sem "todas"', h.disp === 'block' && h.op === '1' && h.left === (h.panel.right + 14) + 'px' && h.top === (h.vp.top + 16) + 'px' && !h.all, h);
  await sw.evaluate(() => { self.__calls.length = 0; });
  await p.keyboard.press('d');
  c = await calls(1);
  check('post único: nome sem _NN', c.length === 1 && /perfil\/fotos\/2026-10-\d\d_DQsingle123\.jpg$/.test(c[0]), c);
  // rolar até a grade: o cartão sai da tela e os botões somem (não vão para as miniaturas)
  await p.evaluate(() => scrollTo(0, 1300)); await wait(500);
  h = await host(p);
  check('rolou para a grade: some', h.disp === 'none' || h.op === '0', h);
  // sair do post: some
  await p.goto('https://www.instagram.com/pessoa.teste/'); await wait(700);
  h = await host(p);
  check('fora do post: some', !h.disp || h.disp === 'none', h);
  await ctx.close();
}
// ── 2) janela estreita: sem espaço fora do cartão → dentro da foto, canto de cima ──
{
  const { ctx, p } = await run(1100);
  await p.goto(`https://www.instagram.com/p/${CODE}/?img_index=1`); await wait(900);
  const h = await host(p);
  check('janela estreita: dentro da foto, no canto', h.disp === 'block' && h.op === '1' && h.left === (h.vp.right - 44 - 12) + 'px' && h.top === (h.vp.top + 12) + 'px', h);
  await ctx.close();
}
// ── 3) painel de comentários que aparece depois da mídia (post aberto pelo Direct, 29/10/2026): os botões já estavam
// ao lado da mídia, em cima de onde o painel aparece; têm de sair de cima dele (sem espaço à direita → dentro da foto) ──
{
  const { ctx, p } = await run(1300);
  await p.goto(`https://www.instagram.com/p/${CODE}/?img_index=1&late=1`); await wait(400);
  const h0 = await host(p);
  await wait(1200);
  const h = await host(p);
  check('painel atrasado: botões saem de cima dos comentários (dentro da foto)', h.disp === 'block' && h.op === '1' && h.left === (h.vp.right - 44 - 12) + 'px' && parseInt(h.left) + 44 <= h.panel.left, { h0, h });
  await ctx.close();
}
// ── 4) painel que não dá para medir pelo meio (cabeçalho em cima, comentários recuados): os botões não podem ficar em
// cima do cabeçalho do painel (como no print do André de 29/10/2026); com o lugar ocupado, vão para dentro da foto ──
{
  const { ctx, p } = await run(1300);
  await p.goto(`https://www.instagram.com/p/${CODE}/?img_index=1&gap=1`); await wait(1200);
  const h = await host(p);
  const head = await p.evaluate(() => { const r = document.getElementById('phead').getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom) }; });
  const L = parseInt(h.left), T = parseInt(h.top);
  const over = L < head.right && L + 44 > head.left && T < head.bottom;
  check('painel sem medida: botões não ficam em cima do cabeçalho do painel', h.disp === 'block' && h.op === '1' && !over, { h, head });
  await ctx.close();
}
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
