import { resolveSession } from "@/features/auth/server/session";
import {
  isExplicitDemoMode,
  isSupabaseConfigured,
} from "@/server/supabase/env";
import AuthGate from "@/features/auth/components/AuthGate";
import AppShell from "@/components/ui/AppShell";

export const dynamic = "force-dynamic";

export default async function Page() {
  const demoMode = isExplicitDemoMode();
  const supabaseReady = isSupabaseConfigured();

  if (!supabaseReady && !demoMode) {
    return (
      <main
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#FAFAF8",
          color: "#0B1F3A",
          textAlign: "center",
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <p className="serif" style={{ fontSize: "1.6rem", marginBottom: 8 }}>
            NextAct
          </p>
          <p style={{ color: "#7C8798", lineHeight: 1.5 }}>
            This private space needs Supabase credentials before it can open.
            See docs/03-engineering/04-deployment.md.
          </p>
        </div>
      </main>
    );
  }

  let session = null;
  try {
    session = await resolveSession();
  } catch (err) {
    console.error("resolveSession failed", err);
    session = null;
  }

  if (!session) {
    return <AuthGate demoMode={demoMode} />;
  }

  return (
    <AppShell
      initialOnboardingComplete={demoMode ? true : session.onboardingComplete}
      preferredName={session.preferredName}
      email={session.email}
    />
  );
}
