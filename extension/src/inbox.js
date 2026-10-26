// Salva Stories — seleção múltipla na lista de conversas do Direct.
// Marca várias conversas e aplica uma ação em todas: marcar como lida / não lida, fixar, silenciar, excluir.
// Não chama API escondida: para cada conversa, faz o que a pessoa faria (passa o mouse → "…" → item do menu),
// uma por vez, com pausa entre elas. Assim o Instagram vê o mesmo fluxo da interface dele.
(() => {
  'use strict';
  if (window.__salvaStoriesInbox) return;
  window.__salvaStoriesInbox = true;
  const API = () => window[Symbol.for('salvaStories.api')];
  const K = () => window[Symbol.for('salvaStories.kit')];

  const T = {
    pt: { select: 'Selecionar conversas', sel: (n) => n === 1 ? '1 selecionada' : `${n} selecionadas`, all: 'Todas', none: 'Nenhuma',
      unread: 'Não lida', read: 'Lida', pin: 'Fixar', mute: 'Silenciar', del: 'Excluir', close: 'Sair da seleção', cancel: 'Parar',
      doing: (a, b) => `${a} de ${b}…`, done: (n, s) => `Feito em ${n}` + (s ? ` · ${s} sem essa opção` : ''), stopped: 'Parado.',
      confirmT: (n) => n === 1 ? 'Excluir 1 conversa?' : `Excluir ${n} conversas?`,
      confirmB: 'As conversas somem só para você; a outra pessoa continua com elas. Não dá para desfazer.', confirm: 'Excluir', back: 'Voltar',
      allHint: '', pick: 'Selecione conversas primeiro.', loading: (n) => `Carregando todas as conversas… ${n}`, loaded: (n) => `${n} conversas selecionadas (todas)`,
      pause: (s) => `Pausa curta para não chamar atenção: ${s} s…`, blocked: 'O Instagram pediu para esperar. Parei aqui; tente de novo mais tarde.' },
    en: { select: 'Select chats', sel: (n) => `${n} selected`, all: 'All', none: 'None',
      unread: 'Unread', read: 'Read', pin: 'Pin', mute: 'Mute', del: 'Delete', close: 'Exit selection', cancel: 'Stop',
      doing: (a, b) => `${a} of ${b}…`, done: (n, s) => `Done on ${n}` + (s ? ` · ${s} without that option` : ''), stopped: 'Stopped.',
      confirmT: (n) => n === 1 ? 'Delete 1 chat?' : `Delete ${n} chats?`,
      confirmB: 'Chats are removed only for you; the other person keeps them. This cannot be undone.', confirm: 'Delete', back: 'Back',
      allHint: '', pick: 'Select chats first.', loading: (n) => `Loading all chats… ${n}`, loaded: (n) => `${n} chats selected (all)`,
      pause: (s) => `Short break so it isn't flagged: ${s} s…`, blocked: 'Instagram asked to wait. I stopped here; try again later.' },
    es: { select: 'Seleccionar chats', sel: (n) => n === 1 ? '1 seleccionado' : `${n} seleccionados`, all: 'Todos', none: 'Ninguno',
      unread: 'No leído', read: 'Leído', pin: 'Fijar', mute: 'Silenciar', del: 'Eliminar', close: 'Salir de la selección', cancel: 'Detener',
      doing: (a, b) => `${a} de ${b}…`, done: (n, s) => `Hecho en ${n}` + (s ? ` · ${s} sin esa opción` : ''), stopped: 'Detenido.',
      confirmT: (n) => n === 1 ? '¿Eliminar 1 chat?' : `¿Eliminar ${n} chats?`,
      confirmB: 'Los chats se eliminan solo para ti; la otra persona los conserva. No se puede deshacer.', confirm: 'Eliminar', back: 'Volver',
      allHint: '', pick: 'Selecciona chats primero.', loading: (n) => `Cargando todos los chats… ${n}`, loaded: (n) => `${n} chats seleccionados (todos)`,
      pause: (s) => `Pausa corta para que no lo marquen: ${s} s…`, blocked: 'Instagram pidió esperar. Me detuve aquí; inténtalo más tarde.' },
  };
  let t = (k) => k;

  // textos do menu "…" do Instagram (pt/en/es). O primeiro que casar é clicado.
  const ACT = {
    unread: /^(marcar como não lida|mark as unread|marcar como no leíd[oa])/i,
    read: /^(marcar como lida|mark as read|marcar como leíd[oa])/i,
    pin: /^(pin|fixar|fijar)\b/i,
    mute: /^(silenciar|mute)\b/i,
    del: /^(excluir|apagar|delete|eliminar)\b/i,
  };
  const MORE = /^(mais opções|more options|más opciones|opções|options|opciones)$/i;

  const SVG = {
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    sel: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="m8 12 3 3 5-6"/></svg>',
    unread: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-4.2-7.6"/><circle cx="19" cy="5" r="3" fill="currentColor" stroke="none"/></svg>',
    read: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 13 4 4 8-9"/><path d="m11 16 1 1 9-10"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l-1 6 4 4H6l4-4z"/><path d="M12 13v8"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-9.3-5"/><path d="M6 8c0 7-3 9-3 9h13"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/><path d="m2 2 20 20"/></svg>',
    del: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>',
  };

  const CSS = `
  .fab { position: fixed; width: 40px; height: 40px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer; color: #fff;
    background: var(--grad); box-shadow: 0 4px 14px -3px rgba(214,41,118,.65); transition: transform .12s, filter .15s; }
  .fab:hover { filter: brightness(1.08); transform: scale(1.05); }
  .tip { position: fixed; padding: 6px 10px; border-radius: 8px; background: rgba(20,20,20,.94); color: #fff; font: 600 12.5px var(--font); white-space: nowrap; pointer-events: none; }
  .ov { position: fixed; border-radius: 10px; cursor: pointer; transition: background .12s; }
  .ov:hover { background: var(--hover); }
  .ov.on { background: rgba(214,41,118,.13); box-shadow: inset 3px 0 0 #d62976; }
  .ov .cb { position: absolute; right: 14px; top: 50%; width: 24px; height: 24px; margin-top: -12px; border-radius: 50%; border: 2px solid var(--track);
    display: grid; place-items: center; color: transparent; background: var(--bg); transition: all .12s; }
  .ov.on .cb { border-color: transparent; background: var(--grad); color: #fff; }
  .tb { position: fixed; display: grid; gap: 8px; padding: 10px 10px 8px; border-radius: 16px; background: var(--bg); border: 1px solid var(--sep); box-shadow: var(--shadow);
    animation: up .18s cubic-bezier(.2,.9,.3,1.2); }
  @keyframes up { from { opacity: 0; transform: translateY(10px); } }
  .tr1 { display: flex; align-items: center; gap: 8px; }
  .cnt { font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lnk { border: 0; background: transparent; color: var(--accent); font: 700 13px var(--font); cursor: pointer; padding: 4px 6px; border-radius: 6px; }
  .lnk:hover { background: var(--hover); }
  .lnk[disabled] { opacity: .5; cursor: default; }
  .acts { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
  .a { display: grid; justify-items: center; gap: 3px; padding: 7px 2px 6px; border: 0; border-radius: 10px; background: var(--card); color: var(--fg); font: 600 11.5px var(--font); cursor: pointer; transition: background .12s, transform .1s; }
  .a:hover { background: var(--hover); } .a:active { transform: scale(.96); }
  .a.danger { color: rgb(237,73,86); }
  .a[disabled] { opacity: .45; cursor: default; }
  .prog { display: grid; gap: 6px; }
  .prog .st { font-size: 12.5px; color: var(--sub); }
  .ft { display: flex; justify-content: center; padding-top: 2px; }
  .scrim { position: fixed; inset: 0; width: 100vw; height: 100vh; background: var(--scrim); display: grid; place-items: center; animation: fade .15s; }
  @keyframes fade { from { opacity: 0; } }
  .dlg { width: min(380px, calc(100vw - 32px)); background: var(--bg); color: var(--fg); border-radius: 16px; box-shadow: var(--shadow); padding: 22px 22px 16px; text-align: center; }
  .dlg .ic { width: 52px; height: 52px; margin: 0 auto 10px; border-radius: 50%; display: grid; place-items: center; color: rgb(237,73,86); background: rgba(237,73,86,.12); }
  .dlg h3 { margin: 0 0 8px; font-size: 18px; } .dlg p { margin: 0 0 18px; color: var(--sub); }
  .dlg .bt { display: grid; gap: 8px; }
  .dlg .btn { height: 42px; }
  `;

  // ───────── linhas da lista de conversas ─────────
  const KEY = new WeakMap();
  function threadKey(el) {
    if (KEY.has(el)) return KEY.get(el);
    let f = API().fiberOf(el), key = null;
    for (let d = 0; f && d < 12 && !key; d++, f = f.return) {
      const p = f.memoizedProps;
      if (p && typeof p === 'object') {
        const v = p.threadKeyForSelection || p.threadFbidForSelection || p.threadKey || p.threadID || p.threadId;
        if (v && (typeof v === 'string' || typeof v === 'number')) key = String(v);
      }
    }
    if (key) KEY.set(el, key);
    return key;
  }
  const inInbox = () => /^\/direct\/(inbox|t|requests)(\/|$)/.test(location.pathname);
  function rows() {
    const out = [];
    for (const el of document.querySelectorAll('div[role="button"], a[role="link"][href^="/direct/t/"]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 240 || r.width > 560 || r.height < 56 || r.height > 100 || r.left > innerWidth * 0.55) continue;
      if (el.closest('[role="dialog"]')) continue;
      const k = threadKey(el);
      if (k) out.push({ el, key: k, r });
    }
    // remove aninhados (fica com o de fora)
    let list = out.filter((x) => !out.some((y) => y !== x && y.el.contains(x.el)));
    // a lista é a coluna mais à esquerda; balões da conversa aberta (à direita) carregam a mesma chave e ficam de fora
    const minLeft = Math.min(...list.map((x) => x.r.left));
    list = list.filter((x) => Math.abs(x.r.left - minLeft) < 8);
    const n = new Map();
    for (const x of list) n.set(x.key, (n.get(x.key) || 0) + 1);
    return list.filter((x) => n.get(x.key) === 1);
  }
  function scroller(el) {
    for (let p = el && el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 4) return p;
    }
    return null;
  }

  // ───────── estado / interface ─────────
  let ui = null, selecting = false, busy = false, stop = false;
  const SEL = new Set();
  const KNOWN = new Set(); // todas as conversas que já apareceram na lista (o Instagram carrega ~15 por vez)
  let lastRows = [], lastResult = null, lastItems = null, lastAction = null;
  let padded = null, padOld = '';
  function unpad() { if (padded) { try { padded.style.paddingBottom = padOld; } catch (_) {} padded = null; } }
  const allSelected = () => KNOWN.size > 0 && [...KNOWN].every((k) => SEL.has(k));
  const listBox = () => { const r = rows(); return r.length ? scroller(r[0].el) : null; };
  const atBottom = (sc) => sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4;

  // "Todas": rola a lista até o fim para o Instagram carregar todas as conversas, marcando cada uma que aparece.
  // A lista pode ser virtualizada (linhas de cima saem do DOM), por isso marca durante a rolagem.
  async function selectAll() {
    const sc = listBox();
    busy = true; stop = false;
    const p = ui.$('.prog'); p.hidden = false;
    p.querySelector('.bar i').style.width = '0%';
    render();
    try {
      const grab = () => { let n = 0; for (const x of rows()) { KNOWN.add(x.key); if (!SEL.has(x.key)) { SEL.add(x.key); n++; } } return n; };
      grab();
      if (sc) {
        sc.scrollTop = 0; await sleep(300); grab();
        let still = 0;
        for (let step = 0; step < 2000 && !stop; step++) {
          const before = sc.scrollHeight, n0 = SEL.size;
          sc.scrollTop += Math.max(200, sc.clientHeight * 0.85);
          await sleep(K().jitter(600, 1100)); // o próprio Instagram busca a próxima página ao rolar
          grab();
          p.querySelector('.st').textContent = t('loading', SEL.size);
          p.querySelector('.bar i').style.width = Math.min(95, 10 + step) + '%';
          render();
          const grew = SEL.size > n0 || sc.scrollHeight > before;
          if (atBottom(sc) && !grew) { if (++still >= 4) break; await sleep(800); } else still = 0;
        }
        sc.scrollTop = 0;
      }
      p.querySelector('.bar i').style.width = '100%';
      p.querySelector('.st').textContent = stop ? t('stopped') + ' ' + t('sel', SEL.size) : t('loaded', SEL.size);
    } finally {
      busy = false; stop = false;
      render();
      setTimeout(() => { if (!busy && ui) ui.$('.prog').hidden = true; layout(); }, 3500);
    }
  }

  function ensureUI() {
    if (ui && ui.host.isConnected) return;
    ui = K().makeHost('salva-stories-inbox', CSS, `
      <div class="ovs"></div>
      <button class="fab" type="button" hidden>${SVG.sel}</button>
      <div class="tip" hidden></div>
      <div class="tb" hidden>
        <div class="tr1"><span class="cnt"></span><button class="lnk all" type="button"></button><button class="x" type="button">${K().ICON.x}</button></div>
        <div class="acts">${['unread', 'read', 'pin', 'mute', 'del'].map((a) => `<button class="a${a === 'del' ? ' danger' : ''}" data-a="${a}" type="button">${SVG[a]}<span></span></button>`).join('')}</div>
        <div class="prog" hidden><div class="st"></div><div class="bar"><i></i></div></div>
        <div class="ft"></div>
      </div>
      <div class="scrim" hidden></div>`);
    const $ = ui.$;
    $('.fab').addEventListener('click', () => { selecting = true; SEL.clear(); render(); });
    $('.fab').addEventListener('pointerenter', () => tip($('.fab'), t('select')));
    $('.fab').addEventListener('pointerleave', () => { $('.tip').hidden = true; });
    $('.tb .x').addEventListener('click', () => { if (busy) { stop = true; return; } selecting = false; SEL.clear(); render(); });
    $('.all').addEventListener('click', () => {
      if (busy) return;
      if (allSelected()) { SEL.clear(); render(); return; }
      selectAll();
    });
    for (const b of ui.$$('.a')) b.addEventListener('click', () => act(b.dataset.a));
  }
  function tip(anchor, text) {
    const el = ui.$('.tip'), r = anchor.getBoundingClientRect();
    el.textContent = text; el.hidden = false;
    el.style.left = Math.round(Math.max(8, r.left + r.width / 2 - el.offsetWidth / 2)) + 'px';
    el.style.top = Math.round(r.top - el.offsetHeight - 8) + 'px';
  }

  function render() {
    if (!ui) return;
    const $ = ui.$;
    t = K().tr(T);
    ui.refreshMode();
    $('.fab').hidden = selecting;
    $('.tb').hidden = !selecting;
    if (selecting) $('.tip').hidden = true;
    $('.cnt').textContent = t('sel', SEL.size);
    $('.all').textContent = !busy && allSelected() ? t('none') : t('all');
    $('.all').disabled = busy;
    $('.tb .x').title = busy ? t('cancel') : t('close');
    for (const b of ui.$$('.a')) { b.querySelector('span').textContent = t(b.dataset.a); b.disabled = busy || !SEL.size; }
    $('.ft').innerHTML = K().signature(K().version());
    layout();
  }

  // posiciona botão, barra e as camadas de seleção sobre as linhas (a cada quadro, por causa da rolagem)
  function layout() {
    if (!ui) return;
    const $ = ui.$;
    const list = lastRows.length ? lastRows : [];
    const sc = list.length ? scroller(list[0].el) : null;
    const box = sc ? sc.getBoundingClientRect() : list.length ? { left: list[0].r.left, right: list[0].r.right, top: 0, bottom: innerHeight, width: list[0].r.width } : null;
    if (!box) { $('.fab').hidden = true; $('.tb').hidden = true; $('.ovs').innerHTML = ''; return; }
    const fab = $('.fab');
    fab.style.left = Math.round(box.right - 40 - 16) + 'px';
    fab.style.top = Math.round(Math.min(box.bottom, innerHeight) - 40 - 18) + 'px';
    const tb = $('.tb');
    const w = Math.min(380, box.width - 16);
    tb.style.width = Math.round(w) + 'px';
    tb.style.left = Math.round(box.left + (box.width - w) / 2) + 'px';
    tb.style.top = Math.round(Math.min(box.bottom, innerHeight) - tb.offsetHeight - 12) + 'px';
    // camadas
    const ovs = $('.ovs');
    if (!selecting) { if (ovs.childElementCount) ovs.innerHTML = ''; unpad(); return; }
    // espaço no fim da lista enquanto seleciona: senão as últimas conversas ficam presas atrás da barra
    if (sc) { const want = Math.round(tb.offsetHeight + 24) + 'px'; if (padded !== sc) { unpad(); padded = sc; padOld = sc.style.paddingBottom; } if (sc.style.paddingBottom !== want) sc.style.paddingBottom = want; }
    const tbTop = tb.getBoundingClientRect().top;
    const want = new Map(list.map((x) => [x.key, x]));
    for (const o of [...ovs.children]) if (!want.has(o.dataset.k)) o.remove();
    for (const [k, x] of want) {
      let o = ovs.querySelector(`[data-k="${window.CSS.escape(k)}"]`);
      if (!o) {
        o = document.createElement('div');
        o.className = 'ov'; o.dataset.k = k; o.innerHTML = `<span class="cb">${SVG.check}</span>`;
        o.addEventListener('click', () => { if (busy) return; SEL.has(k) ? SEL.delete(k) : SEL.add(k); render(); });
        ovs.appendChild(o);
      }
      const r = x.el.getBoundingClientRect();
      const top = Math.max(r.top, box.top), bottom = Math.min(r.bottom, box.bottom, tbTop - 4);
      o.hidden = bottom - top < 16;
      o.style.left = Math.round(r.left) + 'px'; o.style.width = Math.round(r.width) + 'px';
      o.style.top = Math.round(top) + 'px'; o.style.height = Math.round(bottom - top) + 'px';
      o.classList.toggle('on', SEL.has(k));
    }
  }

  // ───────── executar as ações ─────────
  const sleep = (ms) => K().sleep(ms);
  async function waitFor(fn, ms = 2500, every = 80) {
    const end = Date.now() + ms;
    for (;;) { const v = fn(); if (v) return v; if (Date.now() > end) return null; await sleep(every); }
  }
  function hover(el) {
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, composed: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerType: 'mouse' };
    for (const ty of ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove']) {
      el.dispatchEvent(ty.startsWith('pointer') ? new PointerEvent(ty, o) : new MouseEvent(ty, o));
    }
  }
  function unhover(el) {
    const o = { bubbles: true, cancelable: true, composed: true, view: window };
    for (const ty of ['pointerout', 'pointerleave', 'mouseout', 'mouseleave']) el.dispatchEvent(ty.startsWith('pointer') ? new PointerEvent(ty, o) : new MouseEvent(ty, o));
  }
  const label = (el) => ((el.getAttribute('aria-label') || '') || (el.querySelector('svg[aria-label]') && el.querySelector('svg[aria-label]').getAttribute('aria-label')) || '').trim();
  function moreButton(row) {
    // o botão "…" aparece dentro da linha (ou logo ao lado) quando o mouse passa
    const cands = [...row.querySelectorAll('[aria-haspopup], div[role="button"], button')].filter((b) => b !== row);
    return cands.find((b) => MORE.test(label(b))) || cands.find((b) => b.getAttribute('aria-haspopup') && b.querySelector('svg')) || null;
  }
  const visibleText = (el) => (el.innerText || el.textContent || '').trim().split('\n')[0].trim();
  // no Instagram de out/2026 o menu "…" é um role=dialog com itens role=button (antes: role=menuitem)
  function menuItems() { return [...document.querySelectorAll('[role="menuitem"], [role="menu"] [role="button"], [role="dialog"] [role="button"], [role="dialog"] button')].filter((e) => e.getBoundingClientRect().height > 0 && visibleText(e)); }
  // clique "de verdade" (o React do Instagram às vezes só reage à sequência completa de ponteiro)
  function press(el) {
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, composed: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerType: 'mouse', button: 0, buttons: 1, isPrimary: true, pointerId: 1 };
    for (const ty of ['pointerover', 'pointerenter', 'mouseover', 'pointerdown', 'mousedown', 'pointerup', 'mouseup']) el.dispatchEvent(ty.startsWith('pointer') ? new PointerEvent(ty, o) : new MouseEvent(ty, o));
    el.click();
  }
  function escapeMenus() { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })); document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })); }

  // "Tente novamente mais tarde" / ação bloqueada: para tudo
  const BLOCK = /tente novamente mais tarde|try again later|inténtalo (de nuevo )?más tarde|ação bloqueada|action blocked/i;
  const blockedNow = () => [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="alert"]')].some((d) => BLOCK.test(d.innerText || ''));
  // acha a linha da conversa; se não está na tela, rola a lista (primeiro para baixo, depois do topo)
  async function findRow(key) {
    const here = () => { const x = rows().find((y) => y.key === key); return x ? x.el : null; };
    let el = here();
    if (el) return el;
    const sc = listBox();
    if (!sc) return null;
    const scan = async (limit) => {
      let still = 0;
      for (let i = 0; i < limit && !stop; i++) {
        const before = sc.scrollHeight;
        sc.scrollTop += Math.max(200, sc.clientHeight * 0.8);
        await sleep(450);
        const e = here(); if (e) return e;
        if (atBottom(sc) && sc.scrollHeight === before) { if (++still >= 3) return null; await sleep(600); } else still = 0;
      }
      return null;
    };
    el = await scan(400);
    if (el) return el;
    sc.scrollTop = 0; await sleep(400);
    return here() || (await scan(400));
  }

  async function doOne(key, action) {
    const row = await findRow(key);
    if (!row) return 'gone';
    row.scrollIntoView({ block: 'nearest' });
    await sleep(120);
    hover(row);
    const btn = await waitFor(() => moreButton(row), 2000);
    if (!btn) { unhover(row); return 'nomenu'; }
    press(btn);
    const items = await waitFor(() => { const m = menuItems(); return m.length ? m : null; }, 2500);
    if (!items) { unhover(row); return 'nomenu'; }
    const it = items.find((m) => ACT[action].test(visibleText(m)));
    if (!it) { lastItems = items.map(visibleText); escapeMenus(); await sleep(150); unhover(row); return 'skip'; }
    press(it);
    await sleep(400);
    if (action === 'del' || action === 'mute') {
      // excluir pede confirmação; silenciar pode abrir um diálogo de opções
      const RX = action === 'del' ? ACT.del : /^(silenciar mensagens|mute messages|silenciar mensajes|silenciar|mute)\b/i;
      const ok = await waitFor(() => [...document.querySelectorAll('[role="dialog"] button, [role="dialog"] [role="button"], [role="alertdialog"] button')]
        .find((b) => b !== it && b.isConnected && RX.test(visibleText(b)) && b.getBoundingClientRect().height > 0), action === 'del' ? 2500 : 900);
      if (ok) press(ok);
      else if (action === 'del') { escapeMenus(); return 'nomenu'; }
    }
    await sleep(200);
    unhover(row);
    if (blockedNow()) return 'blocked';
    return 'ok';
  }

  async function act(action) {
    lastAction = action;
    if (busy) return;
    if (!SEL.size) { ui.toast(t('pick')); return; }
    if (action === 'del' && !(await confirmDelete(SEL.size))) return;
    busy = true; stop = false;
    const keys = [...SEL];
    const p = ui.$('.prog'); p.hidden = false;
    let done = 0, skipped = 0;
    render();
    try {
      for (let i = 0; i < keys.length; i++) {
        if (stop) break;
        p.querySelector('.st').textContent = t('doing', i + 1, keys.length);
        p.querySelector('.bar i').style.width = Math.round((i / keys.length) * 100) + '%';
        let r = 'err';
        try { r = await doOne(keys[i], action); } catch (e) { r = 'err:' + (e && e.message); }
        lastResult = r;
        if (r === 'ok') { done++; SEL.delete(keys[i]); if (action === 'del') KNOWN.delete(keys[i]); } else skipped++;
        render();
        if (r === 'blocked') { stop = true; ui.toast(t('blocked')); break; }
        // ritmo de gente: 2,5–5 s por conversa e uma pausa maior a cada 20
        if ((i + 1) % 20 === 0 && i + 1 < keys.length) {
          for (let s = Math.round(K().jitter(60, 120)); s > 0 && !stop; s--) { p.querySelector('.st').textContent = t('pause', s); await sleep(1000); }
        } else await sleep(K().jitter(2500, 5000));
      }
      p.querySelector('.bar i').style.width = '100%';
      p.querySelector('.st').textContent = stop ? t('stopped') + ' ' + t('done', done, skipped) : t('done', done, skipped);
      ui.toast(p.querySelector('.st').textContent);
    } finally {
      busy = false; stop = false;
      render();
      setTimeout(() => { if (!busy && ui) ui.$('.prog').hidden = true; layout(); }, 4000);
    }
  }

  function confirmDelete(n) {
    return new Promise((resolve) => {
      const s = ui.$('.scrim');
      s.innerHTML = `<div class="dlg" role="alertdialog"><div class="ic">${SVG.del}</div><h3>${K().esc(t('confirmT', n))}</h3><p>${K().esc(t('confirmB'))}</p>
        <div class="bt"><button class="btn danger ok" type="button">${K().esc(t('confirm'))}</button><button class="btn sec no" type="button">${K().esc(t('back'))}</button></div></div>`;
      s.hidden = false;
      const end = (v) => { s.hidden = true; s.innerHTML = ''; resolve(v); };
      s.querySelector('.ok').addEventListener('click', () => end(true));
      s.querySelector('.no').addEventListener('click', () => end(false));
      s.addEventListener('click', (e) => { if (e.target === s) end(false); });
      s.querySelector('.no').focus();
    });
  }

  // ───────── ciclo ─────────
  let enabled = true;
  function tick() {
    const ok = enabled && inInbox() && API() && K();
    if (!ok) { if (ui) { if (!busy) { selecting = false; SEL.clear(); } ui.$('.fab').hidden = true; ui.$('.tb').hidden = true; ui.$('.ovs').innerHTML = ''; } unpad(); return; }
    lastRows = rows();
    for (const x of lastRows) KNOWN.add(x.key);
    if (!lastRows.length && !busy) { if (ui) { ui.$('.fab').hidden = true; ui.$('.tb').hidden = true; ui.$('.ovs').innerHTML = ''; } return; }
    ensureUI();
    ui.$('.fab').hidden = selecting;
    ui.$('.tb').hidden = !selecting;
    if (selecting) render(); else layout();
  }
  const start = () => {
    if (!API() || !K()) return setTimeout(start, 50);
    const apply = (s) => { enabled = s.inboxTools !== false; };
    API().whenSettings().then(() => apply(API().settings() || {}));
    K().onSettings(apply);
    setInterval(tick, 500);
    // rolar a lista troca as linhas (o Instagram recicla): relê antes de redesenhar as marcações
    const relayout = () => { if (selecting && inInbox()) { lastRows = rows(); for (const x of lastRows) KNOWN.add(x.key); layout(); } };
    let relT = 0;
    addEventListener('scroll', () => { relayout(); clearTimeout(relT); relT = setTimeout(relayout, 60); requestAnimationFrame(relayout); }, { passive: true, capture: true });
    addEventListener('resize', () => layout());
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && selecting && !busy && ui && ui.$('.scrim').hidden) { selecting = false; SEL.clear(); render(); } });
  };
  start();
  const __box = (el) => { if (!el || el.hidden) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  window.__salvaStoriesInboxDebug = () => ({ at: ui ? { fab: __box(ui.$('.fab')), all: __box(ui.$('.all')), acts: Object.fromEntries(ui.$$('.a').map((b) => [b.dataset.a, __box(b)])), ok: __box(ui.$('.scrim .ok')), no: __box(ui.$('.scrim .no')) } : null, inInbox: inInbox(), rows: rows().map((x) => x.key.slice(0, 6) + '…'), selecting, selected: SEL.size, busy, status: ui && ui.$('.prog .st') ? ui.$('.prog .st').textContent : null, lastResult, lastItems, lastAction });
})();
