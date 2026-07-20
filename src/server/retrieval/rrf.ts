/**
 * Reciprocal Rank Fusion.
 *
 * Combines several ranked lists of item ids into one deterministic ranking.
 * score(id) = sum over lists of 1 / (k + rank), rank is 0-based. Ties break by
 * id string so results are stable and testable.
 */
export interface RankedList {
  /** Item ids in ranked order (best first). */
  ids: string[];
}

export function reciprocalRankFusion(
  lists: RankedList[],
  k = 60,
): { id: string; score: number }[] {
  const scores = new Map<string, number>();
  for (const list of lists) {
    list.ids.forEach((id, rank) => {
      const inc = 1 / (k + rank);
      scores.set(id, (scores.get(id) ?? 0) + inc);
    });
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}
