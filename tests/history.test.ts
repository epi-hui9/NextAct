import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import type { Thread } from "@/lib/history/types";
import {
  makeTitle,
  parseThreads,
  serializeThreads,
  sortThreads,
  titleFromMessages,
  validateThread,
} from "@/lib/history/storage";

function userMessage(text: string): UIMessage {
  return {
    id: "u1",
    role: "user",
    parts: [{ type: "text", text }],
  } as unknown as UIMessage;
}

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: "t1",
    title: "A thread",
    createdAt: 1,
    updatedAt: 1,
    messages: [],
    ...overrides,
  };
}

describe("makeTitle", () => {
  it("uses a default for empty input", () => {
    expect(makeTitle("")).toBe("New conversation");
    expect(makeTitle("   ")).toBe("New conversation");
  });

  it("collapses whitespace and keeps short text", () => {
    expect(makeTitle("  Hello   there  ")).toBe("Hello there");
  });

  it("truncates long text with an ellipsis", () => {
    const long = "a".repeat(80);
    const title = makeTitle(long);
    expect(title.length).toBeLessThanOrEqual(49);
    expect(title.endsWith("\u2026")).toBe(true);
  });
});

describe("titleFromMessages", () => {
  it("derives from the first user message", () => {
    expect(titleFromMessages([userMessage("What should I do next?")])).toBe(
      "What should I do next?",
    );
  });

  it("falls back to default with no user message", () => {
    expect(titleFromMessages([])).toBe("New conversation");
  });
});

describe("validateThread", () => {
  it("accepts a well-formed thread", () => {
    const t = makeThread({ messages: [userMessage("hi")] });
    const valid = validateThread(t);
    expect(valid).not.toBeNull();
    expect(valid?.messages.length).toBe(1);
  });

  it("rejects malformed values", () => {
    expect(validateThread(null)).toBeNull();
    expect(validateThread({})).toBeNull();
    expect(validateThread({ id: "x" })).toBeNull();
    expect(
      validateThread({ id: "x", title: "t", createdAt: 1, updatedAt: 1 }),
    ).toBeNull();
  });

  it("drops malformed messages but keeps the thread", () => {
    const t = {
      id: "t1",
      title: "t",
      createdAt: 1,
      updatedAt: 1,
      messages: [userMessage("ok"), { nope: true }, { role: "user" }],
    };
    const valid = validateThread(t);
    expect(valid?.messages.length).toBe(1);
  });
});

describe("parseThreads", () => {
  it("returns [] for null, invalid JSON, or wrong version", () => {
    expect(parseThreads(null)).toEqual([]);
    expect(parseThreads("not json{")).toEqual([]);
    expect(parseThreads(JSON.stringify({ version: 2, threads: [] }))).toEqual(
      [],
    );
    expect(parseThreads(JSON.stringify({ threads: "nope" }))).toEqual([]);
  });

  it("round-trips valid threads and filters malformed ones", () => {
    const threads = [makeThread({ id: "a" }), makeThread({ id: "b" })];
    const raw = serializeThreads(threads);
    const parsed = parseThreads(raw);
    expect(parsed.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });

  it("does not crash on outdated data and fails to empty", () => {
    const raw = JSON.stringify({ version: 1, threads: [{ bad: "data" }, 42] });
    expect(parseThreads(raw)).toEqual([]);
  });
});

describe("sortThreads", () => {
  it("orders by updatedAt descending", () => {
    const threads = [
      makeThread({ id: "old", updatedAt: 10 }),
      makeThread({ id: "new", updatedAt: 30 }),
      makeThread({ id: "mid", updatedAt: 20 }),
    ];
    expect(sortThreads(threads).map((t) => t.id)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });
});
