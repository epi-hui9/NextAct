import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { displayConversationTitle } from "@/features/conversation/title";
import { resolveClientId } from "@/features/auth/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List conversations for the signed-in vault, newest first. */
export async function GET() {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await db.listConversations(clientId);
  return NextResponse.json({
    conversations: rows.map((c) => ({
      id: c.id,
      title: displayConversationTitle(c.title),
      updatedAt: c.updated_at,
      createdAt: c.created_at,
    })),
  });
}
