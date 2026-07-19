import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * The single model gateway.
 *
 * Roles map to environment-configured model IDs. If a role is not separately
 * configured it falls back to the one known-good workhorse model, so the app is
 * always runnable with a single valid model. Routing is deterministic — we
 * never make an LLM call to choose a model. No model names are invented here;
 * the default is the model already working in this repo.
 */

export type ModelRole = "small" | "workhorse" | "frontier" | "verifier";

/** The known-good default model for this repo (Anthropic, key auto-read). */
export const DEFAULT_MODEL_ID = "claude-sonnet-5";

function resolveId(role: ModelRole): string {
  const workhorse = process.env.MODEL_WORKHORSE || DEFAULT_MODEL_ID;
  switch (role) {
    case "small":
      return process.env.MODEL_SMALL || workhorse;
    case "workhorse":
      return workhorse;
    case "frontier":
      return process.env.MODEL_FRONTIER || workhorse;
    case "verifier":
      return process.env.MODEL_VERIFIER || workhorse;
  }
}

export interface ResolvedModel {
  id: string;
  model: LanguageModel;
}

/** Resolve the model + id for a role. Pure, deterministic. */
export function modelFor(role: ModelRole): ResolvedModel {
  const id = resolveId(role);
  return { id, model: anthropic(id) };
}

/** Exposed for tests/reporting: the id each role resolves to. */
export function roleModelIds(): Record<ModelRole, string> {
  return {
    small: resolveId("small"),
    workhorse: resolveId("workhorse"),
    frontier: resolveId("frontier"),
    verifier: resolveId("verifier"),
  };
}
