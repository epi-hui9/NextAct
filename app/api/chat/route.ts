import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  stepCountIs,
  type UIMessage,
} from "ai";
import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { modelFor } from "@/lib/ai/gateway";
import { calculatorTool } from "@/lib/ai/calculator";
import { buildConversationSystem } from "@/lib/ai/prompt";
import { routeEffort } from "@/lib/ai/reasoning";
import { capWords } from "@/lib/ai/output-policy";
import { checkOrdinaryResponse } from "@/lib/memory/guards";
import { buildContext } from "@/lib/memory/retrieve";
import { captureExchange } from "@/lib/memory/capture";
import { db } from "@/lib/db";
import { resolveClientId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_OUTPUT_TOKENS = 12000;
const MAX_VISIBLE_WORDS = 90;
const REVEAL_DELAY_MS = 12;
const GEN_TIMEOUT_MS = 45_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BodySchema = z.object({
  messages: z.array(z.any()),
  conversationId: z.string().min(1).max(80).optional(),
});

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m?.role !== "user") continue;
    return m.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();
  }
  return "";
}

export async function POST(req: Request) {
  const clientId = await resolveClientId();
  if (!clientId) return new Response("Unauthorized", { status: 401 });

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const messages = parsed.messages as UIMessage[];
  const userText = lastUserText(messages);
  if (!userText) return new Response("Empty message", { status: 400 });

  // Ensure a conversation exists for this client. A client-supplied id lets one
  // ongoing thread persist across turns; otherwise the server creates one.
  const title = userText.slice(0, 48) || "Conversation";
  let conversationId = parsed.conversationId ?? null;
  if (conversationId) {
    const existing = await db.getConversation(clientId, conversationId);
    if (!existing) {
      await db.createConversation(clientId, title, conversationId);
    }
  } else {
    const conv = await db.createConversation(clientId, title);
    conversationId = conv.id;
  }

  // Persist the raw user message (never overwritten later).
  const userMsg = await db.addMessage({
    id: randomUUID(),
    client_id: clientId,
    conversation_id: conversationId,
    role: "user",
    content: userText,
  });

  // Retrieval (tenant-filtered) + style + name for the system prompt.
  const [{ items, procedural }, style, client] = await Promise.all([
    buildContext(clientId, userText),
    db.getStyleProfile(clientId),
    db.getClient(clientId),
  ]);

  const system = buildConversationSystem({
    contextItems: items,
    procedural,
    style,
    preferredName: client?.preferred_name ?? null,
  });

  const effort = routeEffort(messages);
  const { model, id: modelId } = modelFor("workhorse");
  const started = Date.now();

  let rawText = "";
  let usageIn: number | null = null;
  let usageOut: number | null = null;
  try {
    const result = await generateText({
      model,
      system,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      tools: { calculator: calculatorTool },
      stopWhen: stepCountIs(3),
      abortSignal: AbortSignal.any([
        req.signal,
        AbortSignal.timeout(GEN_TIMEOUT_MS),
      ]),
      providerOptions: {
        anthropic: {
          thinking: { type: "adaptive" },
          effort,
          sendReasoning: false,
        } satisfies AnthropicProviderOptions,
      },
    });
    rawText = result.text;
    usageIn = result.usage?.inputTokens ?? null;
    usageOut = result.usage?.outputTokens ?? null;
  } catch {
    await db.addAiRun({
      client_id: clientId,
      skill: "conversation",
      model: modelId,
      input_tokens: null,
      output_tokens: null,
      latency_ms: Date.now() - started,
      status: "error",
      error_category: "generation_failed",
    });
    return new Response(
      JSON.stringify({
        error: "I lost the connection for a moment. Your words are still here.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  // Concise-by-default cap. Guards run for telemetry; never surfaced.
  let clean = capWords(rawText, MAX_VISIBLE_WORDS).trim();
  const check = checkOrdinaryResponse({ assistantText: clean, userText });
  if (clean === "") {
    clean = "I'm here. Take your time, and tell me a little more.";
  }

  await db.addAiRun({
    client_id: clientId,
    skill: "conversation",
    model: modelId,
    input_tokens: usageIn,
    output_tokens: usageOut,
    latency_ms: Date.now() - started,
    status: "ok",
    error_category: check.ok ? null : check.violations.join(","),
  });

  const assistantMessageId = randomUUID();
  const convId = conversationId;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "text-start", id: "0" });
      const tokens = clean.match(/\S+\s*/g) ?? [clean];
      for (const token of tokens) {
        writer.write({ type: "text-delta", id: "0", delta: token });
        if (REVEAL_DELAY_MS > 0) await sleep(REVEAL_DELAY_MS);
      }
      writer.write({ type: "text-end", id: "0" });

      // Persist the assistant reply, then run the capture loop. Awaited inside
      // execute so it completes before the response closes.
      try {
        await db.addMessage({
          id: assistantMessageId,
          client_id: clientId,
          conversation_id: convId,
          role: "assistant",
          content: clean,
        });
        await db.touchConversation(clientId, convId);
        await captureExchange({
          clientId,
          userMessageId: userMsg.id,
          userText,
          assistantMessageId,
          assistantText: clean,
        });
      } catch {
        // Memory capture is best-effort; the conversation must never break.
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: { "x-conversation-id": convId },
  });
}
