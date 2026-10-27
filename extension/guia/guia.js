// Guia do Salva Stories: idioma (bandeiras), navegador, permissão de site (Firefox) e versão no rodapé.
// Script externo: página de extensão não aceita script inline. Funciona também aberto direto do zip (sem a API da extensão).
(() => {
  const ext = (typeof browser !== 'undefined' && browser.runtime) ? browser : (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id ? chrome : null);
  const LANGS = ['pt', 'en', 'es'];
  const escolher = (l) => {
    if (!LANGS.includes(l)) l = 'pt';
    document.body.classList.remove(...LANGS);
    document.body.classList.add(l);
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
    document.querySelectorAll('[data-escolher]').forEach((b) => b.classList.toggle('on', b.dataset.escolher === l));
    try { localStorage.setItem('salva-stories-guia-lang', l); } catch (e) {}
  };
  const doNavegador = () => { const n = (navigator.language || 'pt').toLowerCase(); return n.startsWith('pt') ? 'pt' : n.startsWith('es') ? 'es' : 'en'; };
  let l = 'pt';
  try { l = localStorage.getItem('salva-stories-guia-lang') || doNavegador(); } catch (e) {}
  escolher(l);
  // dentro da extensão: usa o idioma escolhido no menu do Salva Stories
  try {
    const area = ext && (ext.storage.sync || ext.storage.local);
    if (area) Promise.resolve(area.get({ lang: null })).then((s) => { if (s && s.lang && !localStorage.getItem('salva-stories-guia-lang')) escolher(s.lang); }).catch(() => {});
  } catch (e) {}
  document.querySelectorAll('[data-escolher]').forEach((b) => b.addEventListener('click', () => escolher(b.dataset.escolher)));

  // passo a passo do navegador certo (detecta o atual; dá para trocar)
  const ua = navigator.userAgent;
  const atual = /Firefox\//.test(ua) ? 'firefox' : /Edg\//.test(ua) ? 'edge' : /OPR\/|Opera/.test(ua) ? 'opera' : navigator.brave ? 'brave' : 'chrome';
  const nav = (k) => {
    document.querySelectorAll('[data-nav]').forEach((b) => b.classList.toggle('on', b.dataset.nav === k));
    document.querySelectorAll('[data-navbox]').forEach((e) => e.classList.toggle('navon', e.dataset.navbox === k));
  };
  document.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => nav(b.dataset.nav)));
  nav(atual);

  // versão sempre do manifest (regra 9)
  try { if (ext) document.getElementById('versao').textContent = 'v' + ext.runtime.getManifest().version; } catch (e) {}

  // permissão de site: o Firefox deixa o usuário tirar. Mostra o que falta e pede de volta (precisa de clique).
  const sec = document.getElementById('permissao');
  if (!ext || !ext.permissions || !sec) return;
  const origins = (ext.runtime.getManifest().host_permissions || []).slice();
  const conferir = async () => {
    const falta = [];
    for (const o of origins) { try { if (!(await ext.permissions.contains({ origins: [o] }))) falta.push(o); } catch (e) {} }
    sec.hidden = !(falta.length || atual === 'firefox' || location.hash === '#permissao');
    sec.querySelector('.permst').hidden = !falta.length;
    sec.querySelector('.permok').hidden = !!falta.length;
    document.getElementById('permfalta').textContent = falta.join('  ');
    document.getElementById('permitir').hidden = !falta.length;
    return falta;
  };
  document.getElementById('permitir').addEventListener('click', async () => {
    try { await ext.permissions.request({ origins }); } catch (e) {}
    await conferir();
    try { await ext.runtime.sendMessage({ type: 'salva-stories:update', cmd: 'perm' }); } catch (e) {}
  });
  conferir().then((falta) => { if (falta.length || location.hash === '#permissao') sec.scrollIntoView({ block: 'start' }); });
})();
