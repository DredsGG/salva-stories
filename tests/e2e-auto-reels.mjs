// Auto Reels (v1.10.0): no Reels, quando o reel acaba, passa sozinho para o próximo, pelo botão do próprio Instagram.
// O Reels simulado imita o medido ao vivo em 11/11/2026: o <video> não tem loop; no fim sai pause → ended e o "Instagram" volta ao 0 e toca;
// o caminho para o próximo é div[role=button][aria-label="Navegar para o próximo reel"], que rola o contêiner (scroll-snap).
// Cobre: desligado não passa; ligado passa no fim de cada volta, um por vez; pausado (do Instagram e pelo nosso botão) não passa; diálogo
// (comentários) aberto não passa; campo de texto com foco não passa; mouse na barra do player não passa; aba escondida não passa; foto
// passa em ~8 s; sem botão de próximo não passa e registra (3 idiomas); em /reel/<código> e fora do Reels nada acontece; o botão Auto e
// a chave do menu são o mesmo ajuste (sincronizados e salvos); o som continua ligado ao passar.
// Uso: node e2e-auto-reels.mjs $PWD/ext-test   (precisa de media/short.webm; leva uns 3 min)
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WEBM = fs.readFileSync(path.join(DIR, 'media', 'short.webm')); // 3 s: cada volta dura 3 s
const R = {}; let ok = true;
const check = (name, cond, info) => { R[name] = cond ? 'ok' : ['FALHOU', info]; if (!cond) ok = false; };

const reel = (i, photo) => `<div class="rl" style="height:100vh;display:grid;place-items:center;scroll-snap-align:start"><div style="position:relative;width:480px;height:800px">
  ${photo ? `<img id="v${i}" src="/p${i}.png" style="width:480px;height:800px;background:#345;display:block">` : `<video id="v${i}" src="/v.webm?${i}" muted autoplay playsinline style="width:480px;height:800px;background:#234;display:block"></video>`}
  <div role="button" class="snd" style="position:absolute;right:12px;top:12px;width:28px;height:28px;border-radius:50%;background:#0008;cursor:pointer"><svg aria-label="O áudio está silenciado" width="16" height="16"></svg></div></div></div>`;
const page = (photo, nobtn) => `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000">
<div id="sc" style="position:fixed;inset:0;overflow-y:scroll;scroll-snap-type:y mandatory">${[1, 2, 3].map((i) => reel(i, photo)).join('')}</div>
${nobtn ? '' : '<div id="nx" role="button" aria-label="Navegar para o próximo reel" style="position:fixed;right:40px;top:50%;width:44px;height:44px;background:#555;border-radius:50%;cursor:pointer"></div>'}
<div id="pv" role="button" aria-label="Navegar para o reel anterior" style="position:fixed;right:40px;top:44%;width:44px;height:44px;background:#555;border-radius:50%"></div>
<input id="txt" style="position:fixed;left:10px;bottom:10px;width:200px">
<script>
  window.igMuted = true; window.nextClicks = 0; window.laps = 0;
  const sc = document.getElementById('sc');
  const activeV = () => [...document.querySelectorAll('video, img[id^=v]')].find((v) => { const r = v.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
  window.activeIdx = () => { const v = activeV(); return v ? Number(v.id.slice(1)) : 0; };
  const label = () => document.querySelectorAll('.snd svg').forEach((s) => s.setAttribute('aria-label', igMuted ? 'O áudio está silenciado' : 'O áudio está em reprodução'));
  document.querySelectorAll('.snd').forEach((b) => b.addEventListener('click', () => { igMuted = !igMuted; const v = activeV(); if (v && v.tagName === 'VIDEO') v.muted = igMuted; label(); }));
  const nx = document.getElementById('nx'); if (nx) nx.addEventListener('click', () => { window.nextClicks++; sc.scrollTo(0, sc.scrollTop + innerHeight); });
  document.querySelectorAll('video').forEach((v) => v.addEventListener('ended', () => { if (v === activeV()) window.laps++; v.currentTime = 0; v.play().catch(() => {}); })); // como o Instagram: volta ao 0 e toca
  let last = null;
  setInterval(() => { const v = activeV(); if (v && v !== last) { last = v; if (v.tagName === 'VIDEO') { v.currentTime = 0; v.muted = igMuted; v.play().catch(() => {}); } label(); if (!location.search.includes('keepurl')) history.replaceState(null, '', '/reels/r' + v.id.slice(1) + '/'); } }, 100);
  window.openDialog = () => { const d = document.createElement('div'); d.setAttribute('role', 'dialog'); d.id = 'dlg'; d.style.cssText = 'position:fixed;right:0;top:0;width:360px;height:100vh;background:#222'; document.body.appendChild(d); };
  window.closeDialog = () => { const d = document.getElementById('dlg'); if (d) d.remove(); };
</script></body></html>`;

