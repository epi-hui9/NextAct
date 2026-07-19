import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { db, DEMO_CLIENT_ID } from "@/lib/db";

/**
 * Resolve the authenticated client for the current request.
 *
 * Round 1 has one test client. The password gate proves membership; the schema
 * still scopes everything by client_id so multi-tenant isolation is enforced by
 * construction. Returns null when the session is not authenticated.
 */
export async function resolveClientId(): Promise<string | null> {
  const store = await cookies();
  const authed = await verifySessionToken(store.get(AUTH_COOKIE)?.value);
  if (!authed) return null;
  await db.ensureClient(DEMO_CLIENT_ID, null);
  return DEMO_CLIENT_ID;
}
