import { NextResponse } from "next/server";
import { resolveClientId } from "@/features/auth/server/session";
import { getLegacyMap } from "@/features/legacy/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The Living Legacy map: fixed sections with deterministic fill + entries. */
export async function GET() {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });
  const sections = await getLegacyMap(clientId);
  return NextResponse.json({ sections });
}
