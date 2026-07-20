import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { resolveClientId } from "@/features/auth/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authoritative conversation messages for client reconciliation. */
export async function GET(req: Request) {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return new NextResponse("conversationId required", { status: 400 });
  }

  const conv = await db.getConversation(clientId, conversationId);
  if (!conv) {
    return NextResponse.json({ conversationId, messages: [] });
  }

  const rows = await db.listMessages(clientId, conversationId);
  return NextResponse.json({
    conversationId,
    messages: rows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })),
  });
}
