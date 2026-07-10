/**
 * L3 — Agentic Retrieval + Living Memory (PLACEHOLDER ONLY).
 *
 * Future home of active retrieval and a living memory that updates across
 * turns and sessions. This round it is a typed, no-op seam: the chat route
 * calls `recall()` so the wiring exists, but it returns nothing and has zero
 * runtime effect.
 *
 * TODO(Round 3): implement agentic recall and a `remember()` update loop that
 * persists salient facts about the person across the conversation.
 */

import type { UIMessage } from "ai";

/** A single recalled memory item to prime the current turn. */
export interface MemoryItem {
  /** Stable identifier for the memory. */
  id: string;
  /** The remembered content, phrased for prompt injection. */
  content: string;
  /** Optional recency/importance weight in [0, 1]. */
  weight?: number;
}

export interface MemoryLoop {
  /**
   * Recall memory relevant to the current conversation context.
   * @param context - The running message history for this turn.
   */
  recall(context: UIMessage[]): Promise<MemoryItem[]>;
  /**
   * Persist salient information from a completed turn.
   * @param turn - The message(s) to consider for long-term memory.
   */
  remember(turn: UIMessage[]): Promise<void>;
}

/**
 * No-op implementation. Recall returns nothing; remember does nothing.
 * Intentionally has no side effects and no dependencies.
 */
export const memoryLoop: MemoryLoop = {
  async recall(_context: UIMessage[]): Promise<MemoryItem[]> {
    // TODO(Round 3): agentic retrieval over living memory. No-op for now.
    return [];
  },
  async remember(_turn: UIMessage[]): Promise<void> {
    // TODO(Round 3): update living memory after each turn. No-op for now.
  },
};
