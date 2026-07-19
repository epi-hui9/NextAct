import { describe, expect, it } from "vitest";
import {
  AREA_WEIGHT,
  computeStatus,
  nextInvitationArea,
  STATUS_SCORE,
  storyProgress,
  type StoryAreaState,
} from "@/lib/story/config";
import { STORY_AREAS, type StoryArea } from "@/lib/db/types";

const allEmpty: StoryAreaState[] = STORY_AREAS.map((area) => ({
  area,
  status: "empty",
}));

describe("story progress math", () => {
  it("is 0 when everything is empty", () => {
    expect(storyProgress(allEmpty)).toBe(0);
  });

  it("is 100 when everything is verified", () => {
    const all = STORY_AREAS.map((area) => ({ area, status: "verified" as const }));
    expect(storyProgress(all)).toBe(100);
  });

  it("is a weighted whole-number average", () => {
    const areas = STORY_AREAS.map((area, i) => ({
      area,
      status: (i === 0 ? "verified" : "empty") as StoryAreaState["status"],
    }));
    // Only transition_context (weight 2) verified out of total weight 20.
    const totalWeight = STORY_AREAS.reduce((s, a) => s + AREA_WEIGHT[a], 0);
    const expected = Math.round((AREA_WEIGHT.transition_context / totalWeight) * 100);
    expect(storyProgress(areas)).toBe(expected);
  });

  it("does not increase from unsupported (empty) evidence", () => {
    const before = storyProgress(allEmpty);
    // computeStatus with no sources stays empty -> no progress.
    const status = computeStatus({
      distinctSourceSpans: 0,
      hasDetailedFirstPerson: false,
      hasUnresolvedContradiction: false,
    });
    expect(status).toBe("empty");
    expect(STATUS_SCORE[status]).toBe(0);
    expect(before).toBe(0);
  });
});

describe("computeStatus rules", () => {
  it("emerging with one source, no detail", () => {
    expect(
      computeStatus({
        distinctSourceSpans: 1,
        hasDetailedFirstPerson: false,
        hasUnresolvedContradiction: false,
      }),
    ).toBe("emerging");
  });

  it("supported with two distinct spans", () => {
    expect(
      computeStatus({
        distinctSourceSpans: 2,
        hasDetailedFirstPerson: false,
        hasUnresolvedContradiction: false,
      }),
    ).toBe("supported");
  });

  it("verified with detailed first-person and no contradiction", () => {
    expect(
      computeStatus({
        distinctSourceSpans: 1,
        hasDetailedFirstPerson: true,
        hasUnresolvedContradiction: false,
      }),
    ).toBe("verified");
  });

  it("stays supported (not verified) when a contradiction is unresolved", () => {
    expect(
      computeStatus({
        distinctSourceSpans: 1,
        hasDetailedFirstPerson: true,
        hasUnresolvedContradiction: true,
      }),
    ).toBe("supported");
  });
});

describe("next invitation area", () => {
  it("prefers the highest-weight empty area first", () => {
    const area = nextInvitationArea(allEmpty);
    // Among empty areas, a weight-2 area wins over weight-1.
    expect(AREA_WEIGHT[area as StoryArea]).toBe(2);
  });
});
