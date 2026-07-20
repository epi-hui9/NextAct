import { describe, expect, it } from "vitest";
import {
  conversationTitle,
  displayConversationTitle,
} from "@/lib/conversation/title";

describe("conversationTitle", () => {
  it("keeps at most five words", () => {
    const t = conversationTitle(
      "I want to talk about the board meeting and my next chapter at length today",
    );
    expect(t.split(/\s+/).length).toBeLessThanOrEqual(5);
  });

  it("prefers content words", () => {
    expect(conversationTitle("I am thinking about succession")).toMatch(
      /succession/i,
    );
  });

  it("falls back for empty input", () => {
    expect(conversationTitle("   ")).toBe("New talk");
  });

  it("clamps long stored titles for display", () => {
    const long =
      "When you have a moment, tell me what is on your mind about this chapter";
    expect(displayConversationTitle(long).split(/\s+/).length).toBeLessThanOrEqual(
      5,
    );
  });
});
