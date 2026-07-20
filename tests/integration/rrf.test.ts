import { describe, expect, it } from "vitest";
import { reciprocalRankFusion } from "@/server/retrieval/rrf";

describe("reciprocal rank fusion", () => {
  it("ranks an item appearing near the top of both lists highest", () => {
    const fused = reciprocalRankFusion([
      { ids: ["a", "b", "c"] },
      { ids: ["b", "a", "d"] },
    ]);
    // a and b are strong in both; b is rank0+rank1, a is rank0+rank1 too.
    expect(new Set([fused[0].id, fused[1].id])).toEqual(new Set(["a", "b"]));
  });

  it("is deterministic and breaks ties by id", () => {
    const a = reciprocalRankFusion([{ ids: ["x", "y"] }, { ids: ["y", "x"] }]);
    const b = reciprocalRankFusion([{ ids: ["x", "y"] }, { ids: ["y", "x"] }]);
    expect(a).toEqual(b);
    // x and y have equal score; tie broken by id ascending.
    expect(a[0].id).toBe("x");
  });

  it("combines lexical and semantic contributions additively", () => {
    const fused = reciprocalRankFusion([
      { ids: ["only-lexical"] },
      { ids: ["only-semantic"] },
    ]);
    expect(fused.map((f) => f.id).sort()).toEqual([
      "only-lexical",
      "only-semantic",
    ]);
    expect(fused[0].score).toBeCloseTo(fused[1].score);
  });
});
