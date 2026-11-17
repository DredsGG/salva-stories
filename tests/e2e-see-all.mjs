// v1.13.0: botão "Ver todos" da bandeja de stories. Página inicial simulada com a bandeja como a real (medida em 17/11/2026):
// fibra do React com PolarisStoriesV3TrayReelItem (reel, trayPosition), PolarisStoriesV3TrayItem (onHoverIn, user) e
// PolarisStoriesV3Tray (tray, viewer); `require` do Instagram simulado com CometRelay, PolarisRelayEnvironment,
// PolarisStoriesV3ReelPageGalleryQuery.graphql (só existe depois do onHoverIn, como na real) e PolarisAPIReelSeen.reelSeen,
// que manda o aviso por XHR de verdade para /api/graphql (passa pelo modo fantasma da extensão). O "servidor" (rota do
// Playwright) registra cada aviso que chegou, guarda o que foi visto e devolve a bandeja de acordo na próxima carga.
// Uso: node e2e-see-all.mjs $PWD/ext-test
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import path from 'path'; import os from 'os'; import fs from 'fs';
const EXT = process.argv[2];
const DIR = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ME = '999';

// bandeja: 3 pessoas com story não visto (5 stories), mais o que tem de ser pulado
const REELS = [
  { id: '101', name: 'ana.teste', items: [[5001, 1000], [5002, 1100]], seen: 0 },
  { id: '102', name: 'bruno.teste', items: [[5101, 1000], [5102, 1200], [5103, 1300]], seen: 1000 }, // o 1º já visto
  { id: '103', name: 'carla.live', items: [[5201, 1000]], seen: 0, live: true }, // live: pula
  { id: '104', name: 'davi.visto', items: [[5301, 1000]], seen: 1000 }, // já visto: pula
  { id: '105', name: 'anuncio', items: [[5401, 1000]], seen: 0, type: 'ad' }, // anúncio: pula
  { id: '106', name: 'eva.teste', items: [[5501, 1400], [5502, 1500, 'ad']], seen: 0 }, // 1 story + 1 item de anúncio (pula)
  { id: ME, name: 'eu.mesmo', items: [[5601, 1000]], seen: 0 }, // o próprio: pula
];
const ORDER = ['5001', '5002', '5102', '5103', '5501'];
const server = { marked: new Map(), posts: [], mode: 'ok', allSeen: false };
function trayState() {
  return REELS.map((r) => {
    const latest = Math.max(...r.items.filter((i) => i[2] !== 'ad').map((i) => i[1]));
    const seen = server.allSeen ? latest : Math.max(r.seen, server.marked.get(r.id) || 0);
    return { id: r.id, reel_type: r.type || 'user_reel', latest_reel_media: latest, seen, muted: false,
      user: { pk: r.id, id: r.id, username: r.name, live_broadcast_id: r.live ? 'L1' : null },
      items: r.items.map(([pk, ts, kind]) => ({ pk: String(pk), id: pk + '_' + r.id, taken_at: ts, product_type: kind === 'ad' ? 'ad' : 'story' })) };
  });
}
const pageHtml = () => `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#fff;font:14px sans-serif">
<nav style="position:fixed;left:0;top:0;width:72px;height:100vh"></nav>
<main style="margin-left:300px;height:3000px">
  <div id="tray" style="width:630px;height:124px;display:flex;align-items:center;gap:8px;padding:0 8px;box-sizing:border-box;margin-top:16px">
    <ul id="ul" style="display:flex;gap:8px;margin:0;padding:0;list-style:none"></ul>
  </div>
  <article style="height:600px;width:470px;margin:20px 80px;background:#222"></article>
</main>
<script>
  document.cookie = 'ds_user_id=${ME}; path=/';
  const TRAY = ${JSON.stringify(trayState())};
  window.__fetches = 0; window.__hover = 0;
  // ── store do Relay simulado ──
  const REC = new Map();
  const relay = {
    getStore: () => ({ getSource: () => ({ get: (id) => REC.get(id) }) }),
  };
  const proxy = (rec) => rec && { setValue: (v, k) => { rec[k] = v; const tr = TRAY.find((x) => 'XDTReelDict:' + x.id === rec.__id); if (tr && k === 'seen') tr.seen = v; },
    getValue: (k) => rec[k], getLinkedRecord: (k) => proxy(rec[k] && REC.get(rec[k].__ref)) };
  const MODS = {
    PolarisRelayEnvironment: relay,
    CometRelay: {
      fetchQuery: (env, Q, vars) => ({ toPromise: async () => {
        window.__fetches++; window.__lastVars = vars;
        await new Promise((r) => setTimeout(r, 60));
        for (const id of vars.reel_ids) {
          const t = TRAY.find((x) => x.id === id); if (!t) continue;
          const refs = t.items.map((it) => { const k = 'XDTMediaDict:' + it.id; REC.set(k, { __id: k, ...it }); return k; });
          REC.set('XDTUserDict:' + id, { __id: 'XDTUserDict:' + id, username: t.user.username, reel_media_seen_timestamp: t.seen });
          REC.set('XDTReelDict:' + id, { __id: 'XDTReelDict:' + id, id, seen: t.seen, latest_reel_media: t.latest_reel_media, user: { __ref: 'XDTUserDict:' + id }, items: { __refs: refs } });
        }
        return { __fragments: {} };
      } }),
      commitLocalUpdate: (env, fn) => fn({ get: (id) => proxy(REC.get(id)) }),
    },
    PolarisAPIReelSeen: {
      // como a do Instagram: commitMutation da PolarisAPIReelSeenMutation, por XHR; rejeita com o erro do GraphQL
      reelSeen: (media, reel) => new Promise((ok, fail) => {
        const vars = { reelId: reel.id, reelMediaId: media.id, reelMediaOwnerId: media.owner.id, reelMediaTakenAt: media.postedAt, viewSeenAt: Math.floor(Date.now() / 1000) };
        const x = new XMLHttpRequest();
        x.open('POST', '/api/graphql');
        x.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        x.onload = () => { try { const j = JSON.parse(x.responseText); if (j.errors) fail(Object.assign(new Error(j.errors[0].message), { source: j })); else ok({}); } catch (e) { fail(e); } };
        x.onerror = () => fail(new Error('network'));
        x.send('fb_api_req_friendly_name=PolarisAPIReelSeenMutation&doc_id=36133297086317984&variables=' + encodeURIComponent(JSON.stringify(vars)));
      }),
    },
  };
  window.require = (n) => { if (n === 'PolarisStoriesV3ReelPageGalleryQuery.graphql' && window.__hover) return { kind: 'Request' }; if (n in MODS) return MODS[n]; throw new Error('Requiring unknown module "' + n + '"'); };
  // "story aberto na mão": o visualizador manda a PolarisStoriesV3SeenMutation (o fantasma tem de segurar)
  window.__openStory = (pk) => { const x = new XMLHttpRequest(); x.open('POST', '/api/graphql');
    x.send('fb_api_req_friendly_name=PolarisStoriesV3SeenMutation&variables=' + encodeURIComponent(JSON.stringify({ reelId: '101', reelMediaId: String(pk), reelMediaOwnerId: '101', reelMediaTakenAt: 1, viewSeenAt: 2 }))); };
  // ── bandeja com fibras ──
  const ul = document.getElementById('ul');
  const trayFiber = { memoizedProps: { tray: { tray: TRAY, broadcasts: [] }, viewer: {} }, return: null };
  TRAY.forEach((r, i) => {
    const li = document.createElement('li');
    const b = document.createElement('div'); b.setAttribute('role', 'button');
    b.style.cssText = 'width:66px;height:90px;background:' + (r.latest_reel_media > r.seen ? '#d62976' : '#555') + ';border-radius:8px';
    b.setAttribute('aria-label', 'Story de ' + r.user.username + (r.latest_reel_media > r.seen ? ', não visto' : ', visto'));
    const fReel = { memoizedProps: { reel: { id: r.id }, trayPosition: i }, return: { memoizedProps: { fallback: null }, return: trayFiber } };
    const fItem = { memoizedProps: { isSeen: r.latest_reel_media <= r.seen, user: r.user, onHoverIn: () => { window.__hover++; } }, return: fReel };
    b['__reactFiber$test'] = { memoizedProps: { 'aria-label': 'x' }, return: fItem };
    li.appendChild(b); ul.appendChild(li);
  });
</script></body></html>`;

