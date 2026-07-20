import type { UIMessage } from "ai";
import { countWords } from "./output-policy";

/**
 * Reasoning effort for Claude Sonnet 5's adaptive thinking.
 *
 * Product policy: default to `high`, escalate to `max` only for genuinely
 * difficult requests. We never go below `high`, and there is no user-facing
 * control. The router is a cheap, deterministic heuristic over the current
 * user message (plus light context), so it never costs a second model call.
 */
export type Effort = "high" | "max";

/** Signals of a genuinely hard request: strategy, high-stakes, multi-constraint. */
const DIFFICULT_KEYWORDS = [
  "strategy",
  "strategic",
  "restructure",
  "restructuring",
  "reorg",
  "merger",
  "acquisition",
  "acquire",
  "valuation",
  "fundraise",
  "fundraising",
  "cap table",
  "board",
  "layoff",
  "layoffs",
  "succession",
  "negotiate",
  "negotiation",
  "trade-off",
  "tradeoff",
  "trade off",
  "decide between",
  "decision",
  "dilemma",
  "ethical",
  "ethics",
  "architecture",
  "framework",
  "roadmap",
  "prioritize",
  "constraints",
  "crisis",
  "high-stakes",
  "long-term",
  "competing",
];

/** Extract the plain text of a UI message from its parts. */
export function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/** The most recent user message text, or "" if none. */
export function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return messageText(messages[i]);
  }
  return "";
}

/**
 * Choose the reasoning effort for this turn.
 *
 * Scoring is intentionally simple and readable:
 * - length of the request (more detail usually means more to weigh),
 * - number of distinct difficulty keywords,
 * - multiple questions in one turn.
 *
 * A score of 3+ escalates to `max`; everything else stays at `high`.
 */
export function routeEffort(messages: UIMessage[]): Effort {
  const text = lastUserText(messages);
  if (text === "") return "high";

  const lower = text.toLowerCase();
  const words = countWords(text);

  const keywordHits = new Set(
    DIFFICULT_KEYWORDS.filter((k) => lower.includes(k)),
  ).size;

  const questionCount = (text.match(/\?/g) ?? []).length;

  let score = 0;
  if (words >= 60) score += 2;
  else if (words >= 35) score += 1;

  if (keywordHits >= 2) score += 2;
  else if (keywordHits >= 1) score += 1;

  if (questionCount >= 2) score += 1;

  return score >= 3 ? "max" : "high";
}
