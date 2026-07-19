import "server-only";
import { generateObject } from "ai";
import { modelFor } from "@/lib/ai/gateway";
import { ExtractionSchema, type Extraction } from "@/lib/db/types";

/**
 * Structured extraction from one completed exchange, using the small model.
 * Zod validates the model output at the boundary. Returns null on any failure
 * so the conversation is never blocked by extraction.
 */

const EXTRACTION_SYSTEM = `You extract durable memory from one exchange between a client (an accomplished executive in a life/career transition) and their companion. Be conservative and literal. Only record what the CLIENT actually expressed in first person. Never invent facts.

Return:
- episodic: a one-sentence factual summary of what happened, plus the client's emotional_state in 1-3 words (e.g. "uncertain", "proud", "grieving", "hopeful"). null if the client shared nothing personal.
- semantic_candidates: stable conclusions about the client (values, goals, relationships, stable facts). Empty if none.
- story_areas: which evidence areas this exchange touched, and whether it was a passing "mention" or a "detailed_first_person" account.
- legacy_candidate: at most one durable insight worth preserving in the client's legacy, phrased in plain language grounded ONLY in what they said. null if nothing durable.
- correction: only if the client EXPLICITLY corrected the companion (e.g. "that's too long", "that doesn't sound like me"). Otherwise null.
- style: observable signals of how the CLIENT writes/speaks. null if not enough signal.`;

export async function runExtraction(
  userText: string,
  assistantText: string,
): Promise<Extraction | null> {
  const { model } = modelFor("small");
  try {
    const { object } = await generateObject({
      model,
      schema: ExtractionSchema,
      system: EXTRACTION_SYSTEM,
      prompt: `CLIENT said:\n${userText}\n\nCOMPANION replied:\n${assistantText}`,
      abortSignal: AbortSignal.timeout(30_000),
    });
    return object;
  } catch {
    return null;
  }
}
