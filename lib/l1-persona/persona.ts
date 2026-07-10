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
 * Assemble the system prompt injected on every turn.
 *
 * L1 is the ONLY layer with real content this round. Round 2/3 will fold in
 * retrieved passages (L2) and recalled memory (L3) here.
 */
export function buildSystemPrompt(): string {
  return personaCore;
}
