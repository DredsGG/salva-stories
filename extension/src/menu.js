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
      reelsSound: 'Som ligado no Reels', reelsSoundD: 'Os reels já começam com som e continuam com som ao passar. Se você mutar, fica mudo até sair do Reels',
      storySpeed: 'Velocidade nos stories', storySpeedD: 'Botão para ver story de vídeo em 0,5×, 1,5× ou 2×',
      postBtn: 'Botões nos posts', postBtnD: 'No post aberto e no feed, salva a foto da tela ou todas do carrossel',
      profileBtn: 'Botão "baixar perfil"', profileBtnD: 'Na página de um perfil, baixa todos os posts organizados em pastas',
      inboxTools: 'Seleção no direct', inboxToolsD: 'Selecionar várias conversas e agir em todas de uma vez',
      ghostOn: 'Modo fantasma ligado', ghostSub: 'Ninguém vê que você assistiu', ghostClick: 'Clique para desligar', ghostOffA: 'Desligar o modo fantasma', ghostOffT: 'Modo fantasma desligado', ghostOffSub: 'Quem postou vê que você assistiu', ghostOnClick: 'Clique para ligar', ghostOnA: 'Ligar o modo fantasma', open2: 'Abrir',
      updCheck: 'Procurar atualização', updChecking: 'Procurando…', updLatest: 'Você está na versão mais nova', updFail: 'Não deu para procurar agora',
      updAvail: (v) => `v${v} disponível`, updTitle: 'Atualização disponível', updUrgTitle: 'Atualização urgente: a extensão está pausada até atualizar', updGo: 'Atualizar', updLater: 'Depois', updHow: 'Como atualizar, passo a passo',
      updDownloaded: 'O zip novo foi para a pasta Downloads. Extraia por cima da pasta da extensão: ela se recarrega sozinha em até 1 minuto.',
      updDone: (a, b) => `Salva Stories atualizado: v${a} → v${b}`, updHelp: 'Como instalar e atualizar',
      swOld: 'A parte de fundo da extensão ficou na versão antiga (o Chrome não trocou). Abra chrome://extensions e clique em ↻ no Salva Stories. É só desta vez: daqui para frente ele se atualiza sozinho.',
      bugBtn: 'Relatar bug', bugTitle: 'Relatar um bug', bugPh: 'O que aconteceu? Ex.: o botão de baixar sumiu, o vídeo saiu sem som, o perfil parou no meio…',
      bugDiag: 'O que vai junto (nada da sua conta)', bugOpen: 'Abrir no GitHub', bugCopy: 'Copiar relatório', bugCopied: 'Copiado!', bugFail: 'Não deu para copiar',
      bugNote: 'Abrir no GitHub pede uma conta no GitHub (é grátis). Sem conta? Copie o relatório e mande para quem te passou o Salva Stories.',
      bugWhatHead: 'O que aconteceu', bugTrimmed: 'cortado para caber; o completo vai no Copiar',
      help: 'Como usar', updXpi: 'O Firefox vai perguntar se instala a versão nova: confirme. Ele também se atualiza sozinho.',
      permT: 'Falta permissão de acesso', permD: 'O Firefox tirou o acesso da extensão a uma parte do Instagram. Sem ele, os botões e os downloads podem falhar.', permGo: 'Permitir acesso',
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
      reelsSound: 'Sound on in Reels', reelsSoundD: 'Reels start with sound and keep it as you swipe. If you mute, it stays muted until you leave Reels',
      storySpeed: 'Speed in stories', storySpeedD: 'A button to watch video stories at 0.5×, 1.5× or 2×',
      postBtn: 'Post buttons', postBtnD: 'On an open post and in the feed, saves the photo on screen or the whole carousel',
      profileBtn: '"Download profile" button', profileBtnD: "On a profile page, downloads every post into tidy folders",
      inboxTools: 'Direct selection', inboxToolsD: 'Select several chats and act on all of them at once',
      ghostOn: 'Ghost mode on', ghostSub: 'Nobody sees that you watched', ghostClick: 'Click to turn it off', ghostOffA: 'Turn off ghost mode', ghostOffT: 'Ghost mode off', ghostOffSub: 'The poster sees that you watched', ghostOnClick: 'Click to turn it on', ghostOnA: 'Turn on ghost mode', open2: 'Open',
      updCheck: 'Check for updates', updChecking: 'Checking…', updLatest: "You're on the latest version", updFail: "Couldn't check right now",
      updAvail: (v) => `v${v} available`, updTitle: 'Update available', updUrgTitle: 'Urgent update: the extension is paused until you update', updGo: 'Update', updLater: 'Later', updHow: 'How to update, step by step',
      updDownloaded: 'The new zip went to your Downloads folder. Unzip it over the extension folder: it reloads itself within 1 minute.',
      updDone: (a, b) => `Salva Stories updated: v${a} → v${b}`, updHelp: 'How to install and update',
      swOld: "The extension's background part stayed on the old version (Chrome didn't swap it). Open chrome://extensions and click ↻ on Salva Stories. Only this once: from now on it updates itself.",
      bugBtn: 'Report a bug', bugTitle: 'Report a bug', bugPh: 'What happened? E.g. the download button disappeared, the video has no sound, the profile stopped halfway…',
      bugDiag: 'What gets attached (nothing from your account)', bugOpen: 'Open on GitHub', bugCopy: 'Copy report', bugCopied: 'Copied!', bugFail: "Couldn't copy",
      bugNote: 'Opening on GitHub needs a GitHub account (free). No account? Copy the report and send it to whoever shared Salva Stories with you.',
      bugWhatHead: 'What happened', bugTrimmed: 'trimmed to fit; the full log is in Copy',
      help: 'How to use', updXpi: 'Firefox will ask whether to install the new version: confirm. It also updates itself.',
      permT: 'Missing site access', permD: "Firefox removed the extension's access to part of Instagram. Without it, the buttons and downloads may fail.", permGo: 'Allow access',
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
      reelsSound: 'Sonido activado en Reels', reelsSoundD: 'Los reels empiezan con sonido y lo mantienen al pasar. Si silencias, queda en silencio hasta salir de Reels',
      storySpeed: 'Velocidad en historias', storySpeedD: 'Un botón para ver historias de video a 0,5×, 1,5× o 2×',
      postBtn: 'Botones en las publicaciones', postBtnD: 'En una publicación abierta y en el feed, guarda la foto en pantalla o todo el carrusel',
      profileBtn: 'Botón "descargar perfil"', profileBtnD: 'En un perfil, descarga todas las publicaciones en carpetas ordenadas',
      inboxTools: 'Selección en el direct', inboxToolsD: 'Selecciona varios chats y actúa en todos a la vez',
      ghostOn: 'Modo fantasma activado', ghostSub: 'Nadie ve que la viste', ghostClick: 'Haz clic para desactivarlo', ghostOffA: 'Desactivar el modo fantasma', ghostOffT: 'Modo fantasma desactivado', ghostOffSub: 'Quien publicó ve que la viste', ghostOnClick: 'Haz clic para activarlo', ghostOnA: 'Activar el modo fantasma', open2: 'Abrir',
      updCheck: 'Buscar actualización', updChecking: 'Buscando…', updLatest: 'Tienes la versión más nueva', updFail: 'No se pudo buscar ahora',
      updAvail: (v) => `v${v} disponible`, updTitle: 'Actualización disponible', updUrgTitle: 'Actualización urgente: la extensión está en pausa hasta actualizar', updGo: 'Actualizar', updLater: 'Después', updHow: 'Cómo actualizar, paso a paso',
      updDownloaded: 'El zip nuevo fue a la carpeta Descargas. Extráelo sobre la carpeta de la extensión: se recarga sola en hasta 1 minuto.',
      updDone: (a, b) => `Salva Stories actualizado: v${a} → v${b}`, updHelp: 'Cómo instalar y actualizar',
      swOld: 'La parte de fondo de la extensión quedó en la versión antigua (Chrome no la cambió). Abre chrome://extensions y haz clic en ↻ en Salva Stories. Solo esta vez: desde ahora se actualiza sola.',
      bugBtn: 'Reportar error', bugTitle: 'Reportar un error', bugPh: '¿Qué pasó? Ej.: desapareció el botón de descargar, el video salió sin sonido, el perfil se detuvo a mitad…',
      bugDiag: 'Lo que se adjunta (nada de tu cuenta)', bugOpen: 'Abrir en GitHub', bugCopy: 'Copiar informe', bugCopied: '¡Copiado!', bugFail: 'No se pudo copiar',
      bugNote: 'Abrir en GitHub requiere una cuenta de GitHub (gratis). ¿Sin cuenta? Copia el informe y envíalo a quien te pasó Salva Stories.',
      bugWhatHead: 'Qué pasó', bugTrimmed: 'recortado para que quepa; el completo va en Copiar',
      help: 'Cómo usar', updXpi: 'Firefox preguntará si instala la versión nueva: confirma. También se actualiza solo.',
      permT: 'Falta permiso de acceso', permD: 'Firefox quitó el acceso de la extensión a una parte de Instagram. Sin él, los botones y las descargas pueden fallar.', permGo: 'Permitir acceso',
    },
  };

  let S = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: (() => { const l = String(navigator.language || 'en').toLowerCase(); return l.startsWith('pt') ? 'pt' : l.startsWith('es') ? 'es' : 'en'; })(), theme: 'auto', player: true, reelsSound: true, storySpeed: true, postBtn: true, profileBtn: true, inboxTools: true };
  let version = '';
  let stale = false;
  const tr = (k, ...a) => { const v = (T[S.lang] || T.pt)[k] ?? T.pt[k]; return typeof v === 'function' ? v(...a) : v; };
  // atualização e relato de bug (regra 7 / Relatar bug, igual ao Midas, à Plateia e ao PokeIdle)
  const REPO = 'DredsGG/salva-stories';
  let upd = {}, updBusy = null, updDownloaded = false, updXpi = false, swOk = true, bugOpen = false, bugText = '', disco = null, perm = null;
  const IS_FF = /Firefox\//.test(navigator.userAgent);
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
  const REFRESH = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/></svg>';
  const BUG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 12v8M9 5l1.5 2M15 5l-1.5 2M3 13h4M17 13h4M4 19l3-2M20 19l-3-2M4 7l3 2M20 7l-3 2"/></svg>';
  const GIFT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>';
  const LANG_NAME = { pt: 'Português', en: 'English', es: 'Español' };
  // bandeira + anel no MESMO svg (concêntricos em vetor; igual à v1.3.2 do popup)
  const flag = (l) => `<button type="button" class="flag" data-lang="${l}" role="radio" title="${LANG_NAME[l]}"><svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">`
    + `<defs><clipPath id="sc-${l}"><circle cx="16" cy="16" r="12"/></clipPath><linearGradient id="sr-${l}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#962fbf"/><stop offset=".55" stop-color="#d62976"/><stop offset="1" stop-color="#fa7e1e"/></linearGradient></defs>`
    + `<g class="fl" clip-path="url(#sc-${l})"><g transform="translate(4 4) scale(1.2)">${FLAG_IN[l]}</g></g>`
    + `<circle class="ring" cx="16" cy="16" r="13.5" fill="none" stroke="url(#sr-${l})" stroke-width="3.4"/></svg><span class="lc">${l.toUpperCase()}</span></button>`;
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
  /* fantasminha abaixo do ícone da barra: aceso = modo fantasma ligado, apagado = desligado; clique liga/desliga (1.8.9) */
  .ghost { position: fixed; z-index: 2147483000; width: 48px; height: 48px; display: grid; place-items: center; cursor: pointer; user-select: none; outline: none; }
  .ghost:hover .gc { background: rgba(150,47,191,.24); }
  .ghost.off .gc { background: transparent; box-shadow: none; }
  .ghost.off .gc::before { background: var(--navfg, #fff); opacity: .45; }
  .ghost.off svg { filter: none; animation: none; opacity: .6; }
  .ghost.off:hover svg { opacity: .8; }
  .ghost.off .gtip b { background: none; color: #fff; }
  .ghost:focus-visible .gc { outline: 2px solid var(--navfg, #fff); outline-offset: 2px; }
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
  .gtip i { display: block; margin-top: 4px; font-style: normal; color: rgba(255,255,255,.55); font-size: 11px; }
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
  .head .hb { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; padding: 0; cursor: pointer;
    border: 1.5px solid var(--sep); background: transparent; color: var(--sub); font: 700 14px var(--font, inherit); }
  .head .hb:hover { color: var(--fg); border-color: var(--sub); }
  .head .hb + .x { margin-left: 0; }
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
  .flag { width: 34px; padding: 0; border: 0; background: transparent; cursor: pointer; border-radius: 8px; transition: transform .15s; display: grid; justify-items: center; gap: 1px; }
  .flag .lc { font: 700 9.5px/1 var(--font, inherit); letter-spacing: .06em; color: var(--sub); }
  .flag.on .lc { color: var(--fg); }
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
  .foot { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; padding: 10px 16px 14px; border-top: 1px solid var(--sep); font-size: 12px; color: var(--sub); }
  .foot .r1, .foot .r2 { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
  .foot .r1 .uchk { flex: 1 1 auto; min-width: 0; justify-content: center; }
  .foot .r1 .ubug { flex: 1 1 auto; min-width: 0; justify-content: center; }
  .fbtn { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 0; border-radius: 8px; background: var(--card); color: var(--fg);
    font: 600 12px var(--font); cursor: pointer; white-space: nowrap; transition: background .15s; }
  .fbtn:hover { background: var(--hover); }
  .fbtn.spin svg { animation: spin .9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .ust { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; text-align: center; }
  .ust:empty { display: none; }
  .ust.av { color: #d62976; font-weight: 700; cursor: pointer; }
  .fi { width: 22px; height: 22px; flex: none; border-radius: 50%; border: 1px solid var(--sep); background: transparent; color: var(--sub); font: 700 11px/1 Georgia, serif; cursor: pointer; display: grid; place-items: center; padding: 0; }
  .fi:hover { color: var(--fg); background: var(--hover); }
  /* cartões no topo do painel */
  .card2 { margin: 12px 16px 4px; padding: 12px 12px 10px; border-radius: 12px; font-size: 13px; color: var(--fg); }
  .card2 h4 { margin: 0 0 6px; font-size: 13.5px; display: flex; align-items: center; gap: 6px; }
  .card2 h4 small { font-weight: 600; color: var(--sub); }
  .card2 ul { margin: 4px 0 8px; padding-left: 18px; color: var(--fg); } .card2 li { margin: 2px 0; }
  .card2 .acts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .card2 .b1 { height: 30px; padding: 0 14px; border: 0; border-radius: 8px; background: var(--grad); color: #fff; font: 700 13px var(--font); cursor: pointer; }
  .card2 .b2 { height: 30px; padding: 0 12px; border: 0; border-radius: 8px; background: var(--card); color: var(--fg); font: 600 13px var(--font); cursor: pointer; }
  .card2 .lk { margin-left: auto; color: #d62976; font-weight: 600; font-size: 12px; cursor: pointer; background: none; border: 0; padding: 0; }
  .card2.gold { background: linear-gradient(135deg, rgba(250,126,30,.16), rgba(214,41,118,.12)); border: 1px solid rgba(250,126,30,.45); }
  .card2.ok { background: rgba(0,163,108,.12); border: 1px solid rgba(0,163,108,.4); display: flex; align-items: center; gap: 10px; }
  .card2.ok .x2 { margin-left: auto; }
  .card2.warn { background: rgba(250,126,30,.12); border: 1px solid rgba(250,126,30,.45); }
  .card2.blue { background: rgba(0,149,246,.08); border: 1px solid rgba(0,149,246,.35); }
  .card2 textarea { width: 100%; min-height: 70px; resize: vertical; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--sep); background: var(--bg); color: var(--fg); font: 13px/1.35 var(--font); outline: none; }
  .card2 textarea:focus { border-color: #d62976; }
  .card2 .lbl { margin: 8px 0 4px; font-size: 11.5px; font-weight: 700; color: var(--sub); text-transform: uppercase; letter-spacing: .05em; }
  .card2 pre { margin: 0 0 8px; max-height: 110px; overflow: auto; padding: 8px; border-radius: 8px; background: var(--card); font: 11px/1.4 ui-monospace, Consolas, monospace; white-space: pre-wrap; word-break: break-word; color: var(--sub); }
  .card2 .note { font-size: 11.5px; color: var(--sub); margin-bottom: 8px; }
  .x2 { width: 24px; height: 24px; border-radius: 50%; border: 0; background: transparent; color: var(--fg); cursor: pointer; display: grid; place-items: center; padding: 0; }
  .x2:hover { background: var(--hover); }
  .nav.upd::after { content: ""; position: absolute; top: 9px; right: 9px; width: 9px; height: 9px; border-radius: 50%; background: rgb(0,149,246); box-shadow: 0 0 0 2px var(--navbg, #000); }
  .sig { display: inline-flex; align-items: baseline; gap: 6px; letter-spacing: .12em; text-transform: uppercase; font-size: 10.5px; white-space: nowrap; }
  .flang { display: inline-flex; align-items: center; gap: 1px; font: 700 11px var(--font, inherit); letter-spacing: .05em; color: var(--sub); white-space: nowrap; }
  .flang button { border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; padding: 3px 5px; border-radius: 6px; }
  .flang button:hover { color: var(--fg); }
  .flang button.on { color: var(--fg); background: var(--card); }
  .flang i { font-style: normal; opacity: .5; }
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
      <div class="ghost" role="button" tabindex="0" hidden><div class="gc">${GHOST}</div><div class="gtip"><b></b><span></span><i></i></div></div>
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
    // fantasminha: clique (ou Enter) desliga o modo fantasma; para ligar de novo, a chave no menu
    const ghostToggle = () => { set({ ghost: !S.ghost }, !isOpen()); placeNav(); };
    ghostEl.addEventListener('click', ghostToggle);
    ghostEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ghostToggle(); } });
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

  // Um menu do Instagram por cima do nosso lugar (o "Mais" abre no canto de baixo da barra, por cima do nosso
  // ícone e do fantasminha): o que fica no ponto, tirando o que é nosso, é o vão vazio da coluna da barra (o
  // elemento que contém o "Início"). Se for outra coisa (um item do menu aberto), o ícone se esconde até o menu fechar.
  function homeLink() {
    return [...document.querySelectorAll('a[href="/"]')].filter((a) => { const r = a.getBoundingClientRect(); return r.width && r.left < 140; })
      .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] || null;
  }
  function coveredAt(x, y, home) {
    if (!home || x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
    const hit = document.elementsFromPoint(x, y).find((e) => !/^SALVA-STORIES/.test(e.tagName));
    return !!hit && !hit.contains(home);
  }
  let coverCheck = 0;
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
    const home = anchorMode === 'sidebar' && !isOpen() ? homeLink() : null;
    const nl = parseFloat(nav.style.left), nt = parseFloat(nav.style.top);
    nav.hidden = !!home && coveredAt(nl + 24, nt + 24, home);
    // modo fantasma ligado → fantasminha logo abaixo do nosso ícone (no flutuante, acima dele)
    ghostEl.hidden = !!home && (nav.hidden || coveredAt(nl + 24, nt + 52 + 22, home)); // sempre à vista: aceso ou apagado
    if (nav.hidden) navTip.classList.remove('show');
    {
      ghostEl.classList.toggle('off', !S.ghost);
      ghostEl.setAttribute('aria-pressed', String(!!S.ghost));
      ghostEl.style.left = nl + 'px';
      ghostEl.style.top = (anchorMode === 'fab' ? nt - 56 : nt + 52) + 'px';
      ghostEl.setAttribute('aria-label', tr(S.ghost ? 'ghostOffA' : 'ghostOnA'));
      ghostEl.querySelector('.gtip b').textContent = tr(S.ghost ? 'ghostOn' : 'ghostOffT');
      ghostEl.querySelector('.gtip span').textContent = tr(S.ghost ? 'ghostSub' : 'ghostOffSub');
      ghostEl.querySelector('.gtip i').textContent = tr(S.ghost ? 'ghostClick' : 'ghostOnClick');
      ghostEl.classList.toggle('flip', anchorMode === 'fab');
    }
    nav.title = anchorMode === 'fab' ? tr('open') : '';
    nav.setAttribute('aria-label', tr('open'));
    nav.classList.toggle('on', isOpen());
    nav.classList.toggle('upd', !!(upd.disponivel && upd.ultima) || !swOk);
  }

  // ───────────── painel ─────────────
  const isOpen = () => panel && !panel.hidden;
  let lastAnchor = null;

  const LABEL = { perUser: 'perUser', maxQuality: 'maxQ', showAll: 'all', hotkey: 'hotkey', ghost: 'ghost', player: 'player', reelsSound: 'reelsSound', storySpeed: 'storySpeed', postBtn: 'postBtn', profileBtn: 'profileBtn', inboxTools: 'inboxTools' };
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
        <button class="hb" type="button" title="${esc(tr('help'))}" aria-label="${esc(tr('help'))}">?</button>
        <button class="x" type="button" title="${esc(tr('close'))}" aria-label="${esc(tr('close'))}">${X_ICON}</button></div>
      <div class="body">
        ${stale ? `<div class="stale"><span>${esc(tr('stale'))}</span><button type="button" class="reload">${esc(tr('reload'))}</button></div>` : ''}
        ${cardsHtml()}
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
        ${sw('player')}${sw('reelsSound')}${sw('storySpeed')}${sw('postBtn')}${sw('profileBtn')}${sw('inboxTools')}
        <div class="sec">${esc(tr('secLook'))}</div>
        <div class="row static"><span class="txt"><span class="t">${esc(tr('lang'))}</span></span>
          <div class="flags" role="radiogroup" aria-label="${esc(tr('lang'))}">${['pt', 'en', 'es'].map(flag).join('')}</div></div>
        <div class="row static"><span class="txt"><span class="t">${esc(tr('theme'))}</span></span>
          <div class="seg" role="radiogroup" aria-label="${esc(tr('theme'))}">
            <button type="button" data-theme="auto" title="${esc(tr('autoD'))}">${AUTO}${esc(tr('auto'))}</button>
            <button type="button" data-theme="light">${SUN}${esc(tr('light'))}</button>
            <button type="button" data-theme="dark">${MOON}${esc(tr('dark'))}</button></div></div>
      </div>
      <div class="foot">
        <div class="r1"><button type="button" class="fbtn uchk${updBusy === 'check' ? ' spin' : ''}" title="${esc(tr('updCheck'))}">${REFRESH}${esc(tr('updCheck'))}</button>
          <button type="button" class="fbtn ubug" title="${esc(tr('bugTitle'))}">${BUG}${esc(tr('bugBtn'))}</button>
          <button type="button" class="fi uhelp" title="${esc(tr('updHelp'))}" aria-label="${esc(tr('updHelp'))}">i</button></div>
        <div class="ust${upd.disponivel ? ' av' : ''}">${esc(updStatus())}</div>
        <div class="r2"><span class="sig">${STAR}<span>${esc(tr('madeBy'))}</span><a href="${GITHUB}" target="_blank" rel="noopener noreferrer">Dreds</a>${version ? `<span class="ver">· v${esc(version)}</span>` : ''}</span>
        <span class="flang" role="radiogroup" aria-label="${esc(tr('lang'))}" title="${esc(tr('hintT'))}">${['pt', 'en', 'es'].map((l, i) => `${i ? '<i>·</i>' : ''}<button type="button" data-l="${l}" role="radio" aria-checked="${S.lang === l}" class="${S.lang === l ? 'on' : ''}" title="${LANG_NAME[l]}">${l.toUpperCase()}</button>`).join('')}</span></div></div>`;
    panel.querySelector('.body').scrollTop = keepScroll;
    for (const f of panel.querySelectorAll('.flag')) { const on = f.dataset.lang === S.lang; f.classList.toggle('on', on); f.setAttribute('aria-checked', String(on)); }
    for (const b of panel.querySelectorAll('.seg button')) { const on = b.dataset.theme === (S.theme || 'auto'); b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }
    wirePanel();
    // altura pode mudar (idioma/tema): mantém o painel inteiro dentro da tela
    if (!panel.hidden) { const r = panel.getBoundingClientRect(); place(r.left, r.top); }
  }

  function wirePanel() {
    panel.querySelector('.head .x').addEventListener('click', close);
    // "?" = Como usar: reabre o tutorial (regra 12)
    panel.querySelector('.hb').addEventListener('click', () => { const ob = window[Symbol.for('salvaStories.onboard')]; close(); if (ob) ob.tutorial(); });
    const rl = panel.querySelector('.reload'); if (rl) rl.addEventListener('click', () => location.reload());
    wireUpdBug();
    for (const row of panel.querySelectorAll('.row[data-key]')) {
      const flip = () => set({ [row.dataset.key]: !S[row.dataset.key] });
      row.addEventListener('click', flip);
      row.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    }
    for (const f of panel.querySelectorAll('.flag')) f.addEventListener('click', () => set({ lang: f.dataset.lang }));
    // PT · EN · ES no rodapé, sempre à vista (regra 13)
    for (const b of panel.querySelectorAll('.flang button')) b.addEventListener('click', () => set({ lang: b.dataset.l }));
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
      if (e.button !== 0 || e.target.closest('.x, .hb')) return;
      const r = panel.getBoundingClientRect(); const ox = e.clientX - r.left, oy = e.clientY - r.top;
      head.classList.add('dragging'); head.setPointerCapture(e.pointerId);
      const mv = (ev) => { place(ev.clientX - ox, ev.clientY - oy); };
      const up = () => { head.classList.remove('dragging'); head.removeEventListener('pointermove', mv); head.removeEventListener('pointerup', up);
        const rr = panel.getBoundingClientRect(); saveUi({ x: Math.round(rr.left), y: Math.round(rr.top) }); };
      head.addEventListener('pointermove', mv); head.addEventListener('pointerup', up);
    });
  }

  // ───────────── atualização e relato de bug ─────────────
  const updCmd = (cmd, data) => window.postMessage({ __salvaStories: 'page', kind: 'updCmd', cmd, data }, location.origin);
  function updStatus() {
    if (updBusy === 'check') return tr('updChecking');
    if (upd.disponivel && upd.ultima) return tr('updAvail', upd.ultima);
    if (upd.erro && !upd.ultima) return tr('updFail');
    return upd.procuradoEm ? tr('updLatest') : '';
  }
  // notas do Release (markdown simples) → até 5 itens curtos, sem o bloco "Install" que o workflow põe no topo
  const noteItems = (md) => String(md || '').replace(/^\s*#+\s*Install[\s\S]*?(\n\s*\n)(?=\S)/i, '').split(/\r?\n/)
    .map((l) => l.replace(/^\s*(#+|[-*+]|\d+\.)\s*/, '').replace(/[*_`]/g, '').trim())
    .filter((l) => l && !/^(install|download|open .?chrome|drag the zip)/i.test(l))
    .flatMap((l) => (l.length > 170 ? l.split(/(?<=[.!?])\s+/) : [l])).filter(Boolean).slice(0, 5);
  function cardsHtml() {
    let h = '';
    if (perm && perm.ok === false) h += `<div class="card2 warn"><b>${esc(tr('permT'))}</b><div>${esc(tr('permD'))}</div><div class="acts"><button type="button" class="b1 upermgo">${esc(tr('permGo'))}</button></div></div>`;
    if (!swOk && !IS_FF) h += `<div class="card2 warn">${esc(tr('swOld'))}</div>`;
    const j = upd.acabouDeAtualizar;
    if (j && j.para === version && Date.now() - (j.em || 0) < 30 * 60000) {
      h += `<div class="card2 ok"><span>${GIFT}</span><b>${esc(tr('updDone', j.de || '?', j.para))}</b><button type="button" class="x2 useen" aria-label="${esc(tr('close'))}">${X_ICON}</button></div>`;
    }
    const urg = !!(upd.urgente && upd.disponivel);
    if (upd.disponivel && upd.ultima && (urg || upd.dispensada !== upd.ultima)) {
      const items = noteItems(upd.notas);
      h += `<div class="card2 ${urg ? 'warn' : 'gold'}"><h4>${esc(tr(urg ? 'updUrgTitle' : 'updTitle'))} <small>· v${esc(upd.atual || version)} → v${esc(upd.ultima)}</small></h4>
        ${items.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${updDownloaded ? `<div class="note">${esc(tr('updDownloaded'))}</div>` : ''}${updXpi || IS_FF ? `<div class="note">${esc(tr('updXpi'))}</div>` : ''}
        <div class="acts"><button type="button" class="b1 ugo">${esc(updBusy === 'apply' ? '…' : tr('updGo'))}</button>${urg ? '' : `<button type="button" class="b2 ulater">${esc(tr('updLater'))}</button>`}
          <button type="button" class="lk uhow">${esc(tr('updHow'))}</button></div></div>`;
    }
    if (bugOpen) {
      h += `<div class="card2 blue"><h4>${BUG} ${esc(tr('bugTitle'))}<button type="button" class="x2 bclose" style="margin-left:auto" aria-label="${esc(tr('close'))}">${X_ICON}</button></h4>
        <textarea class="bwhat" maxlength="2000" placeholder="${esc(tr('bugPh'))}">${esc(bugText)}</textarea>
        <div class="lbl">${esc(tr('bugDiag'))}</div><pre class="bdiag">${esc(bugReport(bugText).diag)}</pre>
        <div class="note">${esc(tr('bugNote'))}</div>
        <div class="acts"><button type="button" class="b1 bgh">${esc(tr('bugOpen'))}</button><button type="button" class="b2 bcopy">${esc(tr('bugCopy'))}</button></div></div>`;
    }
    return h;
  }
  // relatório: versão, navegador, tipo de página, ajustes e o registro da extensão. Nada da conta.
  function bugReport(what, maxLog = 60) {
    const api = window[Symbol.for('salvaStories.api')];
    const ua = navigator.userAgent;
    const fx = (ua.match(/Firefox\/([\d.]+)/) || [])[1];
    const brow = fx ? `Firefox ${fx}` : /Edg\//.test(ua) ? `Edge ${(ua.match(/Edg\/([\d.]+)/) || [])[1] || '?'}` : /OPR\//.test(ua) ? `Opera ${(ua.match(/OPR\/([\d.]+)/) || [])[1] || '?'}`
      : `${navigator.brave ? 'Brave' : 'Chrome'} ${(ua.match(/Chrome\/([\d.]+)/) || [])[1] || '?'}`;
    const os = /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : '?';
    const p = location.pathname;
    const page = /^\/stories\//.test(p) ? 'stories' : /^\/direct\//.test(p) ? 'direct' : /^\/(?:[^/]+\/)?reels?\//.test(p) ? 'reel' : /^\/(?:[^/]+\/)?p\//.test(p) ? 'post'
      : /^\/explore\//.test(p) ? 'explore' : p === '/' ? 'feed' : /^\/[A-Za-z0-9._]{1,30}\/?$/.test(p) ? 'profile' : 'other';
    const on = (k) => (S[k] ? 'on' : 'off');
    const meta = [
      `Salva Stories: v${version || '?'} (${upd.instalacao || '?'}) · background ${swOk ? 'ok' : 'OLD'}`,
      disco ? `Auto-reload: checked ${Math.round((Date.now() - (disco.em || 0)) / 60000)} min ago · disk v${disco.noDisco || '?'} · running v${disco.rodando || '?'} · ${disco.estado || '?'}` : 'Auto-reload: no check yet',
      `Browser: ${brow} · ${os} · UI ${S.lang} · ${navigator.language}${perm && perm.ok === false ? ' · site access MISSING' : ''}`,
      `Page: ${page} · theme ${S.theme} (${mode()})`,
      `Settings: ghost ${on('ghost')}, maxQuality ${on('maxQuality')}, perUser ${on('perUser')}, showAll ${on('showAll')}, hotkey ${on('hotkey')}, player ${on('player')}, reelsSound ${on('reelsSound')}, storySpeed ${on('storySpeed')}, postBtn ${on('postBtn')}, profileBtn ${on('profileBtn')}, inboxTools ${on('inboxTools')}, custom folder ${S.folder && S.folder !== 'Instagram Stories' ? 'yes' : 'no'}`,
      api && api.itemCount ? `Cache: ${api.itemCount()} items` : '',
    ].filter(Boolean).join('\n');
    const logs = api && api.logs ? api.logs() : [];
    const locale = S.lang === 'en' ? 'en-US' : S.lang === 'es' ? 'es-ES' : 'pt-BR';
    const msgOf = (m) => (m && typeof m === 'object' ? (m[S.lang] || m.en || m.pt) : m);
    const log = logs.slice(-maxLog).map((l) => `${new Date(l.t).toLocaleTimeString(locale)} ${l.level === 'info' ? '' : l.level.toUpperCase() + ' '}${msgOf(l.msg)}`);
    return { what: String(what || '').trim(), meta, log, diag: `${meta}\n\nLog:\n${log.join('\n') || '-'}` };
  }
  function bugUrl(what) {
    const r = bugReport(what);
    const title = '[Bug] ' + (r.what.split('\n')[0].slice(0, 70) || `v${version || '?'}`);
    const make = (log, cut) => `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(
      `### ${tr('bugWhatHead')}\n\n${r.what || '-'}\n\n### Diagnostics\n\n\`\`\`text\n${r.meta}\n\nLog${cut ? ' (' + tr('bugTrimmed') + ')' : ''}:\n${log.join('\n') || '-'}\n\`\`\`\n`)}`;
    let log = r.log, url = make(log, false);
    while (url.length > 7500 && log.length > 3) { log = log.slice(Math.ceil(log.length / 5)); url = make(log, true); }
    return url;
  }
  function wireUpdBug() {
    const q = (s) => panel.querySelector(s);
    const on = (s, fn) => { const el = q(s); if (el) el.addEventListener('click', fn); };
    on('.uchk', () => { updBusy = 'check'; renderPanel(); updCmd('check'); });
    on('.ust', () => { if (upd.disponivel) { upd.dispensada = null; updCmd('dismiss', null); renderPanel(); } });
    on('.uhelp', () => updCmd('guide', '#atualizar'));
    on('.upermgo', () => updCmd('guide', '#permissao'));
    on('.uhow', () => updCmd('guide', '#atualizar'));
    on('.ugo', () => { updBusy = 'apply'; renderPanel(); updCmd('apply'); });
    on('.ulater', () => { upd.dispensada = upd.ultima; updCmd('dismiss', upd.ultima); renderPanel(); });
    on('.useen', () => { upd.acabouDeAtualizar = null; updCmd('seen'); renderPanel(); });
    on('.ubug', () => { bugOpen = !bugOpen; renderPanel(); if (bugOpen) { const b = panel.querySelector('.body'); if (b) b.scrollTop = 0; const ta = q('.bwhat'); if (ta) ta.focus(); } });
    on('.bclose', () => { bugOpen = false; renderPanel(); });
    const ta = q('.bwhat');
    if (ta) {
      ta.addEventListener('input', () => { bugText = ta.value; const d = q('.bdiag'); if (d) d.textContent = bugReport(bugText).diag; });
      ta.addEventListener('keydown', (e) => e.stopPropagation());
    }
    on('.bgh', () => window.open(bugUrl(bugText), '_blank', 'noopener'));
    on('.bcopy', async (e) => {
      const b = e.currentTarget, r = bugReport(bugText, 150);
      const text = `Salva Stories — bug report\n\n${r.what || '-'}\n\n${r.diag}`;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {
        const x = document.createElement('textarea'); x.value = text; document.body.appendChild(x); x.select();
        try { ok = document.execCommand('copy'); } catch (__) {} x.remove();
      }
      b.textContent = tr(ok ? 'bugCopied' : 'bugFail'); setTimeout(() => { b.textContent = tr('bugCopy'); }, 1600);
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
    if (!upd.procuradoEm || Date.now() - upd.procuradoEm > 3600e3) { updBusy = 'check'; updCmd('check'); }
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
    if (d.kind === 'upd') { upd = d.state || {}; if (updBusy === 'check' && upd.procuradoEm && Date.now() - upd.procuradoEm < 10000) updBusy = null; refreshOpen(); }
    if (d.kind === 'updRes') { if (d.cmd === 'apply') { updBusy = null; updDownloaded = !!(d.res && d.res.modo === 'download'); updXpi = !!(d.res && d.res.modo === 'xpi'); } if (d.cmd === 'check') updBusy = null; refreshOpen(); }
    if (d.kind === 'perm') { perm = d.state || null; refreshOpen(); }
    if (d.kind === 'sw') { swOk = !!d.ok; refreshOpen(); }
    if (d.kind === 'disco') disco = d.state || null;
    if (d.kind === 'toggleMenu') toggle(nav && !nav.hidden ? nav.getBoundingClientRect() : null);
  });
  // redesenha o painel aberto sem atrapalhar quem está digitando (pasta ou relato)
  function refreshOpen() {
    if (!isOpen()) return;
    const a = panel.querySelector('#ss-folder'), b = panel.querySelector('.bwhat');
    if ((a && a.matches(':focus')) || (b && b.matches(':focus'))) { const st = panel.querySelector('.ust'); if (st) st.textContent = updStatus(); return; }
    renderPanel();
  }
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
  // menu do Instagram abrindo/fechando por clique ou tecla: confere logo, sem esperar os 500 ms
  const soon = () => { clearTimeout(coverCheck); coverCheck = setTimeout(() => { placeNav(); setTimeout(placeNav, 200); }, 40); };
  addEventListener('click', soon, true);
  addEventListener('keyup', soon, true);
  addEventListener('resize', () => { placeNav(); if (isOpen()) positionFrom(lastAnchor); });
  new MutationObserver(applyMode).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // depuração pelo console: __salvaStoriesMenuDebug() — inclui a posição dos controles (o shadow DOM é fechado)
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; };
  window.__salvaStoriesMenuDebug = () => ({
    anchorMode, open: isOpen(), S, version, stale, slot: sidebarSlot(), upd, swOk, disco, bugUrl: bugOpen ? bugUrl(bugText) : null,
    at: isOpen() ? {
      ghost: box(panel.querySelector('.row[data-key="ghost"] .sw')), es: box(panel.querySelector('.flag[data-lang="es"]')), langFoot: Object.fromEntries([...panel.querySelectorAll('.flang button')].map((b) => [b.dataset.l, box(b)])),
      light: box(panel.querySelector('.seg [data-theme="light"]')), folder: box(panel.querySelector('#ss-folder')),
      dreds: box(panel.querySelector('.sig a')), close: box(panel.querySelector('.head .x')), help: box(panel.querySelector('.hb')),
      follows: box(panel.querySelector('.tool[data-tool="follows"]')), player: box(panel.querySelector('.row[data-key="player"] .sw')),
      uchk: box(panel.querySelector('.uchk')), ubug: box(panel.querySelector('.ubug')), ugo: box(panel.querySelector('.ugo')), bgh: box(panel.querySelector('.bgh')), bwhat: box(panel.querySelector('.bwhat')),
    } : null,
    ghostBadge: ghostEl && !ghostEl.hidden ? box(ghostEl) : null, ghostOff: ghostEl ? ghostEl.classList.contains('off') : null, navHidden: nav ? nav.hidden : null,
  });
})();
