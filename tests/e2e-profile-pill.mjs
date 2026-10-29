// v1.8.12: botão "Baixar perfil" quando você já segue a pessoa. O Instagram mostra embaixo o carrossel "Sugestões para
// você" com vários "Seguir" (que vai além da tela); o botão tem de ficar na linha de cima (Seguindo / Enviar mensagem),
// e não ir parar no canto da direita (print do André de 29/10/2026).
// Uso: node e2e-profile-pill.mjs $PWD/ext-test
import { chromium } from 'playwright';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(new URL(import.meta.url).pathname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const card = (i) => `<li style="list-style:none;flex:0 0 138px;height:200px;border:1px solid #333;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:end;padding-bottom:12px"><span>pessoa${i}</span><button style="width:114px;height:30px;background:#4a5df9;color:#fff;border:0;border-radius:8px">Seguir</button></li>`;
const page = (following) => `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#0c1014;color:#fff;font:14px sans-serif">
<main style="padding:0 0 0 335px"><header style="width:615px;padding-top:10px">
 <section style="display:flex;gap:24px"><div style="width:134px;height:134px;border-radius:50%;background:#555"></div><div><h2 style="margin:0">a_pessoa</h2><div>8 posts · 1.324 seguidores</div></div></section>
 <div style="display:flex;gap:8px;margin-top:24px">${following ? '<button style="width:266px;height:40px">Seguindo</button><button style="width:291px;height:40px">Enviar mensagem</button><button style="width:40px;height:40px">+</button>' : '<button style="width:266px;height:40px">Seguir</button><button style="width:291px;height:40px">Enviar mensagem</button>'}</div>
 ${following ? `<div style="margin-top:40px"><b>Sugestões para você</b><div style="overflow:hidden;width:615px;margin-top:12px"><ul style="display:flex;gap:10px;margin:0;padding:0;width:max-content">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(card).join('')}</ul></div></div>` : ''}
</header><div style="height:1200px"></div></main></body></html>`;
const ctx = await chromium.launchPersistentContext(path.join(DIR, 'ppill-' + Date.now()), {
  headless: true, channel: 'chromium', viewport: { width: 2000, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR'],
});
await ctx.route('https://www.instagram.com/**', (r) => { const u = new URL(r.request().url()); return r.fulfill({ status: 200, contentType: 'text/html', body: page(u.pathname.startsWith('/a_pessoa')) }); });
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(1000);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
const p = await ctx.newPage();
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const st = () => p.evaluate(() => { const d = window.__salvaStoriesProfileDebug(); const bs = [...document.querySelectorAll('header button')].slice(0, 3).map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent, right: Math.round(r.right), top: Math.round(r.top), h: Math.round(r.height) }; }); return { pill: d.at && d.at.pill, bs }; });
await p.goto('https://www.instagram.com/b_pessoa/'); await wait(1500);
let s = await st();
check('sem seguir: botão na linha de Seguir / Enviar mensagem', s.pill && Math.abs(s.pill.y - (s.bs[0].top + s.bs[0].h / 2)) <= 3 && s.pill.x > s.bs[1].right && s.pill.x < s.bs[1].right + 120, s);
await p.goto('https://www.instagram.com/a_pessoa/'); await wait(1500);
s = await st();
check('seguindo (com sugestões embaixo): botão na linha de cima, ao lado de "+"', s.pill && Math.abs(s.pill.y - (s.bs[0].top + s.bs[0].h / 2)) <= 3 && s.pill.x > s.bs[2].right && s.pill.x < s.bs[2].right + 120, s);
await p.screenshot({ path: path.join(DIR, 'shots-feed', 'profile-pill.png') });
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
await ctx.close(); process.exit(ok ? 0 : 1);
