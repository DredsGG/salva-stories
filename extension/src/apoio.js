// Salva Stories — "Apoiar ♥" (regra 16 do hub; v1.8.14). Quadro aberto pelo item do rodapé do menu: primeiro "De onde
// você é?" (Brasil → Pix em reais, com QR gerado aqui mesmo; outro país → GitHub Sponsors em dólar). Nada de rede,
// rastreio ou dado de quem doa: o QR e o "copia e cola" são montados no próprio navegador. Nunca abre sozinho.
// Dados oficiais: vault 02-projetos/extensoes/apoio.md (não inventar chave, nome nem link).
(() => {
  'use strict';
  const KEY = Symbol.for('salvaStories.apoio');
  if (window[KEY]) return;

  const SPONSORS = 'https://github.com/sponsors/DredsGG';
  const PIX_KEY = 'fa525dad-afca-4683-845d-eee7225a53e3';
  const PIX_NAME = 'Andre Miller Fleck'; // sem acento, até 25
  const PIX_CITY = 'Sao Paulo'; // sem acento, até 15
  const VALUES = [5, 10, 25];
  const MIN = 1, MAX = 10000;

  // ───────── BR Code (Pix estático) ─────────
  const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  // CRC16-CCITT-FALSE: polinômio 0x1021, início 0xFFFF, sem reflexão, sem XOR final
  function crc16(s) {
    let c = 0xffff;
    for (let i = 0; i < s.length; i++) {
      c ^= s.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
    }
    return c.toString(16).toUpperCase().padStart(4, '0');
  }
  // amount: número em reais ou null (valor livre: a pessoa digita no banco)
  function pixCode(amount) {
    let s = tlv('00', '01')
      + tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', PIX_KEY))
      + tlv('52', '0000') + tlv('53', '986');
    if (amount != null) s += tlv('54', amount.toFixed(2));
    s += tlv('58', 'BR') + tlv('59', PIX_NAME) + tlv('60', PIX_CITY) + tlv('62', tlv('05', '***')) + '6304';
    return s + crc16(s);
  }
  // "12,50", "R$ 1.000,00", "7" → número; "" → null (livre); fora de R$ 1 a R$ 10.000 ou inválido → NaN
  function parseAmount(txt) {
    let t = String(txt || '').replace(/R\$|\s/gi, '');
    if (!t) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
    const n = Math.round(parseFloat(t) * 100) / 100;
    return n >= MIN && n <= MAX ? n : NaN;
  }

  // ───────── textos (PT · EN · ES) ─────────
  const T = {
    pt: {
      title: 'Apoiar o Salva Stories', where: 'De onde você é?', br: 'Brasil', brD: 'Pix, em reais, na hora',
      world: 'Outro país', worldD: 'Cartão, em dólar, pelo GitHub Sponsors', opt: 'É opcional e não muda nada no Salva Stories. Obrigado por usar!',
      back: 'Voltar', close: 'Fechar (Esc)', other: 'Outro valor', otherPh: 'R$ 0,00', free: 'Sem valor: você digita o valor no app do banco.',
      bad: 'Digite um valor entre R$ 1 e R$ 10.000.', copy: 'Copiar código Pix', copied: 'Copiado!', copyFail: 'Não deu para copiar. Selecione e copie à mão.',
      keyL: 'Chave aleatória', copyKey: 'Copiar chave', help: 'Abra o app do seu banco, escolha Pix → Ler QR Code ou Pix Copia e Cola. O nome que aparece é Andre Miller Fleck.',
      worldT: 'Uma vez ou todo mês, a partir de US$ 1. Pagamento com cartão pelo GitHub, sem taxa para mim.', open: 'Abrir o GitHub Sponsors',
      qrAlt: (v) => (v == null ? 'QR Code Pix com valor livre' : `QR Code Pix de ${brl(v)}`), amounts: 'Valor',
    },
    en: {
      title: 'Support Salva Stories', where: 'Where are you from?', br: 'Brazil', brD: 'Pix, in reais, instantly',
      world: 'Another country', worldD: 'Card, in dollars, via GitHub Sponsors', opt: "It's optional and changes nothing in Salva Stories. Thanks for using it!",
      back: 'Back', close: 'Close (Esc)', other: 'Other amount', otherPh: 'R$ 0,00', free: 'No amount: you type it in your bank app.',
      bad: 'Type an amount between R$ 1 and R$ 10,000.', copy: 'Copy Pix code', copied: 'Copied!', copyFail: "Couldn't copy. Select it and copy by hand.",
      keyL: 'Random key', copyKey: 'Copy key', help: 'Open your bank app, choose Pix → Read QR Code or Pix Copy and Paste. The name shown is Andre Miller Fleck.',
      worldT: 'One-time or monthly, from US$ 1. Card payments through GitHub, no fee for me.', open: 'Open GitHub Sponsors',
      qrAlt: (v) => (v == null ? 'Pix QR Code with open amount' : `Pix QR Code for ${brl(v)}`), amounts: 'Amount',
    },
    es: {
      title: 'Apoyar Salva Stories', where: '¿De dónde eres?', br: 'Brasil', brD: 'Pix, en reales, al instante',
      world: 'Otro país', worldD: 'Tarjeta, en dólares, por GitHub Sponsors', opt: 'Es opcional y no cambia nada en Salva Stories. ¡Gracias por usarlo!',
      back: 'Volver', close: 'Cerrar (Esc)', other: 'Otro valor', otherPh: 'R$ 0,00', free: 'Sin valor: lo escribes en la app de tu banco.',
      bad: 'Escribe un valor entre R$ 1 y R$ 10.000.', copy: 'Copiar código Pix', copied: '¡Copiado!', copyFail: 'No se pudo copiar. Selecciónalo y cópialo a mano.',
      keyL: 'Clave aleatoria', copyKey: 'Copiar clave', help: 'Abre la app de tu banco, elige Pix → Leer código QR o Pix Copia y Pega. El nombre que aparece es Andre Miller Fleck.',
      worldT: 'Una vez o cada mes, desde US$ 1. Pago con tarjeta por GitHub, sin comisión para mí.', open: 'Abrir GitHub Sponsors',
      qrAlt: (v) => (v == null ? 'Código QR Pix con valor libre' : `Código QR Pix de ${brl(v)}`), amounts: 'Valor',
    },
  };
  const brl = (v) => 'R$ ' + (Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','));

  const K = () => window[Symbol.for('salvaStories.kit')];
  const QR = () => window[Symbol.for('salvaStories.qr')];
  let t = (k) => k;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // QR como SVG (módulos pretos em fundo branco, borda branca de 4 módulos), correção de erro M
  function qrSvg(text, px) {
    const q = QR()(0, 'M');
    q.addData(text, 'Byte');
    q.make();
    const n = q.getModuleCount(), m = 4, size = n + m * 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${size} ${size}" width="${px}" height="${px}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  // ───────── quadro ─────────
  const HEART = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.6 2.9 4.5 6.6 4.5c2.1 0 3.7 1.2 4.4 2.7.7-1.5 2.3-2.7 4.4-2.7 3.7 0 5.7 4.1 4.2 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  const COPY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  const EXT = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>';
  const CSS = `
  .scrim { position: fixed; inset: 0; width: 100vw; height: 100vh; background: var(--scrim); display: grid; place-items: center; animation: fade .15s ease; }
  @keyframes fade { from { opacity: 0; } }
  .box { width: min(420px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; background: var(--bg); color: var(--fg); border-radius: 16px;
    border: 1px solid var(--sep); box-shadow: var(--shadow); animation: pop .18s cubic-bezier(.2,.9,.3,1.2); outline: none; }
  @keyframes pop { from { opacity: 0; transform: scale(.95); } }
  @media (prefers-reduced-motion: reduce) { .scrim, .box { animation: none; } }
  .hd { display: flex; align-items: center; gap: 8px; padding: 14px 12px 12px 16px; border-bottom: 1px solid var(--sep); }
  .hd h2 { margin: 0; flex: 1; min-width: 0; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 7px; }
  .hd h2 .hi { color: #d62976; display: inline-flex; }
  .bk { height: 30px; padding: 0 10px 0 6px; border: 0; border-radius: 8px; background: transparent; color: var(--sub); font: 600 13px var(--font); cursor: pointer; }
  .bk:hover { background: var(--hover); color: var(--fg); }
  .bd { padding: 16px; display: grid; gap: 14px; }
  .q { margin: 0; font-size: 14px; font-weight: 700; }
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .card { display: grid; gap: 6px; justify-items: start; text-align: left; padding: 14px; min-height: 108px; border-radius: 14px; border: 1.5px solid var(--sep);
    background: var(--card); color: var(--fg); font: inherit; cursor: pointer; transition: border-color .15s, transform .1s, background .15s; }
  .card:hover { border-color: var(--sub); }
  .card:active { transform: scale(.98); }
  .card .fl { font-size: 26px; line-height: 1; }
  .card b { font-size: 15px; }
  .card span { font-size: 12.5px; color: var(--sub); line-height: 1.3; }
  .card.rec { border-color: transparent; background: linear-gradient(var(--card), var(--card)) padding-box, var(--grad) border-box; }
  .opt { margin: 0; font-size: 12.5px; color: var(--sub); text-align: center; }
  .lbl { font-size: 11.5px; font-weight: 700; color: var(--sub); text-transform: uppercase; letter-spacing: .06em; }
  .vals { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { height: 34px; padding: 0 14px; border-radius: 99px; border: 1px solid var(--sep); background: transparent; color: var(--fg); font: 600 13.5px var(--font); cursor: pointer; }
  .chip:hover { background: var(--hover); }
  .chip.on { border-color: transparent; background: var(--grad); color: #fff; }
  .oth { display: flex; align-items: center; gap: 8px; }
  .oth input { flex: 1; min-width: 0; height: 36px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--sep); background: var(--card); color: var(--fg);
    font: 600 14px var(--font); outline: none; }
  .oth input:focus { border-color: #d62976; }
  .oth input.bad { border-color: rgb(237,73,86); }
  .msg { font-size: 12px; color: var(--sub); min-height: 15px; }
  .msg.bad { color: rgb(237,73,86); }
  .qr { justify-self: center; padding: 10px; background: #fff; border-radius: 14px; box-shadow: 0 0 0 1px var(--sep); line-height: 0; }
  .qr.off { opacity: .35; }
  .row { display: flex; align-items: center; gap: 8px; }
  .row .btn { flex: 1; }
  .key { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 12px; border-radius: 10px; background: var(--card); }
  .key code { flex: 1; min-width: 0; font: 12px/1.3 ui-monospace, Consolas, monospace; color: var(--fg); overflow-wrap: anywhere; user-select: all; }
  .key small { display: block; font: 700 10.5px var(--font); color: var(--sub); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; }
  .ic { width: 32px; height: 32px; flex: none; display: grid; place-items: center; border: 0; border-radius: 8px; background: transparent; color: var(--fg); cursor: pointer; }
  .ic:hover { background: var(--hover); }
  .help { margin: 0; font-size: 12.5px; color: var(--sub); }
  .wt { margin: 0; font-size: 14px; }
  a.btn { text-decoration: none; height: 42px; }
  .btn:focus-visible, .card:focus-visible, .chip:focus-visible, .ic:focus-visible, .bk:focus-visible, .x:focus-visible { outline: 2px solid #d62976; outline-offset: 2px; }
  `;
  let ui = null, step = 'where', pick = 10, otherTxt = '', lastFocus = null; // pick: 5 | 10 | 25 | 'other'
  const PREF = 'salvaStories.apoio';
  const loadPref = () => { try { return JSON.parse(localStorage.getItem(PREF) || '{}'); } catch (_) { return {}; } };
  const savePref = (o) => { try { localStorage.setItem(PREF, JSON.stringify(Object.assign(loadPref(), o))); } catch (_) {} };

  function ensure() {
    if (ui && ui.host.isConnected) return;
    ui = K().makeHost('salva-stories-apoio', CSS, '<div class="scrim" hidden><div class="box" role="dialog" aria-modal="true" tabindex="-1"></div></div>');
    ui.host.style.zIndex = '2147483002';
    ui.$('.scrim').addEventListener('mousedown', (e) => { if (e.target === ui.$('.scrim')) close(); });
    ui.sh.addEventListener('keydown', onKey);
  }
  const isOpen = () => !!(ui && !ui.$('.scrim').hidden);
  function open() {
    ensure();
    t = K().tr(T);
    ui.refreshMode();
    lastFocus = document.activeElement;
    const p = loadPref();
    step = p.step === 'br' || p.step === 'world' ? p.step : 'where';
    if (VALUES.includes(p.pick) || p.pick === 'other') pick = p.pick;
    if (typeof p.other === 'string') otherTxt = p.other.slice(0, 12);
    ui.$('.scrim').hidden = false;
    render(true);
  }
  function close() {
    if (!ui) return;
    ui.$('.scrim').hidden = true;
    try { if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); } catch (_) {}
  }
  function go(s) { step = s; savePref({ step: s }); render(true); }

  function render(focusFirst) {
    const box = ui.$('.box');
    const lang = K().lang();
    const head = (back) => `<div class="hd">${back ? `<button type="button" class="bk">← ${esc(t('back'))}</button>` : ''}
      <h2 id="apt"><span class="hi">${HEART}</span>${esc(t('title'))}</h2>
      <button type="button" class="x" title="${esc(t('close'))}" aria-label="${esc(t('close'))}">${K().ICON.x}</button></div>`;
    box.setAttribute('aria-labelledby', 'apt');
    if (step === 'where') {
      const recBr = lang === 'pt';
      box.innerHTML = head(false) + `<div class="bd"><p class="q">${esc(t('where'))}</p>
        <div class="cards">
          <button type="button" class="card${recBr ? ' rec' : ''}" data-go="br"><span class="fl" aria-hidden="true">🇧🇷</span><b>${esc(t('br'))}</b><span>${esc(t('brD'))}</span></button>
          <button type="button" class="card${recBr ? '' : ' rec'}" data-go="world"><span class="fl" aria-hidden="true">🌎</span><b>${esc(t('world'))}</b><span>${esc(t('worldD'))}</span></button>
        </div><p class="opt">${esc(t('opt'))}</p></div>`;
      for (const c of box.querySelectorAll('.card')) c.addEventListener('click', () => go(c.dataset.go));
    } else if (step === 'br') {
      const isOther = pick === 'other';
      box.innerHTML = head(true) + `<div class="bd">
        <div><div class="lbl">${esc(t('amounts'))}</div><div class="vals" role="radiogroup" aria-label="${esc(t('amounts'))}" style="margin-top:6px">
          ${VALUES.map((v) => `<button type="button" class="chip${pick === v ? ' on' : ''}" role="radio" aria-checked="${pick === v}" data-v="${v}">${brl(v)}</button>`).join('')}
          <button type="button" class="chip${isOther ? ' on' : ''}" role="radio" aria-checked="${isOther}" data-v="other">${esc(t('other'))}</button></div></div>
        <div class="oth"${isOther ? '' : ' hidden'}><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="12" placeholder="${esc(t('otherPh'))}" aria-label="${esc(t('other'))}" value="${esc(otherTxt)}"></div>
        <div class="msg" aria-live="polite"></div>
        <div class="qr" role="img"></div>
        <div class="row"><button type="button" class="btn pri cp">${COPY}<span>${esc(t('copy'))}</span></button></div>
        <div class="key"><div style="flex:1;min-width:0"><small>${esc(t('keyL'))}</small><code>${PIX_KEY}</code></div>
          <button type="button" class="ic ck" title="${esc(t('copyKey'))}" aria-label="${esc(t('copyKey'))}">${COPY}</button></div>
        <p class="help">${esc(t('help'))}</p></div>`;
      for (const c of box.querySelectorAll('.chip')) c.addEventListener('click', () => {
        pick = c.dataset.v === 'other' ? 'other' : +c.dataset.v; savePref({ pick }); render(false);
        if (pick === 'other') box.querySelector('.oth input').focus(); else box.querySelector(`.chip[data-v="${pick}"]`).focus();
      });
      const inp = box.querySelector('.oth input');
      inp.addEventListener('input', () => { otherTxt = inp.value; savePref({ other: otherTxt }); updateQr(); });
      box.querySelector('.cp').addEventListener('click', () => copy(box.querySelector('.cp').dataset.code, box.querySelector('.cp span'), t('copy')));
      box.querySelector('.ck').addEventListener('click', () => copy(PIX_KEY, null, null));
      updateQr();
    } else {
      box.innerHTML = head(true) + `<div class="bd"><p class="wt">${esc(t('worldT'))}</p>
        <a class="btn pri" href="${SPONSORS}" target="_blank" rel="noopener noreferrer">${HEART}${esc(t('open'))}${EXT}</a>
        <p class="opt">${esc(t('opt'))}</p></div>`;
    }
    box.querySelector('.hd .x').addEventListener('click', close);
    const bk = box.querySelector('.bk'); if (bk) bk.addEventListener('click', () => go('where'));
    if (focusFirst) { const f = focusables()[step === 'where' ? 1 : 0]; (f || box).focus({ preventScroll: true }); }
  }
  // QR + "copia e cola" do valor escolhido: R$ 5/10/25, ou o campo "Outro valor" (vazio = livre)
  const currentValue = () => (pick === 'other' ? parseAmount(otherTxt) : pick);
  function updateQr() {
    const box = ui.$('.box');
    const v = currentValue();
    const msg = box.querySelector('.msg'), inp = box.querySelector('.oth input'), qr = box.querySelector('.qr'), cp = box.querySelector('.cp');
    const bad = Number.isNaN(v);
    inp.classList.toggle('bad', bad);
    msg.classList.toggle('bad', bad);
    msg.textContent = bad ? t('bad') : v == null ? t('free') : '';
    if (bad) { // sem QR de valor errado na tela: quadro branco vazio, sem código para copiar
      qr.classList.add('off'); qr.innerHTML = '<svg width="208" height="208" aria-hidden="true"><rect width="208" height="208" fill="#fff"/></svg>';
      qr.removeAttribute('aria-label'); delete qr.dataset.code; delete cp.dataset.code; cp.disabled = true; return;
    }
    const code = pixCode(v);
    qr.classList.remove('off');
    qr.innerHTML = qrSvg(code, 208);
    qr.setAttribute('aria-label', t('qrAlt', v));
    qr.dataset.code = code;
    cp.disabled = false;
    cp.dataset.code = code;
  }
  async function copy(text, label, base) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {}
    if (!ok) { // alternativa: textarea temporário + execCommand
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
      } catch (_) { ok = false; }
    }
    if (label && ok) { label.textContent = t('copied'); setTimeout(() => { if (label.isConnected) label.textContent = base; }, 1600); }
    ui.toast(ok ? t('copied') : t('copyFail'));
    if (ok) window.postMessage({ __salvaStories: 'page', kind: 'apoioCopied' }, location.origin); // só para o teste; nada sai do navegador
  }
  const focusables = () => [...ui.$('.box').querySelectorAll('button:not([disabled]), a[href], input:not([hidden])')].filter((e) => !e.closest('[hidden]'));
  function onKey(e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    // foco preso no quadro enquanto aberto
    const f = focusables(); if (!f.length) return;
    const cur = ui.sh.activeElement, i = f.indexOf(cur);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  }

  window.addEventListener('salva-stories:apoio', () => { if (K() && QR()) open(); });

  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; };
  Object.defineProperty(window, KEY, { value: Object.freeze({ pixCode, crc16, parseAmount, open, close, isOpen }) });
  window.__salvaStoriesApoioDebug = () => ({
    open: isOpen(), step, pick, otherTxt,
    code: isOpen() && ui.$('.qr') ? ui.$('.qr').dataset.code || null : null,
    qrAlt: isOpen() && ui.$('.qr') ? ui.$('.qr').getAttribute('aria-label') : null,
    msg: isOpen() && ui.$('.msg') ? ui.$('.msg').textContent : null,
    rec: isOpen() && ui.$('.card.rec') ? ui.$('.card.rec').dataset.go : null,
    focus: isOpen() && ui.sh.activeElement ? (ui.sh.activeElement.className || ui.sh.activeElement.tagName) : null,
    at: isOpen() ? { br: box(ui.$('.card[data-go="br"]')), world: box(ui.$('.card[data-go="world"]')), back: box(ui.$('.bk')), close: box(ui.$('.hd .x')),
      v5: box(ui.$('.chip[data-v="5"]')), v10: box(ui.$('.chip[data-v="10"]')), v25: box(ui.$('.chip[data-v="25"]')), other: box(ui.$('.chip[data-v="other"]')),
      input: box(ui.$('.oth input')), qr: box(ui.$('.qr')), copy: box(ui.$('.cp')), copyKey: box(ui.$('.ck')), open: box(ui.$('a.btn')),
      box: (() => { const r = ui.$('.box').getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) }; })() } : null,
  });
})();
