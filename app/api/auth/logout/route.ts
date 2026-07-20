import { NextResponse } from "next/server";
import { isSupabaseConfigured, isExplicitDemoMode } from "@/lib/supabase/env";
import { createUserClient } from "@/lib/supabase/server";
import { AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (isSupabaseConfigured() && !isExplicitDemoMode()) {
    const supabase = await createUserClient();
    await supabase.auth.signOut();
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
