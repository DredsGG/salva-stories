# Testes do Salva Stories

E2E num Chromium com a extensão carregada; instagram.com e CDN simulados.

1. `npm i playwright` e gere a mídia de teste em `media/` (ffmpeg):
   - `prog.mp4` (720x1280 com áudio), `silent.mp4` (sem áudio)
   - `hq-stream0.mp4` / `hq-stream1.mp4`: `ffmpeg ... -f dash -single_file 1 -dash_segment_type mp4 hq.mpd` (1080x1920 + áudio)
   - `big.jpg` 1320x2346, `small.jpg` 720x1280
2. Certificado: `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 2 -subj "/CN=cdn"`
3. Copie a extensão para `ext-test/` e, só na cópia, aceite `127.0.0.1` no regex `CDN` do `src/sw.js`.
4. `node cdn.mjs &` (porta 443) e depois `node e2e.mjs $PWD/ext-test`.

Flags necessárias no Chromium 141+: `--ignore-certificate-errors` e `--disable-features=LocalNetworkAccessChecks,...` (senão o pedido para 127.0.0.1 fica parado no prompt de rede local).
