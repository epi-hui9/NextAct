# AI Runtime

Verified from code paths in Round 2:

| Field | Value |
| --- | --- |
| Provider | Anthropic via `@ai-sdk/anthropic` |
| Default model | `claude-sonnet-5` (`lib/ai/gateway.ts`) |
| Env overrides | `MODEL_WORKHORSE`, `MODEL_SMALL`, `MODEL_FRONTIER`, `MODEL_VERIFIER` |
| Effort | `high` default; escalate to `max` via `routeEffort` |
| Thinking | `thinking: { type: "adaptive" }`, `sendReasoning: false` |
| Timeout | 45 seconds generation |
| Tool loop | calculator only, max 3 steps |
| Fallback | Role IDs fall back to workhorse/default when unset. No alternate provider fallback. |

Client UI never displays model names, effort, or retrieval internals.
