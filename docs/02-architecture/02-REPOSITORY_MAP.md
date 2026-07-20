# Repository map

Every top-level path and what it is for.

## Root

| Path | Purpose |
| --- | --- |
| `app/` | Next.js App Router: pages, layouts, API routes |
| `components/` | UI screens and shell (Home, Talk, Path, Legacy, Account) |
| `lib/` | Server/client domain logic (AI, DB, story, legacy, journey, auth) |
| `hooks/` | Client hooks (recorder, etc.) |
| `public/` | Static assets, icons, service worker, offline shell |
| `supabase/` | SQL migrations and seed |
| `tests/` | Vitest unit/integration tests |
| `e2e/` | Playwright mobile e2e |
| `scripts/` | Tooling (icons, banned-copy scan) |
| `docs/` | Numbered handoff documentation (see `00-start-here`) |
| `prompt.md` | Prefer `docs/12-specs/history/` for historical prompts |

## `docs/` (numbered)

| Folder | Contents |
| --- | --- |
| `00-start-here/` | Index + engineer handoff |
| `01-product/` | Vision, journey |
| `02-architecture/` | Architecture, repo map, design system |
| `03-data-privacy/` | Vault, safety contract, chat reliability |
| `04-ai-runtime/` | Model, effort, notifications |
| `05-pwa/` | iOS PWA + update lifecycle |
| `06-testing/` | How to test |
| `07-deployment/` | Vercel + Supabase |
| `08-security/records/` | Credential rotation notes (no secrets) |
| `09-decisions/adr/` | ADRs |
| `10-qa/evidence/` | QA matrices and screenshots |
| `11-rounds/history/` | Sprint execution notes |
| `12-specs/history/` | Historical product prompts |

## Primary UI entry

`components/AppShell.tsx` owns tabs, Talk overlay (`#talk`), account sheet, and draft persistence. Bottom nav is Home · Path · Legacy only.
