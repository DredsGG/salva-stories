// Guia do Salva Stories: idioma (bandeiras) e versão no rodapé. Script externo: página de extensão não aceita script inline.
(() => {
  const LANGS = ['pt', 'en', 'es'];
  const escolher = (l) => {
    if (!LANGS.includes(l)) l = 'pt';
    document.body.className = l;
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
    document.querySelectorAll('[data-escolher]').forEach((b) => b.classList.toggle('on', b.dataset.escolher === l));
    try { localStorage.setItem('salva-stories-guia-lang', l); } catch (e) {}
  };
  const doNavegador = () => { const n = (navigator.language || 'pt').toLowerCase(); return n.startsWith('pt') ? 'pt' : n.startsWith('es') ? 'es' : 'en'; };
  let l = 'pt';
  try { l = localStorage.getItem('salva-stories-guia-lang') || doNavegador(); } catch (e) {}
  escolher(l);
  // dentro da extensão: usa o idioma escolhido no menu do Salva Stories
  try { chrome.storage.sync.get({ lang: null }, (s) => { if (s && s.lang && !localStorage.getItem('salva-stories-guia-lang')) escolher(s.lang); }); } catch (e) {}
  document.querySelectorAll('[data-escolher]').forEach((b) => b.addEventListener('click', () => escolher(b.dataset.escolher)));
  // versão sempre do manifest (regra 9)
  try { document.getElementById('versao').textContent = 'v' + chrome.runtime.getManifest().version; } catch (e) {}
})();
