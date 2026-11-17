// Print do README (v1.13.0): botão "See all" ao lado da bandeja de stories, com a barrinha no meio da rodada.
// Bandeja simulada como a do e2e-see-all (fibras + require falso), contas fictícias example.*, em inglês e no tema escuro.
// Uso: node prints-see-all.mjs $PWD/ext-test  →  shotsgh/salva-stories-see-all.png
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import path from 'path'; import os from 'os'; import fs from 'fs';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'shotsgh'); fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const AV = 'https://127.0.0.1/v/t51/me_n.jpg';
const NAMES = ['example.anna', 'example.bruno', 'example.carla', 'example.davi', 'example.eva', 'example.felipe'];
const TRAY = NAMES.map((n, i) => ({ id: String(201 + i), reel_type: 'user_reel', latest_reel_media: 1900, seen: 0, muted: false,
  user: { pk: String(201 + i), id: String(201 + i), username: n, live_broadcast_id: null },
  items: [0, 1, 2, 3].map((k) => ({ pk: String(7000 + i * 10 + k), id: (7000 + i * 10 + k) + '_' + (201 + i), taken_at: 1000 + k * 300, product_type: 'story' })) }));
const page = `<!doctype html><html class="__fb-dark-mode"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#000;color:#f5f5f5;font:12px system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
<nav style="position:fixed;left:0;top:0;width:72px;height:100vh;border-right:1px solid #262626"></nav>
<main style="margin-left:110px;height:2000px">
  <div id="tray" style="width:630px;height:118px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;margin-top:12px;position:relative">
    <ul id="ul" style="flex:1;display:flex;gap:14px;margin:0;padding:0;list-style:none"></ul>
    <div style="position:absolute;right:6px;top:34px;width:26px;height:26px;border-radius:50%;background:#f5f5f5;color:#000;display:grid;place-items:center;font:700 15px system-ui">›</div>
  </div>
  <article style="height:420px;width:470px;margin:18px 80px;background:#121212;border-radius:4px"></article>
</main>
<script>
  document.cookie = 'ds_user_id=1; path=/';
  const TRAY = ${JSON.stringify(TRAY)};
  const REC = new Map();
  const proxy = (rec) => rec && { setValue: (v, k) => { rec[k] = v; const tr = TRAY.find((x) => 'XDTReelDict:' + x.id === rec.__id); if (tr && k === 'seen') { tr.seen = v; paintRing(tr); } },
    getValue: (k) => rec[k], getLinkedRecord: (k) => proxy(rec[k] && REC.get(rec[k].__ref)) };
  let hover = 0;
  const MODS = {
    PolarisRelayEnvironment: { getStore: () => ({ getSource: () => ({ get: (id) => REC.get(id) }) }) },
    CometRelay: {
      fetchQuery: (env, Q, vars) => ({ toPromise: async () => {
        for (const id of vars.reel_ids) {
          const t = TRAY.find((x) => x.id === id); if (!t) continue;
          const refs = t.items.map((it) => { const k = 'XDTMediaDict:' + it.id; REC.set(k, { __id: k, ...it }); return k; });
          REC.set('XDTReelDict:' + id, { __id: 'XDTReelDict:' + id, id, seen: t.seen, latest_reel_media: t.latest_reel_media, items: { __refs: refs } });
        }
        return {};
      } }),
      commitLocalUpdate: (env, fn) => fn({ get: (id) => proxy(REC.get(id)) }),
    },
    PolarisAPIReelSeen: { reelSeen: (media, reel) => new Promise((ok) => setTimeout(() => { const t = TRAY.find((x) => x.id === reel.id); if (t) { t.seen = Math.max(t.seen, media.postedAt); paintRing(t); } ok({}); }, 80)) },
  };
  window.require = (n) => { if (n === 'PolarisStoriesV3ReelPageGalleryQuery.graphql' && hover) return { kind: 'Request' }; if (n in MODS) return MODS[n]; throw new Error('unknown ' + n); };
  const ul = document.getElementById('ul');
  const trayFiber = { memoizedProps: { tray: { tray: TRAY, broadcasts: [] }, viewer: {} }, return: null };
  const rings = {};
  function paintRing(r) { const el = rings[r.id]; if (el) el.style.background = r.latest_reel_media > r.seen ? 'linear-gradient(45deg,#fa7e1e,#d62976 50%,#962fbf)' : '#3a3a3a'; }
  TRAY.forEach((r, i) => {
    const li = document.createElement('li'); li.style.cssText = 'width:72px;text-align:center';
    const b = document.createElement('div'); b.setAttribute('role', 'button'); b.style.cssText = 'width:66px;height:66px;margin:0 auto;border-radius:50%;padding:3px;box-sizing:border-box;cursor:pointer';
    b.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;border:3px solid #000;box-sizing:border-box;overflow:hidden"><img src="${AV}" style="width:100%;height:100%;object-fit:cover;filter:hue-rotate(' + (i * 55) + 'deg)"></div>';
    rings[r.id] = b; paintRing(r);
    const s = document.createElement('div'); s.textContent = r.user.username.length > 11 ? r.user.username.slice(0, 10) + '…' : r.user.username; s.style.cssText = 'margin-top:5px;color:#f5f5f5';
    const fReel = { memoizedProps: { reel: { id: r.id }, trayPosition: i }, return: { memoizedProps: {}, return: trayFiber } };
    const fItem = { memoizedProps: { isSeen: false, user: r.user, onHoverIn: () => { hover++; } }, return: fReel };
    b['__reactFiber$print'] = { memoizedProps: {}, return: fItem };
    li.appendChild(b); li.appendChild(s); ul.appendChild(li);
  });
</script></body></html>`;

const PROF = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-print-seeall-'));
const ctx = await chromium.launchPersistentContext(PROF, {
  headless: true, channel: 'chromium', viewport: { width: 900, height: 360 }, deviceScaleFactor: 2, locale: 'en-US', colorScheme: 'dark',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=en-US'],
});
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page }));
await ctx.route('https://127.0.0.1/**', (r) => (r.request().url() === AV ? r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(path.join(DIR, 'media', 'avatar-sm.jpg')) }) : r.fulfill({ status: 404, body: '' })));
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(800);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'en', ghost: true, sideBtns: false }));
const p = await ctx.newPage();
await p.goto('https://www.instagram.com/'); await wait(1500);
// o tutorial da primeira instalação pode gravar por cima: marca de novo e recarrega
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await p.reload(); await wait(2000);
const dbg = () => p.evaluate(() => window.__salvaStoriesSeeAllDebug());
let d = await dbg();
if (!d.btn) throw new Error('botão não apareceu: ' + JSON.stringify(d));
// clica e espera a rodada chegar ao meio (2ª pessoa vista, 3ª em andamento)
await p.mouse.click(d.btn.x, d.btn.y);
const end = Date.now() + 90000;
while (Date.now() < end) { d = await dbg(); if (d.run && d.run.state === 'run' && d.run.done >= 10) break; await wait(100); }
await p.mouse.move(450, 300);
await wait(350);
const file = path.join(OUT, 'salva-stories-see-all.png');
await p.screenshot({ path: file, clip: { x: 100, y: 0, width: 700, height: 150 } });
console.log('ok', file, d.text);
await ctx.close();
fs.rmSync(PROF, { recursive: true, force: true });
