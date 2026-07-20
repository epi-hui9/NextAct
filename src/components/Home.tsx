"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import TreeMark from "./TreeMark";
import ProgressBar from "./ProgressBar";
import type { TreeStage } from "@/lib/story/tree";
import styles from "./Home.module.css";

interface HomeState {
  preferredName: string | null;
  storyProgress: number;
  oneSmallThing: string;
  legacyUpdate: string | null;
  treeStage: TreeStage;
  treeSummary: string;
  journeyStage?: string;
  reminderEnabled?: boolean;
}

export default function Home({
  active,
  nonce,
  preferredName = null,
  onOpenConversation,
  onOpenLegacy,
  onOpenAccount,
  onOpenJourney,
}: {
  active: boolean;
  nonce: number;
  preferredName?: string | null;
  email?: string | null;
  onOpenConversation: (prompt?: string) => void;
  onOpenLegacy: () => void;
  onOpenAccount: () => void;
  onOpenJourney: () => void;
}) {
  const [state, setState] = useState<HomeState | null>(null);
  const [reminderOn, setReminderOn] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/state", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch("/api/account", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([data, account]) => {
        if (cancelled) return;
        if (data) setState(data as HomeState);
        if (account?.reminderEnabled) setReminderOn(true);
      })
      .catch(() => {
        /* keep calm */
      });
    return () => {
      cancelled = true;
    };
  }, [active, nonce]);

  const prompt =
    state?.oneSmallThing ??
    "What feels most true to say about this chapter?";
  const treeStage = state?.treeStage ?? 0;
  const progress = Math.max(
    0,
    Math.min(100, Math.round(state?.storyProgress ?? 0)),
  );
  const name = state?.preferredName ?? preferredName;

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <header className={styles.top}>
          <button
            type="button"
            className={styles.gear}
            onClick={onOpenAccount}
            aria-label="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.9 5.9l1.6 1.6M16.5 16.5l1.6 1.6M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <button
          type="button"
          className={styles.treeBg}
          onClick={onOpenLegacy}
          aria-label="Open Living Legacy"
        >
          <TreeMark stage={treeStage} size={200} />
        </button>

        <motion.p
          className={`serif ${styles.question}`}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {prompt}
        </motion.p>

        {name ? <p className={styles.greeting}>For {name}</p> : null}

        <button
          type="button"
          className={styles.primary}
          onClick={() => onOpenConversation(prompt)}
        >
          Continue
        </button>

        <button
          type="button"
          className={styles.storyTrack}
          onClick={onOpenJourney}
          aria-label={`Story progress ${progress} percent`}
        >
          <span className={styles.storyMeta}>
            <span>Story</span>
            <span className={styles.storyPct}>{progress}%</span>
          </span>
          <ProgressBar value={progress} label="Story progress" compact />
        </button>

        {!reminderOn ? (
          <ReminderOptIn onEnabled={() => setReminderOn(true)} />
        ) : null}
      </div>
    </div>
  );
}

function ReminderOptIn({ onEnabled }: { onEnabled: () => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    setStatus(null);
    try {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      if (!standalone) {
        setStatus(
          "Add NextAct to your Home Screen first, then enable the reminder.",
        );
        return;
      }
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setStatus("Reminders are not available on this device yet.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Reminders stay off unless you allow them.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch("/api/reminders/vapid-public");
      if (!keyRes.ok) {
        setStatus(
          keyRes.status === 503
            ? "Reminders are finishing setup. Please try again in a minute."
            : "I could not reach the reminder service.",
        );
        return;
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/reminders/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) {
        setStatus("I could not save that reminder. Please try once more.");
        return;
      }
      onEnabled();
    } catch {
      setStatus("I could not enable reminders just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.reminder}>
      <button
        type="button"
        className={styles.reminderBtn}
        onClick={() => void enable()}
        disabled={busy}
      >
        Enable 10:00 AM reminder
      </button>
      {status ? <p className={styles.reminderStatus}>{status}</p> : null}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}
