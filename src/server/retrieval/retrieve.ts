import "server-only";
import { db } from "@/server/db";
import type { ProceduralMemory } from "@/server/db/types";
import { reciprocalRankFusion } from "./rrf";

/**
 * Tenant-filtered retrieval.
 *
 * All records come from the adapter already scoped to `clientId`, so no other
 * client's data can enter. We fuse a lexical ranking and a recency ranking with
 * RRF (pgvector embeddings would add a third list when available; we fall back
 * to lexical + recency without breaking chat). Returns at most six items plus
 * the active procedural rules to apply.
 */

export type ContextKind =
  | "semantic"
  | "episodic"
  | "document"
  | "legacy";

export interface ContextItem {
  id: string;
  kind: ContextKind;
  text: string;
  sourceIds: string[];
  /** Stale memory is included only as historical contrast, never as current. */
  stale: boolean;
  timestamp: number;
}

export interface RetrievalResult {
  items: ContextItem[];
  procedural: ProceduralMemory[];
}

const MAX_ITEMS = 6;

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter(
    (w) => w.length >= 3,
  );
}

/** Lexical overlap score between query tokens and an item's text. */
function lexicalScore(queryTokens: Set<string>, text: string): number {
  const tokens = tokenize(text);
  let score = 0;
  for (const t of tokens) if (queryTokens.has(t)) score += 1;
  return score;
}

export async function buildContext(
  clientId: string,
  query: string,
): Promise<RetrievalResult> {
  const [semanticActive, semanticStale, episodic, chunks, legacy, procedural] =
    await Promise.all([
      db.listSemantic(clientId, { status: "active" }),
      db.listSemantic(clientId, { status: "stale" }),
      db.listEpisodic(clientId),
      db.listChunks(clientId),
      db.listLegacyEntries(clientId),
      db.listProcedural(clientId, { status: "active" }),
    ]);

  const candidates: ContextItem[] = [
    ...semanticActive.map((m) => ({
      id: `sem:${m.id}`,
      kind: "semantic" as const,
      text: m.statement,
      sourceIds: m.source_ids.length ? m.source_ids : [m.id],
      stale: false,
      timestamp: m.updated_at,
    })),
    ...semanticStale.map((m) => ({
      id: `sem:${m.id}`,
      kind: "semantic" as const,
      text: m.statement,
      sourceIds: m.source_ids.length ? m.source_ids : [m.id],
      stale: true,
      timestamp: m.updated_at,
    })),
    ...episodic.map((m) => ({
      id: `epi:${m.id}`,
      kind: "episodic" as const,
      text: `${m.summary} (felt: ${m.emotional_state})`,
      sourceIds: m.source_message_ids.length ? m.source_message_ids : [m.id],
      stale: false,
      timestamp: m.occurred_at,
    })),
    ...chunks.map((c) => ({
      id: `doc:${c.id}`,
      kind: "document" as const,
      text: c.content,
      sourceIds: [c.file_id],
      stale: false,
      timestamp: c.created_at,
    })),
    ...legacy.map((l) => ({
      id: `leg:${l.id}`,
      kind: "legacy" as const,
      text: `${l.title}: ${l.content}`,
      sourceIds: l.source_ids.length ? l.source_ids : [l.id],
      stale: false,
      timestamp: l.created_at,
    })),
  ];

  if (candidates.length === 0) return { items: [], procedural };

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const queryTokens = new Set(tokenize(query));

  // Lexical list: only items with any overlap, ranked by score then recency.
  const lexical = candidates
    .map((c) => ({ id: c.id, score: lexicalScore(queryTokens, c.text) }))
    .filter((x) => x.score > 0)
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : byId.get(b.id)!.timestamp - byId.get(a.id)!.timestamp,
    )
    .map((x) => x.id);

  // Recency list.
  const recency = [...candidates]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((c) => c.id);

  const fused = reciprocalRankFusion([{ ids: lexical }, { ids: recency }]);

  // Prefer active (current) memory over stale; stale only as historical tail.
  const ordered = fused
    .map((f) => byId.get(f.id)!)
    .sort((a, b) => Number(a.stale) - Number(b.stale));

  return { items: ordered.slice(0, MAX_ITEMS), procedural };
}
