"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ThreadSummary } from "@/lib/history/types";
import styles from "./HistoryPanel.module.css";

/**
 * An understated left drawer listing past conversations. Restrained motion,
 * no chrome, works on desktop and mobile. Never exposes internal architecture.
 */
export default function HistoryPanel({
  open,
  summaries,
  activeId,
  onSelect,
  onRemove,
  onClose,
}: {
  open: boolean;
  summaries: ThreadSummary[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.scrim}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className={styles.drawer}
            role="dialog"
            aria-label="Conversations"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <p className={styles.heading}>Conversations</p>

            {summaries.length === 0 ? (
              <p className={styles.empty}>No conversations yet.</p>
            ) : (
              <ul className={styles.list}>
                {summaries.map((s) => (
                  <li key={s.id} className={styles.item}>
                    <button
                      type="button"
                      className={`${styles.entry} ${
                        s.id === activeId ? styles.active : ""
                      }`}
                      onClick={() => onSelect(s.id)}
                      aria-current={s.id === activeId ? "true" : undefined}
                    >
                      <span className={styles.title}>{s.title}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => onRemove(s.id)}
                      aria-label={`Delete conversation: ${s.title}`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M3 3l8 8M11 3l-8 8"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
