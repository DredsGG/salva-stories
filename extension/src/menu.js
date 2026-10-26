// Salva Stories — menu dentro do Instagram (mundo MAIN, shadow DOM fechado).
// Substitui o popup da barra do Chrome (removido na v1.4.0). Abre por:
//   • ícone na barra lateral do Instagram (logo abaixo dos itens dele);
//   • botão de engrenagem na pilha de botões do story;
//   • Alt+S;
//   • clique no ícone da extensão na barra do Chrome.
// Os ajustes vão para o chrome.storage pela ponte (bridge.js) e voltam pela mesma mensagem
// "settings" que o page.js já usa.
(() => {
  'use strict';
  if (window.__salvaStoriesMenu) return;
  window.__salvaStoriesMenu = true;

  const GITHUB = 'https://github.com/DredsGG';
  const UI_KEY = 'salvaStories.ui';
  const loadUi = () => { try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (_) { return {}; } };
  const saveUi = (o) => { try { localStorage.setItem(UI_KEY, JSON.stringify(Object.assign(loadUi(), o))); } catch (_) {} };

  const T = {
    pt: {
      title: 'Salva Stories', close: 'Fechar', open: 'Salva Stories — ajustes (Alt+S)',
      secDownloads: 'Downloads', secStories: 'Nos stories', secPrivacy: 'Privacidade', secLook: 'Aparência',
      folder: 'Pasta em Downloads', folderD: 'Onde os arquivos são salvos',
      perUser: 'Subpasta por perfil', perUserD: 'Downloads/Instagram Stories/usuario/…',
      maxQ: 'Vídeo na resolução máxima', maxQD: 'Acima de 720p junta vídeo e som em alta (pode vir em VP9). Se falhar, salva o 720p.',
      all: 'Botão "salvar todos"', allD: 'Baixa todos os stories da pessoa aberta',
      hotkey: 'Atalho de teclado', hotkeyD: '<kbd>D</kbd> salva o atual · <kbd>Shift</kbd>+<kbd>D</kbd> salva todos',
      ghost: 'Modo fantasma', ghostD: 'Não avisa que você viu o story.',
      lang: 'Idioma', theme: 'Tema', auto: 'Auto', light: 'Claro', dark: 'Escuro', autoD: 'Auto segue o tema do Instagram.',
      madeBy: 'feito por', hintT: 'Alt+S abre e fecha este menu',
      stale: 'A extensão foi atualizada. Recarregue a página para usar a versão nova.', reload: 'Recarregar',
      secTools: 'Ferramentas', follows: 'Seguidores e seguindo', followsD: 'Quem não te segue de volta, quem você não segue, mútuos e quem deixou de seguir',
      player: 'Player nos vídeos', playerD: 'Pausar, voltar, avançar, velocidade, volume e baixar nos vídeos e reels',
      profileBtn: 'Botão "baixar perfil"', profileBtnD: 'Na página de um perfil, baixa todos os posts organizados em pastas',
      inboxTools: 'Seleção no direct', inboxToolsD: 'Selecionar várias conversas e agir em todas de uma vez',
      ghostOn: 'Modo fantasma ligado', ghostSub: 'Ninguém vê que você assistiu', open2: 'Abrir',
    },
    en: {
      title: 'Salva Stories', close: 'Close', open: 'Salva Stories — settings (Alt+S)',
      secDownloads: 'Downloads', secStories: 'In stories', secPrivacy: 'Privacy', secLook: 'Appearance',
      folder: 'Folder in Downloads', folderD: 'Where files are saved',
      perUser: 'Subfolder per profile', perUserD: 'Downloads/Instagram Stories/username/…',
      maxQ: 'Maximum video resolution', maxQD: 'Above 720p, merges high-res video and audio (may be VP9). If it fails, saves the 720p.',
      all: '"Save all" button', allD: 'Downloads all stories of the open profile',
      hotkey: 'Keyboard shortcut', hotkeyD: '<kbd>D</kbd> saves current · <kbd>Shift</kbd>+<kbd>D</kbd> saves all',
      ghost: 'Ghost mode', ghostD: "Doesn't tell them you viewed the story.",
      lang: 'Language', theme: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark', autoD: 'Auto follows Instagram’s theme.',
      madeBy: 'made by', hintT: 'Alt+S opens and closes this menu',
      stale: 'The extension was updated. Reload the page to use the new version.', reload: 'Reload',
      secTools: 'Tools', follows: 'Followers & following', followsD: "Who doesn't follow you back, who you don't follow back, mutuals and who unfollowed",
      player: 'Video player', playerD: 'Pause, rewind, forward, speed, volume and download on videos and reels',
      profileBtn: '"Download profile" button', profileBtnD: "On a profile page, downloads every post into tidy folders",
      inboxTools: 'Direct selection', inboxToolsD: 'Select several chats and act on all of them at once',
      ghostOn: 'Ghost mode on', ghostSub: 'Nobody sees that you watched', open2: 'Open',
    },
    es: {
      title: 'Salva Stories', close: 'Cerrar', open: 'Salva Stories — ajustes (Alt+S)',
      secDownloads: 'Descargas', secStories: 'En las historias', secPrivacy: 'Privacidad', secLook: 'Apariencia',
      folder: 'Carpeta en Descargas', folderD: 'Dónde se guardan los archivos',
      perUser: 'Subcarpeta por perfil', perUserD: 'Descargas/Instagram Stories/usuario/…',
      maxQ: 'Video en resolución máxima', maxQD: 'Por encima de 720p une video y audio en alta (puede ser VP9). Si falla, guarda el 720p.',
      all: 'Botón "guardar todos"', allD: 'Descarga todas las historias del perfil abierto',
      hotkey: 'Atajo de teclado', hotkeyD: '<kbd>D</kbd> guarda la actual · <kbd>Shift</kbd>+<kbd>D</kbd> guarda todas',
      ghost: 'Modo fantasma', ghostD: 'No avisa que viste la historia.',
      lang: 'Idioma', theme: 'Tema', auto: 'Auto', light: 'Claro', dark: 'Oscuro', autoD: 'Auto sigue el tema de Instagram.',
      madeBy: 'hecho por', hintT: 'Alt+S abre y cierra este menú',
      stale: 'La extensión se actualizó. Recarga la página para usar la versión nueva.', reload: 'Recargar',
      secTools: 'Herramientas', follows: 'Seguidores y seguidos', followsD: 'Quién no te sigue, a quién no sigues, mutuos y quién dejó de seguirte',
      player: 'Reproductor en los videos', playerD: 'Pausar, retroceder, avanzar, velocidad, volumen y descargar en videos y reels',
      profileBtn: 'Botón "descargar perfil"', profileBtnD: 'En un perfil, descarga todas las publicaciones en carpetas ordenadas',
      inboxTools: 'Selección en el direct', inboxToolsD: 'Selecciona varios chats y actúa en todos a la vez',
      ghostOn: 'Modo fantasma activado', ghostSub: 'Nadie ve que la viste', open2: 'Abrir',
    },
  };

  let S = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: 'pt', theme: 'auto', player: true, profileBtn: true, inboxTools: true };
  let version = '';
  let stale = false;
  const tr = (k) => (T[S.lang] || T.pt)[k] ?? T.pt[k];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ───────────── ícones ─────────────
  // ícone da barra lateral: "anel de story" no gradiente + seta de download (no estilo dos ícones de linha do Instagram)
  const NAV_ICON = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><defs><linearGradient id="ssg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#962fbf"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#fa7e1e"/></linearGradient></defs><circle cx="12" cy="12" r="10.2" fill="none" stroke="url(#ssg)" stroke-width="2"/><path d="M12 7v8.2M8.4 11.8 12 15.4l3.6-3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const APP_ICON = `<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><defs><linearGradient id="ssa" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#962fbf"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#fa7e1e"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#ssa)"/><path d="M16 8.5v10.5M11.2 14.6 16 19.4l4.8-4.8M10.5 23.5h11" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const X_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const SUN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.55 1.55M17.15 17.15l1.55 1.55M5.3 18.7l1.55-1.55M17.15 6.85l1.55-1.55"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
  const AUTO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/></svg>';
  const FLAG_IN = {
    pt: '<rect width="20" height="20" fill="#009c3b"/><path d="M10 3.2 18.6 10 10 16.8 1.4 10z" fill="#ffdf00"/><circle cx="10" cy="10" r="4.1" fill="#002776"/><path d="M6.1 9.1q4.2-1.5 7.8 1.6" stroke="#fff" stroke-width=".9" fill="none"/>',
    en: '<rect width="20" height="20" fill="#fff"/><path fill="#b22234" d="M0 0h20v1.54H0zm0 3.08h20v1.54H0zm0 3.08h20V7.7H0zm0 3.08h20v1.54H0zm0 3.08h20v1.54H0zm0 3.08h20v1.54H0zm0 3.08h20V20H0z"/><rect width="9.5" height="10.77" fill="#3c3b6e"/><g fill="#fff"><circle cx="2" cy="2" r=".55"/><circle cx="4.7" cy="2" r=".55"/><circle cx="7.4" cy="2" r=".55"/><circle cx="3.35" cy="4.2" r=".55"/><circle cx="6.05" cy="4.2" r=".55"/><circle cx="2" cy="6.4" r=".55"/><circle cx="4.7" cy="6.4" r=".55"/><circle cx="7.4" cy="6.4" r=".55"/><circle cx="3.35" cy="8.6" r=".55"/><circle cx="6.05" cy="8.6" r=".55"/></g>',
    es: '<rect width="20" height="20" fill="#c60b1e"/><rect y="5" width="20" height="10" fill="#ffc400"/>',
  };
  const GHOST = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a7 7 0 0 0-7 7v10.6l2.33-1.75 2.34 1.75L12 18.85l2.33 1.75 2.34-1.75L19 20.6V10a7 7 0 0 0-7-7z"/><circle cx="9.5" cy="10.5" r="1.25" fill="currentColor" stroke="none"/><circle cx="14.5" cy="10.5" r="1.25" fill="currentColor" stroke="none"/></svg>';
  const PEOPLE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>';
  const CHEVRON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  const LANG_NAME = { pt: 'Português', en: 'English', es: 'Español' };
  // bandeira + anel no MESMO svg (concêntricos em vetor; igual à v1.3.2 do popup)
  const flag = (l) => `<button type="button" class="flag" data-lang="${l}" role="radio" title="${LANG_NAME[l]}"><svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">`
    + `<defs><clipPath id="sc-${l}"><circle cx="16" cy="16" r="12"/></clipPath><linearGradient id="sr-${l}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#962fbf"/><stop offset=".55" stop-color="#d62976"/><stop offset="1" stop-color="#fa7e1e"/></linearGradient></defs>`
    + `<g class="fl" clip-path="url(#sc-${l})"><g transform="translate(4 4) scale(1.2)">${FLAG_IN[l]}</g></g>`
    + `<circle class="ring" cx="16" cy="16" r="13.5" fill="none" stroke="url(#sr-${l})" stroke-width="3.4"/></svg></button>`;
  const STAR = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sst" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#962fbf"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#fa7e1e"/></linearGradient></defs><path fill="url(#sst)" d="M12 0c.9 6.3 5.7 11.1 12 12-6.3.9-11.1 5.7-12 12-.9-6.3-5.7-11.1-12-12C6.3 11.1 11.1 6.3 12 0z"/></svg>';

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  .root {
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --grad: linear-gradient(135deg, #962fbf, #d62976 55%, #fa7e1e);
    font-family: var(--font); -webkit-font-smoothing: antialiased;
  }
  /* paletas tiradas do próprio Instagram web (variáveis --ig-*, medidas em 2026-10-23) */
  .root[data-mode="dark"] { --bg: rgb(33,35,40); --card: rgb(37,41,46); --fg: rgb(245,245,245); --sub: rgb(168,168,168);
    --sep: rgb(54,54,54); --hover: rgba(255,255,255,.08); --track: rgb(85,85,85); --shadow: 0 8px 40px rgba(0,0,0,.6); --kbd: rgb(54,54,54); }
  .root[data-mode="light"] { --bg: #fff; --card: rgb(239,239,239); --fg: rgb(0,0,0); --sub: rgb(115,115,115);
    --sep: rgb(219,219,219); --hover: rgba(0,0,0,.05); --track: rgb(199,199,199); --shadow: 0 8px 40px rgba(0,0,0,.18); --kbd: rgb(239,239,239); }

  /* ── item na barra lateral do Instagram ── */
  .nav { position: fixed; z-index: 2147483000; width: 48px; height: 48px; border-radius: 8px; display: grid; place-items: center;
    cursor: pointer; color: var(--navfg, rgb(245,245,245)); background: transparent; border: 0; padding: 0; transition: background .15s ease, transform .1s ease; }
  .nav:hover { background: var(--navhover, rgba(255,255,255,.1)); }
  .nav:active { transform: scale(.94); }
  .nav:focus-visible { outline: 2px solid #d62976; outline-offset: 2px; }
  .nav.fab { width: 48px; height: 48px; border-radius: 50%; background: var(--navbg, rgb(37,41,46)); box-shadow: 0 4px 18px rgba(0,0,0,.35); }
  .nav.on { background: var(--navhover, rgba(255,255,255,.1)); }
  .navtip { position: fixed; z-index: 2147483001; pointer-events: none; padding: 7px 11px; border-radius: 8px; font: 600 13px/1.2 var(--font);
    background: rgb(54,54,54); color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.35); opacity: 0; transform: translateX(-4px); transition: opacity .15s, transform .15s; white-space: nowrap; }
  .navtip.show { opacity: 1; transform: none; }
  /* fantasminha abaixo do ícone da barra (só aparece com o modo fantasma ligado; não é botão) */
  .ghost { position: fixed; z-index: 2147483000; width: 48px; height: 48px; display: grid; place-items: center; cursor: default; user-select: none; }
  .ghost .gc { position: relative; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--navfg, #fff);
    background: rgba(150,47,191,.12); box-shadow: 0 2px 12px rgba(150,47,191,.35); }
  .ghost .gc::before { content: ""; position: absolute; inset: 0; border-radius: 50%; padding: 1.5px; background: var(--grad);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
  .ghost svg { filter: drop-shadow(0 0 4px rgba(214,41,118,.6)); animation: float 3.2s ease-in-out infinite; }
  @keyframes float { 0%,100% { transform: translateY(1px); opacity: .95; } 50% { transform: translateY(-2px); opacity: .7; } }
  @media (prefers-reduced-motion: reduce) { .ghost svg { animation: none; } }
  .gtip { position: absolute; left: calc(100% + 10px); top: 50%; transform: translate(-6px,-50%); white-space: nowrap; pointer-events: none;
    padding: 8px 12px; border-radius: 10px; background: rgba(18,12,24,.96); color: #fff; font: 13px/1.3 var(--font);
    box-shadow: 0 6px 22px rgba(0,0,0,.45), 0 0 0 1px rgba(214,41,118,.35); opacity: 0; transition: opacity .18s, transform .18s; }
  .gtip b { display: block; font-weight: 700; background: linear-gradient(90deg,#c77dff,#ff5fa2 55%,#ffb36b); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .gtip span { display: block; color: rgba(255,255,255,.7); font-size: 11.5px; }
  .gtip::after { content: ""; position: absolute; right: 100%; top: 50%; transform: translateY(-50%); border: 6px solid transparent; border-right-color: rgba(18,12,24,.96); }
  .ghost.flip .gtip { left: auto; right: calc(100% + 10px); transform: translate(6px,-50%); }
  .ghost.flip .gtip::after { right: auto; left: 100%; border-right-color: transparent; border-left-color: rgba(18,12,24,.96); }
  .ghost:hover .gtip { opacity: 1; transform: translate(0,-50%); }
  .tool { display: flex; align-items: center; gap: 12px; padding: 10px 16px; cursor: pointer; }
  .tool:hover { background: var(--hover); }
  .tool .ti { flex: none; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--grad); color: #fff; }
  .tool .go { margin-left: auto; flex: none; color: var(--sub); }

  /* ── painel ── */
  .panel { position: fixed; z-index: 2147483001; width: 360px; max-height: calc(100vh - 32px); display: flex; flex-direction: column;
    background: var(--bg); color: var(--fg); border-radius: 16px; box-shadow: var(--shadow); border: 1px solid var(--sep);
    font-size: 14px; line-height: 1.35; overflow: hidden; transform-origin: var(--ox, 0) var(--oy, 0);
    animation: pop .18s cubic-bezier(.2,.9,.3,1.2); }
  @keyframes pop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }
  .head { display: flex; align-items: center; gap: 12px; padding: 16px 16px 14px; border-bottom: 1px solid var(--sep); cursor: grab; user-select: none; }
  .head.dragging { cursor: grabbing; }
  .head .app { flex: none; display: block; width: 32px; height: 32px; line-height: 0; border-radius: 9px; box-shadow: 0 3px 10px -2px rgba(214,41,118,.55); }
  .head .app svg { display: block; }
  .head h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -.01em; white-space: nowrap; }
  .head .x { margin-left: auto; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; border: 0; padding: 0;
    background: transparent; color: var(--fg); cursor: pointer; }
  .head .x:hover { background: var(--hover); }
  .body { overflow: auto; padding: 4px 0 6px; scrollbar-width: thin; }
  .sec { padding: 12px 16px 4px; font-size: 12px; font-weight: 600; color: var(--sub); text-transform: uppercase; letter-spacing: .06em; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 16px; cursor: pointer; }
  .row:hover { background: var(--hover); }
  .row.static { cursor: default; } .row.static:hover { background: transparent; }
  .txt { min-width: 0; }
  .t { display: block; font-weight: 600; }
  .d { display: block; color: var(--sub); font-size: 12.5px; margin-top: 2px; }
  kbd { display: inline-block; min-width: 18px; padding: 0 5px; border-radius: 5px; background: var(--kbd); border: 1px solid var(--sep);
    font: 600 11px/17px var(--font); text-align: center; color: var(--fg); }
  .field { padding: 6px 16px 10px; }
  .field label { display: block; font-weight: 600; margin-bottom: 6px; }
  .field input { width: 100%; height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--sep); background: var(--card);
    color: var(--fg); font: 14px var(--font); outline: none; transition: border-color .15s; }
  .field input:focus { border-color: #d62976; }
  .field .d { margin-top: 6px; }
  /* chave no estilo iOS/Instagram, ligada = gradiente da marca */
  .sw { position: relative; flex: none; width: 44px; height: 26px; border-radius: 99px; background: var(--track); transition: background .2s; }
  .sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s cubic-bezier(.3,1.4,.5,1); }
  .sw.on { background: var(--grad); }
  .sw.on::after { transform: translateX(18px); }
  .row:focus-visible { outline: 2px solid #d62976; outline-offset: -2px; }
  .flags { display: flex; gap: 2px; }
  .flag { width: 32px; height: 32px; padding: 0; border: 0; background: transparent; cursor: pointer; border-radius: 50%; transition: transform .15s; }
  .flag svg { display: block; }
  .flag .fl { opacity: .45; filter: saturate(.6); transition: opacity .15s, filter .15s; }
  .flag .ring { opacity: 0; transition: opacity .2s; }
  .flag:hover { transform: translateY(-1px); } .flag:hover .fl { opacity: .85; filter: none; }
  .flag.on .fl { opacity: 1; filter: none; } .flag.on .ring { opacity: 1; }
  .seg { display: flex; padding: 3px; gap: 2px; border-radius: 10px; background: var(--card); }
  .seg button { display: flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px; border: 0; border-radius: 8px; background: transparent;
    color: var(--sub); font: 600 12.5px var(--font); cursor: pointer; transition: background .15s, color .15s; }
  .seg button:hover { color: var(--fg); }
  .seg button.on { background: var(--bg); color: var(--fg); box-shadow: 0 1px 4px rgba(0,0,0,.18); }
  .stale { margin: 12px 16px 2px; padding: 10px 12px; border-radius: 10px; background: rgba(214,41,118,.12); color: var(--fg); font-size: 13px;
    display: flex; align-items: center; gap: 10px; }
  .stale button { margin-left: auto; flex: none; height: 30px; padding: 0 12px; border: 0; border-radius: 8px; background: var(--grad); color: #fff;
    font: 600 13px var(--font); cursor: pointer; }
  .foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px 14px; border-top: 1px solid var(--sep);
    font-size: 12px; color: var(--sub); }
  .sig { display: inline-flex; align-items: baseline; gap: 6px; letter-spacing: .12em; text-transform: uppercase; font-size: 10.5px; white-space: nowrap; }
  .hint { white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; cursor: help; }
  .sig .star { width: 10px; height: 10px; align-self: center; position: relative; top: 1px; }
  .sig a { text-decoration: none; text-transform: none; letter-spacing: .01em; font-size: 13.5px; font-weight: 800;
    background: linear-gradient(90deg,#962fbf 0%,#d62976 50%,#fa7e1e 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text;
    color: transparent; transition: background-position .6s ease; }
  .sig a:hover { background-position: 100% 0; }
  .sig .ver { letter-spacing: .02em; text-transform: none; font-size: 12px; }
  .hint kbd { font-size: 10.5px; line-height: 16px; }
  `;

  // ───────────── montagem ─────────────
  let host, root, nav, navTip, panel, ghostEl;
  let anchorMode = 'none'; // 'sidebar' | 'fab' | 'none'

  function ensure() {
    if (host && host.isConnected) return;
    host = document.createElement('salva-stories-menu');
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483000;';
    const sh = host.attachShadow({ mode: 'closed' });
    sh.innerHTML = `<style>${CSS}</style><div class="root" data-mode="dark">
      <button class="nav" type="button" hidden>${NAV_ICON}</button>
      <div class="navtip"></div>
      <div class="ghost" role="img" hidden><div class="gc">${GHOST}</div><div class="gtip"><b></b><span></span></div></div>
      <div class="panel" role="dialog" aria-modal="false" hidden></div>
    </div>`;
    root = sh.querySelector('.root');
    nav = sh.querySelector('.nav');
    navTip = sh.querySelector('.navtip');
    panel = sh.querySelector('.panel');
    ghostEl = sh.querySelector('.ghost');
    // nada do menu chega aos atalhos do Instagram
    for (const ev of ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'wheel']) {
      host.addEventListener(ev, (e) => e.stopPropagation());
    }
    nav.addEventListener('click', () => toggle(nav.getBoundingClientRect()));
    nav.addEventListener('mouseenter', () => { if (anchorMode !== 'sidebar' || isOpen()) return; const r = nav.getBoundingClientRect();
      navTip.textContent = tr('title'); navTip.style.left = Math.round(r.right + 10) + 'px'; navTip.style.top = Math.round(r.top + r.height / 2 - 15) + 'px'; navTip.classList.add('show'); });
    nav.addEventListener('mouseleave', () => navTip.classList.remove('show'));
    (document.body || document.documentElement).appendChild(host);
  }

  // ───────────── tema ─────────────
  function igIsDark() {
    const c = document.documentElement.classList;
    if (c.contains('__fb-dark-mode')) return true;
    if (c.contains('__fb-light-mode')) return false;
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function mode() { return S.theme === 'light' ? 'light' : S.theme === 'dark' ? 'dark' : (igIsDark() ? 'dark' : 'light'); }
  function applyMode() {
    if (!root) return;
    root.dataset.mode = mode();
    // o ícone da barra lateral sempre combina com o Instagram (não com o tema do menu)
    const igDark = igIsDark();
    root.style.setProperty('--navfg', igDark ? 'rgb(245,245,245)' : 'rgb(0,0,0)');
    root.style.setProperty('--navhover', igDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.05)');
    root.style.setProperty('--navbg', igDark ? 'rgb(37,41,46)' : '#fff');
  }

  // ───────────── ícone na barra lateral (ou botão flutuante) ─────────────
  // Acha a coluna de ícones da barra lateral (Início, Reels, Mensagens…) e põe o nosso logo abaixo do último
  // do grupo de cima, com o mesmo espaçamento. Fica no nosso shadow DOM: o React do Instagram não é tocado.
  function sidebarSlot() {
    // o logo do Instagram (no topo) também é link para "/": o item "Início" é o mais baixo dos dois
    const homes = [...document.querySelectorAll('a[href="/"] svg')].map((el) => el.getBoundingClientRect())
      .filter((r) => r.width >= 18 && r.width <= 30 && r.left < 140).sort((a, b) => b.top - a.top);
    const hr = homes[0];
    if (!hr) return null;
    const cx = hr.left + hr.width / 2;
    // svg dos itens + a foto do perfil (img 24×24), que também é item da barra
    const icons = [...document.querySelectorAll('svg, img')].map((s) => s.getBoundingClientRect())
      .filter((r) => r.width >= 18 && r.width <= 30 && Math.abs(r.left + r.width / 2 - cx) < 3 && r.top >= hr.top - 1)
      .sort((a, b) => a.top - b.top);
    if (icons.length < 2) return null;
    let last = icons[0], gap = 0;
    for (let i = 1; i < icons.length; i++) {
      const g = icons[i].top - icons[i - 1].top;
      if (g < 20) continue;
      if (gap && g > gap * 1.6) break; // começou o grupo de baixo (Configurações…)
      gap = gap || g; last = icons[i];
    }
    if (!gap) return null;
    const top = last.top + gap;
    if (top + 48 > innerHeight - 140) return null; // sem espaço antes do grupo de baixo
    return { x: cx - 24, y: top + last.height / 2 - 24 };
  }

  function placeNav() {
    ensure();
    applyMode();
    const onStories = location.pathname.startsWith('/stories/');
    if (onStories) { nav.hidden = true; ghostEl.hidden = true; anchorMode = 'none'; return; } // no story, engrenagem e fantasma ficam na pilha de botões
    const slot = sidebarSlot();
    if (slot) {
      anchorMode = 'sidebar';
      nav.classList.remove('fab');
      nav.style.left = Math.round(slot.x) + 'px';
      nav.style.top = Math.round(slot.y) + 'px';
    } else {
      anchorMode = 'fab'; // layout estreito/sem barra: botão redondo no canto, acima do "Mensagens"
      nav.classList.add('fab');
      nav.style.left = (innerWidth - 24 - 48) + 'px';
      nav.style.top = (innerHeight - 96 - 48) + 'px';
    }
    nav.hidden = false;
    // modo fantasma ligado → fantasminha logo abaixo do nosso ícone (no flutuante, acima dele)
    ghostEl.hidden = !S.ghost;
    if (S.ghost) {
      const nl = parseFloat(nav.style.left), nt = parseFloat(nav.style.top);
      ghostEl.style.left = nl + 'px';
      ghostEl.style.top = (anchorMode === 'fab' ? nt - 56 : nt + 52) + 'px';
      ghostEl.setAttribute('aria-label', tr('ghostOn'));
      ghostEl.querySelector('.gtip b').textContent = tr('ghostOn');
      ghostEl.querySelector('.gtip span').textContent = tr('ghostSub');
      ghostEl.classList.toggle('flip', anchorMode === 'fab');
    }
    nav.title = anchorMode === 'fab' ? tr('open') : '';
    nav.setAttribute('aria-label', tr('open'));
    nav.classList.toggle('on', isOpen());
  }

  // ───────────── painel ─────────────
  const isOpen = () => panel && !panel.hidden;
  let lastAnchor = null;

  const LABEL = { perUser: 'perUser', maxQuality: 'maxQ', showAll: 'all', hotkey: 'hotkey', ghost: 'ghost', player: 'player', profileBtn: 'profileBtn', inboxTools: 'inboxTools' };
  // linha com chave liga/desliga (a descrição pode ter <kbd>, por isso não passa por esc)
  function sw(key) {
    const k = LABEL[key];
    return `<div class="row" role="switch" tabindex="0" data-key="${key}" aria-checked="${!!S[key]}"><span class="txt"><span class="t">${esc(tr(k))}</span>`
      + `<span class="d">${tr(k + 'D')}</span></span><span class="sw${S[key] ? ' on' : ''}"></span></div>`;
  }

  function renderPanel() {
    if (!panel) return;
    const keepScroll = panel.querySelector('.body')?.scrollTop || 0;
    panel.innerHTML = `
      <div class="head"><span class="app">${APP_ICON}</span><h1>${esc(tr('title'))}</h1>
        <button class="x" type="button" title="${esc(tr('close'))}" aria-label="${esc(tr('close'))}">${X_ICON}</button></div>
      <div class="body">
        ${stale ? `<div class="stale"><span>${esc(tr('stale'))}</span><button type="button" class="reload">${esc(tr('reload'))}</button></div>` : ''}
        <div class="sec">${esc(tr('secDownloads'))}</div>
        <div class="field"><label for="ss-folder">${esc(tr('folder'))}</label>
          <input id="ss-folder" type="text" spellcheck="false" autocomplete="off" maxlength="120" placeholder="Instagram Stories" value="${esc(S.folder || '')}">
          <span class="d">${esc(tr('folderD'))}</span></div>
        ${sw('perUser')}${sw('maxQuality')}
        <div class="sec">${esc(tr('secStories'))}</div>
        ${sw('showAll')}${sw('hotkey')}
        <div class="sec">${esc(tr('secPrivacy'))}</div>
        ${sw('ghost')}
        <div class="sec">${esc(tr('secTools'))}</div>
        <div class="tool" role="button" tabindex="0" data-tool="follows"><span class="ti">${PEOPLE}</span>
          <span class="txt"><span class="t">${esc(tr('follows'))}</span><span class="d">${esc(tr('followsD'))}</span></span><span class="go">${CHEVRON}</span></div>
        ${sw('player')}${sw('profileBtn')}${sw('inboxTools')}
        <div class="sec">${esc(tr('secLook'))}</div>
        <div class="row static"><span class="txt"><span class="t">${esc(tr('lang'))}</span></span>
          <div class="flags" role="radiogroup" aria-label="${esc(tr('lang'))}">${['pt', 'en', 'es'].map(flag).join('')}</div></div>
        <div class="row static"><span class="txt"><span class="t">${esc(tr('theme'))}</span></span>
          <div class="seg" role="radiogroup" aria-label="${esc(tr('theme'))}">
            <button type="button" data-theme="auto" title="${esc(tr('autoD'))}">${AUTO}${esc(tr('auto'))}</button>
            <button type="button" data-theme="light">${SUN}${esc(tr('light'))}</button>
            <button type="button" data-theme="dark">${MOON}${esc(tr('dark'))}</button></div></div>
      </div>
      <div class="foot"><span class="sig">${STAR}<span>${esc(tr('madeBy'))}</span><a href="${GITHUB}" target="_blank" rel="noopener noreferrer">Dreds</a>${version ? `<span class="ver">· v${esc(version)}</span>` : ''}</span>
        <span class="hint" title="${esc(tr('hintT'))}"><kbd>Alt</kbd>+<kbd>S</kbd></span></div>`;
    panel.querySelector('.body').scrollTop = keepScroll;
    for (const f of panel.querySelectorAll('.flag')) { const on = f.dataset.lang === S.lang; f.classList.toggle('on', on); f.setAttribute('aria-checked', String(on)); }
    for (const b of panel.querySelectorAll('.seg button')) { const on = b.dataset.theme === (S.theme || 'auto'); b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }
    wirePanel();
    // altura pode mudar (idioma/tema): mantém o painel inteiro dentro da tela
    if (!panel.hidden) { const r = panel.getBoundingClientRect(); place(r.left, r.top); }
  }

  function wirePanel() {
    panel.querySelector('.x').addEventListener('click', close);
    const rl = panel.querySelector('.reload'); if (rl) rl.addEventListener('click', () => location.reload());
    for (const row of panel.querySelectorAll('.row[data-key]')) {
      const flip = () => set({ [row.dataset.key]: !S[row.dataset.key] });
      row.addEventListener('click', flip);
      row.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    }
    for (const f of panel.querySelectorAll('.flag')) f.addEventListener('click', () => set({ lang: f.dataset.lang }));
    for (const tl of panel.querySelectorAll('.tool')) {
      const go = () => { close(); window.dispatchEvent(new CustomEvent('salva-stories:' + tl.dataset.tool)); };
      tl.addEventListener('click', go);
      tl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    }
    for (const b of panel.querySelectorAll('.seg button')) b.addEventListener('click', () => set({ theme: b.dataset.theme }));
    const input = panel.querySelector('#ss-folder');
    let tm;
    input.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => set({ folder: input.value.trim() }, true), 400); });
    input.addEventListener('blur', () => { clearTimeout(tm); if (input.value.trim() !== S.folder) set({ folder: input.value.trim() }, true); });
    // arrastar pelo cabeçalho
    const head = panel.querySelector('.head');
    head.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.x')) return;
      const r = panel.getBoundingClientRect(); const ox = e.clientX - r.left, oy = e.clientY - r.top;
      head.classList.add('dragging'); head.setPointerCapture(e.pointerId);
      const mv = (ev) => { place(ev.clientX - ox, ev.clientY - oy); };
      const up = () => { head.classList.remove('dragging'); head.removeEventListener('pointermove', mv); head.removeEventListener('pointerup', up);
        const rr = panel.getBoundingClientRect(); saveUi({ x: Math.round(rr.left), y: Math.round(rr.top) }); };
      head.addEventListener('pointermove', mv); head.addEventListener('pointerup', up);
    });
  }

  function place(x, y) {
    const w = panel.offsetWidth || 360, h = panel.offsetHeight || 500;
    panel.style.left = Math.round(Math.min(Math.max(8, x), innerWidth - w - 8)) + 'px';
    panel.style.top = Math.round(Math.min(Math.max(8, y), innerHeight - h - 8)) + 'px';
  }

  function positionFrom(anchor) {
    const w = 360, h = panel.offsetHeight || 560;
    const ui = loadUi();
    if (ui.x != null && ui.y != null) { place(ui.x, ui.y); return; } // posição escolhida pelo André (arrastou)
    let x, y;
    if (anchor) {
      // à direita do botão se couber; senão à esquerda
      const right = anchor.right + 12 + w <= innerWidth - 8;
      x = right ? anchor.right + 12 : anchor.left - 12 - w;
      y = anchor.top - 24;
      if (anchorMode === 'fab') y = anchor.top - h - 12;
      panel.style.setProperty('--ox', right ? '0' : '100%');
      panel.style.setProperty('--oy', anchorMode === 'fab' ? '100%' : '0');
    } else { x = innerWidth - w - 24; y = 80; }
    place(x, y);
  }

  function open(anchor) {
    ensure(); applyMode();
    lastAnchor = anchor || lastAnchor;
    navTip.classList.remove('show');
    renderPanel();
    panel.hidden = false;
    positionFrom(lastAnchor);
    nav.classList.add('on');
  }
  function close() { if (!panel) return; panel.hidden = true; nav.classList.remove('on'); }
  function toggle(anchor) { isOpen() ? close() : open(anchor); }

  function set(patch, quiet) {
    Object.assign(S, patch);
    window.postMessage({ __salvaStories: 'page', kind: 'set', patch }, location.origin);
    applyMode();
    if (!quiet) renderPanel(); // o campo de pasta não é redesenhado enquanto se digita
  }

  // ───────────── ligações ─────────────
  window.addEventListener('message', (ev) => {
    if (ev.source !== window || !ev.data || ev.data.__salvaStories !== 'ext') return;
    const d = ev.data;
    if (d.kind === 'settings') {
      S = Object.assign(S, d.settings || {});
      if (d.version) version = d.version;
      applyMode();
      if (isOpen()) {
        const input = panel.querySelector('#ss-folder');
        const editing = input && input.matches(':focus');
        if (!editing) renderPanel();
      }
    }
    if (d.kind === 'stale') { stale = true; if (isOpen()) renderPanel(); }
    if (d.kind === 'toggleMenu') toggle(nav && !nav.hidden ? nav.getBoundingClientRect() : null);
  });
  // engrenagem do story (page.js) abre o menu ao lado dela
  window.addEventListener('salva-stories:menu', (e) => { const r = e.detail && e.detail.rect; toggle(r || null); });

  addEventListener('keydown', (e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
      e.preventDefault(); e.stopPropagation();
      toggle(nav && !nav.hidden ? nav.getBoundingClientRect() : null);
    } else if (e.key === 'Escape' && isOpen()) { close(); }
  }, true);
  // clique fora fecha
  addEventListener('pointerdown', (e) => {
    if (!isOpen()) return;
    const path = e.composedPath();
    if (path.includes(host) || path.some((n) => n && n.tagName === 'SALVA-STORIES')) return; // a engrenagem do story cuida do próprio clique
    close();
  }, true);

  // o Instagram é SPA: reposiciona o ícone ao navegar/redimensionar e acompanha o tema dele
  setInterval(placeNav, 500);
  addEventListener('resize', () => { placeNav(); if (isOpen()) positionFrom(lastAnchor); });
  new MutationObserver(applyMode).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // depuração pelo console: __salvaStoriesMenuDebug() — inclui a posição dos controles (o shadow DOM é fechado)
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; };
  window.__salvaStoriesMenuDebug = () => ({
    anchorMode, open: isOpen(), S, version, stale, slot: sidebarSlot(),
    at: isOpen() ? {
      ghost: box(panel.querySelector('.row[data-key="ghost"] .sw')), es: box(panel.querySelector('.flag[data-lang="es"]')),
      light: box(panel.querySelector('.seg [data-theme="light"]')), folder: box(panel.querySelector('#ss-folder')),
      dreds: box(panel.querySelector('.sig a')), close: box(panel.querySelector('.x')),
      follows: box(panel.querySelector('.tool[data-tool="follows"]')), player: box(panel.querySelector('.row[data-key="player"] .sw')),
    } : null,
    ghostBadge: ghostEl && !ghostEl.hidden ? box(ghostEl) : null,
  });
})();
