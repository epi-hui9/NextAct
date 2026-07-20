import { describe, expect, it } from "vitest";
import { treeStageFromProgress, TREE_STAGE_LABELS } from "@/features/journey/story/tree";
import { JOURNEY_STAGES, ACTIVE_JOURNEY_STAGE_ID } from "@/features/journey/stages";

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

  it("uses named stage labels without percentages", () => {
    expect(TREE_STAGE_LABELS[0]).toBe("Seed");
    expect(TREE_STAGE_LABELS[4]).toBe("Living canopy");
    for (const label of Object.values(TREE_STAGE_LABELS)) {
      expect(label).not.toMatch(/%/);
    }
  });
});

describe("nine month path", () => {
  it("has eight journey stages", () => {
    expect(JOURNEY_STAGES).toHaveLength(8);
    expect(JOURNEY_STAGES[0].title).toBe("Tell Your Story");
    expect(JOURNEY_STAGES[7].title).toBe("Land It and Keep It");
    expect(ACTIVE_JOURNEY_STAGE_ID).toBe("tell_your_story");
  });
});
