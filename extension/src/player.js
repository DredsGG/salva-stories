// Salva Stories — player próprio nos vídeos do Instagram (feed, reels, posts; fora dos stories).
// Uma barra flutuante aparece sobre o vídeo em que o mouse está: pausar, voltar/avançar 10 s, linha do tempo,
// velocidade (0,5× a 2×), volume e baixar. Não troca o <video> do Instagram: só comanda o elemento que já existe.
(() => {
  'use strict';
  if (window.__salvaStoriesPlayer) return;
  window.__salvaStoriesPlayer = true;
  const API = () => window[Symbol.for('salvaStories.api')];
  const K = () => window[Symbol.for('salvaStories.kit')];

  const T = {
    pt: { play: 'Reproduzir', pause: 'Pausar', back: 'Voltar 10 s', fwd: 'Avançar 10 s', speed: 'Velocidade', mute: 'Sem som', unmute: 'Com som', vol: 'Volume',
      dl: 'Baixar vídeo', saving: 'Baixando o vídeo…', saved: 'Vídeo salvo em', noId: 'Não achei este vídeo nos dados do Instagram. Abra o post e tente de novo.', fail: 'Falhou:', normal: 'Normal' },
    en: { play: 'Play', pause: 'Pause', back: 'Back 10 s', fwd: 'Forward 10 s', speed: 'Speed', mute: 'Mute', unmute: 'Unmute', vol: 'Volume',
      dl: 'Download video', saving: 'Downloading the video…', saved: 'Video saved to', noId: "Couldn't find this video in Instagram's data. Open the post and try again.", fail: 'Failed:', normal: 'Normal' },
    es: { play: 'Reproducir', pause: 'Pausar', back: 'Atrás 10 s', fwd: 'Adelantar 10 s', speed: 'Velocidad', mute: 'Silenciar', unmute: 'Activar sonido', vol: 'Volumen',
      dl: 'Descargar video', saving: 'Descargando el video…', saved: 'Video guardado en', noId: 'No encontré este video en los datos de Instagram. Abre la publicación e inténtalo de nuevo.', fail: 'Falló:', normal: 'Normal' },
  };
  let t = (k) => k;

  const I = {
    play: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="20" height="20"><rect fill="currentColor" x="6" y="4.5" width="4.2" height="15" rx="1.2"/><rect fill="currentColor" x="13.8" y="4.5" width="4.2" height="15" rx="1.2"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/><text x="12" y="15.6" text-anchor="middle" font-size="8" font-weight="800" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">10</text></svg>',
    fwd: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v5h-5"/><text x="12" y="15.6" text-anchor="middle" font-size="8" font-weight="800" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">10</text></svg>',
    vol: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4"/><path d="M18.3 6a8.5 8.5 0 0 1 0 12"/></svg>',
    muted: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
  };

  const CSS = `
  .bar2 { position: fixed; display: grid; gap: 4px; padding: 6px 8px 7px; border-radius: 14px; color: #fff;
    background: rgba(16,16,18,.66); -webkit-backdrop-filter: blur(16px) saturate(1.4); backdrop-filter: blur(16px) saturate(1.4);
    box-shadow: 0 6px 24px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.08); opacity: 0; transform: translateY(6px);
    transition: opacity .18s, transform .18s; pointer-events: none; user-select: none; }
  .bar2.show { opacity: 1; transform: none; pointer-events: auto; }
  .seek { position: relative; height: 16px; cursor: pointer; touch-action: none; }
  .seek .tr { position: absolute; left: 0; right: 0; top: 6px; height: 4px; border-radius: 99px; background: rgba(255,255,255,.22); overflow: hidden; transition: top .12s, height .12s; }
  .seek:hover .tr, .seek.drag .tr { top: 5px; height: 6px; }
  .seek .bf { position: absolute; inset: 0 auto 0 0; background: rgba(255,255,255,.3); }
  .seek .fl { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg,#962fbf,#d62976 55%,#fa7e1e); }
  .seek .kn { position: absolute; top: 2px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); transform: scale(0); transition: transform .12s; }
  .seek:hover .kn, .seek.drag .kn { transform: scale(1); }
  .seek .tip { position: absolute; bottom: 20px; padding: 3px 7px; border-radius: 6px; background: rgba(0,0,0,.85); font: 600 11.5px var(--font); transform: translateX(-50%); display: none; white-space: nowrap; }
  .seek:hover .tip { display: block; }
  .row { display: flex; align-items: center; gap: 2px; min-width: 0; }
  .b { width: 34px; height: 34px; flex: none; border: 0; padding: 0; border-radius: 50%; display: grid; place-items: center; background: transparent; color: #fff; cursor: pointer; transition: background .12s, transform .1s; }
  .b:hover { background: rgba(255,255,255,.14); } .b:active { transform: scale(.9); }
  .b svg { display: block; pointer-events: none; }
  .time { font: 600 12.5px var(--font); font-variant-numeric: tabular-nums; padding: 0 6px; opacity: .92; white-space: nowrap; }
  .sp { flex: 1; min-width: 4px; }
  .spd { width: auto; min-width: 42px; padding: 0 9px; border-radius: 99px; font: 800 12.5px var(--font); font-variant-numeric: tabular-nums; }
  .spd.on { background: linear-gradient(135deg,#962fbf,#d62976 55%,#fa7e1e); }
  .volg { display: flex; align-items: center; }
  .vs { width: 0; opacity: 0; transition: width .18s, opacity .18s; height: 34px; display: flex; align-items: center; }
  /* o controle de volume abre para a esquerda: o alto-falante fica parado debaixo do mouse (antes ele era empurrado e o clique caía no controle) */
  .volg:hover .vs, .volg.drag .vs { width: 74px; opacity: 1; margin-right: 4px; }
  .vt { position: relative; width: 70px; height: 4px; border-radius: 99px; background: rgba(255,255,255,.25); cursor: pointer; touch-action: none; }
  .vt i { position: absolute; inset: 0 auto 0 0; border-radius: 99px; background: #fff; }
  .vt b { position: absolute; top: -4px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: #fff; }
  .dl { background: linear-gradient(135deg,#962fbf,#d62976 55%,#fa7e1e); margin-left: 4px; box-shadow: 0 2px 10px -2px rgba(214,41,118,.7); }
  .dl:hover { background: linear-gradient(135deg,#962fbf,#d62976 55%,#fa7e1e); filter: brightness(1.12); }
  .dl.busy svg { animation: bob 1s ease-in-out infinite; }
  @keyframes bob { 50% { transform: translateY(2px); } }
  .menu { position: fixed; display: grid; gap: 2px; padding: 6px; border-radius: 12px; background: rgba(16,16,18,.9); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
    box-shadow: 0 8px 28px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08); color: #fff; min-width: 116px; }
  .menu .h { font: 700 11px var(--font); letter-spacing: .08em; text-transform: uppercase; opacity: .6; padding: 4px 8px 6px; }
  .menu button { height: 30px; border: 0; border-radius: 8px; background: transparent; color: #fff; font: 600 13px var(--font); text-align: left; padding: 0 10px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .menu button:hover { background: rgba(255,255,255,.12); }
  .menu button.on::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg,#962fbf,#fa7e1e); }
  .narrow .time .dur { display: none; }
  `;
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // preferências do player (velocidade e volume escolhidos), só neste navegador
  const PREF_KEY = 'salvaStories.player';
  let pref = { rate: 1, vol: 1 };
  try { pref = Object.assign(pref, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (_) {}
  const savePref = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch (_) {} };

  let ui = null, cur = null, hideT = 0, lastMove = 0, overBar = false, dragging = null, enabled = true;

  function ensureUI() {
    if (ui && ui.host.isConnected) return;
    ui = K().makeHost('salva-stories-player', CSS, `
      <div class="bar2" role="toolbar">
        <div class="seek"><div class="tr"><div class="bf"></div><div class="fl"></div></div><div class="kn"></div><div class="tip"></div></div>
        <div class="row">
          <button class="b pp" type="button"></button>
          <button class="b bk" type="button">${I.back}</button>
          <button class="b fw" type="button">${I.fwd}</button>
          <span class="time"><span class="cu">0:00</span><span class="dur"> / 0:00</span></span>
          <span class="sp"></span>
          <button class="b spd" type="button">1×</button>
          <span class="volg"><span class="vs"><span class="vt"><i></i><b></b></span></span><button class="b mu" type="button"></button></span>
          <button class="b dl" type="button">${K().ICON.dl}</button>
        </div>
      </div>
      <div class="menu" hidden></div>`);
    const $ = ui.$;
    const bar = $('.bar2');
    bar.addEventListener('pointerleave', () => { overBar = false; poke(); });
    // "Toque": apertou e soltou no mesmo botão → age. Não depende do evento click do navegador (que se perdia quando o
    // conteúdo do botão mudava entre apertar e soltar). Teclado (Enter/Espaço) continua pelo click com detail 0.
    const onTap = (btn, fn) => {
      let downAt = 0;
      btn.addEventListener('pointerdown', (e) => { if (e.button === 0) downAt = Date.now(); });
      btn.addEventListener('pointerup', (e) => { if (e.button === 0 && downAt && Date.now() - downAt < 1500) { downAt = 0; btn.__tapAt = Date.now(); fn(e); } });
      btn.addEventListener('pointerleave', () => { downAt = 0; });
      btn.addEventListener('click', (e) => { if (Date.now() - (btn.__tapAt || 0) < 700) return; if (e.detail === 0 || !btn.__tapAt) fn(e); });
    };
    onTap($('.pp'), () => {
      armDiag(); const before = cur; const ok = fresh(); diag('click pp', { switched: before !== cur, ok });
      if (!ok) return; cur.paused ? resume(cur) : hold(cur); sync();
      setTimeout(() => diag('pp +300ms'), 300); setTimeout(() => diag('pp +1500ms'), 1500);
    });
    onTap($('.bk'), () => { if (fresh()) { cur.currentTime = Math.max(0, cur.currentTime - 10); sync(); } });
    onTap($('.fw'), () => { if (!fresh()) return; const d = cur.duration; cur.currentTime = isFinite(d) && d > 0 ? Math.min(d - 0.1, cur.currentTime + 10) : cur.currentTime + 10; sync(); });
    onTap($('.mu'), () => {
      armDiag(); const before = cur; const ok = fresh(); diag('click mu', { switched: before !== cur, ok });
      if (!ok) return; setMuted(cur, !cur.muted); sync();
      setTimeout(() => diag('mu +300ms'), 300); setTimeout(() => diag('mu +1500ms'), 1500);
    });
    // qualquer pressionar dentro da barra: qual botão recebeu
    bar.addEventListener('pointerdown', (e) => { const b = e.target && e.target.closest && e.target.closest('button, .seek, .vt'); diag('down bar', { on: b ? String(b.className).slice(0, 20) : String((e.target && e.target.className) || '?').slice(0, 20) }); }, true);
    onTap($('.spd'), (e) => { e.stopPropagation(); toggleSpeedMenu(); });
    onTap($('.dl'), download);
    // linha do tempo
    const seek = $('.seek');
    const seekAt = (x) => { const r = seek.getBoundingClientRect(); return Math.max(0, Math.min(1, (x - r.left) / r.width)); };
    seek.addEventListener('pointermove', (e) => {
      if (!cur || !isFinite(cur.duration)) return;
      const f = seekAt(e.clientX), tip = $('.tip');
      tip.textContent = fmt(f * cur.duration); tip.style.left = (f * 100) + '%';
      if (dragging === 'seek') { cur.currentTime = f * cur.duration; sync(); }
    });
    seek.addEventListener('pointerdown', (e) => {
      if (!fresh() || !isFinite(cur.duration)) return;
      dragging = 'seek'; seek.classList.add('drag'); seek.setPointerCapture(e.pointerId);
      cur.currentTime = seekAt(e.clientX) * cur.duration; sync();
    });
    const endDrag = () => { dragging = null; seek.classList.remove('drag'); $('.volg').classList.remove('drag'); };
    seek.addEventListener('pointerup', endDrag); seek.addEventListener('pointercancel', endDrag);
    // volume
    const vt = $('.vt');
    const volAt = (x) => { const r = vt.getBoundingClientRect(); return Math.max(0, Math.min(1, (x - r.left) / r.width)); };
    const setVolFrom = (x) => { if (!cur) return; const v = volAt(x); cur.volume = v; pref.vol = v; savePref(); setMuted(cur, v === 0); sync(); };
    vt.addEventListener('pointerdown', (e) => { fresh(); dragging = 'vol'; $('.volg').classList.add('drag'); vt.setPointerCapture(e.pointerId); setVolFrom(e.clientX); });
    vt.addEventListener('pointermove', (e) => { if (dragging === 'vol') setVolFrom(e.clientX); });
    vt.addEventListener('pointerup', endDrag); vt.addEventListener('pointercancel', endDrag);
    addEventListener('pointerdown', (e) => { if (!$('.menu').hidden && !e.composedPath().includes(ui.host)) $('.menu').hidden = true; }, true);
  }

  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  const rateLabel = (r) => String(r).replace('.', K().lang() === 'en' ? '.' : ',') + '×';

  // Pausa que o Instagram respeita. O gerenciador de vídeos do feed acha que o vídeo ainda está tocando e chama play()
  // de novo quando a página rola (medido no feed real, 26/10/2026). Enquanto o usuário pausou pelo nosso botão, os
  // play() do Instagram nesse vídeo são ignorados. Solta ao dar play pelo nosso botão, ao tocar no vídeo do Instagram
  // ou quando a fonte do vídeo muda.
  const NATIVE_PLAY = HTMLMediaElement.prototype.play;
  function guard(v) {
    if (v.__ssGuard) return;
    v.__ssGuard = true;
    v.play = function () { if (Date.now() < diagUntil) diag('v.play()', { hold: !!v.__ssHold, by: stackTop() }); if (v.__ssHold) { API() && API().log('info', { pt: 'player: play() do Instagram ignorado (pausado pelo usuário)', en: "player: Instagram's play() ignored (paused by the user)", es: 'player: play() de Instagram ignorado (pausado por el usuario)' }); return Promise.resolve(); } return NATIVE_PLAY.call(v); };
    // reserva: se algo tocar mesmo assim, pausa de novo
    v.addEventListener('play', () => { if (v.__ssHold) v.pause(); });
    v.addEventListener('loadstart', () => { if (v.__ssHold && v.__ssHoldSrc && v.currentSrc && v.currentSrc !== v.__ssHoldSrc) v.__ssHold = false; });
  }
  // ───────── diagnóstico (relato do André, 27/10: pause e alto-falante não funcionam no Reels dele) ─────────
  // Grava no storage.local ('ss.diag.player') o que acontece quando ele clica: botão, estado do vídeo antes/depois e
  // quem chamou play/pause/muted logo depois (pilha só com endereços de script). Nada da conta.
  const DIAG = [];
  let diagUntil = 0, diagT = 0;
  const vinfo = (v) => { if (!v) return null; const r = v.getBoundingClientRect(); return { p: v.paused, m: v.muted, vol: Math.round(v.volume * 100) / 100, t: Math.round(v.currentTime * 10) / 10, top: Math.round(r.top), h: Math.round(r.height), con: v.isConnected, hold: !!v.__ssHold }; };
  const pageKind = () => { const p = location.pathname; return p.startsWith('/reels') ? 'reels' : /\/reel\//.test(p) ? 'reel' : /\/p\//.test(p) ? 'post' : p === '/' ? 'feed' : 'other'; };
  const stackTop = () => String(new Error().stack || '').split('\n').slice(3, 6).map((l) => l.trim().replace(/https:\/\/static\.cdninstagram\.com\/rsrc\.php\/[^ )]*\//, 'ig/').slice(0, 90)).join(' < ');
  function diag(ev, extra) {
    try {
      DIAG.push(Object.assign({ t: Date.now(), ev, pg: pageKind(), ver: (K() && K().version()) || '', cur: vinfo(cur), dlg: !!document.querySelector('[role="dialog"]') }, extra || {}));
      if (DIAG.length > 80) DIAG.splice(0, DIAG.length - 80);
      clearTimeout(diagT); diagT = setTimeout(() => { try { K().lset('ss.diag.player', DIAG.slice()); } catch (_) {} }, 400);
    } catch (_) {}
  }
  const armDiag = () => { diagUntil = Date.now() + 4000; };
  {
    const P = HTMLMediaElement.prototype, op = P.play, opa = P.pause, md = Object.getOwnPropertyDescriptor(P, 'muted');
    P.play = function () { if (Date.now() < diagUntil && this === cur) diag('play()', { by: stackTop() }); return op.apply(this, arguments); };
    P.pause = function () { if (Date.now() < diagUntil && this === cur) diag('pause()', { by: stackTop() }); return opa.apply(this, arguments); };
    if (md && md.set) Object.defineProperty(P, 'muted', { configurable: true, enumerable: md.enumerable, get: md.get, set(val) { if (Date.now() < diagUntil && this === cur && !!val !== this.muted) diag('muted=' + !!val, { by: stackTop() }); return md.set.call(this, val); } });
  }

  function hold(v) { guard(v); v.__ssHold = true; v.__ssHoldSrc = v.currentSrc; v.pause(); }
  function resume(v) { v.__ssHold = false; NATIVE_PLAY.call(v).catch(() => {}); }
  // pressionar onde a barra está, mas que não chegou nela (algo por cima, ou a barra já tinha sumido)
  addEventListener('pointerdown', (e) => {
    if (!ui || (e.composedPath && e.composedPath().includes(ui.host))) return;
    const r = ui.$('.bar2').getBoundingClientRect();
    if (r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4) {
      armDiag();
      const el = e.composedPath ? e.composedPath()[0] : e.target;
      diag('down MISSED bar', { shown: ui.$('.bar2').classList.contains('show'), op: getComputedStyle(ui.$('.bar2')).opacity, tgt: (el && el.tagName) || '?', role: (el && el.getAttribute && (el.getAttribute('role') || el.getAttribute('aria-label'))) || '' });
    }
  }, true);
  // toque no próprio vídeo (fora da nossa barra) devolve o controle ao Instagram
  addEventListener('pointerdown', (e) => {
    const v = cur;
    if (!v || !v.__ssHold || (ui && e.composedPath().includes(ui.host))) return;
    const r = v.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) v.__ssHold = false;
  }, true);

  // o Instagram costuma remutar o vídeo logo depois; se o usuário pediu som pelo nosso botão, devolve uma vez
  // ───────── som no Reels (pedido do André, 28/10/2026) ─────────
  // O Instagram guarda "som ligado" num estado dele, que só muda pelo botão de som DELE: quem desmutava pelo nosso
  // alto-falante (só o <video>) via o reel seguinte voltar mudo. No Reels, o nosso alto-falante usa o botão do
  // Instagram, e com "Som ligado no Reels" (padrão) o som já vem ligado e continua ao passar de reel. Se a pessoa
  // mutar, fica mudo até sair do Reels.
  let reelsSound = true, reelsUserMuted = false, lastReelsPath = false, audioTouchedAt = 0;
  const onReels = () => /^\/reels?\//.test(location.pathname);
  const AUDIO_RE = /áudio|audio|sonido|\bsom\b|sound/i;
  function igAudioToggle(v) {
    if (!v) return null;
    const r = v.getBoundingClientRect();
    for (const sv of document.querySelectorAll('svg[aria-label]')) {
      if (!AUDIO_RE.test(sv.getAttribute('aria-label') || '')) continue;
      const q = sv.getBoundingClientRect();
      if (q.width && q.left >= r.left - 4 && q.right <= r.right + 40 && q.top >= r.top - 4 && q.bottom <= r.bottom + 40) return sv.closest('[role="button"], button') || sv.parentElement;
    }
    return null;
  }
  const activeReel = () => [...document.querySelectorAll('video')].find((x) => { const q = x.getBoundingClientRect(); return q.width > 150 && q.top < innerHeight / 2 && q.bottom > innerHeight / 2 && q.left < innerWidth / 2 + 300 && q.right > innerWidth / 2 - 300; }) || null;
  // liga/desliga o som pelo botão do Instagram (estado dele fica certo); sem o botão, direto no vídeo
  function igSetMuted(v, m) {
    const tg = onReels() ? igAudioToggle(v) : null;
    if (tg && v.muted !== m) { tg.__ssOurs = Date.now(); tg.click(); setTimeout(() => { if (v.muted !== m) v.muted = m; }, 120); return true; }
    return false;
  }
  const hasActivation = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
  function reelsTick() {
    const here = onReels();
    if (here !== lastReelsPath) { lastReelsPath = here; if (here) reelsUserMuted = false; } // entrou no Reels de novo: volta a ligar o som
    if (!here || !reelsSound || reelsUserMuted || !enabled) return;
    if (Date.now() - audioTouchedAt < 1500) return; // a pessoa acabou de mexer no som: não disputa o clique
    const v = activeReel();
    if (v && !v.muted) v.__ssMutedSince = 0;
    if (!v || !v.muted || v.__ssAutoTried === v.currentSrc) return;
    if (!hasActivation()) return; // o navegador só deixa tocar com som depois de um clique/tecla na página
    // o reel que acabou de entrar pode nascer mudo por um instante antes de o Instagram aplicar o estado dele:
    // só age se ele continua mudo e tocando há 700 ms (senão o clique no botão do Instagram inverteria o som)
    const now = Date.now();
    if (!v.__ssMutedSince) { v.__ssMutedSince = now; return; }
    if (now - v.__ssMutedSince < 700 || v.paused) return;
    v.__ssAutoTried = v.currentSrc;
    if (!igSetMuted(v, false)) v.muted = false;
    if (v.volume === 0) v.volume = pref.vol || 1;
  }
  setInterval(reelsTick, 400);
  addEventListener('pointerdown', () => setTimeout(reelsTick, 60), true);
  addEventListener('keydown', () => setTimeout(reelsTick, 60), true);
  // a pessoa mutou pelo botão de som do Instagram: respeita até sair do Reels
  addEventListener('click', (e) => {
    if (!onReels() || !e.isTrusted) return;
    const sv = e.target && e.target.closest && e.target.closest('[role="button"], button');
    if (!sv || (sv.__ssOurs && Date.now() - sv.__ssOurs < 500)) return;
    const svgEl = sv.querySelector('svg[aria-label]');
    if (!svgEl || !AUDIO_RE.test(svgEl.getAttribute('aria-label') || '')) return;
    const v = activeReel();
    audioTouchedAt = Date.now();
    if (v) reelsUserMuted = !v.muted; // este listener roda antes do Instagram trocar o estado: o novo estado é o oposto
    setTimeout(() => { if (v) reelsUserMuted = v.muted; }, 300);
  }, true);

  function setMuted(v, m) {
    if (onReels()) { reelsUserMuted = m; audioTouchedAt = Date.now(); }
    if (!igSetMuted(v, m)) v.muted = m;
    v.__ssSoundAt = m ? 0 : Date.now();
    if (!m && v.volume === 0) v.volume = pref.vol || 1;
  }
  function adopt(v) {
    if (v.__ssAdopted) return;
    v.__ssAdopted = true;
    try { v.volume = pref.vol; } catch (_) {}
    if (pref.rate !== 1) v.playbackRate = pref.rate;
    v.addEventListener('volumechange', () => { if (v.muted && v.__ssSoundAt && Date.now() - v.__ssSoundAt < 3500 && !onReels()) { v.__ssSoundAt = 0; v.muted = false; } if (v === cur) sync(); }); // no Reels o som segue o estado do Instagram (botão dele), sem brigar
    // o Instagram às vezes recria a fonte e volta para 1×
    v.addEventListener('ratechange', () => { if (v === cur) sync(); });
    // o Instagram troca a fonte (loadstart) e às vezes zera volume/velocidade ao dar play: reaplica
    const reapply = () => { if (pref.rate !== 1 && v.playbackRate !== pref.rate) v.playbackRate = pref.rate; if (Math.abs(v.volume - pref.vol) > 0.01 && pref.vol > 0) v.volume = pref.vol; };
    v.addEventListener('loadedmetadata', reapply); v.addEventListener('loadstart', reapply); v.addEventListener('play', reapply);
    for (const ev of ['play', 'pause', 'durationchange']) v.addEventListener(ev, () => { if (v === cur) sync(); });
  }

  function toggleSpeedMenu() {
    const m = ui.$('.menu');
    if (!m.hidden) { m.hidden = true; return; }
    const r0 = cur ? cur.playbackRate : 1;
    m.innerHTML = `<div class="h">${K().esc(t('speed'))}</div>` + RATES.slice().reverse().map((r) => `<button type="button" data-r="${r}" class="${Math.abs(r - r0) < 0.01 ? 'on' : ''}">${r === 1 ? K().esc(t('normal')) : rateLabel(r)}</button>`).join('');
    for (const b of m.querySelectorAll('button')) b.addEventListener('click', () => {
      const r = +b.dataset.r;
      pref.rate = r; savePref();
      if (cur) cur.playbackRate = r;
      m.hidden = true; sync();
    });
    m.hidden = false;
    const br = ui.$('.spd').getBoundingClientRect();
    const h = m.offsetHeight, w = m.offsetWidth;
    m.style.left = Math.round(Math.min(innerWidth - w - 8, Math.max(8, br.left + br.width / 2 - w / 2))) + 'px';
    m.style.top = Math.round(br.top - h - 10 < 8 ? br.bottom + 10 : br.top - h - 10) + 'px';
  }

  function setIcon(btn, key) { if (btn.dataset.icon !== key) { btn.dataset.icon = key; btn.innerHTML = I[key]; } }
  function sync() {
    if (!ui || !cur) return;
    const $ = ui.$, v = cur, d = v.duration;
    // Só troca o ícone quando o estado muda. Antes trocava a cada quadro: o <svg> que recebia o aperto do mouse era
    // substituído antes de soltar e o Chrome descartava o clique (pause e alto-falante "não faziam nada"; medido no
    // Reels do André em 27/10/2026 com o diagnóstico: o aperto chegava no botão, o clique nunca).
    setIcon($('.pp'), v.paused ? 'play' : 'pause');
    $('.pp').title = v.paused ? t('play') : t('pause');
    $('.bk').title = t('back'); $('.fw').title = t('fwd');
    setIcon($('.mu'), v.muted || v.volume === 0 ? 'muted' : 'vol');
    $('.mu').title = v.muted ? t('unmute') : t('mute');
    $('.dl').title = t('dl');
    $('.spd').textContent = rateLabel(v.playbackRate || 1);
    $('.spd').title = t('speed');
    $('.spd').classList.toggle('on', Math.abs((v.playbackRate || 1) - 1) > 0.01);
    const vol = v.muted ? 0 : v.volume;
    $('.vt i').style.width = (vol * 100) + '%'; $('.vt b').style.left = (vol * 100) + '%';
    const ok = isFinite(d) && d > 0;
    $('.seek').style.visibility = ok ? '' : 'hidden';
    const f = ok ? v.currentTime / d : 0;
    $('.fl').style.width = (f * 100) + '%'; $('.kn').style.left = (f * 100) + '%';
    let bf = 0;
    try { for (let i = 0; i < v.buffered.length; i++) if (v.buffered.start(i) <= v.currentTime + 0.5) bf = Math.max(bf, v.buffered.end(i)); } catch (_) {}
    $('.bf').style.width = (ok ? Math.min(1, bf / d) * 100 : 0) + '%';
    $('.cu').textContent = fmt(v.currentTime);
    $('.dur').textContent = ok ? ' / ' + fmt(d) : '';
  }

  // ───────── qual vídeo está sob o mouse ─────────
  const onStories = () => location.pathname.startsWith('/stories/');
  function videoAt(x, y) {
    const els = document.elementsFromPoint(x, y).filter((e) => !(e.tagName || '').startsWith('SALVA-STORIES'));
    const v = els.find((e) => e.tagName === 'VIDEO');
    if (!v) return null;
    const r = v.getBoundingClientRect();
    if (r.width < 200 || r.height < 150) return null;
    // vídeo por baixo de um diálogo aberto (ex.: post aberto sobre o feed) não conta
    const top = els[0];
    const dlg = (e) => e && e.closest && e.closest('[role="dialog"]');
    if (top && dlg(top) !== dlg(v)) return null;
    return v;
  }

  // O vídeo debaixo da barra agora. No Reels, ao passar para o próximo, o <video> muda e a barra pode continuar no mesmo
  // lugar: sem isto, pausar/mutar iam para o vídeo anterior (fora da tela) e "não acontecia nada" (relato de 27/10/2026).
  function underBar() {
    if (!ui) return null;
    const b = ui.$('.bar2').getBoundingClientRect();
    if (!b.width) return null;
    return videoAt(b.left + b.width / 2, Math.max(2, b.top - 24)) || videoAt(b.left + b.width / 2, b.top + b.height / 2);
  }
  function fresh() {
    const v = underBar();
    if (v && v !== cur) { cur = v; adopt(v); sync(); place(); }
    return !!(cur && cur.isConnected);
  }

  function place(retry) {
    if (!ui || !cur) return;
    const bar = ui.$('.bar2');
    const r = cur.getBoundingClientRect();
    const vis = { l: Math.max(r.left, 0), r: Math.min(r.right, innerWidth), t: Math.max(r.top, 0), b: Math.min(r.bottom, innerHeight) };
    const w = Math.min(560, vis.r - vis.l - 20);
    if (!cur.isConnected || w < 160 || vis.b - vis.t < 120) {
      // o vídeo saiu da tela (passou para o próximo reel): se outro vídeo está debaixo da barra, a barra passa para ele
      const v = !retry && underBar();
      if (v && v !== cur) { cur = v; adopt(v); sync(); return place(true); }
      return hide(true);
    }
    bar.style.width = Math.round(w) + 'px';
    bar.style.left = Math.round(vis.l + (vis.r - vis.l - w) / 2) + 'px';
    bar.style.top = Math.round(vis.b - bar.offsetHeight - 10) + 'px';
    bar.classList.toggle('narrow', w < 330);
  }

  function show(v) {
    ensureUI();
    if (cur !== v) { cur = v; adopt(v); ui.$('.menu').hidden = true; t = K().tr(T); }
    ui.$('.bar2').classList.add('show');
    sync(); place();
    loop();
  }
  // o mouse está em cima da barra (ou do menu de velocidade)? Pela posição, não por evento: com o mouse parado em cima,
  // a barra sumia em ~2 s e o clique seguinte atravessava para o vídeo do Instagram (medido no feed em 27/10/2026)
  function pointerOnBar() {
    if (!ui || !ui.$('.bar2').classList.contains('show')) return false;
    const inR = (el) => { if (!el || el.hidden) return false; const r = el.getBoundingClientRect(); return px >= r.left - 6 && px <= r.right + 6 && py >= r.top - 6 && py <= r.bottom + 6; };
    return inR(ui.$('.bar2')) || inR(ui.$('.menu'));
  }
  function hide(now) {
    if (!ui) return;
    if (Date.now() < diagUntil && ui.$('.bar2').classList.contains('show')) diag('hide', { now: !!now });
    if (!now && (overBar || dragging || !ui.$('.menu').hidden || pointerOnBar())) { if (!now) poke(); return; }
    ui.$('.bar2').classList.remove('show');
    ui.$('.menu').hidden = true;
    overBar = false;
  }
  function poke() { clearTimeout(hideT); hideT = setTimeout(() => hide(false), 2200); }

  let looping = false;
  function loop() {
    if (looping) return;
    looping = true;
    let chk = 0;
    const step = (ts) => {
      if (!ui || !ui.$('.bar2').classList.contains('show')) { looping = false; return; }
      if (!dragging && ts - chk > 250) { chk = ts; const v = underBar(); if (v && v !== cur) { cur = v; adopt(v); } }
      sync(); place();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let raf = 0, px = 0, py = 0, onBarNow = false;
  addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY; lastMove = Date.now();
    // composedPath só vale durante o evento: decide aqui se o mouse está na barra
    onBarNow = !!(ui && e.composedPath && e.composedPath().includes(ui.host));
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!enabled || onStories() || !API() || !K()) return hide(true);
      overBar = !!(onBarNow || pointerOnBar());
      if (overBar) { poke(); return; }
      const v = videoAt(px, py);
      if (v) { show(v); poke(); }
      else if (ui && ui.$('.bar2').classList.contains('show') && !overBar && !dragging) {
        // saiu do vídeo: some rápido
        clearTimeout(hideT); hideT = setTimeout(() => hide(false), 350);
      }
    });
  }, { passive: true, capture: true });
  void lastMove;

  // ───────── baixar o vídeo ─────────
  const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function codeToPk(code) {
    let id = 0n;
    for (const c of String(code).slice(0, 11)) { const i = ALPH.indexOf(c); if (i < 0) return null; id = id * 64n + BigInt(i); }
    return id ? id.toString() : null;
  }
  function codeNear(v) {
    const scope = v.closest('article') || v.closest('[role="dialog"]') || null;
    const links = scope ? [...scope.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')] : [];
    for (const a of links) { const m = a.getAttribute('href').match(/\/(?:p|reel)\/([A-Za-z0-9_-]{5,})/); if (m) return m[1]; }
    const m = location.pathname.match(/^\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})/);
    return m ? m[1] : null;
  }
  async function itemFor(v) {
    const api = API();
    api.harvestInline();
    let pk = api.pkFromFiber(v);
    let item = pk ? await api.getItem(pk).catch(() => null) : null;
    if (item && item.media_type === 2) return item;
    const code = codeNear(v);
    pk = code && codeToPk(code);
    item = pk ? await api.getItem(pk).catch(() => null) : null;
    return item && item.media_type === 2 ? item : null;
  }
  async function download() {
    const v = cur, btn = ui.$('.dl');
    if (!v || btn.classList.contains('busy')) return;
    btn.classList.add('busy');
    ui.toast(t('saving'));
    try {
      const item = await itemFor(v);
      if (!item) throw new Error(t('noId'));
      const job = API().buildJob(item, 1);
      if (!job) throw new Error(t('noId'));
      job.sub = 'videos';
      const r = await API().askExtension([job]);
      if (!r || !r.ok) throw new Error((r && r.error) || '?');
      const s = API().settings() || {};
      ui.toast(`${t('saved')} Downloads/${s.folder || 'Instagram Stories'}/${s.perUser === false ? '' : job.user + '/'}videos`);
      API().log('info', { pt: 'player: vídeo baixado', en: 'player: video saved', es: 'player: video descargado' });
    } catch (e) {
      { const em = String(e.message).slice(0, 160), nf = e.message === t('noId'); API().log('error', { pt: 'player: ' + (nf ? 'vídeo não achado nos dados' : em), en: 'player: ' + (nf ? 'video not found in the data' : em), es: 'player: ' + (nf ? 'video no encontrado en los datos' : em) }); }
      ui.toast(e.message === t('noId') ? e.message : `${t('fail')} ${e.message}`);
    } finally {
      btn.classList.remove('busy');
    }
  }

  // liga/desliga pelo menu (Ferramentas → Player)
  const watch = () => {
    if (!API() || !K()) return setTimeout(watch, 50);
    const apply = (s) => { enabled = s.player !== false; reelsSound = s.reelsSound !== false; if (!enabled) hide(true); if (ui) ui.refreshMode(); };
    API().whenSettings().then(() => apply(API().settings() || {}));
    K().onSettings(apply);
  };
  watch();
  const __box = (el) => { if (!el || el.hidden) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  window.__salvaStoriesPlayerDiag = () => DIAG.slice();
  window.__salvaStoriesPlayerDebug = () => ({ shown: !!(ui && ui.$('.bar2').classList.contains('show')),
    at: ui ? { pp: __box(ui.$('.pp')), back: __box(ui.$('.bk')), fwd: __box(ui.$('.fw')), speed: __box(ui.$('.spd')), mute: __box(ui.$('.mu')), dl: __box(ui.$('.dl')), seek: __box(ui.$('.seek')), rates: ui.$$('.menu button').map((b) => ({ r: b.dataset.r, ...(__box(b) || {}) })) } : null, enabled, reelsSound, reelsUserMuted, onReels: onReels(), igToggle: !!igAudioToggle(activeReel()), overBar, curVisible: cur ? (() => { const r = cur.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })() : null, cur: cur ? { src: (cur.currentSrc || '').slice(0, 30), hold: !!cur.__ssHold, paused: cur.paused, rate: cur.playbackRate, muted: cur.muted, vol: cur.volume } : null, pref });
})();
