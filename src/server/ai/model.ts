import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * Single source of truth for the LLM provider.
 *
 * To swap models, change ONLY this file. Nothing else in the app references a
 * model name. Requires `ANTHROPIC_API_KEY` in the environment; the Anthropic
 * provider reads it automatically.
 *
 * Reasoning configuration (adaptive thinking + effort) is applied per request
 * in the chat route, because the effort level is chosen dynamically by the
 * complexity router. See `lib/ai/reasoning.ts`.
 */
export const MODEL_ID = "claude-sonnet-5" as const;

export const model: LanguageModel = anthropic(MODEL_ID);
