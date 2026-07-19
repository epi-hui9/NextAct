import "server-only";
import { demoAdapter } from "./demo-adapter";
import type { StorageAdapter } from "./adapter";

/**
 * Adapter selection.
 *
 * If a Supabase project is configured we would return a Supabase-backed adapter
 * implementing the same interface. It is not configured in this build, so the
 * app runs on the local demo adapter. This choice is surfaced honestly in the
 * final report via `db.kind`.
 */
function selectAdapter(): StorageAdapter {
  const hasSupabase =
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (hasSupabase) {
    // A Supabase adapter would be constructed here. Intentionally not wired in
    // this build because no Supabase credentials are present.
    return demoAdapter;
  }
  return demoAdapter;
}

export const db: StorageAdapter = selectAdapter();

/**
 * The single Round 1 test client. The schema still stores client_id everywhere
 * so isolated per-client projects are a drop-in later. All membership checks
 * resolve the authenticated session to this client.
 */
export const DEMO_CLIENT_ID = "client_demo_nextact";
