# AGENTS.md

Guidance for coding agents working in this repository.

## Product

NextAct is a private vault PWA for one executive. North star: private, simple, living legacy, hopeful next chapter. Banned product copy: the word “quiet”, and the em dash character U+2014.

## Architecture

- Single repo, modular monolith. No Turborepo / microservices unless product scope changes.
- `src/app` = routes + API entry only.
- Business logic by domain under `src/features/*`.
- Secrets and model calls only through `src/server/*` (unified AI gateway). Pages never call Anthropic directly.
- Browser uses user JWT only; service role stays server-side.
- Docs live in `docs/` with numbered folders; keep docs in sync when behavior changes.

## Commands

```bash
pnpm typecheck
pnpm test
pnpm scan:banned-copy
pnpm build
```

## Conventions

- Folders/files: `kebab-case`. React components: `PascalCase`.
- Commits: `feat(legacy): …` style when possible.
- Prefer `git mv` for renames. Do not invent `misc/`, `utils2.ts`, or dated backup files.
- Respond to the human in 简体中文 when that is the project preference.
