// Salva Stories — peças visuais compartilhadas pelos módulos novos (perfil, player, direct, seguidores).
// Mundo MAIN. Paletas tiradas das variáveis do próprio Instagram (--ig-*, medidas em 2026-10-23).
(() => {
  'use strict';
  const KEY = Symbol.for('salvaStories.kit');
  if (window[KEY]) return;
  const api = () => window[Symbol.for('salvaStories.api')];

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const igDark = () => {
    const c = document.documentElement.classList;
    if (c.contains('__fb-dark-mode')) return true;
    if (c.contains('__fb-light-mode')) return false;
    return matchMedia('(prefers-color-scheme: dark)').matches;
  };
  // tema escolhido no menu (Auto segue o Instagram)
  const mode = () => {
    const s = api() && api().settings();
    const th = s && s.theme;
    return th === 'light' ? 'light' : th === 'dark' ? 'dark' : (igDark() ? 'dark' : 'light');
  };
  const lang = () => (api() ? api().lang() : 'pt');
  const tr = (dict) => (k, ...a) => { const d = dict[lang()] || dict.pt; const v = d[k] ?? dict.pt[k] ?? k; return typeof v === 'function' ? v(...a) : v; };
  const nf = (n) => Number(n || 0).toLocaleString(lang() === 'en' ? 'en-US' : lang() === 'es' ? 'es-ES' : 'pt-BR');

  const BASE_CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  .k { --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --grad: linear-gradient(135deg, #962fbf, #d62976 55%, #fa7e1e); --accent: #d62976;
    font-family: var(--font); -webkit-font-smoothing: antialiased; color: var(--fg); font-size: 14px; line-height: 1.35; }
  .k[data-mode="dark"] { --bg: rgb(33,35,40); --card: rgb(37,41,46); --fg: rgb(245,245,245); --sub: rgb(168,168,168); --sep: rgb(54,54,54);
    --hover: rgba(255,255,255,.08); --track: rgb(85,85,85); --shadow: 0 8px 40px rgba(0,0,0,.6); --scrim: rgba(0,0,0,.65); }
  .k[data-mode="light"] { --bg: #fff; --card: rgb(239,239,239); --fg: rgb(0,0,0); --sub: rgb(115,115,115); --sep: rgb(219,219,219);
    --hover: rgba(0,0,0,.05); --track: rgb(199,199,199); --shadow: 0 8px 40px rgba(0,0,0,.18); --scrim: rgba(0,0,0,.45); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 36px; padding: 0 16px; border: 0; border-radius: 10px;
    font: 600 14px var(--font); cursor: pointer; transition: filter .15s, transform .1s, background .15s; white-space: nowrap; }
  .btn:active { transform: scale(.97); }
  .btn.pri { background: var(--grad); color: #fff; }
  .btn.pri:hover { filter: brightness(1.08); }
  .btn.sec { background: var(--card); color: var(--fg); }
  .btn.sec:hover { background: var(--hover); }
  .btn.danger { background: rgb(237,73,86); color: #fff; }
  .btn[disabled] { opacity: .5; cursor: default; }
  .bar { height: 6px; border-radius: 99px; background: var(--card); overflow: hidden; }
  .bar > i { display: block; height: 100%; width: 0; background: var(--grad); border-radius: 99px; transition: width .3s; }
  .muted { color: var(--sub); }
  .x { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; border: 0; padding: 0; background: transparent; color: var(--fg); cursor: pointer; }
  .x:hover { background: var(--hover); }
  .sig { display: inline-flex; align-items: baseline; gap: 6px; letter-spacing: .12em; text-transform: uppercase; font-size: 10.5px; white-space: nowrap; color: var(--sub); }
  .sig .star { width: 10px; height: 10px; align-self: center; position: relative; top: 1px; }
  .sig a { text-decoration: none; text-transform: none; letter-spacing: .01em; font-size: 13.5px; font-weight: 800;
    background: linear-gradient(90deg,#962fbf,#d62976 50%,#fa7e1e); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; transition: background-position .6s; }
  .sig a:hover { background-position: 100% 0; }
  .sig .ver { letter-spacing: .02em; text-transform: none; font-size: 12px; }
  .ktoast { position: fixed; left: 50%; bottom: 28px; transform: translate(-50%, 8px); padding: 10px 16px; border-radius: 12px; background: rgba(20,20,20,.94);
    color: #fff; font: 14px/1.3 var(--font); max-width: 80vw; box-shadow: 0 4px 18px rgba(0,0,0,.4); opacity: 0; transition: opacity .2s, transform .2s; pointer-events: none; z-index: 2147483647; }
  .ktoast.show { opacity: 1; transform: translate(-50%, 0); }
  `;

  const ICON = {
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    dl: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    star: '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="kst" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#962fbf"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#fa7e1e"/></linearGradient></defs><path fill="url(#kst)" d="M12 0c.9 6.3 5.7 11.1 12 12-6.3.9-11.1 5.7-12 12-.9-6.3-5.7-11.1-12-12C6.3 11.1 11.1 6.3 12 0z"/></svg>',
  };
  const MADE_BY = { pt: 'feito por', en: 'made by', es: 'hecho por' };
  // assinatura da regra 9: "feito por Dreds · vX.Y.Z", Dreds clicável → GitHub
  const signature = (version) => `<span class="sig">${ICON.star}<span>${MADE_BY[lang()] || MADE_BY.pt}</span><a href="https://github.com/DredsGG" target="_blank" rel="noopener noreferrer">Dreds</a>${version ? `<span class="ver">· v${esc(version)}</span>` : ''}</span>`;

  // shadow DOM fechado + isolamento de eventos (nada chega aos atalhos do Instagram)
  function makeHost(tag, css, html) {
    const host = document.createElement(tag);
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483000;';
    const sh = host.attachShadow({ mode: 'closed' });
    sh.innerHTML = `<style>${BASE_CSS}${css}</style><div class="k" data-mode="${mode()}">${html}<div class="ktoast" role="status"></div></div>`;
    for (const ev of ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend', 'wheel']) {
      host.addEventListener(ev, (e) => e.stopPropagation());
    }
    (document.body || document.documentElement).appendChild(host);
    const root = sh.querySelector('.k');
    let tt;
    return {
      host, sh, root,
      $: (q) => sh.querySelector(q), $$: (q) => [...sh.querySelectorAll(q)],
      refreshMode: () => { root.dataset.mode = mode(); },
      toast(msg) { const el = sh.querySelector('.ktoast'); el.textContent = msg; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2800); },
    };
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const jitter = (a, b) => a + Math.random() * (b - a);

  // versão do manifest (chega pelo bridge na mensagem "settings")
  let version = '';
  window.addEventListener('message', (ev) => {
    if (ev.source === window && ev.data && ev.data.__salvaStories === 'ext' && ev.data.kind === 'settings' && ev.data.version) version = ev.data.version;
  });

  // armazenamento local da extensão (só chaves "ss.follows.*", via bridge)
  let lid = 0;
  const lwait = new Map();
  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (ev.source !== window || !d || d.__salvaStories !== 'ext' || d.kind !== 'lres' || !lwait.has(d.id)) return;
    lwait.get(d.id)(d.value); lwait.delete(d.id);
  });
  const local = (kind, key, value) => new Promise((resolve) => {
    const id = ++lid; lwait.set(id, resolve);
    window.postMessage({ __salvaStories: 'page', kind, id, key, value }, location.origin);
    setTimeout(() => { if (lwait.has(id)) { lwait.delete(id); resolve(undefined); } }, 8000);
  });

  Object.defineProperty(window, KEY, {
    value: Object.freeze({
      esc, igDark, mode, lang, tr, nf, makeHost, ICON, signature, sleep, jitter,
      version: () => version,
      lget: (key) => local('lget', key), lset: (key, value) => local('lset', key, value),
      myId: () => (document.cookie.match(/(?:^|;\s*)ds_user_id=(\d+)/) || [])[1] || null,
      onSettings: (fn) => window.addEventListener('message', (ev) => { if (ev.source === window && ev.data && ev.data.__salvaStories === 'ext' && ev.data.kind === 'settings') fn(ev.data.settings || {}); }),
    }),
  });
})();
