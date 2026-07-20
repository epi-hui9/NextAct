/**
 * Deterministic guards for ordinary conversation.
 *
 * These run instead of a second model call on every message. They enforce the
 * response contract and catch unsafe claims. Pure functions so they are unit
 * testable and cheap.
 */

/** Count question marks (a proxy for number of questions asked). */
export function countQuestions(text: string): number {
  return (text.match(/\?/g) ?? []).length;
}

/** Did the client explicitly ask for a list / multiple items? */
export function clientRequestedList(userText: string): boolean {
  return /\b(list|options|steps|ways|examples|bullet|several|a few|multiple|ideas)\b/i.test(
    userText,
  );
}

/**
 * Detect an unsupported "I completed/sent/saved/updated" style claim. Ordinary
 * conversation performs no such side effects, so any such phrasing is unsafe.
 */
export function hasUnsupportedCompletionClaim(text: string): boolean {
  return /\bI(?:'ve| have)?\s+(?:just\s+)?(?:sent|saved|updated|added|created|scheduled|emailed|uploaded|deleted|completed|filed|recorded it|logged it)\b/i.test(
    text,
  );
}

export interface ResponseCheck {
  ok: boolean;
  violations: string[];
}

/**
 * Check an ordinary assistant reply against the contract:
 *  - non-empty output
 *  - at most one question unless the client asked for a list
 *  - no unsupported completion claim
 */
export function checkOrdinaryResponse(input: {
  assistantText: string;
  userText: string;
}): ResponseCheck {
  const violations: string[] = [];
  const text = input.assistantText.trim();

  if (text === "") violations.push("empty_output");

  const questions = countQuestions(text);
  if (questions > 1 && !clientRequestedList(input.userText)) {
    violations.push("too_many_questions");
  }

  if (hasUnsupportedCompletionClaim(text)) {
    violations.push("unsupported_completion_claim");
  }

  return { ok: violations.length === 0, violations };
}
