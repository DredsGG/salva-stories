// Junta duas trilhas DASH (fMP4 "on-demand": ftyp + moov + sidx + moof/mdat...)
// — uma de vídeo e uma de áudio — num único MP4 fragmentado com as duas trilhas.
// Sem dependências. Usado só no plano B, quando o Instagram não manda o MP4
// progressivo (video_versions) e o story vem apenas em DASH.

function readBoxes(buf, start = 0, end = buf.length) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out = [];
  let p = start;
  while (p + 8 <= end) {
    let size = dv.getUint32(p);
    const type = String.fromCharCode(buf[p + 4], buf[p + 5], buf[p + 6], buf[p + 7]);
    let header = 8;
    if (size === 1) {
      const hi = dv.getUint32(p + 8), lo = dv.getUint32(p + 12);
      size = hi * 2 ** 32 + lo;
      header = 16;
    } else if (size === 0) {
      size = end - p;
    }
    if (size < header || p + size > end) break;
    out.push({ type, start: p, size, header });
    p += size;
  }
  return out;
}

function child(buf, box, type) {
  return readBoxes(buf, box.start + box.header, box.start + box.size).find((b) => b.type === type);
}

function children(buf, box) {
  return readBoxes(buf, box.start + box.header, box.start + box.size);
}

function slice(buf, box) {
  return buf.slice(box.start, box.start + box.size);
}

function makeBox(type, parts) {
  const len = 8 + parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, len);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  let o = 8;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function setTkhdTrackId(trak, id) {
  // trak já copiado (offset 0 = início do trak)
  const boxes = readBoxes(trak, 8, trak.length);
  const tkhd = boxes.find((b) => b.type === 'tkhd');
  if (!tkhd) throw new Error('trak sem tkhd');
  const dv = new DataView(trak.buffer, trak.byteOffset, trak.byteLength);
  const v = trak[tkhd.start + tkhd.header];
  dv.setUint32(tkhd.start + tkhd.header + 4 + (v === 1 ? 16 : 8), id);
}

function timescaleOf(buf, trak) {
  const mdia = child(buf, trak, 'mdia');
  const mdhd = mdia && child(buf, mdia, 'mdhd');
  if (!mdhd) return 1;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const v = buf[mdhd.start + mdhd.header];
  return dv.getUint32(mdhd.start + mdhd.header + 4 + (v === 1 ? 16 : 8)) || 1;
}

function parseInput(buf) {
  const top = readBoxes(buf);
  const ftyp = top.find((b) => b.type === 'ftyp');
  const moov = top.find((b) => b.type === 'moov');
  if (!moov) throw new Error('arquivo sem moov');
  const mv = children(buf, moov);
  const traks = mv.filter((b) => b.type === 'trak');
  if (traks.length !== 1) throw new Error('esperava 1 trilha, achei ' + traks.length);
  const mvex = mv.find((b) => b.type === 'mvex');
  const trex = mvex && child(buf, mvex, 'trex');
  const mehd = mvex && child(buf, mvex, 'mehd');
  const mvhd = mv.find((b) => b.type === 'mvhd');
  const fragments = [];
  for (let i = 0; i < top.length; i++) {
    if (top[i].type !== 'moof') continue;
    const mdat = top[i + 1] && top[i + 1].type === 'mdat' ? top[i + 1] : null;
    if (!mdat) continue;
    fragments.push({ moof: top[i], mdat });
  }
  if (!fragments.length) throw new Error('arquivo sem fragmentos');
  return { buf, ftyp, mvhd, trak: traks[0], trex, mehd, fragments, timescale: timescaleOf(buf, traks[0]) };
}

function fragmentTime(buf, moof, timescale) {
  const traf = child(buf, moof, 'traf');
  const tfdt = traf && child(buf, traf, 'tfdt');
  if (!tfdt) return null;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const v = buf[tfdt.start + tfdt.header];
  const o = tfdt.start + tfdt.header + 4;
  const t = v === 1 ? dv.getUint32(o) * 2 ** 32 + dv.getUint32(o + 4) : dv.getUint32(o);
  return t / timescale;
}

