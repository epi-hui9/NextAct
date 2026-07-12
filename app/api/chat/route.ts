import { cookies } from "next/headers";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type UIMessage,
} from "ai";
import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { model } from "@/lib/ai/model";
import { buildSystemPrompt } from "@/lib/l1-persona/persona";
import { routeEffort } from "@/lib/ai/reasoning";
import { enforceOutputPolicy } from "@/lib/ai/output-policy";
import { knowledgeGraph } from "@/lib/l2-knowledge";
import { memoryLoop } from "@/lib/l3-memory";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

// Persona reads from the filesystem, so run on the Node.js runtime.
export const runtime = "nodejs";
// Streaming responses must never be cached.
export const dynamic = "force-dynamic";

// Generous output budget so adaptive thinking has room and the (short) visible
// answer is never truncated by the model. The visible reply is separately
// capped to 100 words after generation.
const MAX_OUTPUT_TOKENS = 16000;

// Gentle per-word reveal (ms) when re-streaming the cleaned reply.
const REVEAL_DELAY_MS = 14;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  // Gate the route behind the auth cookie.
  const cookieStore = await cookies();
  const authed = await verifySessionToken(cookieStore.get(AUTH_COOKIE)?.value);
  if (!authed) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // ---- The seam that matters: L1 -> L2 -> L3 --------------------------------
  const system = buildSystemPrompt(); // L1: active (persona injected every turn)
  const _passages = await knowledgeGraph.retrieve(""); // L2: no-op, wired for future
  const _memory = await memoryLoop.recall(messages); // L3: no-op, wired for future
  // L2/L3 intentionally return empty this round; the seams exist so Rounds 2/3
  // are a drop-in. Reference them so the wiring is real and lint-clean.
  void _passages;
  void _memory;
  // ---------------------------------------------------------------------------

  // Deterministic complexity router: default high, escalate to max.
  const effort = routeEffort(messages);

  // Generate the full reply first. Buffering lets us enforce the exact 100-word
  // cap and strip em dashes deterministically. Correctness of the hard limit
  // takes priority over token-by-token streaming from the model; we re-stream
  // the cleaned text below to preserve the streaming experience.
  const { text } = await generateText({
    model,
    system,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: req.signal,
    providerOptions: {
      anthropic: {
        // Sonnet 5: adaptive thinking is the supported mode (manual budget
        // tokens return a 400 error on this model). Effort guides how much it
        // thinks.
        thinking: { type: "adaptive" },
        effort,
        // Never surface reasoning to the client.
        sendReasoning: false,
      } satisfies AnthropicProviderOptions,
    },
  });

  const clean = enforceOutputPolicy(text);

  // Re-stream the cleaned text as a UI message stream so the client renders it
  // progressively. Reasoning is never written here, so it cannot leak to the
  // client, logs of the response body, or persisted threads.
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const id = "0";
      writer.write({ type: "text-start", id });
      const tokens = clean.match(/\S+\s*/g) ?? (clean ? [clean] : []);
      for (const token of tokens) {
        writer.write({ type: "text-delta", id, delta: token });
        if (REVEAL_DELAY_MS > 0) await sleep(REVEAL_DELAY_MS);
      }
      writer.write({ type: "text-end", id });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
