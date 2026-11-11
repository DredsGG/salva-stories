// Roda a suíte inteira em sequência, uma ou várias vezes, e para no primeiro item que falhar.
// Uso: node suite.mjs [rodadas=1] [nome-do-teste ...]
// Pré-requisitos: `node preparar.mjs` (copia ../instalada para ext-test/) e `node cdn.mjs` rodando (porta 443).
// No app Claude do Windows (MSIX) o Chromium do Playwright só abre pelo caminho REAL (Packages\Claude_...\LocalCache\Local\ms-playwright);
// pelo caminho virtual o spawn falha com "spawn UNKNOWN". Por isso este script acha o caminho real e define
// PLAYWRIGHT_BROWSERS_PATH (testes com channel 'chromium') e CHROME_PATH (testes com executablePath).
import { fileURLToPath } from 'url'; import fs from 'fs'; import path from 'path'; import os from 'os'; import { spawn } from 'child_process';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.join(DIR, 'ext-test');
const LISTA = [
  ['e2e-repo', 'e2e.mjs'], ['e2e-feed', 'e2e-feed.mjs'], ['e2e-post', 'e2e-post.mjs'], ['e2e-flick', 'e2e-flick.mjs'],
  ['e2e-profile-pill', 'e2e-profile-pill.mjs'], ['e2e-avatar', 'e2e-avatar.mjs'], ['e2e-story-speed', 'e2e-story-speed.mjs'],
  ['e2e-reels', 'e2e-reels.mjs'], ['e2e-reels-sound', 'e2e-reels-sound.mjs'], ['e2e-update14', 'e2e-update14.mjs'],
  ['e2e-onboard', 'e2e-onboard.mjs'], ['e2e-lang', 'e2e-lang.mjs'], ['e2e-apoio', 'e2e-apoio.mjs'], ['teste-pix', 'teste-pix.mjs'],
  ['e2e-v15 all', 'e2e-v15.mjs', 'all'], ['e2e-sidebar-buttons', 'e2e-sidebar-buttons.mjs'], ['e2e-story-race', 'e2e-story-race.mjs'], ['e2e-log-i18n', 'e2e-log-i18n.mjs'], ['e2e-auto-reels', 'e2e-auto-reels.mjs'], ['e2e-save-all', 'e2e-save-all.mjs'],
];
const rodadas = Number(process.argv[2]) || 1;
const only = process.argv.slice(3);
let ms = process.env.PLAYWRIGHT_BROWSERS_PATH;
if (!ms) {
  const real = path.join(process.env.LOCALAPPDATA || '', 'Packages');
  const pk = fs.existsSync(real) ? fs.readdirSync(real).filter((n) => n.startsWith('Claude_')) : [];
  for (const p of pk) { const c = path.join(real, p, 'LocalCache', 'Local', 'ms-playwright'); if (fs.existsSync(c)) { ms = c; break; } }
  ms = ms || path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
}
const chromeDir = fs.readdirSync(ms).filter((n) => /^chromium-\d+$/.test(n)).sort().find((n) => fs.existsSync(path.join(ms, n, 'chrome-win64', 'chrome.exe')));
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: ms, CHROME_PATH: path.join(ms, chromeDir, 'chrome-win64', 'chrome.exe') };
console.log('Chromium:', env.CHROME_PATH);
const rodar = (arq, extra) => new Promise((res) => {
  const t0 = Date.now(); let out = '';
  const p = spawn(process.execPath, [path.join(DIR, arq), EXT, ...(extra ? [extra] : [])], { cwd: DIR, env });
  p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
  const kill = setTimeout(() => p.kill(), 400000);
  p.on('exit', (code) => { clearTimeout(kill); res({ code, out, s: ((Date.now() - t0) / 1000).toFixed(0) }); });
});
let falhou = false;
for (let r = 1; r <= rodadas && !falhou; r++) {
  console.log(`\n######## RODADA ${r}/${rodadas} ########`);
  for (const [nome, arq, extra] of LISTA) {
    if (only.length && !only.some((o) => nome.startsWith(o))) continue;
    if (nome === 'e2e-save-all' && !process.env.SAVE_ALL && !only.length) continue; // só entra com SAVE_ALL=1 (a partir da 1.8.15) ou pelo nome
    if (!fs.existsSync(path.join(DIR, arq))) { console.log(`--- ${nome}: ARQUIVO NÃO EXISTE`); falhou = true; break; }
    const { code, out, s } = await rodar(arq, extra);
    fs.mkdirSync(path.join(DIR, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(DIR, 'logs', 'r' + r + '-' + nome.replace(/ /g, '_') + '.log'), out); // saída completa de cada teste
    const linhas = out.trim().split('\n');
    const ok = code === 0 && !/FALHOU|FAIL/i.test(linhas.slice(-3).join('\n'));
    console.log(`--- ${nome}: ${ok ? 'PASSOU' : 'FALHOU'} (exit ${code}, ${s}s)`);
    console.log(linhas.slice(ok ? -3 : -40).map((l) => '    ' + l.slice(0, 200)).join('\n'));
    if (!ok) { falhou = true; break; }
  }
}
console.log(falhou ? '\nSUÍTE: FALHOU' : `\nSUÍTE: TUDO PASSOU (${rodadas} rodada(s))`);
process.exit(falhou ? 1 : 0);
