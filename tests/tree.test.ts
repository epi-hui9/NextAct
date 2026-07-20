import { describe, expect, it } from "vitest";
import { treeStageFromProgress } from "@/lib/story/tree";

describe("treeStageFromProgress", () => {
  it("maps deterministic bands", () => {
    expect(treeStageFromProgress(0)).toBe(0);
    expect(treeStageFromProgress(1)).toBe(1);
    expect(treeStageFromProgress(19)).toBe(1);
    expect(treeStageFromProgress(20)).toBe(2);
    expect(treeStageFromProgress(39)).toBe(2);
    expect(treeStageFromProgress(40)).toBe(3);
    expect(treeStageFromProgress(60)).toBe(4);
    expect(treeStageFromProgress(80)).toBe(5);
    expect(treeStageFromProgress(100)).toBe(5);
  });

  it("clamps out-of-range values", () => {
    expect(treeStageFromProgress(-10)).toBe(0);
    expect(treeStageFromProgress(140)).toBe(5);
  });
});