const PROF = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-seeall-'));
const ctx = await chromium.launchPersistentContext(PROF, {
  headless: true, channel: 'chromium', viewport: { width: 1400, height: 900 }, locale: 'pt-BR',
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new', '--lang=pt-BR', '--mute-audio'],
});
await ctx.route('https://www.instagram.com/**', async (r) => {
  const req = r.request(); const u = new URL(req.url());
  if (req.method() === 'POST' && u.pathname === '/api/graphql') {
    const body = req.postData() || '';
    const sp = new URLSearchParams(body); let vars = {}; try { vars = JSON.parse(sp.get('variables') || '{}'); } catch (_) {}
    server.posts.push({ t: Date.now(), name: sp.get('fb_api_req_friendly_name'), pk: vars.reelMediaId, reel: vars.reelId });
    if (sp.get('fb_api_req_friendly_name') === 'PolarisAPIReelSeenMutation') {
      if (server.mode === 'block') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ errors: [{ message: 'feedback_required', summary: 'Tente novamente mais tarde' }] }) });
      const it = REELS.find((x) => x.id === vars.reelId);
      if (it) server.marked.set(it.id, Math.max(server.marked.get(it.id) || 0, Number(vars.reelMediaTakenAt) || 0));
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{"xdt_mark_story_reel_seen":{"__typename":"XDTMarkSeenResponse"}}}' });
    }
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
  }
  return r.fulfill({ status: 200, contentType: 'text/html', body: pageHtml() });
});
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '' }));
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
await wait(800);
await sw.evaluate(() => chrome.storage.local.set({ 'ss.onboard': { tutorial: 'visto', visto: chrome.runtime.getManifest().version } }));
await sw.evaluate(() => chrome.storage.sync.set({ lang: 'pt', ghost: true }));
const p = await ctx.newPage();
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
const dbg = () => p.evaluate(() => window.__salvaStoriesSeeAllDebug && window.__salvaStoriesSeeAllDebug());
const until = async (fn, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn(); if (v) return v; await wait(150); } return null; };
const seenPosts = () => server.posts.filter((x) => x.name === 'PolarisAPIReelSeenMutation');
const reset = () => { server.marked.clear(); server.posts.length = 0; server.mode = 'ok'; server.allSeen = false; };
const clickBtn = async () => { const d = await dbg(); await p.mouse.click(d.btn.x, d.btn.y); };
const logs = () => p.evaluate(() => window[Symbol.for('salvaStories.api')].logs().map((l) => l.msg));
const busyNow = () => p.evaluate(() => document.documentElement.dataset.ssBusy || '0');

