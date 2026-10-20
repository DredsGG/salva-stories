// Salva Stories — service worker: valida e faz os downloads.
import { muxDash } from './remux.js';

const DEFAULTS = { ghost: false, hotkey: true, showAll: true, folder: 'Instagram Stories', perUser: true, maxQuality: true, lang: 'pt' };
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
  if (!msg || msg.type !== 'salva-stories:download') return;
  if (!sender.tab || !/^https:\/\/(www\.)?instagram\.com\//.test(sender.url || sender.tab.url || '')) return;
  (async () => {
    const s = await chrome.storage.sync.get(DEFAULTS);
    lang = s.lang || 'pt';
    const jobs = Array.isArray(msg.jobs) ? msg.jobs.slice(0, 100) : [];
    let count = 0;
    const errors = [];
    for (const job of jobs) {
      try {
        await runJob(job, s);
        count++;
      } catch (e) {
        errors.push(e.message || String(e));
      }
      if (jobs.length > 1) await new Promise((r) => setTimeout(r, 250));
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
