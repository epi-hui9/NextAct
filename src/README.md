# 01 · Application source (`src/`)

Next.js requires this folder to be named `src/` (not `01-src`). In the repo map it is **layer 01**.

| Path | Role |
| --- | --- |
| `app/` | App Router pages, layouts, API routes |
| `components/` | UI: Home, Talk, Path, Legacy, shell, account |
| `hooks/` | Client hooks (e.g. recorder) |
| `lib/` | Domain logic: AI, DB, story, legacy, journey, memory, auth |
| `proxy.ts` | Auth gate for client-owned API routes |
| `types/` | Ambient TypeScript declarations |

Imports use `@/` → `src/` (see root `tsconfig.json`).
