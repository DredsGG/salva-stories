import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'prl-' + Date.now()), { executablePath: process.env.CHROME_PATH || undefined, headless: true,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new'] });
await ctx.route('https://www.instagram.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body>ig</body></html>' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
const p = await ctx.newPage(); await p.goto('https://www.instagram.com/'); await wait(1500);
const out = { before: await sw.evaluate(() => chrome.runtime.getManifest().version) };
// marca a aba como "ocupada" por 20 s: a recarga tem de esperar
await p.evaluate(() => { document.documentElement.dataset.ssBusy = '1'; setTimeout(() => { document.documentElement.dataset.ssBusy = '0'; }, 70000); });
const mf = path.join(EXT, 'manifest.json');
const m = JSON.parse(fs.readFileSync(mf, 'utf8')); m.version = '1.6.1'; fs.writeFileSync(mf, JSON.stringify(m, null, 2));
const t0 = Date.now(); let reloadedAt = null; out.navs = 0;
p.on('framenavigated', (f) => { if (f === p.mainFrame()) { out.navs++; if (!reloadedAt) reloadedAt = Math.round((Date.now() - t0) / 1000); } });
sw.on('close', () => { out.swClosedAtSec = Math.round((Date.now() - t0) / 1000); });
while (Date.now() - t0 < 170000) {
  const sws = ctx.serviceWorkers();
  const cur = sws[sws.length - 1];
  if (!cur || cur.url().indexOf('chrome-extension') < 0) { out.goneAtSec = out.goneAtSec || Math.round((Date.now() - t0) / 1000); break; }
  try { const v = await cur.evaluate(() => chrome.runtime.getManifest().version); if (v === '1.6.1') { out.after = v; out.secs = Math.round((Date.now() - t0) / 1000); out.upd = await cur.evaluate(() => chrome.storage.local.get('ss.update').then((r) => r['ss.update'] && r['ss.update'].acabouDeAtualizar)); break; } } catch (e) { out.err = String(e.message).slice(0, 80); }
  await wait(2000);
}
await wait(3000);
out.tabReloadedAtSec = reloadedAt;
console.log(JSON.stringify(out, null, 1));
await ctx.close();
