# AI runtime

## Model

| Role | Default id | Override env |
| --- | --- | --- |
| workhorse (chat) | `claude-sonnet-5` | `MODEL_WORKHORSE` |
| small / frontier / verifier | same as workhorse unless set | `MODEL_SMALL`, `MODEL_FRONTIER`, `MODEL_VERIFIER` |

Source: `lib/ai/gateway.ts`.

**Yes: production chat uses Claude Sonnet 5** (`claude-sonnet-5`) unless `MODEL_WORKHORSE` is set in Vercel.

## Effort

Source: `lib/ai/reasoning.ts` + `app/api/chat/route.ts`.

| Policy | Value |
| --- | --- |
| Default | `high` |
| Escalation | `max` when the deterministic keyword/length/question score is high |
| Floor | never below `high` |
| User control | none |

Adaptive thinking is requested via Anthropic provider options (`thinking: { type: "adaptive" }` + `effort`).

## Chat contract

1. Persist user message first (idempotency key).
2. Generate with server timeout only (client disconnect does not cancel generation).
3. Stream reveal to the client.
4. Persist assistant reply.
5. Reconcile from `/api/chat/messages` after interruption.

See also `docs/03-data-privacy/03-CONVERSATION_RELIABILITY.md`.
