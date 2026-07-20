import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness check. Reports configuration presence without exposing secrets
 * or any client data.
 */
export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const aiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  const vapidConfigured = Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
  const voiceConfigured = Boolean(
    process.env.DEEPGRAM_API_KEY || process.env.OPENAI_API_KEY,
  );

  const ok = supabaseConfigured && aiConfigured;
  return NextResponse.json(
    {
      ok,
      service: "nextact",
      time: new Date().toISOString(),
      checks: {
        supabase: supabaseConfigured ? "configured" : "missing",
        ai: aiConfigured ? "configured" : "missing",
        webPush: vapidConfigured ? "configured" : "missing",
        voice: voiceConfigured ? "configured" : "browser_fallback",
      },
    },
    { status: ok ? 200 : 503 },
  );
}
