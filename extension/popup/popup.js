const DEFAULTS = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: 'pt', theme: 'auto' };
const bools = ['ghost', 'hotkey', 'showAll', 'perUser', 'maxQuality'];

const T = {
  pt: {
    folder: 'Pasta em Downloads',
    perUser: 'Subpasta por perfil', perUserD: 'Downloads/Instagram Stories/usuario/…',
    maxQ: 'Vídeo na resolução máxima', maxQD: 'Quando o original passa de 720p, junta vídeo e som em alta (pode vir em VP9). Se falhar, salva o 720p.',
    all: 'Botão "salvar todos"', allD: 'Baixa todos os stories da pessoa aberta',
    hotkey: 'Atalho de teclado', hotkeyD: '<kbd>D</kbd> salva o atual · <kbd>Shift</kbd>+<kbd>D</kbd> salva todos',
    ghost: 'Modo fantasma', ghostD: 'Não avisa que você viu o story.',
    saved: 'As mudanças são salvas na hora.', madeBy: 'feito por', langLabel: 'Idioma', toDark: 'Modo escuro', toLight: 'Modo claro',
  },
  en: {
    folder: 'Folder in Downloads',
    perUser: 'Subfolder per profile', perUserD: 'Downloads/Instagram Stories/username/…',
    maxQ: 'Maximum video resolution', maxQD: 'When the original is above 720p, merges high-res video and audio (may be VP9). If it fails, saves the 720p.',
    all: '"Save all" button', allD: 'Downloads all stories of the open profile',
    hotkey: 'Keyboard shortcut', hotkeyD: '<kbd>D</kbd> saves current · <kbd>Shift</kbd>+<kbd>D</kbd> saves all',
    ghost: 'Ghost mode', ghostD: "Doesn't tell them you viewed the story.",
    saved: 'Changes are saved instantly.', madeBy: 'made by', langLabel: 'Language', toDark: 'Dark mode', toLight: 'Light mode',
  },
  es: {
    folder: 'Carpeta en Descargas',
    perUser: 'Subcarpeta por perfil', perUserD: 'Descargas/Instagram Stories/usuario/…',
    maxQ: 'Video en resolución máxima', maxQD: 'Si el original supera 720p, une video y audio en alta (puede ser VP9). Si falla, guarda el 720p.',
    all: 'Botón "guardar todos"', allD: 'Descarga todas las historias del perfil abierto',
    hotkey: 'Atajo de teclado', hotkeyD: '<kbd>D</kbd> guarda la actual · <kbd>Shift</kbd>+<kbd>D</kbd> guarda todas',
    ghost: 'Modo fantasma', ghostD: 'No avisa que viste la historia.',
    saved: 'Los cambios se guardan al instante.', madeBy: 'hecho por', langLabel: 'Idioma', toDark: 'Modo oscuro', toLight: 'Modo claro',
  },
};

let curLang = 'pt';
const sysDark = window.matchMedia('(prefers-color-scheme: dark)');
let curTheme = 'auto';
function isDark() { return curTheme === 'dark' || (curTheme === 'auto' && sysDark.matches); }
function applyTheme(theme) {
  curTheme = theme;
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme'); else root.dataset.theme = theme;
  try { localStorage.setItem('salvaStoriesTheme', theme); } catch (_) {}
  document.body.classList.toggle('dark', isDark());
  const t = T[curLang] || T.pt;
  const btn = document.getElementById('theme');
  const label = isDark() ? t.toLight : t.toDark;
  btn.title = label;
  btn.setAttribute('aria-label', label);
}
sysDark.addEventListener('change', () => applyTheme(curTheme));

function applyLang(lang) {
  curLang = lang;
  const t = T[lang] || T.pt;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  for (const el of document.querySelectorAll('[data-i]')) {
    const v = t[el.dataset.i];
    if (v === undefined) continue;
    if (el.dataset.html) el.innerHTML = v; else el.textContent = v;
  }
  document.querySelector('.langs').setAttribute('aria-label', t.langLabel);
  for (const b of document.querySelectorAll('.langs button')) {
    const on = b.dataset.lang === lang;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  }
  applyTheme(curTheme);
}

document.getElementById('ver').textContent = 'v' + chrome.runtime.getManifest().version;

chrome.storage.sync.get(DEFAULTS, (s) => {
  curTheme = s.theme;
  applyLang(s.lang);
  document.getElementById('theme').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    applyTheme(next);
    chrome.storage.sync.set({ theme: next });
  });
  for (const b of document.querySelectorAll('.langs button')) {
    b.addEventListener('click', () => { applyLang(b.dataset.lang); chrome.storage.sync.set({ lang: b.dataset.lang }); });
  }
  for (const k of bools) {
    const el = document.getElementById(k);
    el.checked = !!s[k];
    el.addEventListener('change', () => chrome.storage.sync.set({ [k]: el.checked }));
  }
  const folder = document.getElementById('folder');
  folder.value = s.folder;
  let t;
  folder.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => chrome.storage.sync.set({ folder: folder.value.trim() }), 300);
  });
});
