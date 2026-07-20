/**
 * Deterministic Living Legacy tree stages from Story progress (0–100).
 * Progress is already a pure function of verified chapter evidence.
 */

export type TreeStage = 0 | 1 | 2 | 3 | 4 | 5;

export const TREE_STAGE_LABELS: Record<TreeStage, string> = {
  0: "Quiet soil, ready for the first root",
  1: "A first sprout",
  2: "A young trunk taking hold",
  3: "The first branches",
  4: "A growing canopy",
  5: "A mature living tree",
};

/** Map whole-number story progress percent to a tree stage. */
export function treeStageFromProgress(progress: number): TreeStage {
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  if (p <= 0) return 0;
  if (p < 20) return 1;
  if (p < 40) return 2;
  if (p < 60) return 3;
  if (p < 80) return 4;
  return 5;
}
