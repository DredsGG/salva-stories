// Salva Stories — fundo da extensão: valida e faz os downloads, procura atualização e se recarrega quando a pasta muda.
// O mesmo arquivo roda como service worker nos Chromium (Chrome, Edge, Brave, Opera GX) e como event page no Firefox
// (manifest com "service_worker" e "scripts"). Por isso nada de window/DOM aqui.
import { muxDash } from './remux.js';

// browser.* (Firefox e Chrome 148+) sempre devolve promessa; no Chrome antigo, ext.* do MV3 também.
// Aqui só se usa o estilo de promessa (sem callback), que vale nos dois.
const ext = (globalThis.browser && globalThis.browser.runtime) ? globalThis.browser : globalThis.chrome;
const IS_FF = !!(ext.runtime && ext.runtime.getBrowserInfo); // só o Firefox tem
// Opera: storage.sync pode não existir (tabela do MDN) → guarda no local
const SYNC = ext.storage.sync || ext.storage.local;

// muda a cada versão do service worker: a página confere e avisa se o Chrome ficou com o código antigo
const SW_BUILD = 'ss-sw-1.8.11';

// idioma da primeira abertura: o da interface do navegador (pt, en ou es; qualquer outro → en). Regra 13.
const UI_LANG = (() => { const l = String((ext.i18n && ext.i18n.getUILanguage && ext.i18n.getUILanguage()) || navigator.language || 'en').toLowerCase(); return l.startsWith('pt') ? 'pt' : l.startsWith('es') ? 'es' : 'en'; })();
const DEFAULTS = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: UI_LANG, theme: 'auto', player: true, reelsSound: true, storySpeed: true, avatarZoom: true, postBtn: true, profileBtn: true, inboxTools: true };
const ERR = {
  pt: { video: 'trilha de vídeo inválida', audio: 'trilha de áudio inválida', host: 'endereço de mídia fora do Instagram', refused: 'download recusado', none: 'nada baixado', urgent: 'atualização urgente pendente: atualize a extensão para voltar a baixar' },
  en: { video: 'invalid video track', audio: 'invalid audio track', host: 'media address outside Instagram', refused: 'download refused', none: 'nothing downloaded', urgent: 'urgent update pending: update the extension to download again' },
  es: { video: 'pista de video inválida', audio: 'pista de audio inválida', host: 'dirección de medios fuera de Instagram', refused: 'descarga rechazada', none: 'nada descargado', urgent: 'actualización urgente pendiente: actualiza la extensión para volver a descargar' },
};
let lang = UI_LANG;
const tr = (k) => (ERR[lang] || ERR.pt)[k];
const CDN = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i;

function safeUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && CDN.test(url.hostname) ? url.href : null;
  } catch (_) {
    return null;
  }
}

