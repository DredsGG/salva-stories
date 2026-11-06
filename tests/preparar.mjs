// Prepara o ambiente dos testes (rode de novo a cada versão): copia ../instalada para ext-test/ e, só na cópia,
// aceita 127.0.0.1 no regex CDN do sw.js. Gera key.pem/cert.pem se faltarem. Uso: node preparar.mjs
import { fileURLToPath } from 'url'; import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, '..', 'instalada'), DST = path.join(DIR, process.argv[2] || 'ext-test'); // node preparar.mjs [pasta-de-destino]
fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(SRC, DST, { recursive: true });
const sw = path.join(DST, 'src', 'sw.js');
const t = fs.readFileSync(sw, 'utf8');
const re = /^const CDN = \/\(\^\|\\\.\)\(cdninstagram\\\.com\|fbcdn\\\.net\)\$\/i;$/m;
if (!re.test(t)) throw new Error('regex CDN do sw.js mudou: ajuste o preparar.mjs');
fs.writeFileSync(sw, t.replace(re, () => 'const CDN = /(^|\\.)(cdninstagram\\.com|fbcdn\\.net)$|^127\\.0\\.0\\.1$/i;'));
if (!fs.existsSync(path.join(DIR, 'cert.pem'))) execSync('openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=cdn"', { cwd: DIR, stdio: 'inherit' });
console.log('ext-test pronto (versão ' + JSON.parse(fs.readFileSync(path.join(DST, 'manifest.json'), 'utf8')).version + ')');
