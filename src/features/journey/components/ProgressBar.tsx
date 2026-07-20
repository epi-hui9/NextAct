"use client";

import styles from "./ProgressBar.module.css";

/** Minimal navy progress track. Values are clamped 0–100. */
export default function ProgressBar({
  value,
  label,
  tone = "default",
  compact = false,
}: {
  value: number;
  label?: string;
  tone?: "default" | "onDark";
  compact?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`${styles.wrap} ${tone === "onDark" ? styles.onDark : ""} ${compact ? styles.compact : ""}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
