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

  const activeStage =
    JOURNEY_STAGES.find((s) => s.id === ACTIVE_JOURNEY_STAGE_ID) ??
    JOURNEY_STAGES[0];

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <h1 className={`serif ${styles.heading}`}>Nine month path</h1>

        <section className={styles.hero} aria-current="step">
          <p className={styles.heroEyebrow}>Now</p>
          <h2 className={styles.heroTitle}>{activeStage.title}</h2>
          <p className={styles.heroBody}>{activeStage.summary}</p>
          <div className={styles.heroProgress}>
            <div className={styles.heroMeta}>
              <span>Progress</span>
              <span className={styles.badge}>{storyProgress}%</span>
            </div>
            <ProgressBar
              value={storyProgress}
              label={`${activeStage.title} progress`}
              tone="onDark"
            />
          </div>
        </section>

        <ol className={styles.timeline}>
          {JOURNEY_STAGES.map((stage, index) => {
            const isActive = stage.id === ACTIVE_JOURNEY_STAGE_ID;
            return (
              <li
                key={stage.id}
                className={`${styles.node} ${isActive ? styles.nodeActive : ""}`}
              >
                <span className={styles.rail} aria-hidden>
                  <span className={styles.dot} />
                  {index < JOURNEY_STAGES.length - 1 ? (
                    <span className={styles.line} />
                  ) : null}
                </span>
                <div className={styles.nodeBody}>
                  <div className={styles.nodeRow}>
                    <span className={styles.nodeTitle}>{stage.title}</span>
                    {isActive ? (
                      <span className={styles.badge}>{storyProgress}%</span>
                    ) : (
                      <span className={styles.later}>Later</span>
                    )}
                  </div>
                  {isActive ? (
                    <div className={styles.nodeBar}>
                      <ProgressBar
                        value={storyProgress}
                        label={`${stage.title} progress`}
                        compact
                      />
                    </div>
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