async function abrir(pages) {
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'pauto-' + Date.now()), {
    headless: true, channel: 'chromium', viewport: { width: 1300, height: 900 },
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--autoplay-policy=no-user-gesture-required'],
  });
  await ctx.route('https://www.instagram.com/**', (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === '/v.webm') return r.fulfill({ status: 200, contentType: 'video/webm', body: WEBM });
    if (/^\/p\d\.png$/.test(u.pathname)) return r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
    const key = u.search.includes('photo') ? 'photo' : u.search.includes('nobtn') ? 'nobtn' : 'base';
    return r.fulfill({ status: 200, contentType: 'text/html', body: pages[key] });
  });
  await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await wait(1200);
  await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
  const p = await ctx.newPage();
  const st = () => p.evaluate(() => ({ idx: window.activeIdx(), next: window.nextClicks, laps: window.laps, path: location.pathname }));
  const setAuto = (on) => sw.evaluate((on) => chrome.storage.sync.set({ autoReels: on }), on);
  const pd = () => p.evaluate(() => window.__salvaStoriesPlayerDebug());
  return { ctx, sw, p, st, setAuto, pd };
}
const PAGES = { base: page(false, false), photo: page(true, false), nobtn: page(false, true) };

// ───────── 1) desligado não passa; ligado passa por volta, um por vez; som continua ─────────
{
  const { ctx, sw, p, st, setAuto } = await abrir(PAGES);
  await p.goto('https://www.instagram.com/reels/r1/'); await wait(1500);
  await p.mouse.click(640, 300); await wait(1500); // um clique na página: o som liga (Som ligado no Reels)
  const dflt = await sw.evaluate(() => chrome.storage.sync.get('autoReels'));
  check('padrão: Auto Reels vem DESLIGADO', dflt.autoReels === false || dflt.autoReels === undefined, dflt);
  await wait(7000); // duas voltas
  let s = await st();
  check('desligado: passa de 2 voltas sem mudar de reel e sem clicar em próximo', s.idx === 1 && s.next === 0 && s.laps >= 2, s);
  await setAuto(true); await wait(500);
  const t0 = Date.now();
  const trace = [];
  while (Date.now() - t0 < 10500) { const x = await st(); trace.push({ t: Date.now() - t0, ...x }); await wait(150); }
  s = await st();
  const clicksSeen = [...new Set(trace.map((x) => x.next))];
  check('ligado: passou de um em um (reel 1 → 2 → 3), sem pular', trace.every((x, i) => i === 0 || x.idx - trace[i - 1].idx <= 1) && s.idx === 3, trace.filter((x, i) => i === 0 || x.idx !== trace[i - 1].idx));
  check('ligado: um clique em próximo por volta, nunca dois de uma vez', s.next >= 2 && s.next <= s.laps && clicksSeen.every((c, i) => i === 0 || c - clicksSeen[i - 1] === 1), { next: s.next, laps: s.laps, clicksSeen });
  const snd = await p.evaluate(() => { const v = window.activeIdx(); const el = document.getElementById('v' + v); return { muted: el.muted, igMuted: window.igMuted }; });
  check('Som ligado no Reels: o som continua ligado no reel que entrou', snd.muted === false && snd.igMuted === false, snd);
  await ctx.close();
}

