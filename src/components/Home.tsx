"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import TreeMark from "./TreeMark";
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
}

function greeting(name: string | null): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}.` : `${part}.`;
}

/** Classic gear mark (toothed ring + hub), not a sun. */
function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
        /* keep calm on error */
      });
    return () => {
      cancelled = true;
    };
  }, [active, nonce]);

  const prompt =
    state?.oneSmallThing ??
    "When you have a moment, tell me what is on your mind.";
  const treeStage = state?.treeStage ?? 0;
  const progress = Math.max(
    0,
    Math.min(100, Math.round(state?.storyProgress ?? 0)),
  );
  const name = state?.preferredName ?? preferredName;
  const treeLabel = state?.treeSummary ?? "Seed";

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <header className={styles.identity}>
          <button
            type="button"
            className={styles.gear}
            onClick={onOpenAccount}
            aria-label="Settings"
          >
            <GearIcon />
          </button>
        </header>

        <motion.h1
          className={`serif ${styles.greeting}`}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {greeting(name)}
        </motion.h1>

        <button
          type="button"
          className={styles.treeBtn}
          onClick={onOpenLegacy}
          aria-label={`Living legacy tree, ${treeLabel}`}
        >
          <TreeMark stage={treeStage} size={168} />
          <span className={styles.treeCaption}>{treeLabel}</span>
        </button>

        <button
          type="button"
          className={styles.stageBtn}
          onClick={onOpenJourney}
          aria-label={`Story stage, ${progress} percent complete`}
        >
          <span className={styles.stageLabel}>Story</span>
          <span className={styles.stagePct}>{progress}%</span>
        </button>

        <div className={styles.invite}>
          <p className={styles.inviteLabel}>One small thing for today</p>
          <p className={styles.inviteText}>{prompt}</p>
        </div>

        <button
          type="button"
          className={styles.primary}
          onClick={() => onOpenConversation(prompt)}
        >
          Continue this reflection
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
        Enable my 10:00 AM reminder
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