// 1) sem story não visto: o botão não aparece
server.allSeen = true;
await p.goto('https://www.instagram.com/'); await wait(1500);
let d = await dbg();
check('sem story não visto: o botão não aparece', d && !d.btn && d.unseen === 0, d);
reset();

// 2) com story não visto: aparece ao lado da bandeja (depois da ponta direita), na página inicial só
await p.goto('https://www.instagram.com/'); await wait(1500);
d = await dbg();
check('com story não visto: o botão aparece logo depois da bandeja', d.btn && d.tray && d.btn.left >= d.tray.right && d.btn.left - d.tray.right <= 16 && Math.abs(d.btn.y - (d.tray.top + d.tray.bottom) / 2) <= 3 && d.unseen === 3, d);
check('balão em português', /Ver todos os stories/.test(d.tip) && /um por vez/.test(d.tip), d.tip);
check('o módulo da consulta ainda não existe antes do clique (como na página real)', d.hasQuery === false, d);
await p.evaluate(() => history.pushState({}, '', '/explore/')); await wait(700);
check('fora da página inicial o botão some', !(await dbg()).btn, await dbg());
await p.evaluate(() => history.pushState({}, '', '/')); await wait(700);

// 3) rodada inteira: um aviso por story, na ordem, com ritmo; pula o que tem de pular; fantasma segura o resto
const busyDuring = [];
await clickBtn();
const texts = new Set();
let opened = false;
const t0 = Date.now();
await until(async () => {
  const x = await dbg(); if (x.text) texts.add(x.text); busyDuring.push(await busyNow());
  if (!opened && seenPosts().length >= 1) { opened = true; await p.evaluate(() => window.__openStory('5002')); await p.evaluate(() => window.__openStory('777')); }
  return seenPosts().length >= 5 && !x.run;
}, 60000);
const got = seenPosts();
check('manda um aviso por story, na ordem da bandeja (5 stories de 3 pessoas)', JSON.stringify(got.map((x) => x.pk)) === JSON.stringify(ORDER), got.map((x) => x.pk));
const gaps = got.slice(1).map((x, i) => x.t - got[i].t);
check('nunca dois avisos em menos de ~0,8 s', gaps.every((g) => g >= 800), gaps);
check('pausa maior entre uma pessoa e outra', gaps[1] > gaps[0] && gaps[3] > gaps[2], gaps);
check('pula live, anúncio, o que já foi visto e o próprio story', !server.posts.some((x) => ['5201', '5301', '5401', '5502', '5101', '5601'].includes(String(x.pk)) && x.name === 'PolarisAPIReelSeenMutation'), server.posts);
check('fantasma ligado: o "visto" de um story aberto na mão não sai durante a rodada', !server.posts.some((x) => x.name === 'PolarisStoriesV3SeenMutation'), server.posts.map((x) => x.name));
check('a página pré-carregou o visualizador pelo onHoverIn do item (sem abrir story)', (await p.evaluate(() => window.__hover)) >= 1 && (await p.evaluate(() => window.__fetches)) === 1, await p.evaluate(() => ({ h: window.__hover, f: window.__fetches, v: window.__lastVars })));
check('a barrinha mostrou "N/5 · nome" durante a rodada', [...texts].some((x) => /^\d\/5 ?· (ana|bruno|eva)\.teste$/.test(x)), [...texts]);
check('data-ss-busy 1 durante a rodada', busyDuring.slice(2, -3).includes('1'), busyDuring.slice(0, 12));
d = await dbg();
check('no fim: "Todos vistos" e data-ss-busy 0', d.text === 'Todos vistos' && d.busy === '0' && d.passOpen === 0, d);
await wait(4600);
d = await dbg();
check('depois de uns segundos o botão some (nada mais para ver)', !d.btn && d.unseen === 0, d);
const L1 = await logs();
check('registro: início e fim nos 3 idiomas, frase inteira', L1.some((m) => m.pt === 'Ver todos: começou a marcar 5 stories de 3 pessoas como vistos.' && m.en === 'See all: started marking 5 stories from 3 people as seen.' && m.es === 'Ver todas: empezó a marcar 5 historias de 3 personas como vistas.')
  && L1.some((m) => m.pt === 'Ver todos: terminou, 5 stories de 3 pessoas marcados como vistos.' && /^See all: finished, 5 stories from 3 people/.test(m.en) && /^Ver todas: terminó, 5 historias de 3 personas/.test(m.es)), L1.slice(-4));
