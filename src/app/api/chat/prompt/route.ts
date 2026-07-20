import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { conversationTitle } from "@/features/conversation/title";
import { resolveClientId } from "@/features/auth/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  conversationId: z.string().min(1).max(80),
  activePrompt: z.string().min(1).max(500),
});

/** Persist the Home reflection prompt onto the conversation thread. */
export async function POST(req: Request) {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const existing = await db.getConversation(clientId, body.conversationId);
  if (!existing) {
    await db.createConversation(
      clientId,
      conversationTitle(body.activePrompt, "Reflection"),
      body.conversationId,
    );
  }
  await db.setConversationPrompt(
    clientId,
    body.conversationId,
    body.activePrompt,
  );
  return NextResponse.json({ ok: true });
}
