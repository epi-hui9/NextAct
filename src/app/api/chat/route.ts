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
import { createHash, randomUUID } from "node:crypto";
import { modelFor } from "@/server/ai/gateway";
import { calculatorTool } from "@/server/ai/calculator";
import { buildConversationSystem } from "@/server/ai/prompt";
import { routeEffort } from "@/server/ai/reasoning";
import { capWords } from "@/server/ai/output-policy";
import { checkOrdinaryResponse } from "@/server/retrieval/guards";
import { buildContext } from "@/server/retrieval/retrieve";
import { captureExchange } from "@/server/retrieval/capture";
import { db } from "@/server/db";
import { conversationTitle } from "@/features/conversation/title";
import { resolveClientId } from "@/features/auth/server/session";

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
  idempotencyKey: z.string().uuid().optional(),
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

function hashUserId(clientId: string): string {
  return createHash("sha256").update(clientId).digest("hex").slice(0, 12);
}

function classifyError(err: unknown): {
  status: number;
  className: string;
  message: string;
} {
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name?: string }).name)
      : "";
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message)
      : String(err ?? "");

  if (name === "TimeoutError" || /aborted|timeout/i.test(msg)) {
    return {
      status: 504,
      className: "stream_interrupted",
      message: "The reply was interrupted. Your words are saved. Tap to try again.",
    };
  }
  if (/401|unauthorized|auth/i.test(msg)) {
    return {
      status: 401,
      className: "session_expired",
      message: "Your session ended. Sign in again to continue.",
    };
  }
  if (/429|rate|overloaded/i.test(msg)) {
    return {
      status: 503,
      className: "provider_error",
      message: "The model is busy. Your words are saved. Tap to try again.",
    };
  }
  return {
    status: 503,
    className: "server_error",
    message: "Something went wrong on the server. Your words are saved. Tap to try again.",
  };
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const startedAll = Date.now();
  const clientId = await resolveClientId();
  if (!clientId) {
    return new Response(
      JSON.stringify({
        error: "Your session ended. Sign in again to continue.",
        errorClass: "session_expired",
        requestId,
      }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const messages = parsed.messages as UIMessage[];
  const userText = lastUserText(messages);
  if (!userText) return new Response("Empty message", { status: 400 });

  const title = conversationTitle(userText, "Conversation");
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

  // Persist user message first (idempotent on client key).
  const userMessageId = parsed.idempotencyKey ?? randomUUID();
  let userMsg = await db.getMessage(clientId, userMessageId);
  if (!userMsg) {
    try {
      userMsg = await db.addMessage({
        id: userMessageId,
        client_id: clientId,
        conversation_id: conversationId,
        role: "user",
        content: userText,
      });
    } catch (err) {
      // Race: another request with the same key may have inserted first.
      userMsg = await db.getMessage(clientId, userMessageId);
      if (!userMsg) {
        console.error("chat.persist_user_failed", {
          requestId,
          userHash: hashUserId(clientId),
          conversationId,
          stage: "persist_user",
          errorClass: "server_error",
          latencyMs: Date.now() - startedAll,
        });
        throw err;
      }
    }
  }

  // If an assistant reply already exists after this user message, return it.
  const history = await db.listMessages(clientId, conversationId);
  const userIdx = history.findIndex((m) => m.id === userMsg!.id);
  const existingAssistant =
    userIdx >= 0
      ? history.slice(userIdx + 1).find((m) => m.role === "assistant")
      : undefined;
  if (existingAssistant) {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: "text-start", id: "0" });
        writer.write({
          type: "text-delta",
          id: "0",
          delta: existingAssistant.content,
        });
        writer.write({ type: "text-end", id: "0" });
      },
    });
    return createUIMessageStreamResponse({
      stream,
      headers: {
        "x-conversation-id": conversationId,
        "x-user-message-id": userMsg.id,
        "x-request-id": requestId,
      },
    });
  }

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
    // Do not pass req.signal: client disconnect must not cancel generation
    // needed for later reconciliation.
    const result = await generateText({
      model,
      system,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      tools: { calculator: calculatorTool },
      stopWhen: stepCountIs(3),
      abortSignal: AbortSignal.timeout(GEN_TIMEOUT_MS),
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
  } catch (err) {
    const classified = classifyError(err);
    await db.addAiRun({
      client_id: clientId,
      skill: "conversation",
      model: modelId,
      input_tokens: null,
      output_tokens: null,
      latency_ms: Date.now() - started,
      status: "error",
      error_category: classified.className,
    });
    console.error("chat.generation_failed", {
      requestId,
      userHash: hashUserId(clientId),
      conversationId,
      stage: "generation",
      errorClass: classified.className,
      latencyMs: Date.now() - started,
    });
    return new Response(
      JSON.stringify({
        error: classified.message,
        errorClass: classified.className,
        conversationId,
        userMessageId: userMsg.id,
        requestId,
      }),
      {
        status: classified.status,
        headers: { "content-type": "application/json" },
      },
    );
  }

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
          userMessageId: userMsg!.id,
          userText,
          assistantMessageId,
          assistantText: clean,
        });
      } catch {
        // Memory capture is best-effort; the conversation must never break.
      }
    },
  });

  console.info("chat.ok", {
    requestId,
    userHash: hashUserId(clientId),
    conversationId: convId,
    stage: "complete",
    latencyMs: Date.now() - startedAll,
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      "x-conversation-id": convId,
      "x-user-message-id": userMsg.id,
      "x-request-id": requestId,
    },
  });
}
