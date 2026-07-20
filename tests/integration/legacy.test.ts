import { describe, expect, it } from "vitest";
import { countsFromStatuses, sectionFill } from "@/features/legacy/config";

describe("legacy map fill math", () => {
  it("is 0 with no entries", () => {
    expect(sectionFill({ verified: 0, supported: 0 })).toBe(0);
  });

  it("follows the verified ladder: 35 / 65 / 100", () => {
    expect(sectionFill({ verified: 1, supported: 0 })).toBe(35);
    expect(sectionFill({ verified: 2, supported: 0 })).toBe(65);
    expect(sectionFill({ verified: 3, supported: 0 })).toBe(100);
    expect(sectionFill({ verified: 5, supported: 0 })).toBe(100);
  });

  it("supported entries add a little but cannot complete a section", () => {
    const fill = sectionFill({ verified: 0, supported: 3 });
    expect(fill).toBeGreaterThan(0);
    expect(fill).toBeLessThan(100);
    // Even with many supported entries and no verified, never 100.
    expect(sectionFill({ verified: 0, supported: 50 })).toBeLessThan(100);
    expect(sectionFill({ verified: 2, supported: 50 })).toBeLessThan(100);
  });

  it("counts statuses into buckets", () => {
    const counts = countsFromStatuses([
      "verified",
      "verified",
      "supported",
      "emerging",
    ]);
    expect(counts).toEqual({ verified: 2, supported: 1 });
  });
});
