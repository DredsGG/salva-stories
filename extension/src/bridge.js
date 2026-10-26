// Salva Stories — ponte (mundo ISOLATED). Liga a página (page.js e menu.js) ao service worker e ao storage.
(() => {
  'use strict';
  const DEFAULTS = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: 'pt', theme: 'auto', player: true, profileBtn: true, inboxTools: true };
  const RELOAD = { pt: 'extensão atualizada — recarregue a página (F5)', en: 'extension updated — reload the page (F5)', es: 'extensión actualizada — recarga la página (F5)' };
  // só estes ajustes podem ser gravados pelo menu, com o tipo certo
  const BOOL = ['ghost', 'hotkey', 'showAll', 'perUser', 'maxQuality', 'player', 'profileBtn', 'inboxTools'];
  // dados grandes (varreduras de seguidores) ficam no storage.local, só com este prefixo
  const LOCAL_PREFIX = 'ss.follows.';
  const ENUM = { lang: ['pt', 'en', 'es'], theme: ['auto', 'light', 'dark'] };
  let lang = 'pt';
  let dead = false;

  const post = (msg) => window.postMessage(Object.assign({ __salvaStories: 'ext' }, msg), location.origin);
  // extensão recarregada/atualizada: este content script fica órfão e o chrome.* passa a falhar
  const alive = () => { try { return !dead && !!chrome.runtime && !!chrome.runtime.id; } catch (_) { return false; } };
  function markDead() { if (!dead) { dead = true; post({ kind: 'stale' }); } }

  function sendSettings() {
    if (!alive()) return markDead();
    try {
      chrome.storage.sync.get(DEFAULTS, (s) => {
        lang = s.lang || 'pt';
        let version = '';
        try { version = chrome.runtime.getManifest().version; } catch (_) {}
        post({ kind: 'settings', settings: s, version });
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
    if (d.kind === 'hello') sendSettings();
    if (d.kind === 'set') {
      const patch = clean(d.patch);
      if (!Object.keys(patch).length) return;
      if (!alive()) return markDead();
      try { chrome.storage.sync.set(patch); } catch (_) { markDead(); }
    }
    if (d.kind === 'lget' || d.kind === 'lset') {
      const key = String(d.key || '');
      if (!key.startsWith(LOCAL_PREFIX) || key.length > 80) return;
      if (!alive()) return markDead();
      try {
        if (d.kind === 'lget') chrome.storage.local.get(key, (r) => post({ kind: 'lres', id: d.id, value: r ? r[key] : undefined }));
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
    chrome.storage.onChanged.addListener((changes, area) => { if (area === 'sync') sendSettings(); });
    // clique no ícone da extensão na barra do Chrome → abre/fecha o menu
    chrome.runtime.onMessage.addListener((msg) => { if (msg && msg.type === 'salva-stories:toggle-menu') post({ kind: 'toggleMenu' }); });
  } catch (_) { markDead(); }
  sendSettings();
})();
