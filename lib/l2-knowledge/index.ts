/**
 * L2 — Knowledge Graph Corpus (PLACEHOLDER ONLY).
 *
 * Future home of GraphRAG source material about Dr. Elizabeth Lindsey. This
 * round it is a typed, no-op seam: the chat route calls `retrieve()` so the
 * wiring exists, but it returns nothing and has zero runtime effect.
 *
 * TODO(Round 2): back `retrieve()` with a real graph/vector store built from
 * the corpus and return ranked passages for the current turn.
 */

/** A single retrieved passage of source material. */
export interface Passage {
  /** Stable identifier for the source chunk. */
  id: string;
  /** The passage text to fold into the prompt context. */
  content: string;
  /** Optional provenance (document title, section, etc.). */
  source?: string;
  /** Optional relevance score in [0, 1]. */
  score?: number;
}

export interface KnowledgeGraph {
  /**
   * Retrieve passages relevant to a query.
   * @param query - Natural-language retrieval query.
   */
  retrieve(query: string): Promise<Passage[]>;
}

/**
 * No-op implementation. Returns an empty passage list.
 * Intentionally has no side effects and no dependencies.
 */
export const knowledgeGraph: KnowledgeGraph = {
  async retrieve(_query: string): Promise<Passage[]> {
    // TODO(Round 2): implement GraphRAG retrieval. No-op for now.
    return [];
  },
};
