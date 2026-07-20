# Round 2 Execution Ledger

Operational plan for the Production Trust Loop. Updated as gates pass.

## Verified baseline (Phase 0)

| Item | Value |
| --- | --- |
| Branch at audit | `cursor/client-instrument-round-1` |
| Commit | `f1135d3` (feat: NextAct Client Instrument Round 1 vertical slice) |
| Round 2 branch | `cursor/client-instrument-round-2` (created after audit) |
| Package manager | pnpm@11.11.0 (lockfile present) |
| Framework | Next.js 16.2.10, React 19.2.7, AI SDK 7.0.19 |
| Working tree at audit | clean |

### Baseline commands

| Command | Result |
| --- | --- |
| `pnpm install` | pass |
| `pnpm lint` | **fail** (6 errors in `ConversationView.tsx` react-hooks/refs + immutability) |
| `pnpm typecheck` | pass |
| `pnpm test` | pass (64 / 64) |
| `pnpm build` | pass |
| `pnpm test:e2e` | pass (8 / 8) |

### Persistence and auth (proven from code)

- `lib/db/index.ts` always returns `demoAdapter`, even when Supabase env vars are present (adapter never constructed).
- Demo store writes to OS temp / `NEXTACT_DATA_DIR` (`.data` optional).
- Auth is shared password gate (`GATE_PASSWORD` + HMAC cookie). Every session resolves to `DEMO_CLIENT_ID` (`lib/session.ts`).
- `localStorage` holds only `nextact.conversationId` (UI cache, not source of truth for memory).
- No `@supabase/supabase-js` dependency. Migrations exist (`supabase/migrations/0001_init.sql`) with RLS, but are unused at runtime.
- No onboarding, Web Push, VAPID, or notification preference code.

### AI runtime (proven from code)

| Field | Value |
| --- | --- |
| Provider | Anthropic (`@ai-sdk/anthropic`) |
| Default model | `claude-sonnet-5` (`lib/ai/gateway.ts`) |
| Env overrides | `MODEL_WORKHORSE`, `MODEL_SMALL`, `MODEL_FRONTIER`, `MODEL_VERIFIER` |
| Effort | `high` default, escalate to `max` via `routeEffort` (`lib/ai/reasoning.ts`) |
| Thinking | `providerOptions.anthropic.thinking.type = "adaptive"`, `sendReasoning: false` |
| Timeout | 45s generation |
| Fallback | Role IDs fall back to workhorse / default when unset (deliberate, documented). No alternate-provider fallback. |

### Product surfaces (code truth)

- Routes: `/`, `/api/{auth,chat,state,legacy,upload,transcribe}`, manifest, icon.
- Home: greeting, percent ring, `oneSmallThing` invitation, legacy update line. Primary CTA opens Talk tab. No prompt handoff into Talk.
- Talk: seeds independent `FIRST_MESSAGE`; composer placeholder `"Say what's on your mind."`; mic + file upload.
- Legacy: eight-section fill map (not a growing tree).
- Brand: Color 4 (`#10192B`, `#A9AFB8`, `#FAF9F7`, `#7A7D85`).
- PWA: manifest + SW + offline.html. Launch theme navy (risk of dark flash).
- Deploy: no `.vercel`, no Vercel/Supabase CLIs authenticated. Local secrets present: `ANTHROPIC_API_KEY`, `GATE_PASSWORD`, `AUTH_SECRET` only.

### Primary sources read

- `prompt.md` (Round 1 north star + full MVP spec)
- `Round 2 Feedback - Beyond the Title Demo.md` (copy, scroll/composer bugs, model/effort, history/favicon)
- Round 2 execution prompt (Production Trust Loop) appended in chat
- Implementation files listed above; docs vs code: README claims demo adapter honestly; Round 2 Feedback still references older amber/night themes (stale vs Brand Color 4 code)

No `00_START_HERE.md`, meeting transcripts, or memory indexes found in-repo.

### Credential blockers (do not print values)

Missing for live Production Trust Loop:

1. Supabase project URL + anon key + service role + Auth email config
2. Vercel account / project link
3. VAPID public/private keys for Web Push
4. Optional: `DEEPGRAM_API_KEY`

## Exact implementation plan

1. **Phase 1** Health route, security headers, ivory launch surface, shell-first render, PWA cache versioning, Vercel config + deploy instructions.
2. **Phase 2** Supabase Auth (invited email/password), real adapter as sole production source of truth, demo adapter test-only, migrations for profiles/onboarding/push, RLS isolation tests.
3. **Phase 3** Three-screen onboarding, remote completion flag.
4. **Phase 4** Single Home prompt continuity into Talk, remove composer placeholder, caret metrics, Visual Viewport keyboard chrome hide, document WebKit accessory bar.
5. **Phase 5** Brand Color 3 tokens + restrained material on nav/composer.
6. **Phase 6** Deterministic Living Legacy tree stages from story progress.
7. **Phase 7** Web Push subscribe + test send + Cron/Edge Function for 10:00 local.
8. **Phase 8** Documentation set under `docs/`.
9. **Phase 9** Full verification, commit, push, delivery report.

## Phase checklist

- [x] Gate 0 audit + baseline + this ledger
- [x] Gate 1 production foundation (health, headers, ivory launch, SW v2, vercel.json)
- [x] Gate 2 private remote vaults (Supabase adapter, fail-closed, RLS migrations, isolation tests)
- [x] Gate 3 onboarding (3 screens, remote completion)
- [x] Gate 4 Home-to-Talk continuity, composer metrics, Visual Viewport keyboard hide
- [x] Gate 5 Brand Color 3 tokens + glass nav/composer
- [x] Gate 6 deterministic Living Legacy tree
- [x] Gate 7 Web Push subscribe + cron path + scheduler tests
- [x] Gate 8 documentation set
- [x] Gate 9 verification suite locally; GitHub push

## Decisions that differ from stale documentation

- Round 2 Feedback asks for night/amber favicon; Round 2 prompt requires Brand Color 3 ivory/navy. Color 3 wins.
- Round 2 Feedback asks for thread history UI; Round 2 scope excludes spreading effort. Persist conversations remotely; keep UI to Trust Loop (no history panel unless required for reopen continuity).
- Round 1 allowed demo adapter in production; Round 2 forbids silent local fallback. Production requires Supabase or fails closed.
- Shared password gate replaced by per-user Supabase Auth (Mio / Elizabeth / George vaults). Explicit local demo only via `NEXTACT_ALLOW_DEMO=1` and blocked when `VERCEL_ENV=production`.

## Final evidence

| Check | Result |
| --- | --- |
| `pnpm typecheck` | pass |
| `pnpm test` | 72 / 72 pass |
| `pnpm test:e2e` | 8 / 8 pass |
| `pnpm build` | pass |
| Brand Color 4 hex in active UI | absent |
| Secrets in `.next/static` | none found |
| Vercel production deploy | blocked: no Vercel CLI auth / project link |
| Live Supabase RLS matrix | blocked: no Supabase credentials in env |
| Real iPhone Web Push | blocked: missing VAPID + production HTTPS URL |
| Lighthouse production numbers | not measured (no production URL) |
