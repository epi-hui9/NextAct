# Hand-off guide

This document is for an engineer who has never seen NextAct.

## What NextAct is

A private iPhone Home Screen PWA for executives. Each person has an isolated vault. Active stage: **Tell Your Story**.

## Stack

- Next.js 16 App Router + React 19 + TypeScript (`src/`)
- Vercel AI SDK 7 + Anthropic (`claude-sonnet-5`)
- Supabase Auth + Postgres + RLS (`03-supabase/`)
- Custom CSS design tokens (Brand Color 3)
- Vitest (`04-tests/`) + Playwright (`05-e2e/`)

## Local demo

```bash
pnpm install
# .env.local from .env.example
pnpm dev
```

## Production

See `00-docs/07-deployment/01-DEPLOYMENT.md`.

```bash
pnpm typecheck && pnpm test && pnpm scan:banned-copy && pnpm build
```

## Navigation

Bottom tabs: **Home · Path · Legacy**. Talk opens from Home only.

## Model

Default `claude-sonnet-5`, effort `high` (escalates to `max`). Details: `00-docs/04-ai-runtime/01-AI_RUNTIME.md`.
