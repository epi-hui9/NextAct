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
  const canopyOpacity = [0, 0.15, 0.28, 0.45, 0.7, 1][stage];
  const trunkHeight = [8, 22, 36, 48, 58, 66][stage];
  const branchOpacity = stage >= 3 ? Math.min(1, (stage - 2) / 3) : 0;

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
        y={102 - trunkHeight}
        width="6"
        height={trunkHeight}
        rx="2"
        fill="var(--brand-navy)"
        opacity={stage === 0 ? 0.2 : 0.85}
      />
      {stage >= 1 ? (
        <circle
          cx="60"
          cy={102 - trunkHeight - 10}
          r={10 + stage * 3}
          fill="var(--brand-navy)"
          opacity={canopyOpacity}
        />
      ) : null}
      {stage >= 3 ? (
        <>
          <path
            d={`M60 ${102 - trunkHeight + 8} C40 ${90 - stage * 4}, 28 ${70}, 32 ${58}`}
            fill="none"
            stroke="var(--brand-navy)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={branchOpacity}
          />
          <path
            d={`M60 ${102 - trunkHeight + 8} C80 ${90 - stage * 4}, 92 ${70}, 88 ${58}`}
            fill="none"
            stroke="var(--brand-navy)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={branchOpacity}
          />
        </>
      ) : null}
      {stage >= 4 ? (
        <>
          <circle cx="38" cy="52" r="12" fill="var(--brand-mist)" opacity="0.55" />
          <circle cx="82" cy="50" r="13" fill="var(--brand-mist)" opacity="0.5" />
        </>
      ) : null}
      {stage >= 5 ? (
        <circle
          cx="60"
          cy={102 - trunkHeight - 14}
          r="28"
          fill="var(--brand-navy)"
          opacity="0.35"
        />
      ) : null}
    </svg>
  );
}
