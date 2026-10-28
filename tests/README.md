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
- `node e2e-v15.mjs $PWD/ext-test [menu|profile|player|inbox|follows|all]` testa as novidades da v1.5.0:
  - **fantasma**: indicador fora dos stories.
  - **perfil**: baixar perfil com 30 posts e carrossel (34 arquivos em `perfil/fotos` e `perfil/videos`).
  - **player**: pausar, ±10 s, velocidade 2×, som, volume e baixar.
  - **direct**: seleção e "Não lida" em 3 conversas; excluir 2 com a confirmação.
  - **seguidores**: duas análises, com quem deixou de seguir e novos seguidores.
- Use `MODE=light` para o tema claro. As capturas vão para `shots15/`.

## Chromium

- Use `CHROME_PATH=...` para escolher o Chromium.
- No Chromium 141+, são necessárias as flags `--ignore-certificate-errors` e `--disable-features=LocalNetworkAccessChecks,...`. Sem elas, o pedido para 127.0.0.1 fica parado no prompt de rede local.

## Novidades da v1.6.0

- Na cópia de teste, acelere o "deixar de seguir":
  ```
  sed -i 's/GAP = \[8000, 16000\], EVERY = 10, PAUSE = \[180, 300\]/GAP = [150, 300], EVERY = 10, PAUSE = [1, 2]/' ext-test/src/follows.js
  ```
  O ritmo real é 8–16 s por conta, com pausa de 3–5 min a cada 10.
- O `e2e-v15.mjs` cobre também a v1.6.0:
  - `follows`: fotos carregando, seleção manual e "Selecionar todas", uma confirmação e a função `PolarisSharedAPI.unfollowUser` simulada;
  - `upd`: aviso de atualização, "Atualizar" baixando o zip e "Relatar bug" com o endereço preenchido.
- `node reload.mjs $PWD/ext-test` grava uma versão nova no manifest da cópia com uma aba "ocupada" por 70 s e mede quando o service worker se recarrega (deve ser só depois dos 70 s).
  - No modo `--load-extension` o Chrome desativa a extensão depois do `runtime.reload()`. É normal desse modo; carregada pela tela do Chrome, ela volta na versão nova.
- O GitHub simulado não intercepta o `fetch` do service worker. Por isso o teste `upd` grava o estado da atualização direto no `chrome.storage`, e a procura real no GitHub também roda.

## Novidades da v1.7.2 à v1.8.10

Estes testes não precisam da CDN (`cdn.mjs`) nem do certificado. Usam o Chromium do Playwright com `channel: 'chromium'`, porque o headless shell não carrega extensão.

- `node e2e-flick.mjs $PWD/ext-test`: na troca de pessoa nos stories, os botões só aparecem na posição final e voltam antes de a animação acabar.
- `node e2e-post.mjs $PWD/ext-test`: botões no post aberto (carrossel foto, vídeo e foto), troca sem mexer, `D`, `Shift+D`, post único, post direto, rolar até a grade, janela estreita e desligar no menu.
- `node e2e-story-speed.mjs $PWD/ext-test` (v1.8.9/1.8.10): velocidade nos stories de vídeo (lista vertical no hover, 2× aplicado e reaplicado, apagado em foto, vale no próximo vídeo e depois de recarregar, chave do menu) e o fantasminha ligando e desligando o modo fantasma no story e na barra lateral. Precisa do `media/long.webm`.
- `node e2e-feed.mjs $PWD/ext-test` (v1.8.8): botões no feed da página inicial (carrossel foto, vídeo e foto, foto única e reel), `D`, `Shift+D`, clique, troca de post ao rolar, desligar no menu; e o nosso ícone da barra e o fantasminha somem com o menu "Mais" do Instagram aberto por cima.
- `node e2e-reels.mjs $PWD/ext-test`: player num Reels simulado com clique humano (aperta, 120 ms, solta). Precisa do `media/long.webm`.
- `node e2e-reels-sound.mjs $PWD/ext-test` (v1.8.7): som no Reels. O som já vem ligado, continua ao passar de reel, mutar vale até sair do Reels e o ajuste desligado não mexe em nada. Precisa do `media/long.webm`.
- `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node e2e-update14.mjs $PWD/ext-test`: regra 14 com a página aberta. Sem a variável, a rota do Playwright não pega o `fetch` do service worker e o teste lê o GitHub de verdade.
- `node prints-post.mjs <pasta da extensão> <saida.png>`: print do post com os botões para a página do GitHub (conta fictícia e imagem gerada).
- O `e2e-onboard.mjs` também precisa da variável acima desde a v1.8.6, porque o service worker confere o Release ao abrir a página.
