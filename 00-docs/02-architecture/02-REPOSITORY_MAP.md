# Repository map

## Top level

| Path | Purpose |
| --- | --- |
| `00-docs/` | Numbered documentation |
| `src/` | Application (layer 01) |
| `public/` | Static assets (layer 02) |
| `03-supabase/` | Migrations + seed |
| `04-tests/` | Vitest |
| `05-e2e/` | Playwright |
| `06-scripts/` | Icons, banned-copy |
| Root `*.config.*` / `package.json` | Tooling that must live at repo root |

## `00-docs/` subfolders

See [`../README.md`](../README.md) and [`../00-start-here/00-INDEX.md`](../00-start-here/00-INDEX.md).

## Primary UI entry

`src/components/AppShell.tsx` owns tabs, Talk overlay, account sheet, drafts.
