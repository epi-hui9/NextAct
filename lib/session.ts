import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { db, DEMO_CLIENT_ID } from "@/lib/db";
import {
  isExplicitDemoMode,
  isSupabaseConfigured,
  isTestAdapterMode,
} from "@/lib/supabase/env";
import { createUserClient } from "@/lib/supabase/server";
import { STORY_AREAS } from "@/lib/db/types";

export interface SessionIdentity {
  userId: string;
  clientId: string;
  preferredName: string | null;
  email: string | null;
  onboardingComplete: boolean;
}

/**
 * Resolve the authenticated private vault for this request.
 * Never trusts a client-supplied owner id.
 */
export async function resolveSession(): Promise<SessionIdentity | null> {
  if (isSupabaseConfigured() && !isExplicitDemoMode()) {
    const supabase = await createUserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const clientId = user.id;
    try {
      await db.ensureClient(clientId, null);
    } catch (err) {
      console.error("ensureClient failed", err);
      throw err;
    }
    try {
      await ensureStoryRows(clientId);
    } catch (err) {
      console.error("ensureStoryRows failed", err);
      // Story rows are helpful but must not block sign-in.
    }

    let profile = null as Awaited<ReturnType<typeof db.getProfile>>;
    try {
      profile = await db.getProfile(user.id);
      if (!profile) {
        profile = await db.upsertProfile({
          user_id: user.id,
          client_id: clientId,
          preferred_name:
            typeof user.user_metadata?.preferred_name === "string"
              ? user.user_metadata.preferred_name
              : null,
          timezone: "America/Chicago",
          reminder_enabled: false,
        });
      }
    } catch (err) {
      console.error("profile bootstrap failed", err);
      throw err;
    }

    try {
      const service = await import("@/lib/supabase/server").then((m) =>
        m.createServiceClient(),
      );
      await service.from("client_memberships").upsert(
        {
          client_id: clientId,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "client_id,user_id" },
      );
    } catch (err) {
      console.error("membership seed failed", err);
    }

    return {
      userId: user.id,
      clientId,
      preferredName: profile.preferred_name,
      email: user.email ?? null,
      onboardingComplete: profile.onboarding_completed_at != null,
    };
  }

  // Explicit demo / test path only.
  if (isTestAdapterMode() || isExplicitDemoMode()) {
    const store = await cookies();
    const authed = await verifySessionToken(store.get(AUTH_COOKIE)?.value);
    if (!authed) return null;
    await db.ensureClient(DEMO_CLIENT_ID, null);
    await ensureStoryRows(DEMO_CLIENT_ID);
    return {
      userId: "demo-user",
      clientId: DEMO_CLIENT_ID,
      preferredName: null,
      email: null,
      onboardingComplete: true,
    };
  }

  return null;
}

export async function resolveClientId(): Promise<string | null> {
  const session = await resolveSession();
  return session?.clientId ?? null;
}

async function ensureStoryRows(clientId: string): Promise<void> {
  const existing = await db.getStoryEvidence(clientId);
  if (existing.length >= STORY_AREAS.length) return;
  const now = Date.now();
  for (const area of STORY_AREAS) {
    if (existing.some((e) => e.area === area)) continue;
    await db.upsertStoryEvidence({
      client_id: clientId,
      area,
      status: "empty",
      coverage_score: 0,
      evidence_count: 0,
      source_ids: [],
      last_updated_at: now,
    });
  }
}
