/**
 * Short conversation titles for Past list: at most 5 English words.
 * Keeps Past scannable for non-technical executives.
 */

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "for",
  "in",
  "on",
  "at",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "it",
  "this",
  "that",
  "with",
  "from",
  "about",
]);

/** Normalize whitespace and strip punctuation edges. */
function tokenize(text: string): string[] {
  return text
    .replace(/[\u2013\u2014]/g, " ")
    .replace(/[^\p{L}\p{N}'’\s-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/**
 * Build a Past title from free text. Prefer content words; never exceed 5 words.
 */
export function conversationTitle(raw: string, fallback = "New talk"): string {
  const words = tokenize(raw);
  if (words.length === 0) return fallback;

  const content = words.filter((w) => !STOP.has(w.toLowerCase()));
  const pick = (content.length >= 2 ? content : words).slice(0, 5);
  const title = pick
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
      return lower;
    })
    .join(" ");
  return title.slice(0, 48) || fallback;
}

/** Clamp an already-stored title for display (legacy long rows). */
export function displayConversationTitle(raw: string): string {
  return conversationTitle(raw, "Conversation");
}
