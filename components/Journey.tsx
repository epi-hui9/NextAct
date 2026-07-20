"use client";

import { useEffect, useState } from "react";
import {
  ACTIVE_JOURNEY_STAGE_ID,
  JOURNEY_STAGES,
} from "@/lib/journey/stages";
import ProgressBar from "./ProgressBar";
import styles from "./Journey.module.css";

export default function Journey({
  active,
  nonce,
}: {
  active: boolean;
  nonce: number;
  onContinueStory?: () => void;
}) {
  const [storyProgress, setStoryProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch("/api/state", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (typeof data.storyProgress === "number") {
          setStoryProgress(
            Math.max(0, Math.min(100, Math.round(data.storyProgress))),
          );
        }
      })
      .catch(() => {
        /* keep last */
      });
    return () => {
      cancelled = true;
    };
  }, [active, nonce]);

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <h1 className={styles.heading}>Nine month path</h1>
        <ol className={styles.list}>
          {JOURNEY_STAGES.map((stage) => {
            const isActive = stage.id === ACTIVE_JOURNEY_STAGE_ID;
            const pct = isActive ? storyProgress : 0;
            return (
              <li
                key={stage.id}
                className={`${styles.item} ${isActive ? styles.active : ""}`}
              >
                <div className={styles.row}>
                  <span className={styles.title}>{stage.title}</span>
                  {isActive ? (
                    <span className={styles.badge}>{pct}%</span>
                  ) : (
                    <span className={styles.locked}>Later</span>
                  )}
                </div>
                <ProgressBar
                  value={pct}
                  label={`${stage.title} progress`}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
