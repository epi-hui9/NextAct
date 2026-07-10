import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * Single source of truth for the LLM provider.
 *
 * To swap models, change ONLY this file. Nothing else in the app references a
 * model name. Requires `ANTHROPIC_API_KEY` in the environment; the Anthropic
 * provider reads it automatically.
 */
export const MODEL_ID = "claude-sonnet-4-5" as const;

export const model: LanguageModel = anthropic(MODEL_ID);
