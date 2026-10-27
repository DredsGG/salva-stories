// Salva Stories — service worker: valida e faz os downloads, procura atualização e se recarrega quando a pasta muda.
import { muxDash } from './remux.js';

// muda a cada versão do service worker: a página confere e avisa se o Chrome ficou com o código antigo
const SW_BUILD = 'ss-sw-1.5.2';

const DEFAULTS = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: 'pt', theme: 'auto', player: true, profileBtn: true, inboxTools: true };
const ERR = {
  pt: { video: 'trilha de vídeo inválida', audio: 'trilha de áudio inválida', host: 'endereço de mídia fora do Instagram', refused: 'download recusado', none: 'nada baixado' },
  en: { video: 'invalid video track', audio: 'invalid audio track', host: 'media address outside Instagram', refused: 'download refused', none: 'nothing downloaded' },
  es: { video: 'pista de video inválida', audio: 'pista de audio inválida', host: 'dirección de medios fuera de Instagram', refused: 'descarga rechazada', none: 'nada descargado' },
};
let lang = 'pt';
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

function download(opts) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(Object.assign({ conflictAction: 'uniquify', saveAs: false }, opts), (id) => {
      const err = chrome.runtime.lastError;
      if (err || id === undefined) reject(new Error(err ? err.message : tr('refused')));
      else resolve(id);
    });
  });
}

async function fetchBytes(url) {
  const res = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error('CDN HTTP ' + res.status);
  return new Uint8Array(await res.arrayBuffer());
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
  return download({ url: toDataUrl(muxDash(vb, ab), 'video/mp4'), filename });
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'salva-stories:ping') { sendResponse({ build: SW_BUILD, version: chrome.runtime.getManifest().version }); return; }
  if (msg && msg.type === 'salva-stories:update') {
    const run = msg.cmd === 'check' ? procurar() : msg.cmd === 'apply' ? aplicar() : msg.cmd === 'guide' ? abrirGuia(msg.data)
      : msg.cmd === 'dismiss' ? salvarUpd({ dispensada: msg.data || null }) : msg.cmd === 'seen' ? salvarUpd({ acabouDeAtualizar: null }) : Promise.resolve(null);
    run.then((r) => sendResponse(r || {}), (e) => sendResponse({ erro: String((e && e.message) || e) }));
    return true;
  }
  if (!msg || msg.type !== 'salva-stories:download') return;
  if (!sender.tab || !/^https:\/\/(www\.)?instagram\.com\//.test(sender.url || sender.tab.url || '')) return;
  (async () => {
    const s = await chrome.storage.sync.get(DEFAULTS);
    lang = s.lang || 'pt';
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

chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.sync.get(null);
  const missing = {};
  for (const k of Object.keys(DEFAULTS)) if (!(k in cur)) missing[k] = DEFAULTS[k];
  if (Object.keys(missing).length) await chrome.storage.sync.set(missing);
});

// Sem popup desde a v1.4.0: o clique no ícone abre o menu dentro do Instagram.
// Fora do Instagram (ou com a aba sem a extensão carregada), abre o Instagram.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'salva-stories:toggle-menu' });
  } catch (_) {
    chrome.tabs.create({ url: 'https://www.instagram.com/' });
  }
});

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
const PROCURA_MIN = 360;
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
const versaoAtual = () => chrome.runtime.getManifest().version;
const tipoInstalacao = async () => { try { return (await chrome.management.getSelf()).installType; } catch (_) { return 'development'; } };
async function salvarUpd(patch) {
  const cur = (await chrome.storage.local.get(UPD_KEY))[UPD_KEY] || {};
  const novo = Object.assign({}, cur, patch);
  await chrome.storage.local.set({ [UPD_KEY]: novo });
  return novo;
}

async function procurar() {
  const cur = versaoAtual();
  const base = { procuradoEm: Date.now(), atual: cur, instalacao: await tipoInstalacao() };
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const ultima = String(j.tag_name || '').replace(/^v/i, '');
    const zip = ((j.assets || []).find((a) => /\.zip$/i.test(a.name)) || {}).browser_download_url || null;
    return salvarUpd(Object.assign(base, { ultima, notas: String(j.body || '').slice(0, 4000), pagina: j.html_url || null, zip, disponivel: !!ultima && cmpVer(ultima, cur) > 0, erro: null }));
  } catch (e) {
    return salvarUpd(Object.assign(base, { erro: String((e && e.message) || e) }));
  }
}

