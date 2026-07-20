# NextAct

A private space where an executive turns a lifetime of judgment into a living legacy.

## Repository map (read this first)

| # | Path | What it is |
| --- | --- | --- |
| 00 | [`00-docs/`](./00-docs/) | All product & engineering documentation |
| 01 | [`src/`](./src/) | Application source (Next.js App Router) |
| 02 | [`public/`](./public/) | Static assets, icons, service worker |
| 03 | [`03-supabase/`](./03-supabase/) | Database migrations & seed SQL |
| 04 | [`04-tests/`](./04-tests/) | Vitest unit / integration tests |
| 05 | [`05-e2e/`](./05-e2e/) | Playwright mobile e2e |
| 06 | [`06-scripts/`](./06-scripts/) | Repo tooling (icons, banned-copy) |

Framework-required names stay as `src/` and `public/` (Next.js will not resolve `01-src` / `02-public`). They are layers **01** and **02** in this map.

### Root config files (why they sit here)

| File | Purpose |
| --- | --- |
| `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` | Dependencies & scripts |
| `next.config.ts` / `next-env.d.ts` | Next.js |
| `tsconfig.json` | TypeScript (`@/*` → `src/*`) |
| `eslint.config.mjs` / `.prettierrc` / `.prettierignore` | Lint & format |
| `vitest.config.ts` | Unit tests |
| `playwright.config.ts` | E2E |
| `vercel.json` | Production headers / region |
| `.env.example` | Env template (no secrets) |
| `.gitignore` | Ignore rules |

Generated / local only (not source of truth): `node_modules/`, `.next/`, `.vercel/`, `.env.local`, `test-results/`.

## Quick start

```bash
pnpm install
# .env.local: see .env.example
pnpm dev
```

```bash
pnpm typecheck && pnpm test && pnpm scan:banned-copy && pnpm build
```

## Docs entry

Start at [`00-docs/00-start-here/00-INDEX.md`](./00-docs/00-start-here/00-INDEX.md).
