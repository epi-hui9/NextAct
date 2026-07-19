"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./LegacyMap.module.css";

interface MapEntry {
  title: string;
  content: string;
  status: string;
  created_at: number;
}
interface MapSection {
  section: string;
  label: string;
  fill: number;
  entryCount: number;
  entries: MapEntry[];
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LegacyMap({
  active,
  nonce,
}: {
  active: boolean;
  nonce: number;
}) {
  const [sections, setSections] = useState<MapSection[]>([]);
  const [selected, setSelected] = useState<MapSection | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch("/api/legacy", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.sections) setSections(data.sections);
      })
      .catch(() => {
        /* keep last known */
      });
    return () => {
      cancelled = true;
    };
  }, [active, nonce]);

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <h1 className={`serif ${styles.heading}`}>Your Living Legacy</h1>
        <p className={styles.sub}>
          A landscape that fills as your story becomes clear.
        </p>

        <div className={styles.map} role="list">
          {sections.map((s) => {
            const light = s.fill >= 45;
            return (
              <button
                key={s.section}
                type="button"
                role="listitem"
                className={styles.region}
                onClick={() => setSelected(s)}
                aria-label={`${s.label}, ${s.fill} percent`}
              >
                <motion.span
                  className={styles.fill}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: (s.fill / 100) * 0.92 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  aria-hidden
                />
                <span
                  className={styles.regionLabel}
                  style={{ color: light ? "var(--brand-cashmere)" : "var(--ink)" }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <motion.div
          className={styles.detail}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.detailInner}>
            <button
              type="button"
              className={styles.back}
              onClick={() => setSelected(null)}
            >
              ← Back
            </button>
            <h2 className={`serif ${styles.detailTitle}`}>{selected.label}</h2>
            {selected.entries.length === 0 ? (
              <p className={styles.empty}>
                This part of your landscape is still open. It will take shape as
                you talk.
              </p>
            ) : (
              <ul className={styles.entries}>
                {selected.entries.map((e, i) => (
                  <li key={i} className={styles.entry}>
                    <p className={styles.entryTitle}>{e.title}</p>
                    <p className={styles.entryContent}>{e.content}</p>
                    <p className={styles.entryDate}>{fmtDate(e.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
