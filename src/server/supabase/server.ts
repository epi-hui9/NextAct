import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  requireAnonKey,
  requireServiceRoleKey,
  requireSupabaseUrl,
} from "./env";

/** User-scoped server client. RLS applies. */
export async function createUserClient() {
  const cookieStore = await cookies();
  return createServerClient(requireSupabaseUrl(), requireAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Called from a Server Component where setting is not allowed. */
        }
      },
    },
  });
}

/** Service-role client. Server-only. Never import from client components. */
export function createServiceClient() {
  return createClient(requireSupabaseUrl(), requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
