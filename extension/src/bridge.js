// Salva Stories — ponte (mundo ISOLATED). Liga a página (page.js) ao service worker e ao storage.
(() => {
  'use strict';
  const DEFAULTS = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: 'pt' };
  const RELOAD = { pt: 'extensão atualizada — recarregue a página (F5)', en: 'extension updated — reload the page (F5)', es: 'extensión actualizada — recarga la página (F5)' };
  let lang = 'pt';

  function sendSettings() {
    chrome.storage.sync.get(DEFAULTS, (s) => {
      lang = s.lang || 'pt';
      window.postMessage({ __salvaStories: 'ext', kind: 'settings', settings: s }, location.origin);
    });
  }

  window.addEventListener('message', (ev) => {
    if (ev.source !== window || ev.origin !== location.origin) return;
    const d = ev.data;
    if (!d || d.__salvaStories !== 'page') return;
    if (d.kind === 'hello') sendSettings();
    if (d.kind === 'download') {
      try {
        chrome.runtime.sendMessage({ type: 'salva-stories:download', jobs: d.jobs }, (result) => {
          const err = chrome.runtime.lastError;
          window.postMessage({ __salvaStories: 'ext', kind: 'result', id: d.id, result: err ? { ok: false, error: err.message } : result }, location.origin);
        });
      } catch (e) {
        // extensão recarregada/atualizada: este content script ficou órfão
        window.postMessage({ __salvaStories: 'ext', kind: 'result', id: d.id, result: { ok: false, error: RELOAD[lang] || RELOAD.pt } }, location.origin);
      }
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'sync') sendSettings(); });
  sendSettings();
})();
