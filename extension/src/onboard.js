// Salva Stories — tutorial de primeiro uso e quadro de novidades (regra 12 do hub). Mundo MAIN.
// - Instalação nova: na primeira abertura do Instagram aparece o tutorial (poucos passos, "Pular" e "Entendi").
//   Reabre pelo "?" do menu (Como usar).
// - Depois de cada atualização: "Novidades da vX.Y.Z", uma vez por versão, com os textos de src/novidades/<idioma>.js.
// - O "já viu" fica no storage.local da extensão (chave ss.onboard, gravada pelo bridge).
// - Regra 14 (revisada 27/10 20h): os quadros aparecem sozinhos no meio da tela, compactos. Fecham no X ou no Esc.
//   Versão nova: o X só adia (volta em 1 h ou na próxima abertura). Versão URGENTE: sem X, e a extensão pausa até atualizar.
(() => {
  'use strict';
  const KEY = Symbol.for('salvaStories.onboard');
  if (window[KEY]) return;
  const K = () => window[Symbol.for('salvaStories.kit')];
  const API = () => window[Symbol.for('salvaStories.api')];
  const NOV = () => window[Symbol.for('salvaStories.novidades')] || {};
  const STORE = 'ss.onboard';

  const T = {
    pt: {
      tutTitle: 'Como usar o Salva Stories', step: (a, b) => `${a} de ${b}`, skip: 'Pular', next: 'Próximo', back: 'Voltar', ok: 'Entendi', close: 'Fechar',
      newsTitle: (v) => `Novidades da v${v}`,
      updTitle: (v) => `Nova versão v${v}`, updGo: 'Atualizar', updHow: 'Como atualizar', updLater: 'Depois',
      updUrgTitle: (v) => `Atualização urgente v${v}`, updUrgNote: 'Corrige um problema grave. As funções da extensão ficam pausadas até você atualizar.', updSnooze: 'Lembrar daqui a 1 hora',
      updZip: 'O zip novo foi para Downloads. Extraia por cima da pasta da extensão: ela se recarrega sozinha em até 1 minuto.',
      updXpi: 'O Firefox vai perguntar se instala a versão nova: confirme. Ele também se atualiza sozinho.',
      steps: [
        ['Stories e posts', 'Abra um story ou um post: os botões redondos ao lado salvam o atual ou todos (da pessoa ou do carrossel). Atalhos <kbd>D</kbd> e <kbd>Shift</kbd>+<kbd>D</kbd>. Foto no tamanho original, vídeo com som.'],
        ['Menu', 'O ícone com a seta na barra lateral do Instagram (ou <kbd>Alt</kbd>+<kbd>S</kbd>) abre os ajustes: pasta, modo fantasma, idioma e tema.'],
        ['Perfis e vídeos', 'Num perfil, <b>Baixar perfil</b> salva os posts em pastas. Nos vídeos e reels, passe o mouse para ver o player com velocidade e download.'],
        ['Direct e seguidores', 'No Direct, o botão redondo seleciona várias conversas. No menu, em Ferramentas, <b>Seguidores e seguindo</b> mostra quem não te segue de volta.'],
        ['Rodapé do menu', '<b>Procurar atualização</b>, <b>Relatar bug</b> e o <b>?</b> para ver este tutorial de novo.'],
      ],
    },
    en: {
      tutTitle: 'How to use Salva Stories', step: (a, b) => `${a} of ${b}`, skip: 'Skip', next: 'Next', back: 'Back', ok: 'Got it', close: 'Close',
      newsTitle: (v) => `What's new in v${v}`,
      updTitle: (v) => `New version v${v}`, updGo: 'Update', updHow: 'How to update', updLater: 'Later',
      updUrgTitle: (v) => `Urgent update v${v}`, updUrgNote: "Fixes a serious problem. The extension's features are paused until you update.", updSnooze: 'Remind me in 1 hour',
      updZip: 'The new zip went to Downloads. Extract it over the extension folder: it reloads itself within a minute.',
      updXpi: 'Firefox will ask whether to install the new version: confirm. It also updates itself.',
      steps: [
        ['Stories and posts', 'Open a story or a post: the round buttons next to it save the current one or all of them (the person\'s stories or the whole carousel). Shortcuts <kbd>D</kbd> and <kbd>Shift</kbd>+<kbd>D</kbd>. Photos at original size, videos with sound.'],
        ['Menu', 'The arrow icon in Instagram\'s sidebar (or <kbd>Alt</kbd>+<kbd>S</kbd>) opens the settings: folder, ghost mode, language and theme.'],
        ['Profiles and videos', 'On a profile, <b>Download profile</b> saves the posts into folders. On videos and reels, hover to see the player with speed and download.'],
        ['Direct and followers', 'In Direct, the round button selects several chats. In the menu, under Tools, <b>Followers &amp; following</b> shows who doesn\'t follow you back.'],
        ['Menu footer', '<b>Check for updates</b>, <b>Report a bug</b> and the <b>?</b> to see this tutorial again.'],
      ],
    },
    es: {
      tutTitle: 'Cómo usar Salva Stories', step: (a, b) => `${a} de ${b}`, skip: 'Saltar', next: 'Siguiente', back: 'Atrás', ok: 'Entendido', close: 'Cerrar',
      newsTitle: (v) => `Novedades de la v${v}`,
      updTitle: (v) => `Nueva versión v${v}`, updGo: 'Actualizar', updHow: 'Cómo actualizar', updLater: 'Después',
      updUrgTitle: (v) => `Actualización urgente v${v}`, updUrgNote: 'Corrige un problema grave. Las funciones de la extensión quedan en pausa hasta que actualices.', updSnooze: 'Recordar en 1 hora',
      updZip: 'El zip nuevo fue a Descargas. Extráelo sobre la carpeta de la extensión: se recarga sola en hasta 1 minuto.',
      updXpi: 'Firefox preguntará si instala la versión nueva: confirma. También se actualiza solo.',
      steps: [
        ['Historias y publicaciones', 'Abre una historia o una publicación: los botones redondos al lado guardan la actual o todas (de la persona o del carrusel). Atajos <kbd>D</kbd> y <kbd>Shift</kbd>+<kbd>D</kbd>. Fotos en tamaño original, videos con sonido.'],
        ['Menú', 'El ícono con la flecha en la barra lateral de Instagram (o <kbd>Alt</kbd>+<kbd>S</kbd>) abre los ajustes: carpeta, modo fantasma, idioma y tema.'],
        ['Perfiles y videos', 'En un perfil, <b>Descargar perfil</b> guarda las publicaciones en carpetas. En videos y reels, pasa el mouse para ver el reproductor con velocidad y descarga.'],
        ['Direct y seguidores', 'En Direct, el botón redondo selecciona varios chats. En el menú, en Herramientas, <b>Seguidores y seguidos</b> muestra quién no te sigue.'],
        ['Pie del menú', '<b>Buscar actualización</b>, <b>Reportar error</b> y el <b>?</b> para ver este tutorial otra vez.'],
      ],
    },
  };
  // ícone de cada passo (linha, no estilo do menu)
  const IC = [
    '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" stroke-dasharray="3.2 2.2"/><path d="M12 8v7.5M8.8 12.4 12 15.6l3.2-3.2"/>',
    '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v8M8.6 12.2 12 15.6l3.4-3.4"/>',
    '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m10 9.5 4.5 2.5-4.5 2.5z"/>',
    '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5a6 6 0 0 1 12 0M16 5.2a3.2 3.2 0 0 1 0 6.2M21 19.5a6 6 0 0 0-3.6-5.5"/>',
    '<path d="M4 17h16M4 12h10M4 7h16"/><circle cx="19" cy="12" r="1.6"/>',
  ];
  const GIFT = '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>';

  const CSS = `
  .card { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 380px; max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px); overflow: auto; background: var(--bg); color: var(--fg);
    border: 1px solid var(--sep); border-radius: 18px; box-shadow: var(--shadow); pointer-events: auto;
    animation: ssIn .22s ease-out; }
  .card.urg { border-color: rgba(217,58,58,.55); box-shadow: var(--shadow), 0 0 0 3px rgba(217,58,58,.18); }
  .card.urg .app { background: linear-gradient(135deg,#d93a3a,#fa7e1e); }
  .note.urg { background: rgba(217,58,58,.12); color: var(--fg); font-weight: 600; }
  @keyframes ssIn { from { opacity: 0; transform: translate(-50%, calc(-50% + 10px)); } to { opacity: 1; transform: translate(-50%, -50%); } }
  .top { display: flex; align-items: center; gap: 12px; padding: 14px 14px 10px 16px; }
  .app { flex: none; width: 32px; height: 32px; border-radius: 9px; background: var(--grad); display: grid; place-items: center; color: #fff;
    box-shadow: 0 3px 10px -2px rgba(214,41,118,.55); }
  .ttl { min-width: 0; flex: 1; }
  .ttl b { display: block; font-size: 15px; letter-spacing: -.01em; }
  .ttl small { color: var(--sub); font-size: 12.5px; }
  .x { margin-left: auto; flex: none; }
  .bd { padding: 4px 16px 6px; }
  .stp { display: flex; gap: 12px; align-items: flex-start; }
  .stp .ic { flex: none; width: 40px; height: 40px; border-radius: 12px; background: var(--card); display: grid; place-items: center; color: var(--accent); }
  .stp h3 { margin: 2px 0 4px; font-size: 14.5px; }
  .stp p { margin: 0; color: var(--fg); opacity: .92; font-size: 13.5px; line-height: 1.45; }
  kbd { font: 600 11.5px var(--font); background: var(--card); border: 1px solid var(--sep); border-bottom-width: 2px; border-radius: 5px; padding: 0 5px; }
  ul { margin: 2px 0 0; padding-left: 20px; font-size: 13.5px; line-height: 1.45; }
  li { margin: 5px 0; }
  li::marker { color: var(--accent); }
  .ft { display: flex; align-items: center; gap: 8px; padding: 12px 16px 14px; }
  .dots { display: flex; gap: 5px; margin-right: auto; }
  .dots i { width: 6px; height: 6px; border-radius: 99px; background: var(--track); transition: width .2s, background .2s; }
  .dots i.on { width: 16px; background: var(--grad); }
  .btn { height: 34px; padding: 0 14px; font-size: 13.5px; }
  .lk { border: 0; background: none; color: var(--sub); font: 600 13.5px var(--font); cursor: pointer; padding: 0 6px; height: 34px; }
  .lk:hover { color: var(--fg); }
  .langs { display: flex; gap: 2px; align-items: center; padding: 0 16px 2px; font: 700 11px var(--font); letter-spacing: .06em; color: var(--sub); }
  .langs button { border: 0; background: none; font: inherit; color: inherit; cursor: pointer; padding: 3px 5px; border-radius: 6px; }
  .langs button.on { color: var(--fg); background: var(--card); }
  .langs span { opacity: .6; }
  .note { margin: 8px 0 0; padding: 8px 10px; border-radius: 10px; background: var(--card); font-size: 12.5px; line-height: 1.4; }
  `;

  let ui = null, open = null, step = 0, newsVer = null, newsFrom = '';
  const lang = () => (K() ? K().lang() : 'en');
  const t = () => T[lang()] || T.pt;
  const svg = (p) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const esc = (s) => (K() ? K().esc(s) : String(s));

  function ensureUi() {
    if (ui) { ui.refreshMode(); return ui; }
    ui = K().makeHost('salva-stories-onboard', CSS, '<div class="card" role="dialog" aria-modal="false" hidden></div>');
    ui.host.style.zIndex = '2147483001';
    return ui;
  }
  function close() {
    if (!ui) return;
    ui.$('.card').hidden = true;
    const was = open;
    open = null;
    if (was !== 'update') setTimeout(maybeUpdate, 400); // o aviso de versão nova espera o tutorial/novidades
  }
  function renderTutorial() {
    const L = t(), n = L.steps.length, [h, p] = L.steps[step], last = step === n - 1;
    const c = ui.$('.card');
    c.setAttribute('aria-label', L.tutTitle);
    c.innerHTML = `<div class="top"><span class="app">${svg('<path d="M12 6v9M8 11.5 12 15.5l4-4M7 19h10"/>')}</span>
        <span class="ttl"><b>${esc(L.tutTitle)}</b><small>${esc(L.step(step + 1, n))}</small></span>
        <button class="x" type="button" title="${esc(L.close)}" aria-label="${esc(L.close)}">${K().ICON.x}</button></div>
      <div class="bd"><div class="stp"><span class="ic">${svg(IC[step] || IC[0])}</span><div><h3>${esc(h)}</h3><p>${p}</p></div></div></div>
      ${langsHtml()}
      <div class="ft"><span class="dots">${L.steps.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</span>
        ${last ? '' : `<button class="lk skip" type="button">${esc(L.skip)}</button>`}
        ${step > 0 ? `<button class="btn sec back" type="button">${esc(L.back)}</button>` : ''}
        <button class="btn pri go" type="button">${esc(last ? L.ok : L.next)}</button></div>`;
    c.querySelector('.x').addEventListener('click', close);
    const sk = c.querySelector('.skip'); if (sk) sk.addEventListener('click', close);
    const bk = c.querySelector('.back'); if (bk) bk.addEventListener('click', () => { step--; renderTutorial(); });
    c.querySelector('.go').addEventListener('click', () => { if (last) close(); else { step++; renderTutorial(); } });
    wireLangs(c, renderTutorial);
  }
  // seletor PT · EN · ES no próprio quadro (regra 13): troca o idioma da extensão inteira e redesenha
  function langsHtml() {
    return `<div class="langs" role="radiogroup" aria-label="Language">${['pt', 'en', 'es'].map((l, i) => `${i ? '<span>·</span>' : ''}<button type="button" data-l="${l}" role="radio" aria-checked="${lang() === l}" class="${lang() === l ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</div>`;
  }
  function wireLangs(c, redraw) {
    for (const b of c.querySelectorAll('.langs button')) b.addEventListener('click', () => {
      window.postMessage({ __salvaStories: 'page', kind: 'set', patch: { lang: b.dataset.l } }, location.origin);
      const want = b.dataset.l; let n = 0;
      const tick = () => { if (lang() === want || ++n > 20) redraw(); else setTimeout(tick, 50); };
      tick();
    });
  }
  function tutorial() {
    if (!K()) return;
    ensureUi(); open = 'tutorial'; step = 0; renderTutorial(); ui.$('.card').hidden = false;
  }
  function news(v, items) {
    if (!K() || !items || !items.length) return;
    ensureUi(); open = 'news'; newsVer = v;
    const L = t(), c = ui.$('.card');
    c.setAttribute('aria-label', L.newsTitle(v));
    c.innerHTML = `<div class="top"><span class="app">${svg(GIFT)}</span><span class="ttl"><b>${esc(L.newsTitle(v))}</b></span>
        <button class="x" type="button" title="${esc(L.close)}" aria-label="${esc(L.close)}">${K().ICON.x}</button></div>
      <div class="bd"><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      ${langsHtml()}
      <div class="ft"><span class="dots"></span><button class="btn pri go" type="button">${esc(L.ok)}</button></div>`;
    c.querySelector('.x').addEventListener('click', close);
    c.querySelector('.go').addEventListener('click', close);
    wireLangs(c, () => news(v, itensDe(newsFrom, v)));
    c.hidden = false;
  }
  // Esc fecha (só quando um quadro está aberto; não mexe em mais nada da página)
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !open) return;
    if (open === 'update') { if (isUrgent()) return; snooze(); }
    close();
  }, true);

  const versaoQuandoChegar = async () => {
    for (let i = 0; i < 60; i++) { const v = K() && K().version(); if (v) return v; await new Promise((r) => setTimeout(r, 100)); }
    return '';
  };
  const cmpVer = (a, b) => { const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0), pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; };
  // tudo o que mudou depois da versão que a pessoa viu por último até a atual (mais nova primeiro, até 8 frases)
  const itensDe = (from, to) => {
    const L = NOV()[lang()] || NOV().en || NOV().pt || {};
    const vs = Object.keys(L).filter((x) => cmpVer(x, to) <= 0 && (!from || cmpVer(x, from) > 0)).sort((a, b) => cmpVer(b, a));
    const out = [].concat(...vs.map((x) => L[x] || []));
    return out.length ? out.slice(0, 8) : null;
  };

  // ───────── aviso de versão nova (regra 14, revisada 27/10 20h) ─────────
  // Aparece sozinho no meio da tela, na hora em que o service worker acha a versão (sem recarregar a página).
  // O X e o Esc só adiam: volta depois de 1 h (nesta página) ou na próxima abertura do Instagram, até atualizar.
  // URGENTE no título do Release: sem X, Esc não fecha, e a extensão fica pausada (kit.js, page.js, sw.js).
  const SNOOZE_MS = 60 * 60000;
  let upd = {}, updBusy = false, updDone = null, snoozeUntil = 0, snoozedVer = null, snoozeT = 0, ready = false;
  const isUrgent = () => !!(upd.urgente && upd.disponivel);
  function snooze() {
    snoozeUntil = Date.now() + SNOOZE_MS; snoozedVer = upd.ultima;
    updCmd('dismiss', upd.ultima);
    clearTimeout(snoozeT); snoozeT = setTimeout(maybeUpdate, SNOOZE_MS + 500);
  }
  const updCmd = (cmd, data) => window.postMessage({ __salvaStories: 'page', kind: 'updCmd', cmd, data }, location.origin);
  const noteItems = (md) => String(md || '').replace(/^\s*#+\s*Install[\s\S]*?(\n\s*\n)(?=\S)/i, '').split(/\r?\n/)
    .map((l) => l.replace(/^\s*(#+|[-*+]|\d+\.)\s*/, '').replace(/[*_`]/g, '').trim())
    .filter((l) => l && !/^(install|download|open .?chrome|drag the zip|chrome, edge|firefox 1)/i.test(l))
    .flatMap((l) => (l.length > 170 ? l.split(/(?<=[.!?])\s+/) : [l])).filter(Boolean).slice(0, 4);
  function updateCard() {
    ensureUi(); open = 'update';
    const L = t(), c = ui.$('.card'), items = noteItems(upd.notas), urg = isUrgent();
    const title = urg ? L.updUrgTitle(upd.ultima) : L.updTitle(upd.ultima);
    c.classList.toggle('urg', urg);
    c.setAttribute('aria-label', title);
    c.innerHTML = `<div class="top"><span class="app">${svg(GIFT)}</span><span class="ttl"><b>${esc(title)}</b><small>v${esc(K().version())} → v${esc(upd.ultima)}</small></span>
        ${urg ? '' : `<button class="x" type="button" title="${esc(L.updSnooze)}" aria-label="${esc(L.updSnooze)}">${K().ICON.x}</button>`}</div>
      <div class="bd">${urg ? `<div class="note urg">${esc(L.updUrgNote)}</div>` : ''}${items.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${updDone ? `<div class="note">${esc(updDone === 'xpi' || IS_FF ? L.updXpi : L.updZip)}</div>` : ''}</div>
      ${langsHtml()}
      <div class="ft"><span class="dots"></span><button class="lk how" type="button">${esc(L.updHow)}</button>
        <button class="btn pri go" type="button"${updBusy ? ' disabled' : ''}>${esc(updBusy ? '…' : L.updGo)}</button></div>`;
    if (!urg) c.querySelector('.x').addEventListener('click', () => { snooze(); close(); });
    c.querySelector('.how').addEventListener('click', () => updCmd('guide', '#atualizar'));
    c.querySelector('.go').addEventListener('click', () => { updBusy = true; updateCard(); updCmd('apply'); });
    wireLangs(c, updateCard);
    c.hidden = false;
  }
  const IS_FF = /Firefox\//.test(navigator.userAgent);
  function maybeUpdate() {
    if (!ready || !K()) return;
    const v = K().version();
    if (!upd.disponivel || !upd.ultima || !v || cmpVer(upd.ultima, v) <= 0) return;
    // urgente passa na frente de tutorial/novidades; o normal espera eles fecharem e respeita o adiamento
    if (isUrgent()) { if (open !== 'update') updateCard(); return; }
    if (open || (Date.now() < snoozeUntil && snoozedVer === upd.ultima)) return; // versão mais nova que a adiada aparece na hora
    updateCard();
  }
  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (ev.source !== window || !d || d.__salvaStories !== 'ext') return;
    if (d.kind === 'upd') { upd = d.state || {}; if (open === 'update') { if (!upd.disponivel) close(); else updateCard(); } else maybeUpdate(); }
    if (d.kind === 'updRes' && d.cmd === 'apply') { updBusy = false; updDone = (d.res && d.res.modo) || 'download'; if (open === 'update') updateCard(); }
  });

  async function start() {
    if (!K() || !API()) return setTimeout(start, 100);
    try { await API().whenSettings(); } catch (_) {}
    const v = await versaoQuandoChegar();
    if (!v) return;
    let ob = await K().lget(STORE);
    if (ob === undefined) return; // ponte fora do ar (extensão recarregando): tenta na próxima página
    await new Promise((r) => setTimeout(r, 1200)); // deixa o Instagram desenhar primeiro
    if (!ob || ob.tutorial === 'pendente') {
      await K().lset(STORE, Object.assign({}, ob || {}, { tutorial: 'visto', visto: v }));
      ready = true;
      tutorial();
      return;
    }
    ready = true;
    if (ob.visto !== v) {
      await K().lset(STORE, Object.assign({}, ob, { visto: v }));
      newsFrom = ob.visto || '';
      news(v, itensDe(newsFrom, v));
      if (open) return;
    }
    window.postMessage({ __salvaStories: 'page', kind: 'hello' }, location.origin); // pede o estado da atualização de novo
    maybeUpdate();
  }
  start();

  Object.defineProperty(window, KEY, { value: Object.freeze({ tutorial, news: (from) => { newsFrom = from || ''; news(K().version(), itensDe(newsFrom, K().version())); } }) });
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  window.__salvaStoriesOnboardDebug = () => ({
    open, step, newsVer, lang: lang(),
    title: ui && !ui.$('.card').hidden ? (ui.$('.ttl b') || {}).textContent : null,
    items: ui && (open === 'news' || open === 'update') ? ui.$$('li').map((l) => l.textContent) : null, upd: { disponivel: upd.disponivel, ultima: upd.ultima, urgente: !!upd.urgente }, updDone,
    hasX: !!(ui && open && ui.$('.x')), snoozeUntil, paused: document.documentElement.dataset.ssPaused === '1',
    rect: ui && open ? (() => { const r = ui.$('.card').getBoundingClientRect(); return { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), vw: innerWidth, vh: innerHeight }; })() : null,
    note: ui && open === 'update' && ui.$('.note') ? ui.$('.note').textContent : null,
    at: ui && open ? { close: box(ui.$('.x')), next: box(ui.$('.go')), skip: box(ui.$('.skip')), back: box(ui.$('.back')), how: box(ui.$('.how')) } : null,
  });
})();
