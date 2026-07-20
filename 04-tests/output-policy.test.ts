import { describe, expect, it } from "vitest";
import {
  capWords,
  containsEmDash,
  countWords,
  detectCannedContrast,
  enforceOutputPolicy,
  stripEmDashes,
} from "@/lib/ai/output-policy";

describe("countWords", () => {
  it("counts words separated by any whitespace", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("hello")).toBe(1);
    expect(countWords("hello world")).toBe(2);
    expect(countWords("hello\n world\t again")).toBe(3);
  });

  it("does not count punctuation as extra words", () => {
    expect(countWords("Yes, of course.")).toBe(3);
  });
});

describe("stripEmDashes", () => {
  it("replaces spaced and unspaced em dashes with a comma", () => {
    expect(stripEmDashes("a \u2014 b")).toBe("a, b");
    expect(stripEmDashes("a\u2014b")).toBe("a, b");
  });

  it("replaces ASCII double hyphen used as an em dash", () => {
    expect(stripEmDashes("a -- b")).toBe("a, b");
  });

  it("leaves clean text untouched and produces no em dash", () => {
    const cleaned = stripEmDashes("A calm, clear sentence.");
    expect(cleaned).toBe("A calm, clear sentence.");
    expect(containsEmDash(cleaned)).toBe(false);
  });
});

describe("capWords", () => {
  it("returns text unchanged when below the limit", () => {
    const text = "This is a short reply.";
    expect(capWords(text, 100)).toBe(text);
  });

  it("returns text unchanged when exactly at the limit", () => {
    const text = Array(100).fill("word").join(" ");
    expect(countWords(text)).toBe(100);
    expect(capWords(text, 100)).toBe(text);
  });

  it("ends at the last complete sentence within the limit", () => {
    const first = Array(50).fill("alpha").join(" ") + ".";
    const rest = Array(60).fill("beta").join(" ");
    const text = `${first} ${rest}`;
    expect(countWords(text)).toBe(110);
    const capped = capWords(text, 100);
    expect(capped).toBe(first);
    expect(capped.endsWith(".")).toBe(true);
    expect(countWords(capped)).toBe(50);
  });

  it("returns the first N complete words when no sentence boundary fits", () => {
    const text = Array(150).fill("word").join(" ");
    const capped = capWords(text, 100);
    expect(countWords(capped)).toBe(100);
    // No half words: every token is the full word.
    expect(capped.split(/\s+/).every((w) => w === "word")).toBe(true);
  });
});

describe("enforceOutputPolicy", () => {
  it("strips em dashes and enforces the 100-word cap together", () => {
    const long =
      Array(80).fill("thought").join(" ") +
      " \u2014 " +
      Array(80).fill("more").join(" ");
    const result = enforceOutputPolicy(long);
    expect(containsEmDash(result)).toBe(false);
    expect(countWords(result)).toBeLessThanOrEqual(100);
  });

  it("passes through a compliant short reply", () => {
    const text = "I hear you. Take the next small step.";
    expect(enforceOutputPolicy(text)).toBe(text);
  });
});

describe("detectCannedContrast", () => {
  it("flags repeated short 'Not ...' fragments", () => {
    expect(detectCannedContrast("Not the title. Not the role.")).toBe(true);
  });

  it("flags 'Not X, but Y' constructions", () => {
    expect(detectCannedContrast("Not the title, but the person.")).toBe(true);
  });

  it("does not flag legitimate mid-sentence 'not'", () => {
    expect(
      detectCannedContrast("I do not think so, but I will consider it."),
    ).toBe(false);
    expect(detectCannedContrast("You have carried this team for years.")).toBe(
      false,
    );
  });
});
