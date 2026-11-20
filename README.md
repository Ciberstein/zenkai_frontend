# Zenkai — Frontend

Single-page app for the Zenkai anime streaming platform. React 19 + Vite 7,
Redux Toolkit, Tailwind CSS 4 and Headless UI, talking to the `zenkai_backend`
API.

The UI follows a cyberpunk design system ("Night City"): chamfered corners,
a yellow accent, HUD details and light/dark themes. See
[Design system](#design-system).

## Getting started

```bash
npm install
cp .env.example .env   # set VITE_API_URL to the backend URL
npm run dev
```

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server (exposed on the network) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the build locally |
| `npm run lint` | ESLint |
| `npm start` | Serve `dist/` with `serve -s dist -l $PORT` (used on Railway) |

## Environment variables

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | **Public** URL of the backend (e.g. `http://localhost:3010`). It is baked in at build time, so it must exist before `npm run build`. The app runs in the user's browser, so a private network URL will not work |

## Project structure

```
index.html
vite.config.js
hooks/               Reusable hooks (debounce, infinite scroll, mobile)
i18n/                i18next setup + lang/{es,en,ja}.json
public/              Static files served as-is
src/
  main.jsx           Providers (redux, auth, admin) and mounting
  App.jsx            Route table
  index.css          Design tokens and custom utilities
  App.css            Base styles (typography, focus, scrollbars)
  api/               Axios instance (automatic refresh) and prefixes
  config/            Library configuration
  context/           Global contexts: session and admin permissions
  routes/            Protected routes (User, Watch, Private, Admin)
  services/          One-off API calls that do not live in the store
  store/             configureStore + slices/ (one per resource)
  utils/             Pure helpers
  components/
    layouts/         Page frames: User, Watch, Admin
    material/        Base controls (Button, Tag, inputs)
    shared/          Cross-cutting pieces (Navbar, AnimeCard, Rail, ...)
    pages/           One folder per page with its XPage.jsx and partials/
      index.jsx      Single barrel consumed by App.jsx
```

Every page follows the same pattern: `XPage.jsx` orchestrates (thunks + state)
and the `partials/` only render.

## Routes

| Area | Routes | Access |
| --- | --- | --- |
| Auth | `/login` `/register` `/recovery` | public |
| Browse | `/` `/catalog` `/search` `/seasons/:year?/:season?` `/schedule` `/anime/:malId` `/profile/:id?` | public |
| Player | `/watch/:malId/:number` | public |
| Library | `/watchlist` `/favorites` `/history` `/settings` | logged in |
| Admin | `/admin` `/admin/catalog` `/admin/catalog/:id` `/admin/accounts` `/admin/jobs` `/admin/logs` `/admin/settings` | staff / admin |

## Player and watch history

The player picks the engine from the source type: **hls.js** for `hls` (the native
player on Safari), a plain `<video>` for `mp4` and an `<iframe>` for `embed`.

The watch page is just the player, covering the whole screen (no site header, no
episode list). Everything else lives inside it:

- **Back to the series:** the **X** at the top left goes to `/anime/:malId`, next to the
  series title and the episode.
- **Previous / next episode:** buttons in the control bar (disabled at the ends), the
  `p` and `n` keys, and a **Siguiente episodio** prompt that appears in the last 90 s.
- **Server:** the sources of the episode are listed in the settings menu. Embeds
  (iframes) and error states get a slim top bar with the same X, previous/next and
  server picker, since their own controls cannot be driven.

The controls are custom (the browser's own are off) and follow the site's style: a
progress bar with the time under the cursor and drag-to-seek, play/pause, ±10 s,
volume, speed and fullscreen. They hide by themselves after a few seconds of
playback. The code lives in `Player.jsx` (video, tracks, progress reporting),
`PlayerControls.jsx` (the interface on top) and `PlayerTopBar.jsx` (the header with
the X).

- **Mouse:** click pauses, double click toggles fullscreen.
- **Touch:** a tap shows or hides the controls, a double tap on the left or right
  side skips 10 s.
- **Keyboard:** `space`/`k` play-pause, `j`/`l` ∓10 s, `←`/`→` ∓5 s, `↑`/`↓` volume,
  `m` mute, `f` fullscreen, `c` subtitles on/off, `n`/`p` next/previous episode,
  `0`–`9` jump to 0–90 %.

Two menus offer whatever the source provides:

- **Audio and subtitles** (the CC button): the audio tracks declared in the HLS
  manifest, one per language, and the subtitles: the WebVTT tracks stored for the
  episode (`episode.subtitles`) plus any subtitle rendition in the manifest. Only one
  is shown at a time. The text of the stored tracks is drawn by the player itself, so
  it moves up when the controls appear.
- **Settings:** quality (Auto plus one entry per resolution in the manifest) and
  speed (0.5× to 2×).

The chosen audio and subtitle language is remembered in `localStorage`
(`zk_player_prefs`) and applied to the next episodes. Subtitle files and HLS
segments must be served with CORS headers, since the video is requested in CORS mode
when the episode has subtitles.

When the user is **logged in** it:

- reports progress every 15 s, on pause and when the episode ends, ignoring
  anything under 5 s of playback;
- resumes where the user left off, unless the episode was already completed;
- marks the episode as watched (the server flags it as completed at 85 %): the
  episode list is refreshed when it ends, so the series page shows the check.

Guests are never asked for or sent any history.

## Design system

Tokens live in `src/index.css` (`--bg`, `--surface`, `--fg`, `--accent`, ...) and
switch with the `.dark` class on `<html>`.

- **Fonts:** Barlow (body), Chakra Petch (headings), Share Tech Mono (labels),
  Tektur (rank numerals), Zen Kaku Gothic New (Japanese).
- **Shapes:** `cut-xs | cut-sm | cut | cut-lg` chamfer an element with `clip-path`.
  Because the clip also hides borders and shadows, use `cut-ring` (needs `relative`
  plus a `cut-*` class) for a border that follows the cut, and `cut-focus` for
  focus rings.
- **Details:** `hud` (corner brackets), `hazard` (stripe), `eyebrow` (small mono
  label), `.grid-hud` and CRT scanlines in dark mode.

Use canonical Tailwind 4 class names (`size-4.5`, `bg-linear-to-t`, `data-open:`).

## Notes

- **Cookie sessions.** `src/api/axios.js` retries once after refreshing the token
  and queues the requests that fail during the refresh.
- **Public catalog.** It can be browsed without a session (`Protected.User`); only
  the library and settings require login (`Protected.Private`).
- **Filters in the URL.** Catalog, search and seasons read and write query params,
  so any view can be shared.
- **i18n.** Spanish, English and Japanese through i18next; strings live in
  `i18n/lang/`.

## Deploying on Railway

1. Set `VITE_API_URL` to the backend's public URL **before** the build runs.
2. Build with `npm run build` and start with `npm start`; Railway provides `PORT`.
3. Set the backend's `FRONTEND_DOMAIN` to this app's public URL so CORS allows it.
4. Make sure every source folder is tracked by git. Case-insensitive file systems
   can hide folders behind `.gitignore` patterns (a bare `logs` entry once kept
   `src/components/pages/admin/Logs/` out of the repo and broke the Linux build).
