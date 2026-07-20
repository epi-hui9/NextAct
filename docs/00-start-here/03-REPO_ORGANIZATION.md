# Repository layout

Numbered documentation under `docs/`:

| # | Folder | Purpose |
| --- | --- | --- |
| 00 | `00-start-here/` | Index, handoff, file layout |
| 01 | `01-product/` | Vision, journey, Path UI notes |
| 02 | `02-architecture/` | Architecture, map, design system |
| 03 | `03-data-privacy/` | Vault, RLS, chat reliability |
| 04 | `04-ai-runtime/` | Model, effort, voice STT, notifications |
| 05 | `05-pwa/` | iOS PWA, updates, reminders |
| 06 | `06-testing/` | Vitest / Playwright |
| 07 | `07-deployment/` | Vercel + Supabase |
| 08 | `08-security/records/` | Credential notes (no secrets) |
| 09 | `09-decisions/adr/` | ADRs |
| 10 | `10-qa/evidence/` | QA matrices / screenshots |
| 11 | `11-rounds/history/` | Sprint ledgers |
| 12 | `12-specs/history/` | Historical prompts |

## Application code

| Path | Role |
| --- | --- |
| `app/` | Routes + API |
| `components/` | Shell + screens |
| `lib/` | Domain (ai, db, story, legacy, journey, memory) |
| `hooks/` | Client hooks |
| `public/` | Icons, SW, offline |
| `supabase/` | Migrations |
| `tests/` / `e2e/` | Automated tests |
| `scripts/` | Tooling |

Start: `docs/00-start-here/00-INDEX.md`.
