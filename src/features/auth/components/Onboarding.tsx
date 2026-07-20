"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import TreeMark from "@/components/brand/TreeMark";
import LockMark from "@/components/brand/LockMark";
import styles from "./Onboarding.module.css";

/** Four short beats. Title + one line. No marketing stack. */
const STEPS = [
  {
    kind: "vault" as const,
    title: "Yours alone.",
    body: "A locked vault. Nothing shared.",
  },
  {
    kind: "simple" as const,
    title: "Kept simple.",
    body: "One path. No clutter.",
  },
  {
    kind: "tree" as const,
    title: "A living legacy.",
    body: "What you name here stays and grows.",
    treeStage: 3 as const,
  },
  {
    kind: "horizon" as const,
    title: "Still ahead.",
    body: "Start with one honest answer.",
    treeStage: 4 as const,
  },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const reduce = useReducedMotion();
  const current = STEPS[step];

  async function finish() {
    setPending(true);
    try {
      const res = await fetch("/api/onboarding", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      onComplete();
    } catch {
      setPending(false);
    }
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else void finish();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.progress} aria-hidden>
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={i <= step ? styles.dotActive : styles.dot}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className={styles.panel}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <div className={styles.art} aria-hidden>
            {current.kind === "vault" ? (
              <div className={styles.vaultMark}>
                <LockMark size={56} />
              </div>
            ) : current.kind === "simple" ? (
              <div className={styles.horizonMark} />
            ) : (
              <TreeMark stage={current.treeStage ?? 3} size={180} />
            )}
          </div>
          <h1 className={`serif ${styles.title}`}>{current.title}</h1>
          <p className={styles.body}>{current.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className={styles.actions}>
        {step > 0 ? (
          <button
            type="button"
            className={styles.back}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={styles.primary}
          onClick={next}
          disabled={pending}
        >
          {step === STEPS.length - 1
            ? pending
              ? "Opening…"
              : "Begin"
            : "Continue"}
        </button>
      </div>
    </div>
  );
}
