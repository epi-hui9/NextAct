import { describe, expect, it } from "vitest";
import {
  checkOrdinaryResponse,
  clientRequestedList,
  countQuestions,
  hasUnsupportedCompletionClaim,
} from "@/server/retrieval/guards";

describe("ordinary response contract", () => {
  it("permits at most one question by default", () => {
    const one = checkOrdinaryResponse({
      assistantText: "That sounds heavy. What made it feel that way?",
      userText: "I had a hard week.",
    });
    expect(one.ok).toBe(true);

    const two = checkOrdinaryResponse({
      assistantText: "Why now? And what changed?",
      userText: "I had a hard week.",
    });
    expect(two.ok).toBe(false);
    expect(two.violations).toContain("too_many_questions");
  });

  it("allows multiple questions only when the client asked for a list", () => {
    expect(clientRequestedList("give me a few options")).toBe(true);
    const res = checkOrdinaryResponse({
      assistantText: "Option one? Option two? Option three?",
      userText: "Can you list a few options?",
    });
    expect(res.ok).toBe(true);
  });

  it("flags unsupported completion claims", () => {
    expect(hasUnsupportedCompletionClaim("I've saved that to your legacy.")).toBe(
      true,
    );
    expect(hasUnsupportedCompletionClaim("I updated your profile.")).toBe(true);
    expect(hasUnsupportedCompletionClaim("Tell me more about that.")).toBe(false);
  });

  it("flags empty output", () => {
    const res = checkOrdinaryResponse({ assistantText: "  ", userText: "hi" });
    expect(res.ok).toBe(false);
    expect(res.violations).toContain("empty_output");
  });

  it("counts questions", () => {
    expect(countQuestions("a? b? c")).toBe(2);
  });
});