function clean(part, fallback) {
  const s = String(part || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f<>:"/\\|?*\u007f]+/g, '_')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 80);
  return s || fallback;
}

function folderPath(folder) {
  return String(folder || '')
    .split(/[\\/]+/)
    .map((p) => clean(p, ''))
    .filter((p) => p && p !== '..')
    .join('/');
}

function filenameFor(job, s) {
  const parts = [];
  const f = folderPath(s.folder);
  if (f) parts.push(f);
  if (s.perUser) parts.push(clean(job.user, 'instagram'));
  if (job.sub) { const sub = folderPath(job.sub); if (sub) parts.push(sub); } // ex.: posts/2026-10-01_ABC (perfil), videos (player)
  const ext = /^(jpg|png|webp|heic|mp4|m4v)$/.test(job.ext) ? job.ext : (job.type === 'video' ? 'mp4' : 'jpg');
  parts.push(clean(job.name, 'story') + '.' + ext);
  return parts.join('/');
}

async function download(opts) {
  let id;
  try { id = await ext.downloads.download(Object.assign({ conflictAction: 'uniquify', saveAs: false }, opts)); } catch (e) { throw new Error((e && e.message) || tr('refused')); }
  if (id === undefined) throw new Error(tr('refused'));
  return id;
}

async function fetchBytes(url) {
  const res = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error('CDN HTTP ' + res.status);
  return new Uint8Array(await res.arrayBuffer());
}

// vídeo juntado (DASH): no Firefox (event page) sai por blob:, nos Chromium (service worker, sem createObjectURL) por data:
function toDownloadUrl(bytes, mime) {
  if (typeof URL.createObjectURL === 'function') {
    const u = URL.createObjectURL(new Blob([bytes], { type: mime }));
    setTimeout(() => URL.revokeObjectURL(u), 120000);
    return u;
  }
  return toDataUrl(bytes, mime);
}
function toDataUrl(bytes, mime) {
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return `data:${mime};base64,` + btoa(bin);
}

// DASH: vídeo e áudio vêm em arquivos separados; junta sem recodificar.
async function downloadDash(videoUrl, audioUrl, filename) {
  const v = safeUrl(videoUrl);
  if (!v) throw new Error(tr('video'));
  if (!audioUrl) return download({ url: v, filename }); // vídeo sem som: o arquivo de vídeo já basta
  const a = safeUrl(audioUrl);
  if (!a) throw new Error(tr('audio'));
  const [vb, ab] = await Promise.all([fetchBytes(v), fetchBytes(a)]);
  return download({ url: toDownloadUrl(muxDash(vb, ab), 'video/mp4'), filename });
}

async function runJob(job, s) {
  const filename = filenameFor(job, s);
  const url = safeUrl(job.url);
  if (!url) throw new Error(tr('host'));
  if (job.kind === 'dash') return downloadDash(job.url, job.audioUrl, filename);
  if (job.hq && s.maxQuality) {
    try {
      return await downloadDash(job.hq.url, job.hq.audioUrl, filename);
    } catch (e) {
      console.warn('[Salva Stories] alta resolução falhou, usando o MP4 de 720p:', e);
    }
  }
  return download({ url, filename });
}

ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'salva-stories:ping') { sendResponse({ build: SW_BUILD, version: ext.runtime.getManifest().version, firefox: IS_FF }); return; }
  if (msg && msg.type === 'salva-stories:update') {
    const run = msg.cmd === 'check' ? procurar(msg.data === 'auto') : msg.cmd === 'apply' ? aplicar() : msg.cmd === 'guide' ? abrirGuia(msg.data) : msg.cmd === 'perm' ? conferirPermissao()
      : msg.cmd === 'dismiss' ? salvarUpd({ dispensada: msg.data || null, adiadaEm: Date.now() }) : msg.cmd === 'seen' ? salvarUpd({ acabouDeAtualizar: null }) : Promise.resolve(null);
    run.then((r) => sendResponse(r || {}), (e) => sendResponse({ erro: String((e && e.message) || e) }));
    return true;
  }
  if (!msg || msg.type !== 'salva-stories:download') return;
  if (!sender.tab || !/^https:\/\/(www\.)?instagram\.com\//.test(sender.url || sender.tab.url || '')) return;
  (async () => {
    const s = await SYNC.get(DEFAULTS);
    lang = s.lang || UI_LANG;
    // regra 14 d: versão urgente pendente → a extensão fica pausada até atualizar
    if (await urgentePendente()) { sendResponse({ ok: false, count: 0, error: tr('urgent') }); return; }
    const jobs = Array.isArray(msg.jobs) ? msg.jobs.slice(0, 60) : []; // o perfil manda em lotes
    let count = 0;
    const errors = [];
    for (const job of jobs) {
      try {
        await runJob(job, s);
        count++;
      } catch (e) {
        errors.push(e.message || String(e));
      }
      if (jobs.length > 1) await new Promise((r) => setTimeout(r, 600 + Math.random() * 600)); // espaça os pedidos à CDN
    }
    sendResponse(count ? { ok: true, count, errors } : { ok: false, error: errors[0] || tr('none') });
  })();
  return true;
});

ext.runtime.onInstalled.addListener(async () => {
  const cur = await SYNC.get(null);
  const missing = {};
  // o idioma não é gravado: enquanto a pessoa não escolher, segue o do navegador (regra 13)
  for (const k of Object.keys(DEFAULTS)) if (k !== 'lang' && !(k in cur)) missing[k] = DEFAULTS[k];
  if (Object.keys(missing).length) await SYNC.set(missing);
});