await p.evaluate(() => window.__openStory('5001')); await wait(600);
check('depois da rodada o fantasma continua segurando o "visto"', !server.posts.some((x) => x.name === 'PolarisStoriesV3SeenMutation'), server.posts.slice(-2));
console.log('tempo da rodada:', ((Date.now() - t0) / 1000).toFixed(1), 's; intervalos (ms):', gaps.join(', '));

// 4) bloqueio (feedback_required): para na hora e avisa
reset(); server.mode = 'block';
await p.goto('https://www.instagram.com/'); await wait(1500);
await clickBtn();
await until(async () => seenPosts().length >= 1 && !(await dbg()).run, 20000);
await wait(2500);
d = await dbg();
check('bloqueio: para no primeiro aviso, sem insistir', seenPosts().length === 1 && !d.run, { n: seenPosts().length, d });
check('bloqueio: avisa na tela e libera a aba', /bloqueio de ação/.test(d.toast) && d.busy === '0', d);
check('bloqueio: registra a parada com o motivo', (await logs()).some((m) => m.pt === 'Ver todos: parou em 0 de 5 stories (bloqueio de ação do Instagram).' && m.es === 'Ver todas: se detuvo en 0 de 5 historias (bloqueo de acción de Instagram).'), (await logs()).slice(-3));