async function aplicar() {
  const st = (await chrome.storage.local.get(UPD_KEY))[UPD_KEY] || {};
  if (await tipoInstalacao() === 'normal') {
    const res = await new Promise((ok) => chrome.runtime.requestUpdateCheck((status) => ok(status)));
    if (res === 'update_available') { setTimeout(() => chrome.runtime.reload(), 1500); return { modo: 'loja', status: 'aplicando' }; }
    return { modo: 'loja', status: res };
  }
  // por pasta: baixa o zip do Release para a pasta Downloads (o guia ensina a extrair por cima)
  const url = st.zip;
  if (url && /^https:\/\/github\.com\//.test(url)) {
    await new Promise((ok) => chrome.downloads.download({ url, conflictAction: 'uniquify', saveAs: false }, () => ok()));
  } else {
    await chrome.tabs.create({ url: st.pagina || `https://github.com/${REPO}/releases/latest`, active: true });
  }
  await salvarUpd({ baixadoEm: Date.now() });
  return { modo: 'download', status: 'baixado' };
}

function abrirGuia(ancora) {
  const a = /^#[a-z]+$/.test(ancora || '') ? ancora : '';
  return chrome.tabs.create({ url: chrome.runtime.getURL('COMO-INSTALAR.html') + a }).then(() => ({ ok: true }));
}

// alguma aba do Instagram no meio de um trabalho longo? (a ponte responde; aba sem resposta = livre)
// Aba congelada/descartada pelo Chrome (economia de memória) não responde e a pergunta ficava pendurada para
// sempre, travando a recarga (visto ao vivo na 1.6.0): pula essas abas e dá no máximo 1,5 s para cada resposta.
const comPrazo = (p, ms) => Promise.race([p, new Promise((ok) => setTimeout(() => ok(null), ms))]);
async function abasOcupadas() {
  let tabs = [];
  try { tabs = await comPrazo(chrome.tabs.query({ url: IG_TABS }), 3000) || []; } catch (_) { return false; }
  for (const t of tabs) {
    if (t.discarded || t.frozen || t.status === 'unloaded') continue;
    try {
      const r = await comPrazo(chrome.tabs.sendMessage(t.id, { type: 'salva-stories:busy?' }), 1500);
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
const anotarDisco = (o) => chrome.storage.local.set({ 'ss.disco': Object.assign({ em: Date.now(), rodando: versaoAtual() }, o) }).catch(() => {});
async function conferirDisco() {
  if (await tipoInstalacao() !== 'development') return;
  try {
    const r = await fetch(chrome.runtime.getURL('manifest.json') + '?t=' + Date.now(), { cache: 'no-store' });
    const noDisco = (await r.json()).version;
    if (!noDisco || noDisco === versaoAtual() || recargaPendente === noDisco) { anotarDisco({ noDisco, estado: recargaPendente === noDisco ? 'recarregando' : 'igual' }); return; }
    if (await abasOcupadas()) { anotarDisco({ noDisco, estado: 'esperando aba ocupada' }); return; } // tenta de novo no próximo minuto
    anotarDisco({ noDisco, estado: 'recarregando' });
    recargaPendente = noDisco;
    setTimeout(async () => { if (await abasOcupadas()) { recargaPendente = null; return; } chrome.runtime.reload(); }, 15000);
  } catch (_) { /* manifest no meio da gravação: tenta no próximo minuto */ }
}

const agendar = () => {
  chrome.alarms.create('ss-procura', { delayInMinutes: 1, periodInMinutes: PROCURA_MIN });
  chrome.alarms.create('ss-disco', { delayInMinutes: DISCO_MIN, periodInMinutes: DISCO_MIN });
};
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === 'ss-procura') procurar();
  if (a.name === 'ss-disco') vigiarDisco();
});
chrome.runtime.onStartup.addListener(() => { agendar(); procurar(); });
chrome.runtime.onInstalled.addListener(async (d) => {
  agendar();
  if (d.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('COMO-INSTALAR.html#usar') });
  if (d.reason === 'update') {
    await salvarUpd({ acabouDeAtualizar: { de: d.previousVersion || null, para: versaoAtual(), em: Date.now() }, disponivel: false, atual: versaoAtual() });
    // as abas abertas ainda rodam a versão antiga (os scripts ficaram órfãos): recarregar põe a nova
    try { for (const t of await chrome.tabs.query({ url: IG_TABS })) chrome.tabs.reload(t.id); } catch (_) {}
  }
  procurar();
});
// o service worker pode dormir: garante os alarmes sempre que acordar
chrome.alarms.get('ss-disco', (a) => { if (!a) agendar(); });