// Sem popup desde a v1.4.0: o clique no ícone abre o menu dentro do Instagram.
// Fora do Instagram (ou com a aba sem a extensão carregada), abre o Instagram.
// Sem permissão de site (o Firefox deixa o usuário tirar), abre o guia na parte que devolve a permissão.
ext.action.onClicked.addListener(async (tab) => {
  const perm = await conferirPermissao();
  if (!perm.ok) { abrirGuia('#permissao'); return; }
  try {
    await ext.tabs.sendMessage(tab.id, { type: 'salva-stories:toggle-menu' });
  } catch (_) {
    ext.tabs.create({ url: 'https://www.instagram.com/' });
  }
});

// ───────────────────────── permissão de site (Firefox: o usuário pode tirar em about:addons) ─────────────────────────
const ORIGENS = (ext.runtime.getManifest().host_permissions || []).slice();
async function conferirPermissao() {
  let falta = [];
  try {
    for (const o of ORIGENS) if (!(await ext.permissions.contains({ origins: [o] }))) falta.push(o);
  } catch (_) { falta = []; }
  const st = { ok: !falta.length, falta, em: Date.now() };
  try { await ext.storage.local.set({ 'ss.perm': st }); } catch (_) {}
  try {
    await ext.action.setBadgeText({ text: st.ok ? '' : '!' });
    if (!st.ok) await ext.action.setBadgeBackgroundColor({ color: '#d62976' });
  } catch (_) {}
  return st;
}
if (ext.permissions && ext.permissions.onRemoved) ext.permissions.onRemoved.addListener(() => conferirPermissao());
if (ext.permissions && ext.permissions.onAdded) ext.permissions.onAdded.addListener(() => conferirPermissao());

// ───────────────────────── atualização (regra 7, igual ao Midas e à Plateia) ─────────────────────────
// - Procura versão nova nos Releases do GitHub (DredsGG/salva-stories): ao abrir o Chrome, na instalação,
//   a cada 6 h e no botão "Procurar atualização" do menu.
// - Chrome Web Store: "Atualizar" pede a versão nova ao Chrome e recarrega.
// - Por pasta (modo desenvolvedor) o Chrome não deixa a extensão trocar os próprios arquivos: "Atualizar" baixa o zip;
//   quando os arquivos novos chegam na pasta (zip extraído por cima, ou gravados pela IA, manifest por último),
//   a extensão percebe em até 1 min e se recarrega sozinha, sem ↻. Se uma aba estiver no meio de um trabalho longo
//   (baixar perfil, ação no Direct, análise de seguidores), espera ele acabar.
// - Depois de recarregar, as abas do Instagram recarregam para pegar a versão nova.
const REPO = 'DredsGG/salva-stories';
const UPD_KEY = 'ss.update';
// regra 14 (revisada 27/10 20h): confere a cada 30 min, ao abrir o Instagram e ao voltar para a aba (no máximo 1 vez a cada 10 min)
const PROCURA_MIN = 30;
const PROCURA_TRAVA_MS = 10 * 60000;
const DISCO_MIN = 1;
const IG_TABS = ['https://www.instagram.com/*'];

const cmpVer = (a, b) => {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
};
const versaoAtual = () => ext.runtime.getManifest().version;
const tipoInstalacao = async () => { try { return (await ext.management.getSelf()).installType; } catch (_) { return 'development'; } };
async function salvarUpd(patch) {
  const cur = (await ext.storage.local.get(UPD_KEY))[UPD_KEY] || {};
  const novo = Object.assign({}, cur, patch);
  await ext.storage.local.set({ [UPD_KEY]: novo });
  return novo;
}

