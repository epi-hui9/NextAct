import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await resolveSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  await db.setOnboardingComplete(session.userId);
  return NextResponse.json({ ok: true });
}
