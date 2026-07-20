# File layout (what lives where)

## App routes

| Path | Role |
| --- | --- |
| `app/page.tsx` | Auth gate + AppShell mount |
| `app/layout.tsx` | Root layout, metadata, fonts |
| `app/globals.css` | Design tokens (Brand Color 3, spacing, type, glass) |
| `app/api/auth/*` | Sign-in / session |
| `app/api/chat/*` | Chat generate + message reconcile |
| `app/api/conversations` | List past conversations for Talk → Past |
| `app/api/state` | Story / legacy progress for Home & Path |
| `app/api/legacy` | Legacy map payload |
| `app/api/upload` | File ingest |
| `app/api/transcribe` | Voice → text |
| `app/manifest.ts` | PWA manifest |

## Components

| Path | Role |
| --- | --- |
| `AppShell.tsx` | Tabs, Talk overlay, drafts, account, keyboard |
| `Home.tsx` | Identity, tree, Story %, Continue → Talk |
| `ConversationView.tsx` | Talk UI; Past sheet; New |
| `Journey.tsx` | Path: eight stage titles + active % |
| `LegacyMap.tsx` | Living legacy overview/detail |
| `NavBar.tsx` | Home · Path · Legacy only |
| `Composer.tsx` | Input, mic, attach, send |
| `AccountSheet.tsx` | Identity, password, sign out, reminders |
| `UpdateBanner.tsx` | One-tap PWA update |

## Lib

| Path | Role |
| --- | --- |
| `lib/ai/` | Gateway model ids, effort router, prompts, output policy |
| `lib/db/` | StorageAdapter + demo/supabase implementations |
| `lib/story/` | Story progress → tree stages |
| `lib/legacy/` | Legacy fill |
| `lib/journey/` | Nine-month path stage list |
| `lib/memory/` | Capture / retrieve / guards |
| `lib/auth.ts` / `lib/session.ts` | Auth helpers |
