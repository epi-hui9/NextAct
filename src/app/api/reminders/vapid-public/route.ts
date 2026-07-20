import { NextResponse } from "next/server";
import { getVapidPublicKey, isVapidConfigured } from "@/lib/push/vapid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isVapidConfigured()) {
    return NextResponse.json(
      { error: "Web Push is not configured" },
      { status: 503 },
    );
  }
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}
