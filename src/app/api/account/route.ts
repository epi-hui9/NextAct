import { NextResponse } from "next/server";
import { resolveSession } from "@/features/auth/server/session";
import { db } from "@/server/db";
import { createUserClient } from "@/server/supabase/server";
import { isExplicitDemoMode, isSupabaseConfigured } from "@/server/supabase/env";

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