// auto = aberto/volta para a aba/alarme: respeita a trava de 10 min. Sem auto (botão do rodapé): confere na hora.
async function procurar(auto) {
  const cur = versaoAtual();
  const old = (await ext.storage.local.get(UPD_KEY))[UPD_KEY] || {};
  if (auto && old.procuradoEm && Date.now() - old.procuradoEm < PROCURA_TRAVA_MS && old.atual === cur) return old;
  const base = { procuradoEm: Date.now(), atual: cur, instalacao: await tipoInstalacao() };
  try {
    // ETag: se nada mudou, o GitHub responde 304 (mais leve no limite de 60 pedidos/h sem login)
    const h = { Accept: 'application/vnd.github+json' };
    if (old.etag && old.ultima) h['If-None-Match'] = old.etag;
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: h, cache: 'no-store' });
    if (r.status === 304) return salvarUpd(Object.assign(base, { disponivel: !!old.ultima && cmpVer(old.ultima, cur) > 0, erro: null }));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const ultima = String(j.tag_name || '').replace(/^v/i, '');
    const zip = ((j.assets || []).find((a) => /\.zip$/i.test(a.name)) || {}).browser_download_url || null;
    const xpi = ((j.assets || []).find((a) => /\.xpi$/i.test(a.name)) || {}).browser_download_url || null;
    // versão urgente: o André marca o Release com "URGENTE" no título (regra 14 d)
    const titulo = String(j.name || '').slice(0, 200);
    return salvarUpd(Object.assign(base, { ultima, titulo, urgente: /urgente|urgent/i.test(titulo), etag: r.headers.get('etag') || null, notas: String(j.body || '').slice(0, 4000), pagina: j.html_url || null, zip, xpi, firefox: IS_FF, disponivel: !!ultima && cmpVer(ultima, cur) > 0, erro: null }));
  } catch (e) {
    return salvarUpd(Object.assign(base, { erro: String((e && e.message) || e) }));
  }
}
const urgentePendente = async () => { const st = (await ext.storage.local.get(UPD_KEY))[UPD_KEY] || {}; return !!(st.urgente && st.ultima && cmpVer(st.ultima, versaoAtual()) > 0); };

async function aplicar() {
  const st = (await ext.storage.local.get(UPD_KEY))[UPD_KEY] || {};
  // Firefox: abrir o .xpi assinado faz o Firefox perguntar se instala (ele também se atualiza sozinho pelo update_url)
  if (IS_FF) {
    const u = st.xpi && /^https:\/\/github\.com\//.test(st.xpi) ? st.xpi : (st.pagina || `https://github.com/${REPO}/releases/latest`);
    await ext.tabs.create({ url: u, active: true });
    await salvarUpd({ baixadoEm: Date.now() });
    return { modo: st.xpi ? 'xpi' : 'pagina', status: 'aberto' };
  }
  if (await tipoInstalacao() === 'normal' && ext.runtime.requestUpdateCheck) {
    const res = await ext.runtime.requestUpdateCheck().then((r) => (r && r.status) || r).catch(() => 'no_update');
    if (res === 'update_available') { setTimeout(() => ext.runtime.reload(), 1500); return { modo: 'loja', status: 'aplicando' }; }
    return { modo: 'loja', status: res };
  }
  // por pasta: baixa o zip do Release para a pasta Downloads (o guia ensina a extrair por cima)
  const url = st.zip;
  if (url && /^https:\/\/github\.com\//.test(url)) {
    try { await ext.downloads.download({ url, conflictAction: 'uniquify', saveAs: false }); } catch (_) {}
  } else {
    await ext.tabs.create({ url: st.pagina || `https://github.com/${REPO}/releases/latest`, active: true });
  }
  await salvarUpd({ baixadoEm: Date.now() });
  return { modo: 'download', status: 'baixado' };
}

function abrirGuia(ancora) {
  const a = /^#[a-z]+$/.test(ancora || '') ? ancora : '';
  return ext.tabs.create({ url: ext.runtime.getURL('COMO-INSTALAR.html') + a }).then(() => ({ ok: true }));
}