// ───────── 2) pausado, diálogo, campo de texto, mouse na barra, aba escondida: não passa ─────────
{
  const { ctx, sw, p, st, setAuto, pd } = await abrir(PAGES);
  await p.goto('https://www.instagram.com/reels/r1/'); await wait(1500);
  await p.mouse.click(640, 300); await setAuto(true); await wait(800);
  const idle = async (ms) => { const a = await st(); await wait(ms); const b = await st(); return { a, b, moved: b.idx !== a.idx || b.next !== a.next }; };
  const avanca = async (ms = 5200) => { const a = await st(); const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await st()).idx > a.idx) return true; await wait(150); } return false; };
  // volta ao reel 1 e recomeça do 0: sem zerar, o reel 1 podia acabar (e passar, certo) antes do passo seguinte começar (corrida vista em 12/11/2026)
  const volta = async () => { await p.evaluate(() => { const sc = document.getElementById('sc'); sc.scrollTo(0, 0); document.getElementById('v1').currentTime = 0; }); await wait(900); };

  // pausado pelo Instagram
  await p.evaluate(() => document.getElementById('v1').pause());
  let r = await idle(7000);
  check('pausado (pelo Instagram): não passa em 7 s', !r.moved && r.b.idx === 1, r);
  await p.evaluate(() => document.getElementById('v1').play());
  check('despausou: volta a passar no fim da volta', await avanca(), await st());
  await volta(); await wait(1200);

  // pausado pelo nosso botão (a pausa que segura)
  await p.mouse.move(640, 400); await wait(500); await p.mouse.move(650, 420); await wait(600);
  let d = await pd();
  check('a barra do player mostra o botão Auto no Reels', !!d.autoBtn && d.autoHidden === false, d);
  // volta ao reel 1, do 0, logo antes do clique: do volta() de cima até aqui passam ~3,7 s, mais que uma volta de 3 s, e o
  // reel 1 podia acabar e passar antes da pausa (vista na 2ª rodada da suíte em 12/11/2026). Confere que está no reel 1
  // antes de clicar; o clique cai ~1,5 s dentro da volta.
  for (let k = 0; k < 3; k++) { await volta(); if ((await st()).idx === 1) break; }
  await p.mouse.move(640, 400); await wait(250); await p.mouse.move(645, 410); await wait(300); d = await pd();
  const dBefore = d; await p.mouse.click(d.at.pp.x, d.at.pp.y); await wait(500);
  const afterClick = await p.evaluate(() => ({ v1paused: document.getElementById('v1').paused, idx: window.activeIdx(), pd: window.__salvaStoriesPlayerDebug().cur }));
  await p.mouse.move(900, 100); await wait(3000); // mouse fora, a barra some
  r = await idle(7000);
  const held = await p.evaluate(() => document.getElementById('v1').paused);
  check('pausado (pela pausa que segura do player): não passa em 7 s', held && !r.moved && r.b.idx === 1, { held, r, afterClick, pp: dBefore.at && dBefore.at.pp, shown: dBefore.shown });
  d = await pd(); await p.mouse.move(640, 400); await wait(400); d = await pd();
  await p.mouse.click(d.at.pp.x, d.at.pp.y); await wait(600); // despausa
  await p.mouse.move(900, 100);

  // comentários (diálogo) abertos. O diálogo abre ANTES do volta(): voltar o vídeo ao 0 com ele tocando conta como fim de
  // volta (é assim que o Instagram repete o reel), e o Auto Reels passava antes de o diálogo abrir (12/11/2026)
  await p.evaluate(() => window.openDialog());
  for (let k = 0; k < 3; k++) { await volta(); if ((await st()).idx === 1) break; }
  await wait(500);
  r = await idle(7000);
  check('diálogo (comentários) aberto: não passa em 7 s', !r.moved && r.b.idx === 1, r);
  await p.evaluate(() => window.closeDialog());
  check('diálogo fechado: volta a passar', await avanca(), await st());
  await volta(); await wait(500);

  // campo de texto com foco
  await p.evaluate(() => document.getElementById('txt').focus());
  r = await idle(7000);
  check('campo de texto com foco: não passa em 7 s', !r.moved && r.b.idx === 1, r);
  await p.evaluate(() => document.getElementById('txt').blur());
  check('campo sem foco: volta a passar', await avanca(), await st());
  await volta(); await wait(500);

  // mouse em cima da barra do player
  await p.mouse.move(640, 400); await wait(400); await p.mouse.move(650, 410); await wait(500);
  d = await pd();
  await p.mouse.move(d.at.fwd.x, d.at.fwd.y, { steps: 3 });
  const a0 = await st(); const t0 = Date.now(); let moved = false;
  while (Date.now() - t0 < 7000) { await p.mouse.move(d.at.fwd.x + (Date.now() % 2), d.at.fwd.y); if ((await st()).idx !== a0.idx) { moved = true; break; } await wait(250); }
  check('mouse em cima da barra do player: não passa em 7 s', !moved, await st());
  await p.mouse.move(900, 100);
  check('mouse fora da barra: volta a passar', await avanca(), await st());
  await volta(); await wait(500);

  // aba escondida
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  r = await idle(7000);
  check('aba escondida: não passa em 7 s', !r.moved && r.b.idx === 1, r);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  check('aba de volta: volta a passar', await avanca(), await st());
  await ctx.close();
}

