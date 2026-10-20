import https from 'https'; import fs from 'fs'; import path from 'path';
const DIR = path.dirname(new URL(import.meta.url).pathname);
const file = { 'foto_n.jpg': ['big.jpg', 'image/jpeg'], 'prog.mp4': ['prog.mp4', 'video/mp4'], 'hqv.mp4': ['hq-stream0.mp4', 'video/mp4'], 'hqa.mp4': ['hq-stream1.mp4', 'video/mp4'], 'silent.mp4': ['silent.mp4', 'video/mp4'] };
https.createServer({ key: fs.readFileSync(DIR + '/key.pem'), cert: fs.readFileSync(DIR + '/cert.pem') }, (req, res) => {
  const u = new URL(req.url, 'https://x'); const name = u.pathname.split('/').pop(); const f = file[name];
  fs.appendFileSync(DIR + '/cdn.log', req.headers.host + ' ' + name + u.search + '\n');
  if (!f) { res.writeHead(404); return res.end(); }
  const src = name === 'foto_n.jpg' && u.searchParams.get('stp') === 'small' ? 'small.jpg' : f[0];
  res.writeHead(200, { 'content-type': f[1], 'access-control-allow-origin': '*' }); res.end(fs.readFileSync(DIR + '/media/' + src));
}).listen(443, () => console.log('cdn up'));
