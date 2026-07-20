"use client";

import { useEffect, useState } from "react";
import {
  ACTIVE_JOURNEY_STAGE_ID,
  JOURNEY_STAGES,
} from "@/lib/journey/stages";
import styles from "./Journey.module.css";

export default function Journey({
  active,
  nonce,
  onContinueStory,
}: {
  active: boolean;
  nonce: number;
  onContinueStory: () => void;
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
        <p className={styles.eyebrow}>Nine month path</p>
        <h1 className={`serif ${styles.heading}`}>Your journey</h1>
        <p className={styles.lead}>
          Eight stages. One clear place to stand today. The rest waits until you
          are ready.
        </p>

        <ol className={styles.list}>
          {JOURNEY_STAGES.map((stage, index) => {
            const isActive = stage.id === ACTIVE_JOURNEY_STAGE_ID;
            const isLocked = !isActive;
            return (
              <li
                key={stage.id}
                className={`${styles.item} ${isActive ? styles.active : ""} ${isLocked ? styles.locked : ""}`}
              >
                <div className={styles.rail} aria-hidden>
                  <span className={styles.dot} />
                  {index < JOURNEY_STAGES.length - 1 ? (
                    <span className={styles.line} />
                  ) : null}
                </div>
                <div className={styles.body}>
                  <div className={styles.row}>
                    <h2 className={styles.title}>{stage.title}</h2>
                    {isActive ? (
                      <span className={styles.badge}>{storyProgress}%</span>
                    ) : (
                      <span className={styles.wait}>Later</span>
                    )}
                  </div>
                  <p className={styles.summary}>{stage.summary}</p>
                  {isActive ? (
                    <button
                      type="button"
                      className={styles.cta}
                      onClick={onContinueStory}
                    >
                      Continue this stage
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
