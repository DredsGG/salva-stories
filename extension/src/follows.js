// Salva Stories — "Seguidores e seguindo": quem não te segue de volta, quem você não segue, mútuos,
// quem deixou de te seguir e quem começou, comparando com a análise anterior.
// Escrito do zero. Lê as listas pelo mesmo endpoint que a janela "Seguidores" do Instagram usa,
// devagar (pausa aleatória entre páginas, recua quando o Instagram pede), e guarda tudo só neste navegador.
// Não deixa de seguir ninguém em massa: isso é o que mais dá bloqueio de ação na conta.
(() => {
  'use strict';
  if (window.__salvaStoriesFollows) return;
  window.__salvaStoriesFollows = true;
  const API = () => window[Symbol.for('salvaStories.api')];
  const K = () => window[Symbol.for('salvaStories.kit')];

  const T = {
    pt: {
      title: 'Seguidores e seguindo', you: 'Sua conta', last: (d) => `Última análise: ${d}`, never: 'Ainda não analisado',
      introT: 'Descubra quem não te segue de volta', introB: 'A análise lê suas listas de seguidores e de quem você segue direto do Instagram, aqui no seu navegador. Nada sai do seu computador.',
      introPace: 'Vai devagar de propósito, como uma pessoa rolando a lista: umas 1.000 contas por minuto. Pode fechar esta janela que a análise continua.',
      start: 'Começar análise', again: 'Analisar de novo', cancel: 'Parar', close: 'Fechar',
      followers: 'Seguidores', following: 'Seguindo', of: (a, b) => b ? `${a} de ${b}` : a,
      wait: (s) => `O Instagram pediu uma pausa. Tentando de novo em ${s} s…`,
      tabs: { notBack: 'Não te seguem de volta', fans: 'Você não segue de volta', mutual: 'Mútuos', lost: 'Deixaram de te seguir', gained: 'Novos seguidores', ignored: 'Ignorados' },
      hint: { notBack: 'Você segue, mas eles não seguem você.', fans: 'Seguem você, mas você não segue.', mutual: 'Vocês se seguem.', lost: 'Seguiam na análise anterior e agora não seguem mais.', gained: 'Começaram a seguir desde a análise anterior.', ignored: 'Contas que você mandou ignorar (não aparecem em "Não te seguem de volta").' },
      needPrev: 'Aparece a partir da segunda análise.', since: (d) => `desde ${d}`,
      ratio: (p) => `${p}% de quem você segue te segue de volta`,
      search: 'Buscar nome ou @', hideVer: 'Ocultar verificados', sort: { recent: 'Mais recentes', az: 'A → Z', za: 'Z → A' },
      csv: 'Exportar CSV', open: 'Abrir perfil', ignore: 'Ignorar', unignore: 'Voltar a mostrar', verified: 'Verificado', private: 'Privado', followsYou: 'Segue você',
      empty: 'Ninguém aqui.', emptySearch: 'Nada encontrado para essa busca.',
      partial: 'O Instagram parou de responder no meio da análise, então ela não foi salva (números pela metade enganam). Tente de novo mais tarde.',
      canceled: 'Análise parada. Nada foi salvo.', login: 'Entre na sua conta do Instagram para analisar.', err: (m) => `Não deu certo: ${m}`,
      saved: 'Análise salva.', blocked: 'O Instagram pediu verificação ou bloqueou a ação. Parei para proteger a conta; espere algumas horas antes de tentar de novo.', tooBig: 'Lista grande demais para analisar com segurança (mais de 12.500 contas).', count: (n) => n === 1 ? '1 conta' : `${n} contas`,
    },
    en: {
      title: 'Followers & following', you: 'Your account', last: (d) => `Last scan: ${d}`, never: 'Not scanned yet',
      introT: "Find out who doesn't follow you back", introB: 'The scan reads your followers and following lists straight from Instagram, here in your browser. Nothing leaves your computer.',
      introPace: 'It goes slowly on purpose, like a person scrolling: about 1,000 accounts per minute. You can close this window and the scan keeps going.',
      start: 'Start scan', again: 'Scan again', cancel: 'Stop', close: 'Close',
      followers: 'Followers', following: 'Following', of: (a, b) => b ? `${a} of ${b}` : a,
      wait: (s) => `Instagram asked for a break. Retrying in ${s} s…`,
      tabs: { notBack: "Don't follow you back", fans: "You don't follow back", mutual: 'Mutuals', lost: 'Unfollowed you', gained: 'New followers', ignored: 'Ignored' },
      hint: { notBack: "You follow them, they don't follow you.", fans: "They follow you, you don't follow them.", mutual: 'You follow each other.', lost: 'Followed you in the previous scan, not anymore.', gained: 'Started following you since the previous scan.', ignored: 'Accounts you chose to ignore (hidden from "Don\'t follow you back").' },
      needPrev: 'Available from the second scan on.', since: (d) => `since ${d}`,
      ratio: (p) => `${p}% of who you follow follows you back`,
      search: 'Search name or @', hideVer: 'Hide verified', sort: { recent: 'Most recent', az: 'A → Z', za: 'Z → A' },
      csv: 'Export CSV', open: 'Open profile', ignore: 'Ignore', unignore: 'Show again', verified: 'Verified', private: 'Private', followsYou: 'Follows you',
      empty: 'Nobody here.', emptySearch: 'Nothing found for that search.',
      partial: 'Instagram stopped answering halfway, so the scan was not saved (half numbers mislead). Try again later.',
      canceled: 'Scan stopped. Nothing was saved.', login: 'Log in to Instagram to scan.', err: (m) => `Something went wrong: ${m}`,
      saved: 'Scan saved.', blocked: 'Instagram asked for a check or blocked the action. I stopped to protect the account; wait a few hours before trying again.', tooBig: 'List too large to scan safely (over 12,500 accounts).', count: (n) => n === 1 ? '1 account' : `${n} accounts`,
    },
    es: {
      title: 'Seguidores y seguidos', you: 'Tu cuenta', last: (d) => `Último análisis: ${d}`, never: 'Aún sin analizar',
      introT: 'Descubre quién no te sigue', introB: 'El análisis lee tus listas de seguidores y seguidos directo de Instagram, aquí en tu navegador. Nada sale de tu computadora.',
      introPace: 'Va despacio a propósito, como una persona desplazándose: unas 1.000 cuentas por minuto. Puedes cerrar esta ventana y el análisis sigue.',
      start: 'Empezar análisis', again: 'Analizar de nuevo', cancel: 'Detener', close: 'Cerrar',
      followers: 'Seguidores', following: 'Seguidos', of: (a, b) => b ? `${a} de ${b}` : a,
      wait: (s) => `Instagram pidió una pausa. Reintentando en ${s} s…`,
      tabs: { notBack: 'No te siguen', fans: 'No sigues de vuelta', mutual: 'Mutuos', lost: 'Dejaron de seguirte', gained: 'Nuevos seguidores', ignored: 'Ignorados' },
      hint: { notBack: 'Los sigues, pero no te siguen.', fans: 'Te siguen, pero no los sigues.', mutual: 'Se siguen mutuamente.', lost: 'Te seguían en el análisis anterior y ya no.', gained: 'Empezaron a seguirte desde el análisis anterior.', ignored: 'Cuentas que elegiste ignorar (no aparecen en "No te siguen").' },
      needPrev: 'Disponible desde el segundo análisis.', since: (d) => `desde ${d}`,
      ratio: (p) => `${p}% de quienes sigues te siguen`,
      search: 'Buscar nombre o @', hideVer: 'Ocultar verificados', sort: { recent: 'Más recientes', az: 'A → Z', za: 'Z → A' },
      csv: 'Exportar CSV', open: 'Abrir perfil', ignore: 'Ignorar', unignore: 'Volver a mostrar', verified: 'Verificado', private: 'Privado', followsYou: 'Te sigue',
      empty: 'Nadie aquí.', emptySearch: 'Nada encontrado con esa búsqueda.',
      partial: 'Instagram dejó de responder a mitad, así que el análisis no se guardó (números a medias engañan). Inténtalo más tarde.',
      canceled: 'Análisis detenido. No se guardó nada.', login: 'Inicia sesión en Instagram para analizar.', err: (m) => `Algo salió mal: ${m}`,
      saved: 'Análisis guardado.', blocked: 'Instagram pidió una verificación o bloqueó la acción. Me detuve para proteger la cuenta; espera unas horas antes de intentarlo de nuevo.', tooBig: 'Lista demasiado grande para analizar con seguridad (más de 12.500 cuentas).', count: (n) => n === 1 ? '1 cuenta' : `${n} cuentas`,
    },
  };
  let t = (k) => k;
  const tt = (group, k) => { const d = T[K().lang()] || T.pt; return (d[group] && d[group][k]) || T.pt[group][k]; };

  const SV = {
    people: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18.5 14.2A6.5 6.5 0 0 1 21.5 20"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    ver: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="rgb(0,149,246)" d="M12 1.5l2.6 2.1 3.3-.4 1.1 3.2 3 1.6-.9 3.2.9 3.2-3 1.6-1.1 3.2-3.3-.4L12 22.5l-2.6-2.1-3.3.4-1.1-3.2-3-1.6.9-3.2-.9-3.2 3-1.6 1.1-3.2 3.3.4z"/><path d="m8 12 2.7 2.7L16.5 9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    ext: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2.5 12S6 19 12 19a9 9 0 0 0 4.4-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    csv: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 12v6m-3-3 3 3 3-3"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/></svg>',
  };

  const CSS = `
  .scrim { position: fixed; inset: 0; width: 100vw; height: 100vh; background: var(--scrim); display: grid; place-items: center; animation: fade .18s; }
  @keyframes fade { from { opacity: 0; } }
  .win { width: min(940px, calc(100vw - 32px)); height: min(780px, calc(100vh - 40px)); background: var(--bg); color: var(--fg); border-radius: 20px; box-shadow: var(--shadow);
    display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; animation: pop .2s cubic-bezier(.2,.9,.3,1.15); }
  @keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.98); } }
  .hd { display: flex; align-items: center; gap: 14px; padding: 18px 18px 16px 22px; border-bottom: 1px solid var(--sep); }
  .logo { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; color: #fff; background: var(--grad); box-shadow: 0 4px 14px -4px rgba(214,41,118,.7); flex: none; }
  .ht { flex: 1; min-width: 0; }
  .ht h2 { margin: 0; font-size: 18px; font-weight: 800; }
  .ht .sub { color: var(--sub); font-size: 13px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bd { min-height: 0; display: grid; grid-template-rows: auto auto 1fr; }
  .ft { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 22px 12px; border-top: 1px solid var(--sep); color: var(--sub); font-size: 12.5px; }
  /* início / progresso */
  .intro { grid-row: 1 / 4; display: grid; place-items: center; padding: 30px; text-align: center; }
  .intro .in { max-width: 460px; display: grid; gap: 14px; justify-items: center; }
  .art { position: relative; width: 120px; height: 96px; margin-bottom: 4px; }
  .art .c { position: absolute; width: 64px; height: 64px; border-radius: 50%; top: 16px; display: grid; place-items: center; color: #fff; }
  .art .c1 { left: 6px; background: linear-gradient(135deg,#962fbf,#d62976); }
  .art .c2 { right: 6px; background: linear-gradient(135deg,#d62976,#fa7e1e); opacity: .85; mix-blend-mode: normal; }
  .art .q { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 30px; height: 30px; border-radius: 50%; background: var(--bg); border: 2px solid var(--sep); display: grid; place-items: center; font-weight: 800; color: var(--accent); }
  .intro h3 { margin: 0; font-size: 22px; font-weight: 800; }
  .intro p { margin: 0; color: var(--sub); }
  .intro .btn { height: 44px; padding: 0 26px; font-size: 15px; margin-top: 6px; }
  .pg { width: min(420px, 100%); display: grid; gap: 16px; text-align: left; margin-top: 4px; }
  .pg .l { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 6px; }
  .pg .l span:last-child { color: var(--sub); font-variant-numeric: tabular-nums; }
  .bar.ind > i { width: 32%; animation: ind 1.3s ease-in-out infinite; }
  @keyframes ind { from { margin-left: -32%; } to { margin-left: 100%; } }
  .warn { padding: 10px 14px; border-radius: 12px; background: rgba(250,126,30,.12); color: var(--fg); font-size: 13px; text-align: left; border: 1px solid rgba(250,126,30,.35); }
  /* resultado */
  .cards { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 10px; padding: 16px 18px 6px; }
  .card { position: relative; border: 1px solid var(--sep); border-radius: 14px; padding: 12px 12px 11px; text-align: left; background: transparent; color: var(--fg); cursor: pointer; font-family: var(--font); transition: background .12s, border-color .12s, transform .1s; }
  .card:hover { background: var(--hover); } .card:active { transform: scale(.98); }
  .card .n { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.1; }
  .card .lb { font-size: 12.5px; font-weight: 600; color: var(--sub); margin-top: 3px; line-height: 1.25; }
  .card .dl { position: absolute; right: 10px; top: 10px; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 99px; }
  .card .dl.up { color: rgb(0,163,108); background: rgba(0,163,108,.12); } .card .dl.dn { color: rgb(237,73,86); background: rgba(237,73,86,.12); }
  .card.on { border-color: transparent; background: linear-gradient(var(--bg),var(--bg)) padding-box, var(--grad) border-box; border: 2px solid transparent; padding: 11px 11px 10px; }
  .card.on .n { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .card[disabled] { opacity: .5; cursor: default; }
  .tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 18px; }
  .tools .h { flex: 1 1 100%; color: var(--sub); font-size: 13px; }
  .srch { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; border-radius: 10px; background: var(--card); color: var(--sub); }
  .srch input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--fg); font: 14px var(--font); }
  .chip { height: 34px; padding: 0 12px; border-radius: 99px; border: 1px solid var(--sep); background: transparent; color: var(--fg); font: 600 13px var(--font); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .chip.on { background: var(--fg); color: var(--bg); border-color: var(--fg); }
  select.chip { appearance: none; padding-right: 26px; background-image: linear-gradient(45deg, transparent 50%, var(--sub) 50%), linear-gradient(135deg, var(--sub) 50%, transparent 50%);
    background-position: right 13px center, right 8px center; background-size: 5px 5px; background-repeat: no-repeat; }
  select.chip option { color: #000; }
  .list { position: relative; overflow: auto; min-height: 0; border-top: 1px solid var(--sep); }
  .sp { position: relative; }
  .r { position: absolute; left: 0; right: 0; height: 64px; display: flex; align-items: center; gap: 12px; padding: 0 18px 0 22px; }
  .r:hover { background: var(--hover); }
  .av { width: 44px; height: 44px; border-radius: 50%; flex: none; object-fit: cover; background: var(--card); display: grid; place-items: center; font-weight: 800; color: #fff; font-size: 17px; }
  .who { flex: 1; min-width: 0; }
  .who .u { display: flex; align-items: center; gap: 5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--fg); text-decoration: none; }
  .who .u:hover { text-decoration: underline; }
  .who .f { color: var(--sub); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; }
  .tag { font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 99px; background: var(--card); color: var(--sub); display: inline-flex; align-items: center; gap: 3px; flex: none; }
  .ib { width: 36px; height: 36px; border-radius: 10px; border: 0; display: grid; place-items: center; background: transparent; color: var(--sub); cursor: pointer; flex: none; text-decoration: none; }
  .ib:hover { background: var(--card); color: var(--fg); }
  .nobody { display: grid; place-items: center; height: 100%; min-height: 160px; color: var(--sub); }
  @media (max-width: 720px) { .cards { grid-template-columns: repeat(3, minmax(0,1fr)); } }
  `;

  // ───────── dados ─────────
  const F_PRIV = 1, F_VER = 2;
  const pack = (u) => [String(u.pk || u.pk_id || u.id), u.username || '', u.full_name || '', (u.is_private ? F_PRIV : 0) | (u.is_verified ? F_VER : 0), u.profile_pic_url || ''];
  let me = null, data = null, scan = null; // scan = { followers:[], following:[], tot:{}, wait, state }
  let view = { tab: 'notBack', q: '', hideVer: false, sort: 'recent' };
  try { view = Object.assign(view, JSON.parse(localStorage.getItem('salvaStories.follows.view') || '{}')); } catch (_) {}
  const saveView = () => { try { localStorage.setItem('salvaStories.follows.view', JSON.stringify({ tab: view.tab, hideVer: view.hideVer, sort: view.sort })); } catch (_) {} };
  const storeKey = () => 'ss.follows.' + me;

  // nome da conta: link do perfil na barra lateral (a foto tem alt "Foto do perfil de fulano")
  function myName() {
    for (const img of document.querySelectorAll('a[href^="/"] img[alt]')) {
      const m = img.alt.match(/(?:perfil de|profile picture of|foto del perfil de)\s+@?([A-Za-z0-9._]{1,30})|^@?([A-Za-z0-9._]{1,30})['’]s profile picture/i);
      if (m) return m[1] || m[2];
    }
    return null;
  }
  async function load() {
    me = K().myId();
    if (!me) return null;
    data = (await K().lget(storeKey())) || null;
    return data;
  }

  function headers() {
    const api = API();
    const h = { 'x-ig-app-id': api.appId(), 'x-csrftoken': api.csrf(), 'x-requested-with': 'XMLHttpRequest' };
    try { const c = sessionStorage.getItem('www-claim-v2'); if (c) h['x-ig-www-claim'] = c; } catch (_) {}
    return h;
  }
  class Throttled extends Error {}
  class Blocked extends Error {} // feedback_required / checkpoint: parar na hora, sem insistir
  async function getJson(url) {
    const res = await fetch(url, { credentials: 'include', headers: headers() });
    if (res.status === 429) throw new Throttled('429');
    if (res.redirected && /^\/(accounts\/login\/?|challenge\/.*)?$/.test(new URL(res.url).pathname)) throw new Blocked(t('blocked'));
    if (res.status === 401 || res.status === 403) throw new Error(t('login'));
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) throw new Throttled('html'); // página de login / "aguarde" no lugar do JSON
    const j = await res.json();
    if (!res.ok || j.status === 'fail') {
      if (j.require_login || /feedback_required|checkpoint|challenge/i.test((j.message || '') + ' ' + (j.error_type || ''))) throw new Blocked(t('blocked'));
      if (j.spam || /wait|aguarde|espera|rate limit/i.test(j.message || '')) throw new Throttled(j.message || 'fail');
      throw new Error(j.message || 'HTTP ' + res.status);
    }
    return j;
  }

  async function withBackoff(fn) {
    const waits = [60, 120, 300];
    for (let i = 0; ; i++) {
      try { return await fn(); } catch (e) {
        if (!(e instanceof Throttled) || i >= waits.length) throw e;
        for (let s = waits[i]; s > 0; s--) {
          if (scan.stop) throw new Error('stop');
          scan.wait = s; paint();
          await K().sleep(1000);
        }
        scan.wait = 0; paint();
      }
    }
  }

  async function readList(kind) {
    const out = [], seen = new Set();
    let maxId = '', first = true, pages = 0;
    for (;;) {
      if (scan.stop) throw new Error('stop');
      const url = `/api/v1/friendships/${me}/${kind}/?count=${first ? 12 : 50}${maxId ? '&max_id=' + encodeURIComponent(maxId) : ''}&search_surface=follow_list_page`;
      const j = await withBackoff(() => getJson(url));
      for (const u of j.users || []) { const p = pack(u); if (!seen.has(p[0])) { seen.add(p[0]); out.push(p); } }
      scan[kind] = out; paint();
      maxId = j.next_max_id ? String(j.next_max_id) : '';
      first = false; pages++;
      if (!maxId) break;
      // lista incompleta gera falso "não te segue": acima do teto, para em vez de salvar pela metade
      if (pages >= 250) throw new Error(t('tooBig'));
      // ritmo: 1,5–3 s entre páginas e uma pausa maior a cada 15 (como o InstagramUnfollowers)
      await K().sleep(pages % 15 === 0 ? K().jitter(10000, 15000) : K().jitter(1500, 3000));
    }
    scan.done = Object.assign(scan.done || {}, { [kind]: true });
    return out;
  }

  async function runScan() {
    if (scan && scan.state === 'run') return;
    if (!me) await load();
    if (!me) { toast(t('login')); return; }
    scan = { state: 'run', followers: [], following: [], tot: {}, wait: 0, stop: false, msg: '' };
    paint();
    try {
      // sem chamar users/{id}/info (devolve 429 desde out/2026): o nome vem da própria página
      scan.meInfo = myName() ? { username: myName() } : null;
      paint();
      const following = await readList('following');
      await K().sleep(K().jitter(1500, 3000));
      const followers = await readList('followers');
      const prev = data && data.followers ? { at: data.at, followers: data.followers.map((x) => x.slice(0, 4)) } : (data && data.prev) || null;
      const hist = ((data && data.history) || []).concat([{ at: Date.now(), followers: followers.length, following: following.length }]).slice(-30);
      const next = { v: 1, at: Date.now(), me: scan.meInfo || (data && data.me) || null, followers, following, prev, history: hist, ignore: (data && data.ignore) || [] };
      const ok = await K().lset(storeKey(), next);
      data = next;
      scan = null;
      if (!ok) toast(t('err', 'storage'));
      else toast(t('saved'));
      if (view.tab === 'lost' || view.tab === 'gained') { if (!data.prev) view.tab = 'notBack'; }
    } catch (e) {
      if (e.message === 'stop') { scan = null; toast(t('canceled')); }
      else { scan.state = 'error'; scan.msg = e instanceof Throttled ? t('partial') : e instanceof Blocked ? e.message : t('err', e.message); }
    }
    paint();
  }

  // ───────── listas derivadas ─────────
  function sets(src) {
    const fol = src.followers || [], fing = src.following || [];
    const folIds = new Set(fol.map((x) => x[0])), fingIds = new Set(fing.map((x) => x[0]));
    const ign = new Set((data && data.ignore) || []);
    const out = {
      notBack: fing.filter((x) => !folIds.has(x[0]) && !ign.has(x[0])),
      fans: fol.filter((x) => !fingIds.has(x[0])),
      mutual: fing.filter((x) => folIds.has(x[0])),
      lost: null, gained: null,
      ignored: fing.filter((x) => ign.has(x[0])),
      folIds, nFol: fol.length, nFing: fing.length,
    };
    const prev = src === data && data.prev;
    if (prev && prev.followers) {
      const prevIds = new Set(prev.followers.map((x) => x[0]));
      out.lost = prev.followers.filter((x) => !folIds.has(x[0]));
      out.gained = fol.filter((x) => !prevIds.has(x[0]));
    }
    return out;
  }
  function filtered(list) {
    const q = view.q.trim().toLowerCase().replace(/^@/, '');
    let l = list;
    if (view.hideVer) l = l.filter((x) => !(x[3] & F_VER));
    if (q) l = l.filter((x) => x[1].toLowerCase().includes(q) || x[2].toLowerCase().includes(q));
    if (view.sort === 'az') l = l.slice().sort((a, b) => a[1].localeCompare(b[1]));
    else if (view.sort === 'za') l = l.slice().sort((a, b) => b[1].localeCompare(a[1]));
    return l;
  }

  // ───────── interface ─────────
  let ui = null, open = false, rowsNow = [], htmlOverflow = '';
  function toast(m) { if (ui) ui.toast(m); }
  const when = (ms) => { try { return new Intl.DateTimeFormat(K().lang() === 'en' ? 'en-US' : K().lang() === 'es' ? 'es-ES' : 'pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms)); } catch (_) { return new Date(ms).toLocaleString(); } };
  const esc = (s) => K().esc(s);
  const nf = (n) => K().nf(n);

  function ensureUI() {
    if (ui && ui.host.isConnected) return;
    ui = K().makeHost('salva-stories-follows', CSS, `<div class="scrim" hidden><div class="win" role="dialog" aria-modal="true"></div></div>`);
    ui.$('.scrim').addEventListener('pointerdown', (e) => { if (e.target === ui.$('.scrim')) close(); });
    ui.host.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    addEventListener('keydown', (e) => { if (open && e.key === 'Escape') close(); }, true);
  }

  async function show() {
    ensureUI();
    t = K().tr(T);
    ui.refreshMode();
    open = true;
    htmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    ui.$('.scrim').hidden = false;
    if (!data) await load();
    paint(true);
  }
  function close() {
    if (!open) return;
    open = false;
    ui.$('.scrim').hidden = true;
    document.documentElement.style.overflow = htmlOverflow;
  }

  function header() {
    const meName = (scan && scan.meInfo && scan.meInfo.username) || (data && data.me && data.me.username);
    const sub = data && data.at ? t('last', when(data.at)) : t('never');
    const running = scan && scan.state === 'run';
    return `<div class="hd"><div class="logo">${SV.people}</div>
      <div class="ht"><h2>${esc(t('title'))}</h2><div class="sub">${meName ? '@' + esc(meName) + ' · ' : ''}${esc(sub)}</div></div>
      ${data && !running ? `<button class="btn sec again" type="button">${SV.refresh}${esc(t('again'))}</button>` : ''}
      <button class="x cl" type="button" aria-label="${esc(t('close'))}">${K().ICON.x}</button></div>`;
  }

  function progressBlock() {
    const s = scan, line = (kind) => {
      const n = s[kind].length, done = s.done && s.done[kind], active = !done && (kind === 'following' || (s.done && s.done.following));
      const bar = done ? '<div class="bar"><i style="width:100%"></i></div>' : active ? '<div class="bar ind"><i></i></div>' : '<div class="bar"><i style="width:0"></i></div>';
      return `<div><div class="l"><span>${esc(t(kind))}</span><span>${esc(nf(n))}${done ? ' ✓' : ''}</span></div>${bar}</div>`;
    };
    return `<div class="pg">${line('following')}${line('followers')}${s.wait ? `<div class="warn">${esc(t('wait', s.wait))}</div>` : ''}</div>`;
  }

  function paint(fresh) {
    if (!ui || !open) return;
    const win = ui.$('.win');
    const running = scan && scan.state === 'run';
    const src = data;
    let body;
    if (!src || running) {
      body = `<div class="intro"><div class="in">
        <div class="art"><span class="c c1">${SV.people}</span><span class="c c2">${SV.people}</span><span class="q">?</span></div>
        <h3>${esc(t('introT'))}</h3><p>${esc(t('introB'))}</p>
        ${running ? progressBlock() : `<p style="font-size:13px">${esc(t('introPace'))}</p>`}
        ${scan && scan.state === 'error' ? `<div class="warn">${esc(scan.msg)}</div>` : ''}
        ${running ? `<button class="btn sec stop" type="button">${esc(t('cancel'))}</button>` : `<button class="btn pri go" type="button">${esc(t('start'))}</button>`}
      </div></div>`;
      win.innerHTML = header() + `<div class="bd">${body}</div>` + footer();
      wire();
      return;
    }
    const S = sets(src);
    if ((view.tab === 'lost' || view.tab === 'gained') && !S.lost) view.tab = 'notBack';
    const pct = S.nFing ? Math.round((S.mutual.length / S.nFing) * 100) : 0;
    const card = (k, n, delta) => `<button class="card${view.tab === k ? ' on' : ''}" data-tab="${k}" type="button"${n == null ? ' disabled' : ''} title="${esc(n == null ? t('needPrev') : tt('hint', k))}">
      <div class="n">${n == null ? '—' : nf(n)}</div><div class="lb">${esc(tt('tabs', k))}</div>${delta ? delta : ''}</button>`;
    const list = filtered(S[view.tab] || []);
    rowsNow = list;
    const prevAt = src === data && data.prev && data.prev.at;
    win.innerHTML = header() + `<div class="bd">
      <div class="cards">${card('notBack', S.notBack.length)}${card('fans', S.fans.length)}${card('mutual', S.mutual.length)}${card('lost', S.lost ? S.lost.length : null, S.lost && S.lost.length ? `<span class="dl dn">−${nf(S.lost.length)}</span>` : '')}${card('gained', S.gained ? S.gained.length : null, S.gained && S.gained.length ? `<span class="dl up">+${nf(S.gained.length)}</span>` : '')}</div>
      <div class="tools">
        ${scan && scan.state === 'error' ? `<div class="h"><div class="warn">${esc(scan.msg)}</div></div>` : ''}
        <div class="h">${esc(tt('hint', view.tab))}${(view.tab === 'lost' || view.tab === 'gained') && prevAt ? ' (' + esc(t('since', when(prevAt))) + ')' : ''} · <b>${esc(t('count', nf(list.length)))}</b> · ${esc(nf(S.nFol))} ${esc(t('followers').toLowerCase())}, ${esc(nf(S.nFing))} ${esc(t('following').toLowerCase())} · ${esc(t('ratio', pct))}</div>
        <label class="srch">${SV.search}<input type="search" placeholder="${esc(t('search'))}" value="${esc(view.q)}"></label>
        <button class="chip hv${view.hideVer ? ' on' : ''}" type="button">${SV.ver}${esc(t('hideVer'))}</button>
        <select class="chip so">${['recent', 'az', 'za'].map((k) => `<option value="${k}"${view.sort === k ? ' selected' : ''}>${esc(tt('sort', k))}</option>`).join('')}</select>
        <button class="chip ig${view.tab === 'ignored' ? ' on' : ''}" type="button">${SV.eyeOff}${esc(tt('tabs', 'ignored'))} (${nf(S.ignored.length)})</button>
        <button class="chip csv" type="button">${SV.csv}${esc(t('csv'))}</button>
      </div>
      <div class="list"><div class="sp"></div></div>
    </div>` + footer();
    wire(S);
    drawRows(true);
    if (!fresh) { const inp = ui.$('.srch input'); if (document.activeElement === ui.host && inp && view.q) { inp.focus(); inp.setSelectionRange(view.q.length, view.q.length); } }
  }

  function footer() {
    return `<div class="ft"><span>${esc(t('introB').split('. ').slice(-1)[0])}</span>${K().signature(K().version())}</div>`;
  }

  const H = 64;
  const COLORS = ['#962fbf', '#d62976', '#fa7e1e', '#4f5bd5', '#00a36c', '#e1306c'];
  function rowHtml(x, i, S) {
    const [pk, user, name, fl, pic] = x;
    const ign = data && data.ignore && data.ignore.includes(pk);
    const letter = esc((user[0] || '?').toUpperCase());
    const av = pic ? `<img class="av" src="${esc(pic)}" alt="" loading="lazy" decoding="async" data-l="${letter}" data-c="${COLORS[pk.length % COLORS.length]}">`
      : `<span class="av" style="background:${COLORS[Number(pk.slice(-2)) % COLORS.length]}">${letter}</span>`;
    const tags = [
      fl & F_VER ? `<span title="${esc(t('verified'))}">${SV.ver}</span>` : '',
    ].join('');
    const extra = [
      fl & F_PRIV ? `<span class="tag">${SV.lock}${esc(t('private'))}</span>` : '',
      (view.tab === 'mutual' || view.tab === 'notBack' || view.tab === 'ignored') ? '' : S && S.folIds.has(pk) && view.tab !== 'fans' && view.tab !== 'gained' ? `<span class="tag">${esc(t('followsYou'))}</span>` : '',
    ].join('');
    const canIgnore = view.tab === 'notBack' || view.tab === 'ignored';
    return `<div class="r" style="top:${i * H}px">${av}
      <div class="who"><a class="u" href="https://www.instagram.com/${encodeURIComponent(user)}/" target="_blank" rel="noopener noreferrer">${esc(user)}${tags}</a>
      <div class="f">${extra}<span>${esc(name)}</span></div></div>
      ${canIgnore ? `<button class="ib tg" type="button" data-pk="${esc(pk)}" title="${esc(ign ? t('unignore') : t('ignore'))}">${ign ? SV.eye : SV.eyeOff}</button>` : ''}
      <a class="ib" href="https://www.instagram.com/${encodeURIComponent(user)}/" target="_blank" rel="noopener noreferrer" title="${esc(t('open'))}">${SV.ext}</a></div>`;
  }
  let lastRange = '';
  function drawRows(force) {
    const box = ui.$('.list'); if (!box) return;
    const sp = box.querySelector('.sp');
    const n = rowsNow.length;
    if (!n) { sp.style.height = ''; sp.innerHTML = `<div class="nobody">${esc(view.q ? t('emptySearch') : t('empty'))}</div>`; lastRange = ''; return; }
    sp.style.height = n * H + 'px';
    const a = Math.max(0, Math.floor(box.scrollTop / H) - 8), b = Math.min(n, Math.ceil((box.scrollTop + box.clientHeight) / H) + 8);
    const key = a + ':' + b + ':' + n;
    if (!force && key === lastRange) return;
    lastRange = key;
    const S = cachedSets;
    sp.innerHTML = rowsNow.slice(a, b).map((x, j) => rowHtml(x, a + j, S)).join('');
    for (const img of sp.querySelectorAll('img.av')) img.addEventListener('error', () => {
      const s = document.createElement('span'); s.className = 'av'; s.style.background = img.dataset.c; s.textContent = img.dataset.l; img.replaceWith(s);
    }, { once: true });
  }
  let cachedSets = null;

  function wire(S) {
    cachedSets = S || null;
    const $ = ui.$;
    $('.cl').addEventListener('click', close);
    const again = $('.again'); if (again) again.addEventListener('click', runScan);
    const go = $('.go'); if (go) go.addEventListener('click', runScan);
    const stop = $('.stop'); if (stop) stop.addEventListener('click', () => { if (scan) scan.stop = true; });
    if (!S) return;
    for (const c of ui.$$('.card')) c.addEventListener('click', () => { if (c.disabled) return; view.tab = c.dataset.tab; saveView(); ui.$('.list').scrollTop = 0; paint(); });
    const inp = $('.srch input');
    inp.addEventListener('input', () => { view.q = inp.value; const S2 = cachedSets; rowsNow = filtered(S2[view.tab] || []); ui.$('.list').scrollTop = 0; drawRows(true); updateCount(); });
    $('.hv').addEventListener('click', () => { view.hideVer = !view.hideVer; saveView(); paint(); });
    $('.so').addEventListener('change', (e) => { view.sort = e.target.value; saveView(); paint(); });
    $('.ig').addEventListener('click', () => { view.tab = view.tab === 'ignored' ? 'notBack' : 'ignored'; saveView(); paint(); });
    $('.csv').addEventListener('click', exportCsv);
    const list = $('.list');
    list.addEventListener('scroll', () => requestAnimationFrame(() => drawRows(false)), { passive: true });
    list.addEventListener('click', async (e) => {
      const b = e.target.closest && e.target.closest('.tg');
      if (!b || !data) return;
      const pk = b.dataset.pk;
      const ig = new Set(data.ignore || []);
      ig.has(pk) ? ig.delete(pk) : ig.add(pk);
      data.ignore = [...ig];
      await K().lset(storeKey(), data);
      const top = list.scrollTop;
      paint();
      ui.$('.list').scrollTop = top; drawRows(true);
    });
  }
  function updateCount() {
    const h = ui.$('.tools .h:last-of-type b'); if (h) h.textContent = t('count', nf(rowsNow.length));
  }

  function exportCsv() {
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const lines = [['username', 'full_name', 'profile_url', 'verified', 'private', 'list'].join(',')];
    for (const [, user, name, fl] of rowsNow) lines.push([q(user), q(name), q(`https://www.instagram.com/${user}/`), fl & F_VER ? 1 : 0, fl & F_PRIV ? 1 : 0, q(tt('tabs', view.tab))].join(','));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `instagram_${view.tab}_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // throttle do repaint durante a análise
  let paintQueued = false;
  const _paint = paint;
  paint = function (fresh) {
    if (fresh) return _paint(true);
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(() => { paintQueued = false; if (scan && scan.state === 'run' && ui && open && ui.$('.pg')) { updateProgress(); } else _paint(false); });
  };
  function updateProgress() {
    const pg = ui.$('.pg'); if (!pg) return _paint(false);
    const tmp = document.createElement('div'); tmp.innerHTML = progressBlock();
    const nu = tmp.firstElementChild;
    // atualiza só o que mudou (trocar a barra inteira reiniciaria a animação)
    if (nu.children.length !== pg.children.length) return pg.replaceWith(nu);
    [...nu.children].forEach((n, i) => {
      const o = pg.children[i];
      if (o.outerHTML === n.outerHTML) return;
      const ol = o.querySelector('.l'), nl = n.querySelector('.l'), ob = o.querySelector('.bar'), nb = n.querySelector('.bar');
      if (!ol || !nl || !ob || !nb) return o.replaceWith(n);
      if (ol.innerHTML !== nl.innerHTML) ol.innerHTML = nl.innerHTML;
      if (ob.outerHTML !== nb.outerHTML) ob.replaceWith(nb);
    });
  }

  window.addEventListener('salva-stories:follows', () => { if (API() && K()) show(); });
  const __box = (el) => { if (!el || el.hidden) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  window.__salvaStoriesFollowsDebug = () => ({ open, at: ui ? { go: __box(ui.$('.go')), again: __box(ui.$('.again')), stop: __box(ui.$('.stop')), close: __box(ui.$('.cl')), cards: Object.fromEntries(ui.$$('.card').map((c) => [c.dataset.tab, __box(c)])), search: __box(ui.$('.srch input')), hideVer: __box(ui.$('.hv')) } : null, me: !!me, hasData: !!data, savedAt: data && data.at, nFol: data && data.followers && data.followers.length, nFing: data && data.following && data.following.length, scan: scan && { state: scan.state, fol: scan.followers.length, fing: scan.following.length, wait: scan.wait } });
})();
