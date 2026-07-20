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
}

function greeting(name: string | null): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}.` : `${part}.`;
}

export default function Home({
  active,
  nonce,
  onOpenConversation,
  onOpenLegacy,
}: {
  active: boolean;
  nonce: number;
  onOpenConversation: (prompt?: string) => void;
  onOpenLegacy: () => void;
}) {
  const [state, setState] = useState<HomeState | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch("/api/state", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setState(data as HomeState);
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
    "When you have a quiet moment, tell me what is on your mind.";
  const treeStage = state?.treeStage ?? 0;

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <motion.h1
          className={`serif ${styles.greeting}`}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {greeting(state?.preferredName ?? null)}
        </motion.h1>

        <button
          type="button"
          className={styles.treeBtn}
          onClick={onOpenLegacy}
          aria-label={state?.treeSummary ?? "Your living legacy tree"}
        >
          <TreeMark stage={treeStage} size={168} />
          <span className={styles.treeCaption}>
            {state?.treeSummary ?? "Your living legacy begins here"}
          </span>
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

        <ReminderOptIn />
      </div>
    </div>
  );
}

function ReminderOptIn() {
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
        setStatus("Reminders are not configured on the server yet.");
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
      setStatus("Your 10:00 AM reminder is on.");
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
