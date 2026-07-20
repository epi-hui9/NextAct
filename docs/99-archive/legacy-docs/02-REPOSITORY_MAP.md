# Repository map

## Top level

| Path | Purpose |
| --- | --- |
| `docs/` | Numbered documentation |
| `src/` | Application (layer 01) |
| `public/` | Static assets (layer 02) |
| `supabase/` | Migrations + seed |
| `tests/integration/` | Vitest |
| `tests/e2e/` | Playwright |
| `scripts/` | Icons, banned-copy |
| Root `*.config.*` / `package.json` | Tooling that must live at repo root |

## `docs/` subfolders

See [`../README.md`](../README.md) and [`../00-start-here/00-INDEX.md`](../00-start-here/00-INDEX.md).

## Primary UI entry

`src/components/AppShell.tsx` owns tabs, Talk overlay, account sheet, drafts.
