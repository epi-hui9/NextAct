# Hand-off guide

This document is for an engineer who has never seen NextAct.

## What NextAct is

A private iPhone Home Screen PWA for executives. Each person has an isolated vault. The active product stage is **Tell Your Story**. Talk is reached only from Home. Path shows the nine-month journey. Legacy shows the living map.

North star: a private space with zero client data crossing between users, simple enough to avoid overload, that turns forty years of judgment into a living legacy.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Vercel AI SDK 7 + Anthropic (`claude-sonnet-5`)
- Supabase Auth + Postgres + RLS
- Custom CSS design tokens (Brand Color 3)
- Vitest + Playwright
- Deployed on Vercel as a PWA

## Local demo

```bash
pnpm install
# .env.local: ANTHROPIC_API_KEY, GATE_PASSWORD, AUTH_SECRET, NEXTACT_ALLOW_DEMO=1
pnpm dev
```

## Production

Requires Supabase URL/keys and Anthropic. See `docs/07-deployment/01-DEPLOYMENT.md`.

```bash
pnpm typecheck
pnpm test
pnpm scan:banned-copy
pnpm build
```

## Primary code map

| Path | Role |
| --- | --- |
| `app/` | Pages + API routes |
| `components/` | Home, Talk, Path, Legacy, Account, shell |
| `lib/db/` | StorageAdapter (demo + supabase) |
| `lib/ai/` | Model gateway, effort router, prompts |
| `lib/journey/` | Eight path stages |
| `lib/story/` | Story progress + tree stages |
| `lib/legacy/` | Legacy fill math |
| `public/sw.js` | Explicit one-tap update SW |
| `supabase/migrations/` | Schema + RLS |

## Navigation rules

Bottom tabs: **Home · Path · Legacy** only.  
Talk opens from Home ("Continue this reflection"). No Talk tab.

## Model policy (current)

- Default model id: `claude-sonnet-5`
- Effort: `high` by default, `max` when the router scores a hard turn
- Never below `high`; no user-facing effort control
