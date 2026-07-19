import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import AppShell from "@/components/AppShell";

// Auth state is per-request; never statically cache this page.
export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const authed = await verifySessionToken(cookieStore.get(AUTH_COOKIE)?.value);
  return authed ? <AppShell /> : <PasswordGate />;
}
