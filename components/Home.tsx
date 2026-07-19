"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./Home.module.css";

interface HomeState {
  preferredName: string | null;
  storyProgress: number;
  oneSmallThing: string;
  legacyUpdate: string | null;
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
  onOpenConversation: () => void;
  onOpenLegacy: () => void;
}) {
  const [state, setState] = useState<HomeState | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch("/api/state", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setState(data as HomeState);
      })
      .catch(() => {
        /* keep last known state; Home stays calm on error */
      });
    return () => {
      cancelled = true;
    };
  }, [active, nonce]);

  const progress = state?.storyProgress ?? 0;
  const circumference = 2 * Math.PI * 52;
  const dash = (progress / 100) * circumference;

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <motion.h1
          className={`serif ${styles.greeting}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {greeting(state?.preferredName ?? null)}
        </motion.h1>

        <div className={styles.ringWrap} aria-label={`Your story is ${progress} percent along`}>
          <svg viewBox="0 0 120 120" className={styles.ring} aria-hidden>
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--line-strong)"
              strokeWidth="4"
              opacity="0.5"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="4"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - dash }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className={styles.ringInner}>
            <span className={styles.pct}>{progress}%</span>
            <span className={styles.pctLabel}>your story</span>
          </div>
        </div>

        <div className={styles.invite}>
          <p className={styles.inviteLabel}>One small thing for today</p>
          <p className={styles.inviteText}>
            {state?.oneSmallThing ??
              "When you have a quiet moment, tell me what's on your mind."}
          </p>
        </div>

        <button
          type="button"
          className={styles.primary}
          onClick={onOpenConversation}
        >
          Continue the conversation
        </button>

        {state?.legacyUpdate ? (
          <button
            type="button"
            className={styles.mapUpdate}
            onClick={onOpenLegacy}
          >
            {state.legacyUpdate}
            <span className={styles.mapArrow} aria-hidden>
              →
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
