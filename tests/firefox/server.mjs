// Instagram e CDN simulados para o teste no Firefox (CI): www.instagram.com e 127.0.0.1 → este servidor (porta 443).
// Uso: sudo node server.mjs <pasta-da-midia> <cert.pem> <key.pem>
import https from 'https';
import fs from 'fs';
import path from 'path';

const [MEDIA, CERT, KEY] = process.argv.slice(2);
const CDN = 'https://127.0.0.1/v/t51/';
const FB = 'https://127.0.0.1/o1/v/t2/f2/m78/';
const dash = `<?xml version="1.0"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" type="static"><Period id="0">
<AdaptationSet id="0" contentType="video"><Representation id="1v" bandwidth="3000000" codecs="avc1.64001f" mimeType="video/mp4" width="1080" height="1920"><BaseURL>${FB}hqv.mp4?x=1&amp;y=2</BaseURL><SegmentBase indexRange="0-1"/></Representation></AdaptationSet>
<AdaptationSet id="1" contentType="audio"><Representation id="3a" bandwidth="64000" codecs="mp4a.40.2" mimeType="audio/mp4"><BaseURL>${FB}hqa.mp4</BaseURL></Representation></AdaptationSet></Period></MPD>`;
const user = { username: 'example.profile', pk: '999' };
const items = [
  { pk: '111', id: '111_999', media_type: 1, taken_at: 1792400000, user,
    image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'foto_n.jpg?stp=small' }, { width: 1320, height: 2346, url: CDN + 'foto_n.jpg?stp=big' }] } },
  { pk: '222', id: '222_999', media_type: 2, has_audio: true, taken_at: 1792400100, user,
    image_versions2: { candidates: [{ width: 720, height: 1280, url: CDN + 'thumb_n.jpg' }] },
    video_versions: [{ type: 101, url: FB + 'prog.mp4?a=1' }], video_dash_manifest: dash },
];
const inline = JSON.stringify({ require: [['x', { data: { xdt_api__v1__feed__reels_media: { reels_media: [{ id: '999', user, items }] } } }]] });
const story = (kind) => `<!doctype html><html class="__fb-dark-mode"><head><meta charset="utf-8"></head><body style="margin:0;background:#111;display:grid;place-items:center;height:100vh">
${kind === 'img' ? `<img id="m" src="${CDN}foto_n.jpg?stp=small" style="width:400px;height:711px;object-fit:cover">` : `<video id="m" style="width:400px;height:711px;background:#222" muted></video>`}
<script type="application/json">${inline}</script></body></html>`;
const feed = `<!doctype html><html class="__fb-dark-mode"><head><meta charset="utf-8"></head><body style="margin:0;background:#000;color:#eee;font-family:sans-serif;height:100vh">
<main style="margin-left:420px;padding-top:40px">Feed</main></body></html>`;
const files = { 'foto_n.jpg': ['big.jpg', 'image/jpeg'], 'thumb_n.jpg': ['small.jpg', 'image/jpeg'], 'prog.mp4': ['prog.mp4', 'video/mp4'], 'hqv.mp4': ['hq-stream0.mp4', 'video/mp4'], 'hqa.mp4': ['hq-stream1.mp4', 'video/mp4'] };
const seen = [];
https.createServer({ cert: fs.readFileSync(CERT), key: fs.readFileSync(KEY) }, (req, res) => {
  const u = new URL(req.url, 'https://' + req.headers.host);
  const host = (req.headers.host || '').split(':')[0];
  if (host === 'www.instagram.com') {
    if (u.pathname === '/api/graphql') { seen.push('seen'); res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"ok":1}'); }
    if (u.pathname === '/__seen') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(seen)); }
    const body = u.pathname.startsWith('/stories/example.profile/111') ? story('img') : u.pathname.startsWith('/stories/example.profile/222') ? story('video') : feed;
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(body);
  }
  const name = u.pathname.split('/').pop();
  const f = files[name];
  if (!f) { res.writeHead(404); return res.end(); }
  const src = name === 'foto_n.jpg' && u.searchParams.get('stp') === 'small' ? 'small.jpg' : f[0];
  const buf = fs.readFileSync(path.join(MEDIA, src));
  res.writeHead(200, { 'content-type': f[1], 'content-length': buf.length, 'access-control-allow-origin': '*' });
  res.end(buf);
}).listen(443, () => console.log('ok 443'));
