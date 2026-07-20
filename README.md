# NextAct

A private space where an executive turns a lifetime of judgment into a living legacy.

## Destinations

- **Home** - identity, living tree, Story progress, today's invitation → Talk
- **Talk** - private conversation (opened from Home only; Past / New in header)
- **Path** - Nine month path (eight stages)
- **Legacy** - Living Legacy map

## Quick start (local demo)

```bash
pnpm install
# .env.local needs:
# ANTHROPIC_API_KEY, GATE_PASSWORD, AUTH_SECRET, NEXTACT_ALLOW_DEMO=1
pnpm dev
```

Production requires Supabase. See [docs/07-deployment/01-DEPLOYMENT.md](docs/07-deployment/01-DEPLOYMENT.md).

## Verify

```bash
pnpm typecheck
pnpm test
pnpm scan:banned-copy
pnpm build
```

## Documentation

Start at [docs/00-start-here/00-INDEX.md](docs/00-start-here/00-INDEX.md).

## Model

Chat uses **Claude Sonnet 5** (`claude-sonnet-5`) with effort **high** by default (escalates to **max** on hard turns). Details: [docs/04-ai-runtime/01-AI_RUNTIME.md](docs/04-ai-runtime/01-AI_RUNTIME.md).
