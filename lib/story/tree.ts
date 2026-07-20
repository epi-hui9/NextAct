/**
 * Deterministic Living Legacy tree stages from Story progress (0–100).
 * Progress is already a pure function of verified chapter evidence.
 */

export type TreeStage = 0 | 1 | 2 | 3 | 4;

export const TREE_STAGE_LABELS: Record<TreeStage, string> = {
  0: "Seed",
  1: "Sprout",
  2: "Young tree",
  3: "Branching tree",
  4: "Living canopy",
};

/** Map whole-number story progress percent to a tree stage. */
export function treeStageFromProgress(progress: number): TreeStage {
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  if (p < 20) return 0;
  if (p < 40) return 1;
  if (p < 60) return 2;
  if (p < 80) return 3;
  return 4;
}

export function treeSummaryFromProgress(progress: number): string {
  const stage = treeStageFromProgress(progress);
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return `${TREE_STAGE_LABELS[stage]} · ${pct}%`;
}
