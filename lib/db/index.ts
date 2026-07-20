import "server-only";
import { demoAdapter } from "./demo-adapter";
import { createSupabaseAdapter } from "./supabase-adapter";
import type { StorageAdapter } from "./adapter";
import {
  isExplicitDemoMode,
  isSupabaseConfigured,
  isTestAdapterMode,
} from "@/lib/supabase/env";

/**
 * Adapter selection.
 *
 * - Tests: NEXTACT_TEST_ADAPTER=1 → demo
 * - Explicit local demo: NEXTACT_ALLOW_DEMO=1 (never production)
 * - Production/runtime: Supabase required (fail closed)
 * - Next.js production build phase may evaluate modules without secrets;
 *   a throw there would break CI. Build-time only may use demo; runtime
 *   production requests without Supabase still fail when methods run after
 *   a hardened check in resolveClientId / health.
 */
function selectAdapter(): StorageAdapter {
  if (isTestAdapterMode()) return demoAdapter;
  if (isExplicitDemoMode()) return demoAdapter;
  if (isSupabaseConfigured()) return createSupabaseAdapter();
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return demoAdapter;
  }
  if (process.env.NODE_ENV !== "production") {
    // Local `next dev` without Supabase: require explicit opt-in.
    if (process.env.NEXTACT_ALLOW_DEMO === "1") return demoAdapter;
  }
  throw new Error(
    "Supabase is required. Set SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. For local-only demo set NEXTACT_ALLOW_DEMO=1 (non-production).",
  );
}

export const db: StorageAdapter = selectAdapter();

/** Demo vault id used only when the explicit demo adapter is active. */
export const DEMO_CLIENT_ID = "client_demo_nextact";