// alguma aba do Instagram no meio de um trabalho longo? (a ponte responde; aba sem resposta = livre)
// Aba congelada/descartada pelo Chrome (economia de memória) não responde e a pergunta ficava pendurada para
// sempre, travando a recarga (visto ao vivo na 1.6.0): pula essas abas e dá no máximo 1,5 s para cada resposta.
const comPrazo = (p, ms) => Promise.race([p, new Promise((ok) => setTimeout(() => ok(null), ms))]);
async function abasOcupadas() {
  let tabs = [];
  try { tabs = await comPrazo(ext.tabs.query({ url: IG_TABS }), 3000) || []; } catch (_) { return false; }
  for (const t of tabs) {
    if (t.discarded || t.frozen || t.status === 'unloaded') continue;
    try {
      const r = await comPrazo(ext.tabs.sendMessage(t.id, { type: 'salva-stories:busy?' }), 1500);
      if (r && r.busy) return true;
    } catch (_) { /* aba sem a extensão carregada */ }
  }
  return false;
}

// por pasta: versão nova gravada na pasta (manifest por último) → recarrega em 15 s, quando nenhuma aba estiver ocupada
let recargaPendente = null, vigiando = false;
async function vigiarDisco() {
  if (vigiando) return; // uma conferência por vez
  vigiando = true;
  try { await comPrazo(conferirDisco(), 20000); } finally { vigiando = false; }
}
// registro da última conferência (vai no "Relatar bug" e ajuda a ver se a recarga sozinha está andando)
const anotarDisco = (o) => ext.storage.local.set({ 'ss.disco': Object.assign({ em: Date.now(), rodando: versaoAtual() }, o) }).catch(() => {});
async function conferirDisco() {
  if (await tipoInstalacao() !== 'development') return;
  try {
    const r = await fetch(ext.runtime.getURL('manifest.json') + '?t=' + Date.now(), { cache: 'no-store' });
    const noDisco = (await r.json()).version;
    if (!noDisco || noDisco === versaoAtual() || recargaPendente === noDisco) { anotarDisco({ noDisco, estado: recargaPendente === noDisco ? 'recarregando' : 'igual' }); return; }
    if (await abasOcupadas()) { anotarDisco({ noDisco, estado: 'esperando aba ocupada' }); return; } // tenta de novo no próximo minuto
    anotarDisco({ noDisco, estado: 'recarregando' });
    recargaPendente = noDisco;
    setTimeout(async () => { if (await abasOcupadas()) { recargaPendente = null; return; } ext.runtime.reload(); }, 15000);
  } catch (_) { /* manifest no meio da gravação: tenta no próximo minuto */ }
}

const agendar = () => {
  ext.alarms.create('ss-procura', { delayInMinutes: 1, periodInMinutes: PROCURA_MIN });
  ext.alarms.create('ss-disco', { delayInMinutes: DISCO_MIN, periodInMinutes: DISCO_MIN });
};
ext.alarms.onAlarm.addListener((a) => {
  if (a.name === 'ss-procura') procurar(true);
  if (a.name === 'ss-disco') vigiarDisco();
});
ext.runtime.onStartup.addListener(() => { agendar(); procurar(); conferirPermissao(); });
ext.runtime.onInstalled.addListener(async (d) => {
  agendar();
  conferirPermissao();
  // regra 12: instalação nova → tutorial na primeira abertura do Instagram; atualização → quadro de novidades
  try {
    const ob = (await ext.storage.local.get('ss.onboard'))['ss.onboard'];
    if (d.reason === 'install' && !ob) await ext.storage.local.set({ 'ss.onboard': { tutorial: 'pendente', visto: versaoAtual() } });
    if (d.reason === 'update' && !ob) await ext.storage.local.set({ 'ss.onboard': { tutorial: 'pulado', visto: d.previousVersion || '' } });
  } catch (_) {}
  if (d.reason === 'install') ext.tabs.create({ url: ext.runtime.getURL('COMO-INSTALAR.html#usar') });
  if (d.reason === 'update') {
    await salvarUpd({ acabouDeAtualizar: { de: d.previousVersion || null, para: versaoAtual(), em: Date.now() }, disponivel: false, atual: versaoAtual() });
    // as abas abertas ainda rodam a versão antiga (os scripts ficaram órfãos): recarregar põe a nova
    try { for (const t of await ext.tabs.query({ url: IG_TABS })) ext.tabs.reload(t.id); } catch (_) {}
  }
  procurar();
});
// o service worker pode dormir: garante os alarmes sempre que acordar
ext.alarms.get('ss-disco').then((a) => { if (!a) agendar(); }, () => agendar());
