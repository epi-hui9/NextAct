# L3 — Agentic Retrieval + Living Memory (placeholder)

This folder is a **placeholder** for a future memory layer. It is intentionally
empty of logic this round.

## Why empty now

Round 1 ships only L1 (the persona). L3 exists so the chat pipeline can already
_call through_ a recall seam without changing shape later. `recall()` returns an
empty array and `remember()` does nothing.

## What lives here in Round 3

- **Agentic retrieval:** the model decides what to look up, when, and how much.
- **Living memory:** salient facts about the person are captured via
  `remember(turn)` and re-surfaced via `recall(context)` on later turns and
  sessions.

The public interface (`MemoryLoop`, `MemoryItem`, `memoryLoop`) is designed to
stay stable so Round 3 is a drop-in replacement of the implementation only.
