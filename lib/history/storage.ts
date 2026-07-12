import type { UIMessage } from "ai";
import type { StoredThreads, Thread, ThreadSummary } from "./types";

/**
 * Local, single-user thread persistence.
 *
 * Design goals:
 * - Versioned schema so future changes can migrate or discard cleanly.
 * - Pure helpers (title, validation, sort) that are unit-testable without a DOM.
 * - Read/write wrappers that never throw: malformed or outdated data fails safe
 *   to an empty history rather than crashing the app.
 * - Never persists system prompts, reasoning, or API keys. Only the visible
 *   message text the client already holds.
 */

export const SCHEMA_VERSION = 1 as const;
export const THREADS_KEY = "btt.threads.v1";
export const ACTIVE_KEY = "btt.activeThread.v1";

const TITLE_MAX = 48;
const DEFAULT_TITLE = "New conversation";

/** Generate a stable UUID, with a fallback for environments without crypto. */
export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Fallback: RFC-4122-ish random id. Sufficient as a local thread key.
  return "t-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Plain text of a UI message (visible text parts only). */
function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/**
 * Derive a short, deterministic title from the first user message.
 * No model call: first line, whitespace-collapsed, length-capped.
 */
export function makeTitle(firstUserText: string): string {
  const line = firstUserText.replace(/\s+/g, " ").trim();
  if (line === "") return DEFAULT_TITLE;
  if (line.length <= TITLE_MAX) return line;
  return line.slice(0, TITLE_MAX).trimEnd() + "\u2026";
}

/** Title for a thread given its messages (first user message wins). */
export function titleFromMessages(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  return firstUser ? makeTitle(messageText(firstUser)) : DEFAULT_TITLE;
}

/** Most-recently-updated first. */
export function sortThreads<T extends { updatedAt: number }>(
  threads: T[],
): T[] {
  return [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Compact summaries for the history list. */
export function toSummaries(threads: Thread[]): ThreadSummary[] {
  return sortThreads(threads).map(({ id, title, updatedAt }) => ({
    id,
    title,
    updatedAt,
  }));
}

/** Validate an unknown value into a Thread, or null if malformed. */
export function validateThread(value: unknown): Thread | null {
  if (typeof value !== "object" || value === null) return null;
  const t = value as Record<string, unknown>;
  if (typeof t.id !== "string" || t.id === "") return null;
  if (typeof t.title !== "string") return null;
  if (typeof t.createdAt !== "number" || typeof t.updatedAt !== "number") {
    return null;
  }
  if (!Array.isArray(t.messages)) return null;

  // Keep only well-formed messages; tolerate unknown extra fields.
  const messages: UIMessage[] = [];
  for (const raw of t.messages) {
    if (typeof raw !== "object" || raw === null) continue;
    const m = raw as Record<string, unknown>;
    if (typeof m.id !== "string") continue;
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") {
      continue;
    }
    if (!Array.isArray(m.parts)) continue;
    messages.push(m as unknown as UIMessage);
  }

  return {
    id: t.id,
    title: t.title,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    messages,
  };
}

/** Parse the stored envelope into a clean Thread[]; never throws. */
export function parseThreads(raw: string | null): Thread[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as Partial<StoredThreads>;
    if (!data || data.version !== SCHEMA_VERSION) return [];
    if (!Array.isArray(data.threads)) return [];
    const clean: Thread[] = [];
    for (const t of data.threads) {
      const valid = validateThread(t);
      if (valid) clean.push(valid);
    }
    return clean;
  } catch {
    return [];
  }
}

/** Serialize threads into the versioned envelope. */
export function serializeThreads(threads: Thread[]): string {
  const payload: StoredThreads = { version: SCHEMA_VERSION, threads };
  return JSON.stringify(payload);
}

// ---- Browser I/O (guarded, never throws) ----------------------------------

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadThreads(): Thread[] {
  if (!hasStorage()) return [];
  try {
    return parseThreads(window.localStorage.getItem(THREADS_KEY));
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(THREADS_KEY, serializeThreads(threads));
  } catch {
    // Quota or serialization failure: fail silently, keep app usable.
  }
}

export function loadActiveId(): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignore
  }
}
