# Testes do Salva Stories

E2E num Chromium com a extensão carregada; instagram.com e a CDN são simulados.

## Preparação (uma vez)

1. Rode `npm i playwright`.
2. Gere a mídia de teste em `media/` com o ffmpeg:
   - `prog.mp4`: 720x1280, com áudio.
   - `silent.mp4`: sem áudio.
   - `hq-stream0.mp4` / `hq-stream1.mp4`: `ffmpeg ... -f dash -single_file 1 -dash_segment_type mp4 hq.mpd` (1080x1920 + áudio).
   - `big.jpg` (1320x2346) e `small.jpg` (720x1280).
   - `long.webm`, um vídeo de 40 s para o player. É WebM porque o Chromium do Playwright não toca H.264:
     ```
     ffmpeg -f lavfi -i testsrc2=size=480x480:rate=24 -f lavfi -i sine=frequency=440 -t 40 -c:v libvpx -b:v 400k -c:a libopus media/long.webm
     ```
3. Crie o certificado:
   ```
   openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 2 -subj "/CN=cdn"
   ```
4. Copie a extensão para `ext-test/` e, só na cópia, aceite `127.0.0.1` no regex `CDN` do `src/sw.js`.

## Rodar

```
node cdn.mjs
```
Deixe rodando (porta 443, com suporte a Range para o player poder pular). Depois:

- `node e2e.mjs $PWD/ext-test` testa os stories: foto, vídeo em alta (DASH), sem som, salvar todos, 720p, modo fantasma e menu.
- `node e2e-v15.mjs $PWD/ext-test [menu|profile|player|inbox|follows|upd|all]` testa o resto (v1.5.x):
  - **fantasma**: indicador fora dos stories.
  - **perfil**: baixar perfil com 30 posts e carrossel (34 arquivos em `perfil/fotos` e `perfil/videos`).
  - **player**: pausar (e continuar pausado quando a página tenta dar play ao rolar), ±10 s, velocidade 2×, som, volume e baixar.
  - **direct**: "Todas" seleciona as 40 conversas; "Não lida" em 2; excluir 2 com uma confirmação só.
  - **seguidores**: duas análises, com quem deixou de seguir e novos seguidores.
  - **atualização** (`upd`): aviso de versão nova com o zip do Release simulado e "Relatar bug" abrindo o Issue já preenchido.
- Use `MODE=light` para o tema claro. As capturas vão para `shots15/`.

## Chromium

- Use `CHROME_PATH=...` para escolher o Chromium.
- No Chromium 141+, são necessárias as flags `--ignore-certificate-errors` e `--disable-features=LocalNetworkAccessChecks,...`. Sem elas, o pedido para 127.0.0.1 fica parado no prompt de rede local.
