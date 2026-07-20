# NextAct: Client Instrument

A private space where an executive turns a lifetime of judgment into a living legacy.

## Current production slice (Round 2)

The Production Trust Loop: installable HTTPS PWA, private vault sign-in, short onboarding, Home reflection → Talk continuity, remote persistence, deterministic Living Legacy tree, and opt-in 10:00 AM Web Push.

## Quick start (local demo)

```bash
pnpm install
# .env.local needs:
# ANTHROPIC_API_KEY, GATE_PASSWORD, AUTH_SECRET, NEXTACT_ALLOW_DEMO=1
pnpm dev
```

Production requires Supabase. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Verify

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Documentation

- [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/REPOSITORY_MAP.md](docs/REPOSITORY_MAP.md)
- [docs/DATA_AND_PRIVACY.md](docs/DATA_AND_PRIVACY.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/PWA_IOS.md](docs/PWA_IOS.md)
- [docs/AI_RUNTIME.md](docs/AI_RUNTIME.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/rounds/ROUND_2_EXECUTION.md](docs/rounds/ROUND_2_EXECUTION.md)
