"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import LockMark from "./LockMark";
import styles from "./AccountSheet.module.css";

interface AccountInfo {
  preferredName: string | null;
  email: string | null;
  reminderEnabled: boolean;
  version: string;
  shortSha: string;
}

export default function AccountSheet({
  open,
  onClose,
  onReplayOnboarding,
}: {
  open: boolean;
  onClose: () => void;
  onReplayOnboarding: () => void;
}) {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/account", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/version", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]).then(([account, version]) => {
      if (cancelled) return;
      setInfo({
        preferredName: account?.preferredName ?? null,
        email: account?.email ?? null,
        reminderEnabled: Boolean(account?.reminderEnabled),
        version: version?.version ?? "0.1.0",
        shortSha: version?.shortSha ?? "local",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const label = info?.preferredName
    ? `${info.preferredName}'s private space`
    : "Your private space";

  async function changePassword() {
    setPwMsg(null);
    if (password.length < 8) {
      setPwMsg("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setPwMsg("Those passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPwMsg("I could not update the password. Please try again.");
        return;
      }
      setPassword("");
      setConfirm("");
      setPwMsg("Password updated.");
    } catch {
      setPwMsg("I could not update the password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      try {
        const supabase = createBrowserSupabase();
        await supabase.auth.signOut();
      } catch {
        /* demo mode may lack supabase browser env */
      }
      try {
        const { clearAllDrafts } = await import("@/lib/client/draft-store");
        await clearAllDrafts();
      } catch {
        /* ignore */
      }
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  async function testReminder() {
    setReminderMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/reminders/send-test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReminderMsg(
          res.status === 503
            ? "Reminders are finishing setup. Please try again in a minute."
            : "I could not send a test reminder.",
        );
        return;
      }
      setReminderMsg(data.ok ? "Test reminder sent." : "No subscription on this device yet.");
    } catch {
      setReminderMsg("I could not send a test reminder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-label="Account">
      <div className={styles.sheet}>
        <header className={styles.head}>
          <div>
            <p className={styles.lock} aria-hidden>
              <LockMark size={22} />
            </p>
            <h2 className={styles.title}>{label}</h2>
            {info?.email ? <p className={styles.email}>{info.email}</p> : null}
            <p className={styles.note}>
              Your conversations and Legacy belong only to this account.
            </p>
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        </header>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Reminders</h3>
          <p className={styles.meta}>
            {info?.reminderEnabled ? "Enabled for 10:00 AM local time" : "Not enabled yet"}
          </p>
          <button type="button" className={styles.secondary} onClick={() => void testReminder()} disabled={busy}>
            Send a test reminder
          </button>
          {reminderMsg ? <p className={styles.msg}>{reminderMsg}</p> : null}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Change password</h3>
          <label className={styles.label}>
            New password
            <input
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Confirm password
            <input
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => void changePassword()}
            disabled={busy}
          >
            Save password
          </button>
          {pwMsg ? <p className={styles.msg}>{pwMsg}</p> : null}
        </section>

        <section className={styles.section}>
          <button type="button" className={styles.secondary} onClick={onReplayOnboarding}>
            Replay introduction
          </button>
          <p className={styles.meta}>
            App {info?.version ?? "…"} · {info?.shortSha ?? "…"}
          </p>
        </section>

        <button type="button" className={styles.danger} onClick={() => void signOut()} disabled={busy}>
          Sign out
        </button>
      </div>
    </div>
  );
}
