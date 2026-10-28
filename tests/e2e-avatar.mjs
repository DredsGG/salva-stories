// v1.8.11: foto de perfil grande. Perfil sem story: clique abre a foto grande (e não navega). Perfil com story: clique
// abre o story (como no Instagram); segurar abre a foto grande e o story não abre. Próprio perfil: clique é do Instagram,
// segurar abre. A foto grande vem do hd_profile_pic_url_info que o Instagram manda (HTML ou GraphQL); sem ele, mostra a
// da tela com aviso. Salvar baixa em {usuário}/perfil. Esc e clique fora fecham. Chave do menu desliga.
// Uso: node e2e-avatar.mjs $PWD/ext-test   (precisa de media/avatar-hd.jpg e media/avatar-sm.jpg)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const HD = fs.readFileSync(path.join(DIR, 'media', 'avatar-hd.jpg'));
const SM = fs.readFileSync(path.join(DIR, 'media', 'avatar-sm.jpg'));
const CDN = 'https://127.0.0.1/v/t51.2885-19/';
const hdOf = (u) => ({ url: `${CDN}550891366_${u.length}8667771684_n.jpg?stp=hd&oh=x`, width: 1080, height: 1080 });
// cabeçalho de perfil como o do Instagram (medido em 28/10/2026): sem story, img dentro de <a role=link> para o próprio
// perfil; com story, <div role=button> com o anel (canvas) e <span role=link> com a img
const profile = (u, { story = false, own = false, inline = true, gql = false } = {}) => {
  const img = `<img alt="Foto do perfil de ${u}" src="${CDN}${u.length}_sm_n.jpg?stp=s150x150" style="width:150px;height:150px;border-radius:50%;display:block">`;
  const pic = story
    ? `<div role="button" tabindex="0" id="ring" style="position:relative;width:150px;height:150px;cursor:pointer"><canvas width="170" height="170" style="position:absolute;left:-10px;top:-10px"></canvas><span role="link" tabindex="-1">${img}</span></div>`
    : `<a role="link" tabindex="0" href="/${u}/" id="lnk">${img}</a>`;
  const data = JSON.stringify({ require: [['x', { data: { user: { username: u, id: '9' + u.length, hd_profile_pic_url_info: hdOf(u), profile_pic_url: CDN + 'sm.jpg' } } }]] });
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#0c1014;color:#fff;font:14px sans-serif">
<main style="padding:30px 0 0 400px"><header style="display:flex;gap:60px;height:190px"><section style="width:150px;height:150px">${pic}</section>
<section><h2>${u}</h2>${own ? '<a href="/accounts/edit/">Editar perfil</a>' : '<button>Seguir</button>'}</section></header>
<div style="height:1400px"></div></main>
${inline ? `<script type="application/json">${data}</script>` : ''}
<script>
  window.igStory = 0; window.igEdit = 0;
  ${story ? `document.getElementById('ring').addEventListener('click', () => { window.igStory++; history.pushState(null, '', '/stories/${u}/'); });` : ''}
  ${own ? `document.getElementById('lnk').addEventListener('click', (e) => { e.preventDefault(); window.igEdit++; });` : ''}
  ${gql ? `setTimeout(() => { const x = new XMLHttpRequest(); x.open('POST', '/api/graphql'); x.send('q=PolarisProfilePageContentQuery'); }, 300);` : ''}
</script></body></html>`;
};
const gqlBody = (u) => JSON.stringify({ data: { user: { username: u, pk: '1', hd_profile_pic_url_info: hdOf(u), latest_reel_media: 1792400000 } }, extensions: {} });

const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pav-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 1400, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
});
let gqlUser = 'pessoa.story';
await ctx.route('https://www.instagram.com/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/api/graphql') return r.fulfill({ status: 200, contentType: 'application/json', body: gqlBody(gqlUser) });
  if (u.pathname === '/pessoa.sem.story/') return r.fulfill({ status: 200, contentType: 'text/html', body: profile('pessoa.sem.story') });
  if (u.pathname === '/pessoa.story/') return r.fulfill({ status: 200, contentType: 'text/html', body: profile('pessoa.story', { story: true, inline: false, gql: true }) });
  if (u.pathname === '/eu.mesmo/') return r.fulfill({ status: 200, contentType: 'text/html', body: profile('eu.mesmo', { own: true }) });
  if (u.pathname === '/sem.dados/') return r.fulfill({ status: 200, contentType: 'text/html', body: profile('sem.dados', { inline: false }) });
  return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body style="background:#000"></body></html>' });
});
await ctx.route('https://127.0.0.1/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: /stp=hd/.test(r.request().url()) ? HD : SM }));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1000);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => { self.__calls = []; const orig = chrome.downloads.download.bind(chrome.downloads); chrome.downloads.download = (o, cb) => { self.__calls.push(o.filename); return orig(o, cb); }; });
const calls = async (n) => { for (let i = 0; i < 30; i++) { const c = await sw.evaluate(() => self.__calls.slice()); if (c.length >= n) return c; await wait(150); } return sw.evaluate(() => self.__calls.slice()); };
const p = await ctx.newPage();
const dbg = () => p.evaluate(() => ({ ...window.__salvaStoriesAvatarDebug(), path: location.pathname, igStory: window.igStory, igEdit: window.igEdit }));
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const press = async (pt, ms) => { await p.mouse.move(pt.x, pt.y, { steps: 3 }); await p.mouse.down(); await wait(ms); await p.mouse.up(); };

// 1) sem story: clique abre a foto grande, sem navegar
await p.goto('https://www.instagram.com/pessoa.sem.story/'); await wait(1200);
let d = await dbg();
check('acha a foto do perfil (sem story)', !!d.avatar && d.story === false && !d.own, d);
await press(d.avatar, 90); await wait(900);
d = await dbg();
check('sem story: clique abre a foto grande', d.open && d.path === '/pessoa.sem.story/', d);
check('foto em alta (1080) do hd_profile_pic_url_info, sem aviso', d.shown && d.shown.nat === 1080 && /stp=hd/.test(d.shown.src) && !d.shown.low && /1080 × 1080/.test(d.shown.size), d.shown);
await p.screenshot({ path: path.join(DIR, 'shots-avatar', 'aberta.png') });
await p.mouse.click(d.at.save.x, d.at.save.y);
const c = await calls(1);
check('Salvar baixa em {usuário}/perfil com nome da foto', c.length === 1 && /^Instagram Stories\/pessoa\.sem\.story\/perfil\/pessoa\.sem\.story_foto-de-perfil_550891366\.jpg$/.test(c[0]), c);
await p.keyboard.press('Escape'); await wait(250);
check('Esc fecha', !(await dbg()).open, null);
const dd = await dbg(); if (!dd.avatar) { console.log('SEM AVATAR', JSON.stringify(dd), JSON.stringify(R)); } await press(dd.avatar, 90); await wait(500);
d = await dbg();
await p.mouse.click(40, 450); await wait(250);
check('clique fora fecha', d.open && !(await dbg()).open, null);

// 2) com story (dados pelo GraphQL): clique abre o story; segurar abre a foto e não abre o story
await p.goto('https://www.instagram.com/pessoa.story/'); await wait(1300);
d = await dbg();
check('com story: anel detectado e foto em alta pelo GraphQL', d.story === true && d.hd && /stp=hd/.test(d.hd.url), d);
await press(d.avatar, 700); await wait(700);
d = await dbg();
check('segurar abre a foto grande e o story não abre', d.open && d.igStory === 0 && d.path === '/pessoa.story/' && d.shown && d.shown.nat === 1080, d);
const avS = (await dbg()).avatar; if (!avS) console.log('SEM AVATAR', JSON.stringify(d), JSON.stringify(R));
await p.keyboard.press('Escape'); await wait(250);
await press(avS || (await dbg()).avatar, 90); await wait(500);
d = await dbg();
check('clique curto abre o story (do Instagram), sem a foto', !d.open && d.igStory === 1 && d.path === '/stories/pessoa.story/', d);

// 3) próprio perfil: clique é do Instagram; segurar abre
await p.goto('https://www.instagram.com/eu.mesmo/'); await wait(1200);
d = await dbg();
await press(d.avatar, 90); await wait(400);
d = await dbg();
check('próprio perfil: clique fica com o Instagram', d.own && !d.open && d.igEdit === 1, d);
await press(d.avatar, 650); await wait(500);
d = await dbg();
check('próprio perfil: segurar abre', d.open, d);
await p.keyboard.press('Escape'); await wait(200);

// 4) sem os dados em alta: abre a da tela e avisa
await p.goto('https://www.instagram.com/sem.dados/'); await wait(1200);
d = await dbg();
await press(d.avatar, 90); await wait(500);
d = await dbg();
check('sem dados em alta: mostra a da tela com aviso', d.open && d.shown && d.shown.low && d.shown.nat === 150, d.shown);
await p.screenshot({ path: path.join(DIR, 'shots-avatar', 'sem-dados.png') });
await p.keyboard.press('Escape'); await wait(200);

// 5) chave do menu desligada: clique volta a ser do Instagram (navega pelo link)
await sw.evaluate(() => chrome.storage.sync.set({ avatarZoom: false })); await wait(600);
await p.goto('https://www.instagram.com/pessoa.sem.story/'); await wait(1200);
d = await dbg();
await press(d.avatar, 700); await wait(900);
d = await dbg();
check('desligado no menu: nem clique nem segurar abrem', !d.open, d);
await sw.evaluate(() => chrome.storage.sync.set({ avatarZoom: true }));

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
