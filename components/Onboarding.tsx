"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import TreeMark from "./TreeMark";
import styles from "./Onboarding.module.css";

const STEPS = [
  {
    title: "A private place for what comes next.",
    body: "This space belongs to you. Nothing here is shared, compared, or put on display.",
    treeStage: 1 as const,
  },
  {
    title: "Your judgment becomes a living legacy.",
    body: "As you speak honestly about your story, a quiet tree grows to mark what you have named.",
    treeStage: 3 as const,
  },
  {
    title: "Begin with one honest answer.",
    body: "There is no checklist. Just one clear prompt, and a conversation that stays with you.",
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
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          <div className={styles.art} aria-hidden>
            <TreeMark stage={current.treeStage} size={180} />
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
