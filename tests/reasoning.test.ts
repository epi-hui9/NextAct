import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { routeEffort, lastUserText } from "@/lib/ai/reasoning";

function userMessage(text: string): UIMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role: "user",
    parts: [{ type: "text", text }],
  } as unknown as UIMessage;
}

function assistantMessage(text: string): UIMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role: "assistant",
    parts: [{ type: "text", text }],
  } as unknown as UIMessage;
}

describe("lastUserText", () => {
  it("returns the most recent user message text", () => {
    const messages = [
      userMessage("first"),
      assistantMessage("reply"),
      userMessage("second"),
    ];
    expect(lastUserText(messages)).toBe("second");
  });

  it("returns empty string when there is no user message", () => {
    expect(lastUserText([])).toBe("");
    expect(lastUserText([assistantMessage("hi")])).toBe("");
  });
});

describe("routeEffort", () => {
  it("defaults to high for empty or simple input", () => {
    expect(routeEffort([])).toBe("high");
    expect(routeEffort([userMessage("I feel a bit lost lately.")])).toBe(
      "high",
    );
    expect(routeEffort([userMessage("Thanks, that helps.")])).toBe("high");
  });

  it("escalates to max for genuinely complex, multi-constraint requests", () => {
    const hard = userMessage(
      "I am trying to decide between accepting the CEO role at a struggling company that needs a full restructuring, and staying on the board of my current firm during a possible merger. My family wants stability, the numbers are ambiguous, and I need to weigh long-term significance against short-term risk. What should I prioritize?",
    );
    expect(routeEffort([hard])).toBe("max");
  });

  it("never returns a value below high", () => {
    const samples = [
      "",
      "hi",
      "I need a strategic restructuring plan for the board.",
      "help",
    ];
    for (const s of samples) {
      const effort = routeEffort(s ? [userMessage(s)] : []);
      expect(["high", "max"]).toContain(effort);
    }
  });
});
