// E2E da extensão Salva Stories num Chromium real, com o instagram.com e a CDN simulados por rota.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const M = (f) => path.join(DIR, 'media', f);
const DL = path.join(DIR, 'downloads');
fs.rmSync(DL, { recursive: true, force: true });
fs.mkdirSync(DL, { recursive: true });

const CDN = 'https://127.0.0.1/v/t51/';
const FB = 'https://127.0.0.1/o1/v/t2/f2/m78/';
const dash = `<?xml version="1.0"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" type="static"><Period id="0">
<AdaptationSet id="0" contentType="video"><Representation id="1v" bandwidth="3000000" codecs="avc1.64001f" mimeType="video/mp4" width="1080" height="1920"><BaseURL>${FB}hqv.mp4?x=1&amp;y=2</BaseURL><SegmentBase indexRange="0-1"/></Representation>
<Representation id="2v" bandwidth="700000" codecs="avc1.64001f" mimeType="video/mp4" width="720" height="1280"><BaseURL>${FB}low.mp4</BaseURL></Representation></AdaptationSet>
<AdaptationSet id="1" contentType="audio"><Representation id="3a" bandwidth="64000" codecs="mp4a.40.2" mimeType="audio/mp4"><BaseURL>${FB}hqa.mp4</BaseURL></Representation></AdaptationSet></Period></MPD>`;

const user = { username: 'pessoa.teste', pk: '999' };
const items = [
  { pk: '111', id: '111_999', media_type: 1, taken_at: 1792400000, user,
    image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'foto_n.jpg?stp=small' }, { width: 1320, height: 2346, url: CDN + 'foto_n.jpg?stp=big' }] } },
  { pk: '222', id: '222_999', media_type: 2, has_audio: true, taken_at: 1792400100, user,
    image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'thumb_n.jpg' }] },
    video_versions: [{ type: 101, url: FB + 'prog.mp4?a=1' }, { type: 102, url: FB + 'prog.mp4?a=1' }], video_dash_manifest: dash },
  { pk: '333', id: '333_999', media_type: 2, has_audio: false, taken_at: 1792400200, user,
    image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'thumb2_n.jpg' }] },
    video_versions: [{ type: 101, url: FB + 'silent.mp4' }] },
];
const inline = JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user, items }] } } }]] });

