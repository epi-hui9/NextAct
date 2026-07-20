import { describe, expect, it } from "vitest";
import {
  LEGACY_PUZZLE_PIECES,
  PUZZLE_VIEWBOX,
} from "@/lib/legacy/puzzle-paths";

describe("legacy puzzle", () => {
  it("defines eight interlocking pieces on one board", () => {
    expect(LEGACY_PUZZLE_PIECES).toHaveLength(8);
    expect(PUZZLE_VIEWBOX).toBe("0 0 400 200");
    for (const p of LEGACY_PUZZLE_PIECES) {
      expect(p.d.startsWith("M ")).toBe(true);
      expect(p.d.endsWith("Z")).toBe(true);
    }
  });
});
