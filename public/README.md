# 02 · Static assets (`public/`)

Next.js requires this folder to be named `public/` (not `02-public`). In the repo map it is **layer 02**.

| File / area | Role |
| --- | --- |
| `sw.js` | Service worker (explicit one-tap update) |
| `offline.html` | Offline shell |
| `icon-*.png` / `apple-touch-icon.png` | PWA icons |
| Other static files | Served at site root |

Do not put secrets here. Everything is publicly fetchable.