function page(kind) {
  const media = kind === 'img'
    ? `<img id="m" src="${CDN}foto_n.jpg?stp=small" style="width:400px;height:711px;object-fit:cover">`
    : `<video id="m" style="width:400px;height:711px;background:#222" muted></video>`;
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;display:grid;place-items:center;height:100vh">
  ${media}
  <script type="application/json">${inline}</script>
  <script>
    window.seenSent = 0;
    window.sendSeen = () => fetch('/api/graphql', { method: 'POST', body: 'fb_api_req_friendly_name=PolarisAPIReelSeenMutation&variables={}' }).then(r => r.text());
  </script></body></html>`;
}

let seenHits = 0;
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'profile-' + Date.now()), {
  executablePath: process.env.CHROME_PATH || undefined, // ex.: CHROME_PATH=/caminho/do/chrome (sem isso usa o Chromium do Playwright)
  headless: true,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--ignore-certificate-errors', '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights'],
  acceptDownloads: true,
  downloadsPath: DL,
  viewport: { width: 1280, height: 900 },
});

await ctx.route('https://www.instagram.com/**', async (route) => {
  const u = new URL(route.request().url());
  if (u.pathname === '/api/graphql') { seenHits++; return route.fulfill({ status: 200, body: '{"ok":1}', contentType: 'application/json' }); }
  if (u.pathname.startsWith('/stories/pessoa.teste/111')) return route.fulfill({ status: 200, contentType: 'text/html', body: page('img') });
  if (u.pathname.startsWith('/stories/pessoa.teste/222')) return route.fulfill({ status: 200, contentType: 'text/html', body: page('video') });
  if (u.pathname.startsWith('/stories/pessoa.teste/333')) return route.fulfill({ status: 200, contentType: 'text/html', body: page('video') });
  return route.fulfill({ status: 404, body: '' });
});
const served = [];
const file = { 'foto_n.jpg': ['big.jpg', 'image/jpeg'], 'prog.mp4': ['prog.mp4', 'video/mp4'], 'hqv.mp4': ['hq-stream0.mp4', 'video/mp4'], 'hqa.mp4': ['hq-stream1.mp4', 'video/mp4'], 'silent.mp4': ['silent.mp4', 'video/mp4'] };
for (const host of []) {
  await ctx.route(host, async (route) => {
    const u = new URL(route.request().url());
    const name = u.pathname.split('/').pop();
    served.push(name + (u.search ? u.search : ''));
    const f = file[name];
    if (!f) return route.fulfill({ status: 404, body: '' });
    const src = name === 'foto_n.jpg' && u.searchParams.get('stp') === 'small' ? 'small.jpg' : f[0];
    return route.fulfill({ status: 200, contentType: f[1], body: fs.readFileSync(M(src)), headers: { 'access-control-allow-origin': '*' } });
  });
}

let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
const extId = sw.url().split('/')[2];
await new Promise((r) => setTimeout(r, 1500));
await sw.evaluate(() => { self.__calls = []; const orig = chrome.downloads.download.bind(chrome.downloads); chrome.downloads.download = (o, cb) => { self.__calls.push({ filename: o.filename, url: o.url.slice(0, 48), len: o.url.length }); return orig(o, cb); }; });
const results = {};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFiles(n, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const f = fs.readdirSync(DL);
    if (f.length >= n) { await wait(400); return fs.readdirSync(DL); }
    await wait(200);
  }
  return fs.readdirSync(DL);
}
async function lastDownloads(n) {
  return sw.evaluate((n) => new Promise((r) => chrome.downloads.search({ orderBy: ['-startTime'], limit: n }, (d) => r(d.map((x) => ({ file: x.filename, state: x.state, error: x.error || '', mime: x.mime, url: x.url.slice(0, 40) }))))), n);
}

// 1) foto: botão aparece; D salva a maior resolução com nome certo
const p = await ctx.newPage();
const logs = [];
p.on('console', (m) => logs.push(m.text()));
await p.goto('https://www.instagram.com/stories/pessoa.teste/111/');
await wait(1200);
results.hostVisible = await p.evaluate(() => { const h = document.querySelector('salva-stories'); return !!h && h.style.display === 'block'; });
await p.keyboard.press('d');
await waitFiles(1);
results.photo = await lastDownloads(1);

// 2) vídeo com som: alta resolução via DASH (mux) — padrão maxQuality=true
await p.goto('https://www.instagram.com/stories/pessoa.teste/222/');
await wait(1200);
await p.keyboard.press('d');
await waitFiles(2, 20000);
results.videoHQ = await lastDownloads(1);

// 3) vídeo sem som
await p.goto('https://www.instagram.com/stories/pessoa.teste/333/');
await wait(1200);
await p.keyboard.press('d');
await waitFiles(3);
results.silent = await lastDownloads(1);

// 4) salvar todos (Shift+D) → 3 arquivos
await p.keyboard.press('Shift+D');
await waitFiles(6, 25000);
results.all = (await lastDownloads(3)).map((d) => d.file.split('/').slice(-2).join('/') + ' ' + d.state);

// 5) maxQuality desligado → MP4 progressivo
await sw.evaluate(() => chrome.storage.sync.set({ maxQuality: false }));
await p.goto('https://www.instagram.com/stories/pessoa.teste/222/');
await wait(1200);
await p.keyboard.press('d');
await waitFiles(7);
results.video720 = await lastDownloads(1);

// 6) modo fantasma: desligado deixa passar, ligado bloqueia
await p.evaluate(() => window.sendSeen());
const hitsOff = seenHits;
await sw.evaluate(() => chrome.storage.sync.set({ ghost: true }));
await wait(500);
await p.evaluate(() => window.sendSeen());
results.ghost = { hitsWithGhostOff: hitsOff, hitsAfterGhostOn: seenHits };

// 7) menu dentro do Instagram (desde a v1.4.0 não há popup): engrenagem do story abre, mostra ajustes e versão;
//    a chave do modo fantasma grava no storage; Alt+S fecha; digitar "d" no campo de pasta não baixa nada
await p.goto('https://www.instagram.com/stories/pessoa.teste/111/');
await wait(1200);
const stack = await p.evaluate(() => { const r = document.querySelector('salva-stories').getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height }; });
await p.mouse.click(stack.x + 22, stack.y + stack.h - 18); // engrenagem = último botão da pilha
await wait(500);
const menu = () => p.evaluate(() => window.__salvaStoriesMenuDebug());
let m = await menu();
results.menu = { openedByGear: m.open, version: m.version, ghostShown: m.S.ghost };
await p.mouse.click(m.at.ghost.x, m.at.ghost.y); await wait(400);
results.menu.ghostAfterSwitch = (await sw.evaluate(() => chrome.storage.sync.get('ghost'))).ghost;
const nCalls = (await sw.evaluate(() => self.__calls.length));
m = await menu(); await p.mouse.click(m.at.folder.x, m.at.folder.y); await p.keyboard.type('dd'); await wait(700);
results.menu.typingDidNotDownload = (await sw.evaluate(() => self.__calls.length)) === nCalls;
await p.keyboard.press('Alt+s'); await wait(300);
results.menu.closedByAltS = !(await menu()).open;
await sw.evaluate(() => chrome.storage.sync.set({ folder: 'Instagram Stories', ghost: false }));

await p.goto('https://www.instagram.com/stories/pessoa.teste/111/');
await wait(1000);
await p.screenshot({ path: path.join(DIR, 'page.png') });

results.calls = await sw.evaluate(() => self.__calls);
results.files = fs.readdirSync(DL).map(f => { const fp = path.join(DL, f); let probe=''; try { probe = execSync(`ffprobe -v error -show_entries stream=codec_type,width,height -of csv=p=0 "${fp}"`).toString().trim().replace(/\n/g,' | '); } catch(e) { probe='(não é mídia)'; } return fs.statSync(fp).size + 'B ' + probe; });
results.served = served;
results.logs = logs.filter((l) => /Salva/.test(l));
console.log(JSON.stringify(results, null, 1));
await ctx.close();
