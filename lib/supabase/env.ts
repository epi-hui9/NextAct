/** Shared Supabase env checks. Never log secret values. */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function requireSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set");
  return url;
}

export function requireAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return key;
}

export function requireServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return key;
}

/**
 * Explicit demo mode. Never silent.
 * Allowed for local/preview verification. Forbidden on Vercel production.
 */
export function isExplicitDemoMode(): boolean {
  if (process.env.NEXTACT_ALLOW_DEMO !== "1") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return true;
}

export function isTestAdapterMode(): boolean {
  return process.env.NEXTACT_TEST_ADAPTER === "1";
}
