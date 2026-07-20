# NextAct

A private space where an executive turns a lifetime of judgment into a living legacy.

## Repository map

| Path | What it is |
| --- | --- |
| [`docs/`](./docs/) | Product & engineering docs (numbered reading order) |
| [`src/`](./src/) | Next.js app, features, server, shared UI |
| [`public/`](./public/) | Static assets, icons, service worker |
| [`supabase/`](./supabase/) | Migrations & seed |
| [`tests/`](./tests/) | Vitest integration + Playwright e2e |
| [`scripts/`](./scripts/) | Tooling (icons, banned-copy) |

Do **not** number `src`, `public`, or `supabase`. Numbers belong in `docs/`.

### Inside `src/`

| Path | Role |
| --- | --- |
| `app/` | Routes, layout, API entrypoints |
| `features/` | Domain slices: auth, conversation, journey, legacy, reminders, settings |
| `components/` | Shared `ui/` and `brand/` |
| `server/` | AI gateway, Supabase, retrieval, DB, files, security |
| `lib/` | Small shared helpers (`env`, `validation`, `utilities`) |
| `styles/` | Global CSS tokens |
| `proxy.ts` | API auth gate |

## Quick start

```bash
pnpm install
# .env.local: see .env.example and docs/03-engineering/02-environment-variables.md
pnpm dev
```

```bash
pnpm typecheck && pnpm test && pnpm scan:banned-copy && pnpm build
```

## Docs entry

Start at [`docs/00-start-here.md`](./docs/00-start-here.md).
