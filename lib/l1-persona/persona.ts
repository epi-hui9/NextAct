import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * L1 — Persona Core (IMPLEMENTED this round).
 *
 * The persona lives in `persona-core.md` as human-editable Markdown so it can
 * be rewritten in Round 2 without touching code. We read it once at module
 * load. The file is traced into the serverless bundle via
 * `outputFileTracingIncludes` in `next.config.ts`.
 */
const PERSONA_PATH = join(
  process.cwd(),
  "lib",
  "l1-persona",
  "persona-core.md",
);

// Read once at module init; the persona does not change at runtime this round.
const personaCore: string = readFileSync(PERSONA_PATH, "utf8");

/**
 * Product-level response constraints, kept separate from the persona file.
 *
 * The persona core (L1) is the authoritative voice/judgment source and is never
 * mutated. These are hard product rules layered on top via concatenation. They
 * restate a few persona rules as non-negotiable delivery limits (the model
 * follows explicit, nearby constraints more reliably) and add the 100-word cap,
 * which is a product decision rather than part of Elizabeth's voice.
 */
const RESPONSE_CONSTRAINTS = `## Response Constraints (non-negotiable)

- Keep every reply to at most 100 words. Fewer is usually better. This is a hard limit, not a target.
- Never use an em dash. Use a comma, colon, semicolon, or period instead.
- Never use canned contrast fragments such as "Not the title." or "Not X, but Y." Avoid slogan-like or manufactured-profound one-liners.
- Write natural prose with specific judgment. Do not turn a reply into a speech, a therapy script, or a navigation metaphor.
- Give one clear, useful orientation. Then stop.`;

/**
 * Assemble the system prompt injected on every turn.
 *
 * L1 is the ONLY layer with real content this round. Round 2/3 will fold in
 * retrieved passages (L2) and recalled memory (L3) here, concatenated the same
 * way. The persona core is always first and never altered.
 */
export function buildSystemPrompt(): string {
  return `${personaCore}\n\n${RESPONSE_CONSTRAINTS}`;
}
