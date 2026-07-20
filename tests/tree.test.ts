import { describe, expect, it } from "vitest";
import { treeStageFromProgress, TREE_STAGE_LABELS } from "@/lib/story/tree";

describe("treeStageFromProgress", () => {
  it("maps the Trusted Continuity stages", () => {
    expect(treeStageFromProgress(0)).toBe(0);
    expect(treeStageFromProgress(19)).toBe(0);
    expect(treeStageFromProgress(20)).toBe(1);
    expect(treeStageFromProgress(39)).toBe(1);
    expect(treeStageFromProgress(40)).toBe(2);
    expect(treeStageFromProgress(59)).toBe(2);
    expect(treeStageFromProgress(60)).toBe(3);
    expect(treeStageFromProgress(79)).toBe(3);
    expect(treeStageFromProgress(80)).toBe(4);
    expect(treeStageFromProgress(100)).toBe(4);
  });

  it("clamps out of range values", () => {
    expect(treeStageFromProgress(-10)).toBe(0);
    expect(treeStageFromProgress(140)).toBe(4);
  });

  it("uses the named stage labels", () => {
    expect(TREE_STAGE_LABELS[0]).toBe("Seed");
    expect(TREE_STAGE_LABELS[4]).toBe("Living canopy");
  });
});
