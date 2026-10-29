// Salva Stories — ponte (mundo ISOLATED). Liga a página (page.js e menu.js) ao service worker e ao storage.
(() => {
  'use strict';
  // idioma da primeira abertura: o do navegador (pt, en ou es; qualquer outro → en). Regra 13.
  const NAV_LANG = (() => { const l = String(navigator.language || 'en').toLowerCase(); return l.startsWith('pt') ? 'pt' : l.startsWith('es') ? 'es' : 'en'; })();
  const DEFAULTS = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: NAV_LANG, theme: 'auto', player: true, reelsSound: true, storySpeed: true, avatarZoom: true, postBtn: true, profileBtn: true, inboxTools: true };
  const RELOAD = { pt: 'extensão atualizada — recarregue a página (F5)', en: 'extension updated — reload the page (F5)', es: 'extensión actualizada — recarga la página (F5)' };
  // só estes ajustes podem ser gravados pelo menu, com o tipo certo
  const BOOL = ['ghost', 'hotkey', 'showAll', 'perUser', 'maxQuality', 'player', 'reelsSound', 'storySpeed', 'avatarZoom', 'postBtn', 'profileBtn', 'inboxTools'];
  // storage.local acessível pela página: varreduras de seguidores e o "já viu" do tutorial/novidades
  const LOCAL_PREFIXES = ['ss.follows.', 'ss.onboard', 'ss.diag.'];
  const ENUM = { lang: ['pt', 'en', 'es'], theme: ['auto', 'light', 'dark'] };
  const UPD_KEY = 'ss.update';
  // tem de bater com o SW_BUILD do sw.js desta versão: se o Chrome ficou com o service worker antigo, o menu avisa
  const EXPECT_SW = 'ss-sw-1.8.13';
  const UPD_CMDS = ['check', 'apply', 'dismiss', 'seen', 'guide', 'perm'];
  // Opera: storage.sync pode não existir (tabela do MDN) → ajustes no local
  const SYNC = () => chrome.storage.sync || chrome.storage.local;
  let lang = 'pt';
  let dead = false;

  const post = (msg) => window.postMessage(Object.assign({ __salvaStories: 'ext' }, msg), location.origin);
  // extensão recarregada/atualizada: este content script fica órfão e o chrome.* passa a falhar
  const alive = () => { try { return !dead && !!chrome.runtime && !!chrome.runtime.id; } catch (_) { return false; } };
  function markDead() { if (!dead) { dead = true; post({ kind: 'stale' }); } }

  function sendSettings() {
    if (!alive()) return markDead();
    try {
      SYNC().get(DEFAULTS, (s) => {
        lang = s.lang || NAV_LANG;
        let version = '';
        try { version = chrome.runtime.getManifest().version; } catch (_) {}
        post({ kind: 'settings', settings: s, version });
      });
    } catch (_) { markDead(); }
  }

  function sendUpdate() {
    if (!alive()) return;
    try { chrome.storage.local.get([UPD_KEY, 'ss.disco', 'ss.perm'], (r) => { post({ kind: 'upd', state: (r && r[UPD_KEY]) || {} }); post({ kind: 'disco', state: (r && r['ss.disco']) || null }); post({ kind: 'perm', state: (r && r['ss.perm']) || null }); }); } catch (_) {}
  }
  // o service worker que está rodando é o desta versão?
  function pingSw() {
    if (!alive()) return;
    try {
      chrome.runtime.sendMessage({ type: 'salva-stories:ping' }, (r) => {
        void chrome.runtime.lastError;
        post({ kind: 'sw', ok: !!(r && r.build === EXPECT_SW), build: (r && r.build) || null });
      });
    } catch (_) { markDead(); }
  }

  function clean(patch) {
    const out = {};
    for (const [k, v] of Object.entries(patch || {})) {
      if (BOOL.includes(k) && typeof v === 'boolean') out[k] = v;
      else if (ENUM[k] && ENUM[k].includes(v)) out[k] = v;
      else if (k === 'folder' && typeof v === 'string') out[k] = v.slice(0, 120);
    }
    return out;
  }

  window.addEventListener('message', (ev) => {
    if (ev.source !== window || ev.origin !== location.origin) return;
    const d = ev.data;
    if (!d || d.__salvaStories !== 'page') return;
    if (d.kind === 'hello') { sendSettings(); sendUpdate(); pingSw(); }
    if (d.kind === 'updCmd') {
      if (!UPD_CMDS.includes(d.cmd)) return;
      if (!alive()) return markDead();
      const data = d.cmd === 'guide' ? (/^#[a-z]+$/.test(d.data || '') ? d.data : '') : d.cmd === 'dismiss' ? (typeof d.data === 'string' ? d.data.slice(0, 20) : null) : null;
      try {
        chrome.runtime.sendMessage({ type: 'salva-stories:update', cmd: d.cmd, data }, (res) => {
          const err = chrome.runtime.lastError;
          post({ kind: 'updRes', cmd: d.cmd, res: err ? { erro: err.message } : (res || {}) });
        });
      } catch (_) { markDead(); }
      return;
    }
    if (d.kind === 'set') {
      const patch = clean(d.patch);
      if (!Object.keys(patch).length) return;
      if (!alive()) return markDead();
      try { SYNC().set(patch); } catch (_) { markDead(); }
    }
    if (d.kind === 'lget' || d.kind === 'lset') {
      const key = String(d.key || '');
      if (!LOCAL_PREFIXES.some((pre) => key.startsWith(pre)) || key.length > 80) return;
      if (!alive()) return markDead();
      try {
        if (d.kind === 'lget') chrome.storage.local.get(key, (r) => post({ kind: 'lres', id: d.id, value: r && key in r ? r[key] : null }));
        else chrome.storage.local.set({ [key]: d.value }, () => post({ kind: 'lres', id: d.id, value: !chrome.runtime.lastError }));
      } catch (_) { markDead(); }
      return;
    }
    if (d.kind === 'download') {
      if (!alive()) { markDead(); post({ kind: 'result', id: d.id, result: { ok: false, error: RELOAD[lang] || RELOAD.pt } }); return; }
      try {
        chrome.runtime.sendMessage({ type: 'salva-stories:download', jobs: d.jobs }, (result) => {
          const err = chrome.runtime.lastError;
          post({ kind: 'result', id: d.id, result: err ? { ok: false, error: err.message } : result });
        });
      } catch (e) {
        markDead();
        post({ kind: 'result', id: d.id, result: { ok: false, error: RELOAD[lang] || RELOAD.pt } });
      }
    }
  });

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' || (area === 'local' && !chrome.storage.sync && Object.keys(changes).some((k) => k in DEFAULTS))) sendSettings();
      if (area === 'local' && changes[UPD_KEY]) post({ kind: 'upd', state: changes[UPD_KEY].newValue || {} });
      if (area === 'local' && changes['ss.perm']) post({ kind: 'perm', state: changes['ss.perm'].newValue || null });
    });
    chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
      // clique no ícone da extensão na barra do Chrome → abre/fecha o menu
      if (msg && msg.type === 'salva-stories:toggle-menu') post({ kind: 'toggleMenu' });
      // antes de se recarregar para a versão nova, o service worker pergunta se a aba está no meio de um trabalho longo
      if (msg && msg.type === 'salva-stories:busy?') { reply({ busy: (parseInt(document.documentElement.dataset.ssBusy || '0', 10) || 0) > 0 && document.documentElement.dataset.ssPaused !== '1' }); }
    });
  } catch (_) { markDead(); }
  sendSettings();
  sendUpdate();
  pingSw();

  // Regra 14 (revisada 27/10 20h): confere versão nova ao abrir o Instagram e toda vez que a pessoa volta para a aba.
  // O service worker segura em no máximo 1 conferência a cada 10 min; o alarme dele confere a cada 30 min.
  const autoCheck = () => {
    if (!alive() || document.visibilityState !== 'visible') return;
    try { chrome.runtime.sendMessage({ type: 'salva-stories:update', cmd: 'check', data: 'auto' }, () => { void chrome.runtime.lastError; }); } catch (_) { markDead(); }
  };
  autoCheck();
  document.addEventListener('visibilitychange', autoCheck);
  window.addEventListener('focus', autoCheck);
})();
