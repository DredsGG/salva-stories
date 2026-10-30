// v1.8.14: BR Code do Pix (botão Apoiar ♥). Os 4 códigos de referência do vault (02-projetos/extensoes/apoio.md) têm de
// sair IGUAIS, caractere por caractere; "Outro valor" 12,50 → campo 54 "0512.50"; CRC16-CCITT-FALSE conferido à parte.
// Uso: node teste-pix.mjs <pasta da extensão>
import fs from 'fs';
import path from 'path';
import vm from 'vm';
const EXT = process.argv[2];
const win = { addEventListener() {}, postMessage() {} };
win.window = win;
vm.runInNewContext(fs.readFileSync(path.join(EXT, 'src', 'apoio.js'), 'utf8'), { window: win, Symbol, Object, String, Math, parseFloat, Number, JSON, localStorage: { getItem: () => null, setItem() {} } });
const A = win[Symbol.for('salvaStories.apoio')];
const REF = {
  livre: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e35204000053039865802BR5918Andre Miller Fleck6009Sao Paulo62070503***63047D61',
  5: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e352040000530398654045.005802BR5918Andre Miller Fleck6009Sao Paulo62070503***6304C8ED',
  10: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e3520400005303986540510.005802BR5918Andre Miller Fleck6009Sao Paulo62070503***6304DCD7',
  25: '00020126580014br.gov.bcb.pix0136fa525dad-afca-4683-845d-eee7225a53e3520400005303986540525.005802BR5918Andre Miller Fleck6009Sao Paulo62070503***63044036',
};
const R = {}; let ok = true; const check = (n, c, i) => { R[n] = c ? 'ok' : ['FALHOU', i]; if (!c) ok = false; };
check('livre igual à referência', A.pixCode(null) === REF.livre, A.pixCode(null));
for (const v of [5, 10, 25]) check(`R$ ${v} igual à referência`, A.pixCode(v) === REF[v], A.pixCode(v));
const c1250 = A.pixCode(A.parseAmount('12,50'));
check('Outro valor 12,50 → 54 05 12.50', A.parseAmount('12,50') === 12.5 && c1250.includes('540512.50'), c1250);
// CRC calculado por outro caminho (tabela) sobre tudo até "6304"
const crcTab = (s) => { const T = []; for (let i = 0; i < 256; i++) { let c = i << 8; for (let b = 0; b < 8; b++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1; T.push(c & 0xffff); } let c = 0xffff; for (const ch of Buffer.from(s, 'latin1')) c = ((c << 8) ^ T[((c >> 8) ^ ch) & 0xff]) & 0xffff; return c.toString(16).toUpperCase().padStart(4, '0'); };
check('CRC de "123456789" = 29B1 (valor de controle do CRC-16/CCITT-FALSE)', A.crc16('123456789') === '29B1', A.crc16('123456789'));
check('CRC do 12,50 confere com o cálculo por tabela', c1250.slice(-4) === crcTab(c1250.slice(0, -4)), c1250.slice(-4));
check('valores aceitos e recusados', A.parseAmount('') === null && A.parseAmount('1') === 1 && A.parseAmount('10.000') === 10000 && A.parseAmount('1.000,00') === 1000
  && Number.isNaN(A.parseAmount('0,99')) && Number.isNaN(A.parseAmount('10.000,01')) && Number.isNaN(A.parseAmount('abc')) && A.parseAmount('R$ 7,5') === 7.5, null);
console.log(JSON.stringify(R, null, 1));
console.log(ok ? 'TUDO PASSOU' : 'FALHOU');
process.exit(ok ? 0 : 1);
