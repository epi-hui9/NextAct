# Repository organization

## Top-level layers

| # | Path | Notes |
| --- | --- | --- |
| 00 | `docs/` | All markdown documentation |
| 01 | `src/` | App code (Next.js requires this name) |
| 02 | `public/` | Static / PWA assets (Next.js requires this name) |
| 03 | `supabase/` | SQL migrations |
| 04 | `tests/integration/` | Vitest |
| 05 | `tests/e2e/` | Playwright |
| 06 | `scripts/` | Tooling |

## Inside `src/` (layer 01)

| Path | Role |
| --- | --- |
| `app/` | Pages + API |
| `components/` | Screens & shell |
| `hooks/` | Client hooks |
| `lib/` | Domain modules |
| `proxy.ts` | API auth middleware |
| `types/` | Ambient types |

## Path alias

`@/*` → `src/*` (tsconfig + vitest).
