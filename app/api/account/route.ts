import { NextResponse } from "next/server";
import { resolveSession } from "@/lib/session";
import { db } from "@/lib/db";
import { createUserClient } from "@/lib/supabase/server";
import { isExplicitDemoMode, isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await resolveSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  let email: string | null = null;
  if (isSupabaseConfigured() && !isExplicitDemoMode()) {
    const supabase = await createUserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  const profile = await db.getProfile(session.userId).catch(() => null);

  return NextResponse.json({
    preferredName: profile?.preferred_name ?? session.preferredName,
    email,
    reminderEnabled: profile?.reminder_enabled ?? false,
    timezone: profile?.timezone ?? "America/Chicago",
  });
}
