/**
 * Server-side output policy for assistant replies.
 *
 * These are deterministic, pure string utilities (no I/O, no model calls) so
 * they can be unit-tested in isolation and used as a hard safeguard after the
 * model responds. The persona/system prompt is the primary enforcement; this is
 * the belt-and-suspenders layer.
 */

/** Hard product cap on visible assistant output. */
export const MAX_WORDS = 100;

/**
 * Count words deterministically: runs of non-whitespace separated by
 * whitespace. Punctuation attached to a word does not create extra words.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Replace em dashes (and the horizontal bar and ASCII double-hyphen, which read
 * as em dashes) with sentence-appropriate punctuation.
 *
 * A spaced dash acts as a clause separator, so a comma is the safest general
 * replacement. We then normalize any doubled or space-prefixed punctuation the
 * substitution may have produced. This never deletes words, so it cannot
 * corrupt valid prose the way a blind global replace could.
 */
export function stripEmDashes(text: string): string {
  let out = text
    // em dash (U+2014) and horizontal bar (U+2015), with optional surrounding space
    .replace(/\s*[\u2014\u2015]\s*/g, ", ")
    // ASCII double/triple hyphen used as an em dash
    .replace(/\s*--+\s*/g, ", ");

  // Normalize artifacts: " ," -> ",", collapse repeated commas, tidy spaces.
  out = out
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/,(?=\S)/g, ", ")
    .replace(/[ \t]{2,}/g, " ");

  return out;
}

/**
 * Cap text at {@link MAX_WORDS} words without cutting a word in half.
 *
 * Preference order:
 * 1. If already within the limit, return unchanged (trimmed).
 * 2. Otherwise end at the last complete sentence that fits within the limit.
 * 3. If no sentence boundary fits, return the first `max` complete words.
 *
 * Original spacing and line breaks within the kept portion are preserved.
 */
export function capWords(text: string, max: number = MAX_WORDS): string {
  const trimmed = text.trim();
  if (trimmed === "") return "";
  if (countWords(trimmed) <= max) return trimmed;

  // Find the character offset at the end of the `max`-th word.
  const wordRe = /\S+/g;
  let count = 0;
  let endOfMaxWord = trimmed.length;
  let match: RegExpExecArray | null;
  while ((match = wordRe.exec(trimmed)) !== null) {
    count += 1;
    if (count === max) {
      endOfMaxWord = match.index + match[0].length;
      break;
    }
  }

  const head = trimmed.slice(0, endOfMaxWord);

  // Prefer the last complete sentence within the head.
  const sentenceEnd = /[.!?]["'\u201d\u2019)]*(?=\s|$)/g;
  let lastEnd = -1;
  let s: RegExpExecArray | null;
  while ((s = sentenceEnd.exec(head)) !== null) {
    lastEnd = s.index + s[0].length;
  }
  if (lastEnd > 0) return head.slice(0, lastEnd).trim();

  return head.trim();
}

/**
 * Full output policy: strip em dashes, then enforce the word cap.
 * This is what the chat route applies to the model's text before delivery.
 */
export function enforceOutputPolicy(
  text: string,
  max: number = MAX_WORDS,
): string {
  return capWords(stripEmDashes(text), max).trim();
}

/**
 * Detect the canned "artificial contrast" style the persona bans, e.g.
 * "Not the title. Not the role." or repeated "Not X, but Y" constructions.
 *
 * This is used for tests and could gate telemetry, but it intentionally does
 * NOT mutate output: rewriting such prose safely is not possible without
 * risking corruption, so it is enforced through the system prompt and flagged
 * here for verification.
 */
export function detectCannedContrast(text: string): boolean {
  // Split into sentences so we only inspect sentence-initial "Not ...", which
  // keeps legitimate mid-sentence "not" from tripping the detector.
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Two or more short "Not ..." sentences, e.g. "Not the title. Not the role."
  const shortNot = sentences.filter(
    (s) => /^not\b/i.test(s) && s.split(/\s+/).length <= 5,
  );
  if (shortNot.length >= 2) return true;

  // Sentence-initial "Not X, but Y" contrast fragment.
  if (sentences.some((s) => /^not\s+[^.,;]{1,30},\s+but\s+/i.test(s))) {
    return true;
  }

  return false;
}

/** True if the text contains a forbidden em dash (for tests/telemetry). */
export function containsEmDash(text: string): boolean {
  return /[\u2014\u2015]/.test(text) || /--+/.test(text);
}
