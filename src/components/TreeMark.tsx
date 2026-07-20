"use client";

import type { TreeStage } from "@/lib/story/tree";
import styles from "./TreeMark.module.css";

/**
 * Editorial growing-tree mark. Stages are deterministic and dignified.
 * No XP, streaks, or game vocabulary.
 */
export default function TreeMark({
  stage,
  size = 160,
  animate = false,
}: {
  stage: TreeStage;
  size?: number;
  animate?: boolean;
}) {
  const canopyOpacity = [0.12, 0.28, 0.45, 0.7, 1][stage];
  const trunkHeight = [18, 28, 40, 52, 66][stage];
  const branchOpacity = stage >= 2 ? Math.min(1, (stage - 1) / 3) : 0;

  return (
    <svg
      className={animate ? styles.grow : undefined}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={undefined}
    >
      <ellipse
        cx="60"
        cy="102"
        rx="34"
        ry="6"
        fill="var(--brand-mist)"
        opacity="0.45"
      />
      <rect
        x="57"
        y={100 - trunkHeight}
        width="6"
        height={trunkHeight}
        rx="2"
        fill="var(--brand-navy)"
        opacity={0.85}
      />
      {stage >= 2 ? (
        <>
          <path
            d="M60 70 C48 62, 36 58, 28 62"
            stroke="var(--brand-navy)"
            strokeWidth="2.2"
            fill="none"
            opacity={branchOpacity}
            strokeLinecap="round"
          />
          <path
            d="M60 66 C72 58, 84 54, 92 58"
            stroke="var(--brand-navy)"
            strokeWidth="2.2"
            fill="none"
            opacity={branchOpacity}
            strokeLinecap="round"
          />
        </>
      ) : null}
      <circle
        cx="60"
        cy={58 - stage * 2}
        r={14 + stage * 4}
        fill="var(--brand-navy)"
        opacity={canopyOpacity}
      />
      {stage >= 3 ? (
        <>
          <circle cx="42" cy="52" r="10" fill="var(--brand-navy)" opacity={canopyOpacity * 0.85} />
          <circle cx="78" cy="50" r="11" fill="var(--brand-navy)" opacity={canopyOpacity * 0.85} />
        </>
      ) : null}
      {stage >= 4 ? (
        <>
          <circle cx="50" cy="40" r="9" fill="var(--brand-navy)" opacity={canopyOpacity * 0.75} />
          <circle cx="70" cy="38" r="10" fill="var(--brand-navy)" opacity={canopyOpacity * 0.75} />
        </>
      ) : null}
    </svg>
  );
}
