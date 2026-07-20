import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveClientId } from "@/lib/session";

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
      title: c.title,
      updatedAt: c.updated_at,
      createdAt: c.created_at,
    })),
  });
}
