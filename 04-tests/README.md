# 04 · Unit & integration tests

Vitest suite. Run: `pnpm test`.

| Pattern | Role |
| --- | --- |
| `*.test.ts` | Domain tests (AI, memory, story, privacy, puzzle, …) |
| `server-only-stub.ts` | Stub for `server-only` in Node tests |

Config: root `vitest.config.ts` (`@` → `src/`).
