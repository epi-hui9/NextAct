import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Protects the app behind the password gate.
 *
 * (Next.js 16 renamed the `middleware` convention to `proxy`; this is the same
 * request-gate concept.) The gate itself is a single page (`/`) that swaps
 * between the password field and the chat based on the cookie, so this proxy's
 * job is narrow: block the chat API for unauthenticated requests. Page-level
 * rendering is decided in `app/page.tsx`. `/api/auth` stays open so the gate
 * can be submitted.
 */
export async function proxy(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(AUTH_COOKIE)?.value);
  if (!authed) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  // Guard client-owned endpoints. `/api/auth` stays open for the gate
  // submission. Each route also re-checks the session as defense in depth.
  matcher: [
    "/api/chat/:path*",
    "/api/state/:path*",
    "/api/legacy/:path*",
    "/api/upload/:path*",
    "/api/transcribe/:path*",
  ],
};
