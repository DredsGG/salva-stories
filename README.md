<div align="center">

<img src="extension/icons/icon-128.png" width="96" alt="Salva Stories icon">

# Salva Stories

**Save what's on your Instagram screen, the way it was posted.**
Stories, posts and whole profiles at original resolution, videos with sound, plus a video player, Direct multi-select and a followers check, all inside Instagram.

![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)
![Version](https://img.shields.io/badge/version-1.5.1-d62976)
![License](https://img.shields.io/badge/license-MIT-green)

<img src="docs/salva-stories-menu.png" width="300" alt="Salva Stories settings menu inside Instagram: download folder, per-profile subfolder, max resolution, save-all button, hotkeys, ghost mode, followers tool and video player">

</div>

---

## What it does

**Stories**

- **Two round buttons next to the open story:** *save this one* and *save all from this person*. Shortcuts: `D` and `Shift+D`.
- **Photos at the largest size Instagram has**, not the size on screen (for example 1320×2346 when the viewer shows 720×1280).
- **Videos with audio.** By default it saves the progressive MP4 (video + sound in one file). When the original is above 720p, it fetches the separate DASH video and audio tracks and **muxes them in the browser, with no re-encoding**. If that fails, it falls back to the 720p file.
- **Ghost mode** (off by default): the "seen" request isn't sent, so viewing a story doesn't mark it as seen. A ghost badge shows when it's on, in stories and anywhere else on Instagram.

**Profiles, videos and Direct**

- **Download a profile.** A *Download profile* button on any profile saves its posts (photos, videos and every carousel item) into `perfil/fotos` and `perfil/videos`. It scrolls the grid and keeps the responses Instagram itself loads, at a calm pace (3–6 s per page), instead of calling private endpoints.
- **Video player** on posts and reels, laid over Instagram's own `<video>`: play/pause, ±10 s, speed from 0.5× to 2×, volume and a download button.
- **Direct multi-select.** Pick several conversations (or *All*, which scrolls the list to the end so Instagram loads every page) and mark them unread/read, pin, mute or delete in one go, one conversation at a time through Instagram's own menus, with a confirmation before deleting.

**Followers and following**

<img src="docs/salva-stories-followers.png" width="720" alt="Followers tool: who doesn't follow you back, who you don't follow back, mutuals, unfollowers and new followers, with search, filters and CSV export">

- Who doesn't follow you back, who you don't follow back, mutuals, and, from the second check on, **who unfollowed you** and **new followers**. Search, hide verified, sort, ignore list and CSV export.
- Safe by design: only Instagram's `friendships` lists, 1.5–3 s per page with a pause every 15 pages, a full stop on any block or checkpoint, and an incomplete list is never saved. There's **no mass unfollow**, because that's what gets accounts action-blocked. Results stay on your computer.

**Everywhere**

- **Settings inside Instagram**, not in a popup: a story-ring icon in Instagram's left sidebar (or a gear in the story viewer, or `Alt+S`, or the extension icon) opens the menu.
- **Tidy file names:** `Downloads/Instagram Stories/{user}/stories/{user}_{YYYY-MM-DD_HH-MM-SS}_{id}.jpg|mp4`, using the date it was posted. Folder and per-profile subfolder are configurable.
- **PT / EN / ES** with flag buttons, and **auto / light / dark** theme (auto follows Instagram).

## Install

1. Download **salva-stories-vX.Y.Z.zip** from the [latest release](https://github.com/DredsGG/salva-stories/releases/latest).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Drag the zip onto the page (or unzip it and use **Load unpacked**). From a clone of this repo, load the `extension/` folder.
4. Reload instagram.com (already open tabs don't get the script until you reload).

If you have other story downloaders installed, turn them off: their buttons sit on top of these.

## How it works

```mermaid
flowchart LR
  subgraph Page["instagram.com · MAIN world"]
    P["page.js<br/>fetch/XHR hook · story on screen · buttons in closed shadow DOM · ghost mode"]
    M["menu.js · profile.js · player.js · inbox.js · follows.js<br/>settings menu · profile download · player · Direct · followers (kit.js: shared UI)"]
  end
  subgraph Ext["Extension"]
    B["bridge.js<br/>ISOLATED world"]
    SW["sw.js<br/>service worker"]
    R["remux.js<br/>DASH video + audio → one MP4"]
  end
  P & M -- postMessage --> B -- runtime message --> SW
  SW -- chrome.downloads --> D[("Downloads")]
  SW --> R --> SW
```

- **No extra traffic in the normal case.** `page.js` listens to the responses Instagram itself already downloads (the reels media GraphQL payload and inline JSON) and keeps the story items in memory. Only when an item isn't cached does it make a single `media/{id}/info` call.
- **Finding the story on screen:** the biggest `<video>`/`<img>` in the center of the viewer, matched to its media id through React fiber. When the URL already has an id, that one wins, which covers the slide animation between stories.
- **"Save all" uses only the reel the viewer already loaded.** It doesn't do batch API calls, since that's what triggers Instagram's automation checks.
- **Minimal permissions:** `downloads`, `storage`, and host access only to Instagram's CDN (`*.cdninstagram.com`, `*.fbcdn.net`), needed to fetch DASH tracks. The service worker refuses any URL that isn't HTTPS on those hosts. No `cookies`, `tabs` or `webRequest`, and nothing is sent to any outside server.
- **`remux.js`** is a small dependency-free fMP4 muxer: it copies the `moov`/`trak` boxes, renumbers `track_ID` and interleaves `moof`/`mdat` fragments by their decode time.

### When Instagram changes something

Open the console on instagram.com and run `__salvaStoriesDebug()`. It shows how many items are cached, the current story id and the settings:

- `items: 0` → the response format changed: look at `harvest()` and `WATCH` in `page.js`.
- `current: null` → the viewer layout or fiber changed: look at `pkFromFiber()` and `centerMedia()`.

## Tests

End-to-end in Chromium with the real extension loaded, against a simulated instagram.com and CDN. Setup is in [`tests/README.md`](tests/README.md).

- `e2e.mjs`, stories: photo at the largest candidate with the right name, 1080p DASH video muxed with audio (checked with `ffprobe`), video without sound, `Shift+D` saving three, max-resolution off, ghost mode blocking only when on, and the settings menu.
- `e2e-v15.mjs`, everything else, in light and dark: ghost badge outside stories, a 30-post profile with carousels saved as 34 files in the right folders, the player (pause, ±10 s, 2×, sound, volume, download), Direct (3 marked unread, 2 deleted after the confirmation) and two followers checks with unfollowers and new followers. The screenshots on this page come from that run.

## Disclaimer

Personal project, not affiliated with or endorsed by Instagram or Meta. Downloading content may go against Instagram's Terms of Use. Save only for personal use, don't re-post other people's content, and respect the creators.

## License

[MIT](LICENSE) · made by [André Miller Fleck (Dreds)](https://github.com/DredsGG)
