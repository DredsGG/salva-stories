# Testes do Salva Stories

E2E num Chromium com a extensão carregada; instagram.com e CDN simulados.

## Preparação (uma vez)

1. `npm i playwright@1.63.0 jsqr pngjs` (jsqr e pngjs só para o `e2e-apoio`).
2. Mídia de teste em `media/` (ffmpeg):
   - `prog.mp4` (720x1280 com áudio), `silent.mp4` (sem áudio), `long.webm` (360x640, 40 s, com áudio; os testes de Reels e velocidade)
   - `hq-stream0.mp4` / `hq-stream1.mp4`: `ffmpeg ... -f dash -single_file 1 -dash_segment_type mp4 hq.mpd` (1080x1920 + áudio)
   - `big.jpg` 1320x2346, `small.jpg` 720x1280 (`ffmpeg -f lavfi -i testsrc2=size=1320x2346 -frames:v 1 big.jpg`)
   - `avatar-hd.jpg` e `avatar-sm.jpg` já vêm na pasta.

## Rodar a suíte (a cada versão)

```
node preparar.mjs            # copia ../instalada para ext-test/ (aceita 127.0.0.1 só na cópia) e gera key.pem/cert.pem
node cdn.mjs &               # CDN simulada, porta 443
node suite.mjs 3             # 3 rodadas seguidas, para no primeiro que falhar; saída completa de cada teste em logs/
SAVE_ALL=1 node suite.mjs 3  # igual, incluindo o e2e-save-all (a partir da 1.8.15)
node suite.mjs 1 e2e-feed    # só um teste (pelo começo do nome)
```

Cada teste tem de terminar com `TUDO PASSOU` (os `e2e.mjs`, `e2e-v15.mjs` e todos os outros têm veredito desde 2026-11-05). `e2e-repo` na lista do `suite.mjs` é o `e2e.mjs`.

Flags necessárias no Chromium 141+: `--ignore-certificate-errors` e `--disable-features=LocalNetworkAccessChecks,...` (senão o pedido para 127.0.0.1 fica parado no prompt de rede local).

## No Windows, dentro do app Claude (MSIX)

O Chromium do Playwright só abre pelo caminho **real** (`%LOCALAPPDATA%\Packages\Claude_<id>\LocalCache\Local\ms-playwright\...`); pelo caminho virtual (`%LOCALAPPDATA%\ms-playwright\...`) o `spawn` falha com `spawn UNKNOWN`. O `suite.mjs` já define `PLAYWRIGHT_BROWSERS_PATH` (testes com `channel: 'chromium'`) e `CHROME_PATH` (testes com `executablePath`). Rodando um teste solto, defina as duas variáveis. Sem `CHROME_PATH`, o Playwright usa o headless shell, que não carrega extensão. Detalhes e as outras causas: vault, `02-projetos/extensoes/salva-stories/salva-stories.md` (seção de testes).

## Novo na 1.8.15

`e2e-save-all.mjs`: "Salvar todos" com fila (25 itens com confirmação, Cancelar, Esc, segundo clique, intervalo medido, progresso no botão, ocupado 1/0, reel de 8 sem confirmação, 15 sem dado capturado com plano B limitado, URGENTE, carrossel de 10 e os 3 idiomas). `ONLY=4 node e2e-save-all.mjs ext-test` roda só o bloco 4.

## Novo na 1.9.0

`e2e-sidebar-buttons.mjs` (entra na suíte normal): botões Seguidores e seguindo / Trocar de conta na coluna da barra lateral. Confere ordem e alinhamento dos 4 itens (ícone, fantasminha, Seguidores, Trocar conta), balões em pt/en/es, foto da conta lida do DOM, Seguidores abrindo a janela, Trocar conta abrindo o diálogo simulado do Instagram pelo "Mais" sem o menu ser pintado, nenhuma leitura de `one_tap_storage_version`/nonce, bloqueio com `data-ss-busy` = 1, item ou "Mais" ausente (aviso + log), "Mais" da pessoa por cima, chave do menu, janela baixa (botões no canto), janela estreita (pilha do flutuante), story e dados de seguidores separados por id da conta (`ss.follows.<id>`, `.day`). Imprime as chaves de storage antes e depois. Prints em `shots-sidebar/`.

## Novo na 1.10.0

`e2e-auto-reels.mjs` (Reels simulado como o medido ao vivo; precisa de `media/short.webm`, 3 s: `ffmpeg -f lavfi -i testsrc2=size=480x800:rate=15 -f lavfi -i sine=frequency=330 -t 3 -c:v libvpx -b:v 150k -c:a libopus media/short.webm`), `e2e-story-race.mjs` (o D e o botão salvam o item do momento do aperto; foco devolvido à página) e `e2e-log-i18n.mjs` (registro inteiro nos 3 idiomas). Os três entram na `suite.mjs`. `prints-auto-reels.mjs` gera o print do README.