// Copia moof+mdat e ajusta track_ID, número de sequência e (se houver) base_data_offset absoluto.
function rewriteFragment(src, frag, trackId, seq, newStart) {
  const moofBytes = slice(src, frag.moof);
  const mdatBytes = slice(src, frag.mdat);
  const dv = new DataView(moofBytes.buffer);
  for (const b of readBoxes(moofBytes, 8, moofBytes.length)) {
    if (b.type === 'mfhd') dv.setUint32(b.start + b.header + 4, seq);
    if (b.type === 'traf') {
      for (const t of readBoxes(moofBytes, b.start + b.header, b.start + b.size)) {
        if (t.type !== 'tfhd') continue;
        const flags = (moofBytes[t.start + t.header + 1] << 16) | (moofBytes[t.start + t.header + 2] << 8) | moofBytes[t.start + t.header + 3];
        dv.setUint32(t.start + t.header + 4, trackId);
        if (flags & 0x000001) {
          const o = t.start + t.header + 8;
          const old = dv.getUint32(o) * 2 ** 32 + dv.getUint32(o + 4);
          const now = old - frag.moof.start + newStart;
          dv.setUint32(o, Math.floor(now / 2 ** 32));
          dv.setUint32(o + 4, now >>> 0);
        }
      }
    }
  }
  return [moofBytes, mdatBytes];
}

function setNextTrackId(mvhdBytes, next) {
  const dv = new DataView(mvhdBytes.buffer);
  const v = mvhdBytes[8];
  // header(8) + versão/flags(4) + tempos (v0: 16, v1: 28) + rate/volume/reservado/matriz/pre_defined (76)
  dv.setUint32(v === 1 ? 116 : 104, next);
}

function makeTrex(trexBytes, id) {
  const b = trexBytes.slice();
  new DataView(b.buffer).setUint32(12, id);
  return b;
}

export function muxDash(videoBuf, audioBuf) {
  const v = parseInput(videoBuf);
  const a = parseInput(audioBuf);
  if (!v.trex || !a.trex) throw new Error('arquivo sem trex');

  const vTrak = slice(v.buf, v.trak); setTkhdTrackId(vTrak, 1);
  const aTrak = slice(a.buf, a.trak); setTkhdTrackId(aTrak, 2);
  const mvhd = slice(v.buf, v.mvhd); setNextTrackId(mvhd, 3);
  const mvexParts = [];
  if (v.mehd) mvexParts.push(slice(v.buf, v.mehd));
  mvexParts.push(makeTrex(slice(v.buf, v.trex), 1), makeTrex(slice(a.buf, a.trex), 2));
  const moov = makeBox('moov', [mvhd, vTrak, aTrak, makeBox('mvex', mvexParts)]);
  const ftyp = v.ftyp ? slice(v.buf, v.ftyp) : makeBox('ftyp', [new TextEncoder().encode('isom'), new Uint8Array([0, 0, 2, 0]), new TextEncoder().encode('isomiso6mp41')]);

  // intercala os fragmentos pelo tempo de início, para os players lerem em ordem
  const list = [];
  v.fragments.forEach((f, i) => list.push({ src: v.buf, f, id: 1, t: fragmentTime(v.buf, f.moof, v.timescale), i }));
  a.fragments.forEach((f, i) => list.push({ src: a.buf, f, id: 2, t: fragmentTime(a.buf, f.moof, a.timescale), i }));
  const hasTimes = list.every((x) => x.t !== null);
  if (hasTimes) list.sort((x, y) => x.t - y.t || x.id - y.id);

  const parts = [ftyp, moov];
  let offset = ftyp.length + moov.length;
  let seq = 1;
  for (const x of list) {
    const [m, d] = rewriteFragment(x.src, x.f, x.id, seq++, offset);
    parts.push(m, d);
    offset += m.length + d.length;
  }
  const out = new Uint8Array(offset);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
