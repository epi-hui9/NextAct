import { describe, expect, it } from "vitest";
import { validateArtifact } from "@/lib/memory/validate";

describe("automatic validation", () => {
  it("keeps sentences with sources and removes those without", () => {
    const result = validateArtifact([
      { text: "She led the turnaround in 2019.", sourceIds: ["m1"] },
      { text: "She secretly wanted to quit.", sourceIds: [] },
    ]);
    expect(result.supportedStatements).toEqual(["She led the turnaround in 2019."]);
    expect(result.removedStatements).toEqual(["She secretly wanted to quit."]);
    expect(result.followUpQuestion).toBeNull();
  });

  it("converts a client-only gap into one natural follow-up question", () => {
    const result = validateArtifact(
      [{ text: "unsupported guess", sourceIds: [] }],
      { followUpQuestion: "What made that decision feel right to you?" },
    );
    expect(result.supportedStatements).toEqual([]);
    expect(result.followUpQuestion).toBe(
      "What made that decision feel right to you?",
    );
  });

  it("never emits internal failure language", () => {
    const result = validateArtifact([{ text: "x", sourceIds: [] }]);
    const blob = JSON.stringify(result).toLowerCase();
    for (const banned of [
      "validation failed",
      "verifier",
      "confidence too low",
      "human review",
    ]) {
      expect(blob).not.toContain(banned);
    }
  });
});