// 5) recarregar no meio: "Continuar (N/M)" e segue de onde parou
reset();
await p.goto('https://www.instagram.com/'); await wait(1500);
await clickBtn();
await until(async () => seenPosts().length >= 2, 30000);
await p.goto('https://www.instagram.com/'); await wait(2000);
const before = seenPosts().map((x) => x.pk);
d = await dbg();
check('recarregou no meio: o botão vira "Continuar (2/5)"', before.length === 2 && d.btn && d.text === 'Continuar (2/5)' && /Continuar \(2\/5\)/.test(d.aria), { before, d });
await clickBtn();
await until(async () => !(await dbg()).run && seenPosts().length >= 5, 40000);
const after = seenPosts().map((x) => x.pk);
check('continuou de onde parou, sem repetir', JSON.stringify(after) === JSON.stringify(ORDER), after);
const L2 = await logs();
check('registro: continuou de 2 de 5', L2.some((m) => m.pt === 'Ver todos: continuou de 2 de 5 stories.'), L2.slice(-3));

// 6) clique pausa e retoma
reset();
await p.goto('https://www.instagram.com/'); await wait(1500);
await clickBtn();
await until(async () => seenPosts().length >= 1, 20000);
await clickBtn(); await wait(400);
d = await dbg();
const nPause = seenPosts().length;
check('clique pausa: "Pausado N/5" e a aba fica livre (data-ss-busy 0)', /^Pausado \d\/5$/.test(d.text) && d.run && d.run.pause && d.busy === '0', d);
await wait(4000);
check('pausado: nada sai em 4 s', seenPosts().length === nPause, { nPause, now: seenPosts().length });
await clickBtn();
await until(async () => !(await dbg()).run && seenPosts().length >= 5, 40000);
check('outro clique continua até o fim', JSON.stringify(seenPosts().map((x) => x.pk)) === JSON.stringify(ORDER), seenPosts().map((x) => x.pk));

// 7) a chave do menu esconde o botão
reset();
await p.goto('https://www.instagram.com/'); await wait(1500);
check('chave ligada (padrão): botão visível', !!(await dbg()).btn, await dbg());
await sw.evaluate(() => chrome.storage.sync.set({ seeAllStories: false })); await wait(900);
check('chave desligada: botão some', !(await dbg()).btn, await dbg());
await sw.evaluate(() => chrome.storage.sync.set({ seeAllStories: true })); await wait(900);
check('chave ligada de novo: botão volta', !!(await dbg()).btn, await dbg());
// chave desligada NO MEIO da rodada: para de verdade, libera a aba e guarda o progresso para "Continuar"
await clickBtn();
await until(async () => seenPosts().length >= 1, 20000);
await sw.evaluate(() => chrome.storage.sync.set({ seeAllStories: false })); await wait(3500);
const nOff = seenPosts().length; d = await dbg();
check('chave desligada no meio: a rodada para, sem botão, e a aba fica livre', !d.run && !d.btn && d.busy === '0' && d.passOpen === 0, d);
await wait(3000);
check('chave desligada no meio: nada mais sai', seenPosts().length === nOff, { nOff, now: seenPosts().length });
await sw.evaluate(() => chrome.storage.sync.set({ seeAllStories: true })); await wait(1200);
d = await dbg();
check('religada: o botão volta como "Continuar (N/5)"', d.btn && d.text === `Continuar (${nOff}/5)`, { nOff, d });
check('registro: parada por chave desligada', (await logs()).some((m) => m.pt === `Ver todos: parou em ${nOff} de 5 stories (a chave do menu foi desligada).`), (await logs()).slice(-3));
// a chave aparece no menu → Ferramentas
await p.keyboard.press('Alt+s'); await wait(700);
const row = await p.evaluate(() => { const m = window.__salvaStoriesMenuDebug && window.__salvaStoriesMenuDebug(); return m && m.seeAllRow; });
check('a chave "Botão Ver todos os stories" está no menu', !!row, row);

console.log(JSON.stringify(R, null, 1));
await ctx.close();
try { fs.rmSync(PROF, { recursive: true, force: true }); } catch (_) {}
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
