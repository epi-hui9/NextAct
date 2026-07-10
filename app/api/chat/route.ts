import { cookies } from "next/headers";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { model } from "@/lib/ai/model";
import { buildSystemPrompt } from "@/lib/l1-persona/persona";
import { knowledgeGraph } from "@/lib/l2-knowledge";
import { memoryLoop } from "@/lib/l3-memory";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

// Persona reads from the filesystem, so run on the Node.js runtime.
export const runtime = "nodejs";
// Streaming responses must never be cached.
export const dynamic = "force-dynamic";

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

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
  });

  // AI SDK v7: stream UI messages back to `useChat` (was `toDataStreamResponse`
  // in older SDKs — adapted to the installed version).
  return result.toUIMessageStreamResponse();
}
