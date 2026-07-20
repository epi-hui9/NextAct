# Repository Map

| Path | Purpose |
| --- | --- |
| `app/` | Routes, layout, API, PWA manifest |
| `components/` | Mobile UI surfaces (Home, Talk, Path, Legacy, Account) |
| `lib/ai/` | Gateway, prompts, calculator, effort |
| `lib/db/` | StorageAdapter, demo + Supabase adapters |
| `lib/memory/` | Capture, retrieve, validate, guards |
| `lib/story/` | Story progress + living tree stages |
| `lib/journey/` | Nine month path stage definitions |
| `lib/legacy/` | Map fill math |
| `lib/push/` | VAPID + scheduler helpers |
| `lib/client/` | IndexedDB draft helpers |
| `lib/supabase/` | Env + clients |
| `supabase/migrations/` | Schema + RLS |
| `tests/` | Vitest unit/privacy |
| `e2e/` | Playwright iPhone viewport |
| `docs/` | Product, architecture, QA, security |
| `docs/specs/` | Historical round prompts |
| `docs/rounds/` | Execution notes and feedback |
| `scripts/` | Icons, banned-copy scan |

## Primary destinations

1. **Home** - identity, living tree, Story progress once, today's invitation
2. **Talk** - private conversation
3. **Path** - Nine month path (eight journey stages)
4. **Legacy** - Living Legacy map
