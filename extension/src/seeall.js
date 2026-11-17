// Salva Stories — botão "Ver todos" da bandeja de stories (v1.13.0).
// Na página inicial, ao lado da bandeja, marca como vistos todos os stories não vistos, um por vez, em segundo plano,
// com uma barrinha de progresso embaixo do botão. Medido ao vivo em 17/11/2026 (pesquisa/2026-11-17-ver-todos-stories.md):
//  - a bandeja inteira está na prop `tray` do PolarisStoriesV3Tray (fibra do React): id, latest_reel_media, seen, user;
//  - os itens de cada pessoa vêm pela mesma consulta do visualizador (PolarisStoriesV3ReelPageGalleryQuery), pedida pelo
//    Relay da própria página; o módulo dela carrega quando o mouse passa num item da bandeja (chamamos o onHoverIn dele);
//  - o "visto" sai pela função do próprio Instagram, PolarisAPIReelSeen.reelSeen (como o deixar de seguir usa
//    PolarisSharedAPI.unfollowUser). Não precisa abrir o story, carregar a mídia nem esperar na tela.
// Passa por cima do modo fantasma SÓ para esses avisos (page.js: seenPass, um pk por vez, só durante o envio).
// Ritmo de pessoa: 1 a 2 s por story, pausa maior entre uma pessoa e outra. Para na hora em bloqueio de ação ou 3 falhas.
(() => {
  'use strict';
  if (window.__salvaStoriesSeeAll) return;
  window.__salvaStoriesSeeAll = true;
  const API = () => window[Symbol.for('salvaStories.api')];
  const K = () => window[Symbol.for('salvaStories.kit')];

  const GAP = [1000, 2000]; // entre um story e outro (ms)
  const PERSON = [1800, 3500]; // pausa extra entre uma pessoa e outra (ms)
  const CHUNK = 8; // pessoas por pedido de itens (o visualizador pede 2 a 8 de cada vez)
  const CHUNK_GAP = [900, 1700];
  const STORE_BASE = 'ss.seeall';
  const STORE = () => STORE_BASE + '.' + (myIdSafe() || '0'); // progresso por conta do Instagram
  const myIdSafe = () => { try { return (K() && K().myId && K().myId()) || null; } catch (_) { return null; } };
  const MAX_AGE = 24 * 3600 * 1000; // story some em 24 h: progresso mais velho que isso não vale

  const T = {
    pt: {
      btn: 'Ver todos os stories', btnD: 'Marca como vistos todos os stories da bandeja, um por vez, em segundo plano. Quem postou vê que você viu.',
      pauseD: 'Clique para pausar', contD: 'Clique para continuar',
      resume: (a, b) => `Continuar (${a}/${b})`, paused: (a, b) => `Pausado ${a}/${b}`, waitUpd: (a, b) => `Pausado ${a}/${b} · atualize a extensão`,
      prep: (a, b) => `Preparando… ${a}/${b} pessoas`, done: 'Todos vistos',
      blocked: 'O Instagram pediu para esperar (bloqueio de ação). Parei para proteger a conta; tente de novo daqui a algumas horas.',
      fails: 'Parei: deu erro 3 vezes seguidas ao marcar como visto. Tente de novo mais tarde.',
      noApi: 'Não achei a função de "visto" do Instagram nesta página. Recarregue a página e tente de novo.',
      nothing: 'Nada para ver: os stories da bandeja já foram vistos.',
      busyNow: 'Termine ou pause o que está rodando antes.',
      logStart: (n, m) => `Ver todos: começou a marcar ${n} stories de ${m} pessoas como vistos.`,
      logEnd: (n, m) => `Ver todos: terminou, ${n} stories de ${m} pessoas marcados como vistos.`,
      logStop: (n, tot, why) => `Ver todos: parou em ${n} de ${tot} stories (${why}).`,
      logPause: (n, tot) => `Ver todos: pausado em ${n} de ${tot} stories.`,
      logResume: (n, tot) => `Ver todos: continuou de ${n} de ${tot} stories.`,
      why: { blocked: 'bloqueio de ação do Instagram', fails: '3 falhas seguidas', noApi: 'função do Instagram não encontrada', off: 'a chave do menu foi desligada' },
    },
    en: {
      btn: 'See all stories', btnD: 'Marks every story in the tray as seen, one at a time, in the background. The poster sees that you watched.',
      pauseD: 'Click to pause', contD: 'Click to continue',
      resume: (a, b) => `Continue (${a}/${b})`, paused: (a, b) => `Paused ${a}/${b}`, waitUpd: (a, b) => `Paused ${a}/${b} · update the extension`,
      prep: (a, b) => `Getting ready… ${a}/${b} people`, done: 'All seen',
      blocked: 'Instagram asked to wait (action block). I stopped to protect the account; try again in a few hours.',
      fails: 'Stopped: marking as seen failed 3 times in a row. Try again later.',
      noApi: "Couldn't find Instagram's \"seen\" function on this page. Reload the page and try again.",
      nothing: 'Nothing to see: the stories in the tray were already seen.',
      busyNow: 'Finish or pause what is running first.',
      logStart: (n, m) => `See all: started marking ${n} stories from ${m} people as seen.`,
      logEnd: (n, m) => `See all: finished, ${n} stories from ${m} people marked as seen.`,
      logStop: (n, tot, why) => `See all: stopped at ${n} of ${tot} stories (${why}).`,
      logPause: (n, tot) => `See all: paused at ${n} of ${tot} stories.`,
      logResume: (n, tot) => `See all: resumed from ${n} of ${tot} stories.`,
      why: { blocked: 'Instagram action block', fails: '3 failures in a row', noApi: "Instagram's function not found", off: 'the menu switch was turned off' },
    },
    es: {
      btn: 'Ver todas las historias', btnD: 'Marca como vistas todas las historias de la bandeja, una por una, en segundo plano. Quien publicó ve que la viste.',
      pauseD: 'Haz clic para pausar', contD: 'Haz clic para continuar',
      resume: (a, b) => `Continuar (${a}/${b})`, paused: (a, b) => `En pausa ${a}/${b}`, waitUpd: (a, b) => `En pausa ${a}/${b} · actualiza la extensión`,
      prep: (a, b) => `Preparando… ${a}/${b} personas`, done: 'Todas vistas',
      blocked: 'Instagram pidió esperar (bloqueo de acción). Me detuve para proteger la cuenta; inténtalo de nuevo en unas horas.',
      fails: 'Me detuve: marcar como vista falló 3 veces seguidas. Inténtalo más tarde.',
      noApi: 'No encontré la función de "visto" de Instagram en esta página. Recarga la página e inténtalo de nuevo.',
      nothing: 'Nada que ver: las historias de la bandeja ya se vieron.',
      busyNow: 'Termina o pausa lo que está en curso primero.',
      logStart: (n, m) => `Ver todas: empezó a marcar ${n} historias de ${m} personas como vistas.`,
      logEnd: (n, m) => `Ver todas: terminó, ${n} historias de ${m} personas marcadas como vistas.`,
      logStop: (n, tot, why) => `Ver todas: se detuvo en ${n} de ${tot} historias (${why}).`,
      logPause: (n, tot) => `Ver todas: en pausa en ${n} de ${tot} historias.`,
      logResume: (n, tot) => `Ver todas: siguió desde ${n} de ${tot} historias.`,
      why: { blocked: 'bloqueo de acción de Instagram', fails: '3 fallos seguidos', noApi: 'función de Instagram no encontrada', off: 'se desactivó el interruptor del menú' },
    },
  };
  const t = (k, ...a) => K().tr(T)(k, ...a);
  // registro nos 3 idiomas, frase inteira (o "Relatar bug" mostra no idioma escolhido)
  const L = (k, ...a) => ({ pt: T.pt[k](...a), en: T.en[k](...a), es: T.es[k](...a) });
  const LS = (n, tot, k) => ({ pt: T.pt.logStop(n, tot, T.pt.why[k]), en: T.en.logStop(n, tot, T.en.why[k]), es: T.es.logStop(n, tot, T.es.why[k]) });
  const log = (level, msg) => { try { API().log(level, msg); } catch (_) {} };
  const raw = (ms) => new Promise((r) => setTimeout(r, ms));

  // ───────────────────────── o Instagram (medido em 17/11/2026) ─────────────────────────
  const req = (n) => { try { return window.require ? window.require(n) : null; } catch (_) { return null; } };
  const fib = (el) => { for (const k in el) if (k.startsWith('__reactFiber$')) return el[k]; return null; };
  const myId = () => (K() && K().myId && K().myId()) || null;

  let trayItemEl = null, trayMissAt = 0;
  // um item da bandeja: botão cuja fibra tem a prop `reel` com `trayPosition` (PolarisStoriesV3TrayReelItem)
  function findTrayItem() {
    if (trayItemEl && trayItemEl.isConnected) return trayItemEl;
    trayItemEl = null;
    if (Date.now() - trayMissAt < 1500) return null; // sem bandeja agora: não varre a página a cada pintura
    const main = document.querySelector('main') || document.body;
    let n = 0;
    for (const b of main.querySelectorAll('[role="button"], button')) {
      if (++n > 120) break;
      let f = fib(b), d = 0;
      while (f && d < 8) { const p = f.memoizedProps; if (p && typeof p === 'object' && p.reel && 'trayPosition' in p) { trayItemEl = b; return b; } f = f.return; d++; }
    }
    trayMissAt = Date.now();
    return null;
  }
  // props do PolarisStoriesV3Tray (tem `tray` e `viewer`) e as do item (tem `onHoverIn` e `user`)
  function trayProps() {
    const el = findTrayItem(); if (!el) return null;
    let f = fib(el), d = 0;
    while (f && d < 40) { const p = f.memoizedProps; if (p && p.tray && p.viewer) return p; f = f.return; d++; }
    return null;
  }
  // a caixa da bandeja: o primeiro ancestral do item com a largura da coluna do feed
  function trayBox() {
    const el = findTrayItem(); if (!el) return null;
    let a = el, d = 0;
    while (a && d < 10) { const r = a.getBoundingClientRect(); if (r.width >= 400) return r; a = a.parentElement; d++; }
    return null;
  }
  const doneTs = new Map(); // reel id → taken_at do último marcado nesta página (a bandeja pode demorar a repintar)
  function unseenPeople() {
    const p = trayProps(); if (!p) return null;
    const list = (p.tray && p.tray.tray) || [];
    const lives = new Set(((p.tray && p.tray.broadcasts) || []).map((b) => String((b && (b.broadcast_owner && b.broadcast_owner.pk || b.user && b.user.pk)) || '')));
    const me = myId();
    return list.filter((r) => r && r.id != null
      && (!r.reel_type || r.reel_type === 'user_reel') // pula anúncio e o que não for story de pessoa
      && !r.muted && String(r.id) !== String(me)
      && !(r.user && r.user.live_broadcast_id) && !lives.has(String(r.id)) // pula live
      && Number(r.latest_reel_media || 0) > Math.max(Number(r.seen || 0), doneTs.get(String(r.id)) || 0))
      .map((r) => ({ id: String(r.id), name: (r.user && r.user.username) || '' }));
  }
  const galleryQ = () => req('PolarisStoriesV3ReelPageGalleryQuery.graphql');
  // o módulo da consulta só existe depois que a página pré-carrega o visualizador (mouse num item da bandeja)
  async function ensureQuery() {
    if (galleryQ()) return true;
    const el = findTrayItem();
    if (el) {
      let f = fib(el), d = 0;
      while (f && d < 8) { const p = f.memoizedProps; if (p && typeof p.onHoverIn === 'function' && 'user' in p) { try { p.onHoverIn(); } catch (_) {} break; } f = f.return; d++; }
      for (const type of ['pointerover', 'pointerenter', 'mouseover', 'mouseenter']) { try { el.dispatchEvent(new (type.startsWith('pointer') && window.PointerEvent ? PointerEvent : MouseEvent)(type, { bubbles: type.endsWith('over'), cancelable: true })); } catch (_) {} }
    }
    for (let i = 0; i < 40 && !galleryQ(); i++) await raw(200);
    return !!galleryQ();
  }
  // itens de várias pessoas num pedido, pelo Relay da página; os dados ficam no store (o resultado vem mascarado)
  async function fetchItems(ids) {
    const R = req('CometRelay'), env = req('PolarisRelayEnvironment'), Q = galleryQ();
    if (!R || !env || !Q) throw new Error('relay');
    await R.fetchQuery(env, Q, { reel_ids: ids, initial_reel_id: ids[0], first: ids.length, is_highlight: false }, { fetchPolicy: 'network-only' }).toPromise();
    const src = env.getStore().getSource();
    const out = new Map();
    for (const id of ids) {
      const rec = src.get('XDTReelDict:' + id); if (!rec) continue;
      const key = Object.keys(rec).find((k) => /^items/.test(k));
      const refs = (key && rec[key] && rec[key].__refs) || [];
      const seen = Math.max(Number(rec.seen || 0), doneTs.get(id) || 0);
      const items = refs.map((x) => src.get(x)).filter(Boolean)
        .filter((it) => !(it.product_type === 'ad' || it.ad_id || it.is_ad || it.dr_ad_type)) // pula anúncio
        .map((it) => ({ pk: String(it.pk || String(it.id || '').split('_')[0]), taken_at: Number(it.taken_at || 0) }))
        .filter((it) => it.pk && it.taken_at > seen) // pula o que já foi visto
        .sort((a, b) => a.taken_at - b.taken_at);
      out.set(id, items);
    }
    return out;
  }
  const seenFn = () => { const m = req('PolarisAPIReelSeen'); return m && typeof m.reelSeen === 'function' ? m.reelSeen : null; };
  // o "visto" de UM story, pela função do Instagram, com a exceção do modo fantasma só para este pk
  async function markSeen(reelId, it) {
    const fn = seenFn(); if (!fn) throw Object.assign(new Error('noApi'), { noApi: true });
    // teto de 25 s: se o aviso pendurar (rede ou Instagram), conta como falha e o pk sai da exceção do fantasma
    return API().seenPass(it.pk, () => Promise.race([fn({ id: it.pk, owner: { id: reelId }, postedAt: it.taken_at }, { id: reelId }), raw(25000).then(() => { throw new Error('timeout'); })]));
  }
  // anel cinza na hora (o mesmo que o visualizador faz depois do último story da pessoa)
  function localSeen(reelId, ts) {
    doneTs.set(reelId, ts);
    try {
      const R = req('CometRelay'), env = req('PolarisRelayEnvironment');
      R && env && R.commitLocalUpdate(env, (store) => {
        const r = store.get('XDTReelDict:' + reelId); if (!r) return;
        r.setValue(ts, 'seen');
        const u = r.getLinkedRecord && r.getLinkedRecord('user');
        if (u) u.setValue(Math.max(Number(u.getValue('reel_media_seen_timestamp') || 0), ts), 'reel_media_seen_timestamp');
      });
    } catch (_) {}
  }

  // ───────────────────────── estado ─────────────────────────
  let run = null; // { state: 'prep'|'run', pause, stop, done, total, people, prepN, prepTotal, cur, busyOn }
  let saved = null; // progresso guardado (storage.local): { at, done, total, people }
  let flash = 0; // "Todos vistos" até esta hora
  const enabled = () => { const s = API() && API().settings(); return !s || s.seeAllStories !== false; };
  const onHome = () => location.pathname === '/';
  const save = () => { if (run && run.state === 'run') return K().lset(STORE(), { at: Date.now(), done: run.done, total: run.total, people: run.people }); };
  const setBusy = (on) => { if (!run || run.busyOn === on) return; run.busyOn = on; K().busy(on); };

  async function loadSaved() {
    const s = await K().lget(STORE());
    saved = s && typeof s === 'object' && Date.now() - Number(s.at || 0) < MAX_AGE && Number(s.done) < Number(s.total) ? s : null;
    paint();
  }

  async function gate() { // pausa pelo clique ou por versão URGENTE (regra 14 d)
    while (run && !run.stop && (run.pause || K().urgent())) { setBusy(!!(!run.pause && K().urgent())); paint(); await raw(300); }
    if (run && !run.stop) setBusy(true);
  }
  const wait = async (range) => { const end = Date.now() + K().jitter(range[0], range[1]); while (run && !run.stop && Date.now() < end) { await K().sleep(Math.min(250, Math.max(0, end - Date.now()))); await gate(); } };

  async function start() {
    if (run) return;
    if (!seenFn()) { toast(t('noApi')); log('error', LS(0, 0, 'noApi')); return; }
    const people = unseenPeople() || [];
    if (!people.length) { toast(t('nothing')); saved = null; K().lset(STORE(), null); paint(); return; }
    const base = saved ? Number(saved.done) || 0 : 0;
    const resumed = !!saved;
    run = { state: 'prep', pause: false, stop: false, done: base, total: base, people: people.length, prepN: 0, prepTotal: people.length, cur: '', busyOn: false };
    setBusy(true); paint();
    let reason = null, streak = 0;
    const queue = [];
    try {
      if (!(await ensureQuery())) { reason = 'noApi'; return; }
      for (let i = 0; i < people.length && !run.stop; i += CHUNK) {
        await gate(); if (run.stop) break;
        const part = people.slice(i, i + CHUNK);
        let got;
        try { got = await fetchItems(part.map((x) => x.id)); streak = 0; } catch (e) {
          if (K().isBlock(e)) { reason = 'blocked'; break; }
          if (++streak >= 3) { reason = 'fails'; break; }
          i -= CHUNK; await wait([2000, 4000]); continue;
        }
        for (const p of part) { const items = got.get(p.id) || []; if (items.length) { queue.push({ ...p, items }); run.total += items.length; } }
        run.prepN = Math.min(people.length, i + CHUNK); paint();
        if (i + CHUNK < people.length) await wait(CHUNK_GAP);
      }
      if (reason || run.stop) return;
      run.people = queue.length;
      run.state = 'run'; paint();
      if (resumed) log('info', L('logResume', run.done, run.total)); else log('info', L('logStart', run.total - run.done, run.people));
      await save();
      streak = 0;
      for (let qi = 0; qi < queue.length && !run.stop && !reason; qi++) {
        const person = queue[qi];
        run.cur = person.name; paint();
        let last = 0, failed = false;
        for (let k = 0; k < person.items.length; k++) {
          await gate(); if (run.stop) break;
          const it = person.items[k];
          try {
            await markSeen(person.id, it);
            run.done++; streak = 0; last = it.taken_at;
            save(); paint();
          } catch (e) {
            if (e && e.noApi) { reason = 'noApi'; break; }
            if (K().isBlock(e)) { reason = 'blocked'; break; }
            failed = true;
            if (++streak >= 3) { reason = 'fails'; break; }
            log('warn', { pt: 'Ver todos: um story não foi marcado: ' + String((e && e.message) || e).slice(0, 100), en: 'See all: one story was not marked: ' + String((e && e.message) || e).slice(0, 100), es: 'Ver todas: una historia no se marcó: ' + String((e && e.message) || e).slice(0, 100) });
          }
          if (k + 1 < person.items.length) await wait(GAP);
        }
        if (last && !failed) localSeen(person.id, last); // com algum story que falhou, o anel fica como o Instagram disser
        if (qi + 1 < queue.length && !run.stop && !reason) await wait([GAP[0] + PERSON[0], GAP[1] + PERSON[1]]);
      }
    } finally {
      const r = run;
      if (r) {
        setBusy(false);
        run = null; // antes de qualquer await: um clique agora começa do zero, não religa o busy de uma rodada que acabou
        if (reason) {
          log('warn', LS(r.done, r.total, reason));
          toast(t(reason === 'noApi' ? 'noApi' : reason));
          saved = r.done > 0 && r.done < r.total ? { at: Date.now(), done: r.done, total: r.total, people: r.people } : null;
          await K().lset(STORE(), saved);
        } else if (r.stop) {
          saved = r.state === 'run' && r.done < r.total ? { at: Date.now(), done: r.done, total: r.total, people: r.people } : saved;
          await K().lset(STORE(), saved);
        } else {
          log('info', L('logEnd', r.done, r.people));
          saved = null; await K().lset(STORE(), null);
          flash = Date.now() + 4000; setTimeout(paint, 4100);
        }
        paint();
      }
    }
  }

  function click() {
    if (!run) {
      if ((parseInt(document.documentElement.dataset.ssBusy || '0', 10) || 0) > 0) { toast(t('busyNow')); return; }
      start(); return;
    }
    run.pause = !run.pause;
    if (run.pause) { setBusy(false); log('info', L('logPause', run.done, run.total)); save(); }
    else { setBusy(true); log('info', L('logResume', run.done, run.total)); }
    paint();
  }

  // ───────────────────────── interface ─────────────────────────
  const ICON = {
    eye: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  };
  const CSS = `
  .sa { position: fixed; width: 40px; height: 40px; border-radius: 50%; border: 0; padding: 0; display: grid; place-items: center; cursor: pointer;
    color: #fff; background: var(--grad); box-shadow: 0 2px 10px rgba(0,0,0,.35); transition: filter .15s, transform .1s; outline: none; }
  .sa:hover { filter: brightness(1.08); } .sa:active { transform: scale(.95); }
  .sa:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
  .sa .tip { position: absolute; right: calc(100% + 10px); top: 50%; transform: translate(6px,-50%); width: 230px; padding: 8px 11px; border-radius: 10px;
    background: rgba(18,12,24,.94); color: #fff; text-align: left; font: 12.5px/1.35 var(--font); pointer-events: none; opacity: 0; transition: opacity .15s, transform .15s; box-shadow: 0 4px 18px rgba(0,0,0,.4); }
  .sa .tip b { display: block; font-size: 13px; margin-bottom: 2px; }
  .sa:hover .tip, .sa:focus-visible .tip { opacity: 1; transform: translate(0,-50%); }
  .pg { position: fixed; width: 196px; padding: 7px 10px 8px; border-radius: 10px; background: var(--bg); color: var(--fg); box-shadow: var(--shadow); font-size: 12px; }
  .pg .bar { height: 4px; }
  .pg .tx { display: flex; gap: 6px; margin-top: 5px; white-space: nowrap; overflow: hidden; }
  .pg .tx b { font-weight: 700; flex: none; } .pg .tx span { color: var(--sub); overflow: hidden; text-overflow: ellipsis; }
  .pg.float { left: 50% !important; top: auto !important; bottom: 76px; transform: translateX(-50%); }
  .pg.link { cursor: pointer; } .pg.link:hover { background: var(--card); }
  `;
  let ui = null;
  function build() {
    if (ui) return;
    ui = K().makeHost('ss-seeall', CSS, `<button class="sa" type="button" hidden><span class="ic"></span><span class="tip"><b></b><span></span></span></button>
      <div class="pg" hidden><div class="bar"><i></i></div><div class="tx"><b></b><span></span></div></div>`);
    ui.$('.sa').addEventListener('click', click);
    ui.$('.pg').addEventListener('click', () => { if (!run && saved) click(); });
  }
  let toastMsg = '';
  function toast(msg) { build(); toastMsg = msg; ui.toast(msg); }

  let lastKey = '';
  function paint() {
    if (!K() || !API() || (document.hidden && !run)) return;
    build();
    const btn = ui.$('.sa'), pg = ui.$('.pg');
    const box = enabled() && onHome() ? trayBox() : null;
    const trayOk = !!(box && box.bottom > 0 && box.top < innerHeight && box.width > 0);
    const people = trayOk && !run ? unseenPeople() : null;
    const flashing = Date.now() < flash;
    if (!run && saved && people && !people.length) { saved = null; K().lset(STORE(), null); } // nada mais a ver: esquece o progresso
    const showBtn = trayOk && (!!run || flashing || !!(people && people.length));
    btn.hidden = !showBtn;
    ui.refreshMode();
    let icon = 'eye', tipB = t('btn'), tipS = t('btnD'), line = null, sub = '', pct = 0, link = false;
    if (run) {
      const urg = K().urgent();
      if (run.state === 'prep') { line = t('prep', run.prepN, run.prepTotal); pct = run.prepTotal ? run.prepN / run.prepTotal : 0; }
      else { line = run.pause ? t('paused', run.done, run.total) : urg ? t('waitUpd', run.done, run.total) : `${run.done}/${run.total}`; sub = run.pause || urg ? '' : run.cur; pct = run.total ? run.done / run.total : 0; }
      icon = run.pause ? 'play' : 'pause'; tipB = t('btn'); tipS = run.pause ? t('contD') : t('pauseD');
    } else if (flashing) { icon = 'check'; line = t('done'); pct = 1; }
    else if (saved && people && people.length) { line = t('resume', saved.done, saved.total); pct = saved.total ? saved.done / saved.total : 0; link = true; tipS = t('resume', saved.done, saved.total); }
    const showPg = line != null && (showBtn || !!run);
    pg.hidden = !showPg;
    const key = [icon, tipB, tipS, line, sub, K().lang()].join('|');
    if (key !== lastKey) {
      lastKey = key;
      btn.querySelector('.ic').innerHTML = ICON[icon];
      btn.querySelector('.tip b').textContent = tipB;
      btn.querySelector('.tip span').textContent = tipS;
      btn.setAttribute('aria-label', line && run ? `${tipB}: ${line}` : link ? line : tipB);
      pg.querySelector('.tx b').textContent = line || '';
      pg.querySelector('.tx span').textContent = sub ? '· ' + sub : '';
    }
    pg.querySelector('.bar i').style.width = Math.round(Math.max(0, Math.min(1, pct)) * 100) + '%';
    pg.classList.toggle('link', link);
    if (showBtn) {
      let left = box.right + 8;
      if (left + 40 > innerWidth - 4) left = box.right - 48; // sem espaço à direita: dentro da bandeja, na ponta
      const top = box.top + box.height / 2 - 20;
      btn.style.left = Math.round(left) + 'px'; btn.style.top = Math.round(top) + 'px';
      pg.classList.remove('float');
      pg.style.left = Math.max(4, Math.round(left + 40 - 196)) + 'px'; pg.style.top = Math.round(top + 46) + 'px';
    } else if (showPg) pg.classList.add('float'); // rodando fora da página inicial: a barrinha flutua embaixo, no meio
  }

  // ───────────────────────── liga tudo ─────────────────────────
  function boot() {
    if (!K() || !API()) { setTimeout(boot, 300); return; }
    K().onSettings(() => { if (run && !enabled() && !run.stop) { run.stop = true; log('info', LS(run.done, run.total, 'off')); } lastKey = ''; paint(); });
    loadSaved();
    setInterval(paint, 400);
    let raf = 0; addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); }); }, { passive: true });
    addEventListener('resize', () => paint());
  }
  boot();

  // depuração e testes: __salvaStoriesSeeAllDebug()
  const __box = (el) => { if (!el || el.hidden) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null; };
  window.__salvaStoriesSeeAllDebug = () => ({
    btn: ui ? __box(ui.$('.sa')) : null, pg: ui ? __box(ui.$('.pg')) : null, float: ui ? ui.$('.pg').classList.contains('float') : null,
    text: ui && !ui.$('.pg').hidden ? ui.$('.pg .tx').textContent : null, tip: ui ? ui.$('.sa .tip').textContent : null, aria: ui ? ui.$('.sa').getAttribute('aria-label') : null,
    tray: (() => { const b = trayBox(); return b ? { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), bottom: Math.round(b.bottom) } : null; })(),
    unseen: (unseenPeople() || []).length, run: run && { state: run.state, pause: run.pause, done: run.done, total: run.total, people: run.people, cur: run.cur },
    saved, toast: toastMsg, busy: document.documentElement.dataset.ssBusy || '0', passOpen: API() ? API().seenPassCount() : null, hasQuery: !!galleryQ(), hasSeen: !!seenFn(),
  });
})();
