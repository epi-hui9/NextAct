# File layout (what lives where)

## `src/app` routes

| Path | Role |
| --- | --- |
| `page.tsx` | Auth gate + AppShell |
| `layout.tsx` | Root layout, Newsreader, metadata |
| `globals.css` | Design tokens |
| `api/*` | Auth, chat, conversations, state, legacy, upload, transcribe, reminders |

## `src/components`

| Path | Role |
| --- | --- |
| `AppShell.tsx` | Tabs, Talk, drafts, account |
| `Home.tsx` / `ConversationView.tsx` / `Journey.tsx` / `LegacyMap.tsx` | Four screens |
| `NavBar.tsx` / `Composer.tsx` / `AccountSheet.tsx` | Chrome |

## `src/lib`

| Path | Role |
| --- | --- |
| `ai/` | Gateway, effort, prompts |
| `db/` | StorageAdapter |
| `story/` `legacy/` `journey/` `memory/` | Domain |
| `auth.ts` `session.ts` | Auth |

## Other layers

| Path | Role |
| --- | --- |
| `supabase/migrations/` | Schema + RLS |
| `tests/integration/` | Vitest |
| `tests/e2e/` | Playwright |
| `scripts/` | Tooling |
| `public/` | SW + icons |
