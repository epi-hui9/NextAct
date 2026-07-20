"use client";

import styles from "./ProgressBar.module.css";

/** Minimal navy progress track. Values are clamped 0–100. */
export default function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={styles.wrap}
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
