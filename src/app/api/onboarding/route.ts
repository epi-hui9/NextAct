import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { resolveSession } from "@/features/auth/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await resolveSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  await db.setOnboardingComplete(session.userId);
  return NextResponse.json({ ok: true });
}
