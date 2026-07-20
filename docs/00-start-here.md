# Start here

NextAct is a private iPhone PWA where one executive turns a lifetime of judgment into a living legacy.

## Five-minute orientation

| Path | What it is |
| --- | --- |
| [`src/app`](../src/app) | Routes, layout, API entrypoints |
| [`src/features`](../src/features) | Product domains (auth, conversation, journey, legacy, reminders, settings) |
| [`src/server`](../src/server) | AI gateway, Supabase, retrieval, DB, secrets |
| [`src/components`](../src/components) | Shared UI and brand marks |
| [`supabase`](../supabase) | Migrations, seed |
| [`docs`](./) | Product, architecture, engineering, security, ADRs |

## Fifteen-minute local run

```bash
pnpm install
cp .env.example .env.local   # fill required values
pnpm dev
```

Then: `pnpm typecheck && pnpm test && pnpm build`.

## Read next

1. [North star](./01-product/01-north-star.md)
2. [System overview](./02-architecture/01-system-overview.md)
3. [Local setup](./03-engineering/01-local-setup.md)
4. [Privacy model](./06-security/01-privacy-model.md)
5. [Modular monolith ADR](./07-decisions/0001-modular-monolith.md)

Historical sprint notes and old layouts live in [`99-archive/`](./99-archive/).