// ───────── 3) foto passa em ~8 s; sem botão de próximo não passa e registra ─────────
{
  const { ctx, p, st, setAuto } = await abrir(PAGES);
  await setAuto(true);
  const t0 = Date.now(); let t1 = null;
  await p.goto('https://www.instagram.com/reels/r1/?photo=1'); await wait(1800);
  while (Date.now() - t0 < 14000) { if ((await st()).next >= 1) { t1 = Date.now() - t0; break; } await wait(150); }
  check('foto: passa depois de ~8 s contados da abertura (entre 7,5 e 10,5 s)', t1 !== null && t1 >= 7500 && t1 <= 10500, t1);
  await ctx.close();
}
{
  const { ctx, p, st, setAuto } = await abrir(PAGES);
  await setAuto(true);
  await p.goto('https://www.instagram.com/reels/r1/?nobtn=1'); await wait(1800);
  await wait(9500); // 3 voltas
  const s = await st();
  const logs = await p.evaluate(() => window[Symbol.for('salvaStories.api')].logs().map((l) => l.msg).filter((m) => m && typeof m === 'object' && /auto reels/i.test(m.pt)));
  check('sem botão de próximo: não passa (nem rola a página por conta própria)', s.idx === 1 && s.next === 0 && (await p.evaluate(() => document.getElementById('sc').scrollTop)) === 0, s);
  check('sem botão de próximo: registra o motivo uma vez, nos 3 idiomas', logs.length === 1 && /não achei/.test(logs[0].pt) && /couldn't find/.test(logs[0].en) && /no encontré/.test(logs[0].es), logs);
  await ctx.close();
}

// ───────── 4) fora do /reels/ nada acontece ─────────
{
  const { ctx, p, st, setAuto } = await abrir(PAGES);
  await setAuto(true);
  for (const [url, nome] of [['https://www.instagram.com/reel/AAAA/?keepurl=1', '/reel/<código> aberto sozinho'], ['https://www.instagram.com/explore/?keepurl=1', 'fora do Reels (feed/explorar)']]) {
    await p.goto(url); await wait(1800);
    await wait(7000);
    const s = await st();
    check(`${nome}: nada acontece em 7 s (2 voltas)`, s.next === 0 && s.laps >= 2 && s.idx === 1 && s.path === new URL(url).pathname, s);
  }
  await ctx.close();
}

// ───────── 5) o botão Auto e a chave do menu são o mesmo ajuste (sincronizados e salvos) ─────────
{
  const { ctx, sw, p, setAuto, pd } = await abrir(PAGES);
  await p.goto('https://www.instagram.com/reels/r1/'); await wait(1500);
  const sync = () => sw.evaluate(() => chrome.storage.sync.get('autoReels')).then((x) => x.autoReels);
  const menuS = () => p.evaluate(() => window.__salvaStoriesMenuDebug().S.autoReels);
  const bar = async () => { await p.mouse.move(640, 400); await wait(300); await p.mouse.move(652, 412); await wait(500); return pd(); };
  let d = await bar();
  check('botão Auto: apagado no começo (desligado), balão em português', d.autoOn === false && /desligado/.test(d.autoTitle), d);
  await p.mouse.click(d.autoBtn.x, d.autoBtn.y); await wait(700);
  d = await pd();
  check('clique no botão liga na hora: aceso, salvo e a chave do menu junto', d.autoOn === true && (await sync()) === true && (await menuS()) === true && /ligado/.test(d.autoTitle), { d, s: await sync(), m: await menuS() });
  await p.reload(); await wait(1800); d = await bar();
  check('depois de recarregar a página continua ligado (salvo)', d.autoOn === true && (await menuS()) === true, d);
  await setAuto(false); await wait(700); d = await bar();
  check('a chave do menu desliga: o botão apaga junto', d.autoOn === false && (await menuS()) === false, d);
  await p.mouse.click(d.autoBtn.x, d.autoBtn.y); await wait(500);
  await p.mouse.click(d.autoBtn.x, d.autoBtn.y); await wait(700);
  d = await pd();
  check('ligar e desligar pelo botão na hora, sem demora', d.autoOn === false && (await sync()) === false, d);
  // balão nos 3 idiomas
  for (const [lang, on, off] of [['en', /Auto Reels off/, /on:/], ['es', /Auto Reels desactivado/, /activado/]]) {
    await sw.evaluate((l) => chrome.storage.sync.set({ lang: l }), lang); await wait(600);
    await p.reload(); await wait(1800); d = await bar();
    check(`balão do botão Auto em ${lang}`, on.test(d.autoTitle), d.autoTitle);
  }
  // fora do Reels o botão não aparece
  await p.goto('https://www.instagram.com/explore/?keepurl=1'); await wait(1500);
  await p.mouse.move(640, 400); await wait(300); await p.mouse.move(652, 412); await wait(500);
  d = await pd();
  check('fora de /reels/ o botão Auto fica escondido', d.autoHidden !== false, d);
  await ctx.close();
}

console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
