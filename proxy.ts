import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Protects client-owned API routes. Accepts either a Supabase session
 * or the explicit local demo gate cookie.
 */
export async function proxy(req: NextRequest) {
  const demoAuthed = await verifySessionToken(
    req.cookies.get(AUTH_COOKIE)?.value,
  );
  if (demoAuthed) return NextResponse.next();

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let response = NextResponse.next({ request: req });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          req.cookies.set(name, value);
        }
        response = NextResponse.next({ request: req });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  return response;
}

export const config = {
  matcher: [
    "/api/chat",
    "/api/chat/:path*",
    "/api/state/:path*",
    "/api/legacy/:path*",
    "/api/upload/:path*",
    "/api/transcribe/:path*",
    "/api/onboarding/:path*",
    "/api/reminders/subscribe/:path*",
    "/api/reminders/send-test/:path*",
  ],
};
