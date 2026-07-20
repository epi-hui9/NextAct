"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import TreeMark from "./TreeMark";
import LockMark from "./LockMark";
import styles from "./Onboarding.module.css";

/**
 * North star (Introverted Intuition):
 * a private vault, simple enough not to overload,
 * where forty years of judgment become a living legacy,
 * and the present low becomes a chapter still ahead.
 */
const STEPS = [
  {
    kind: "vault" as const,
    title: "A private space. Yours alone.",
    body: "NextAct is a locked vault for one executive. Nothing here is shared, compared, or put on display. Zero leakage. Zero audience.",
  },
  {
    kind: "simple" as const,
    title: "Keep it simple. Hold the long view.",
    body: "The interface stays spare on purpose. One clear path at a time, so forty years of judgment can settle into focus instead of noise.",
  },
  {
    kind: "tree" as const,
    title: "Judgment becomes a living legacy.",
    body: "What you name here gathers into a visible archive: a tree that grows as your story takes shape, a map of a life still being written.",
    treeStage: 3 as const,
  },
  {
    kind: "horizon" as const,
    title: "This low point is not the end.",
    body: "The chapter you are in can turn toward something worth looking forward to. Begin with one honest answer.",
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
