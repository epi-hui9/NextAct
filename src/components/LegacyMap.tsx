"use client";

import { useEffect, useMemo, useState } from "react";
import TreeMark from "./TreeMark";
import type { TreeStage } from "@/lib/story/tree";
import { LEGACY_SECTIONS, type LegacySection } from "@/lib/db/types";
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

function slugToSection(slug: string | null): LegacySection | null {
  if (!slug) return null;
  const key = slug.replace(/-/g, "_") as LegacySection;
  return (LEGACY_SECTIONS as readonly string[]).includes(key) ? key : null;
}

function sectionToSlug(section: string): string {
  return section.replace(/_/g, "-");
}

/** Short labels so puzzle tiles stay readable. */
const TILE_LABELS: Record<LegacySection, string> = {
  personal_philosophy: "Philosophy",
  defining_stories: "Stories",
  judgment_and_decisions: "Judgment",
  courage_and_turning_points: "Courage",
  work_and_contribution: "Work",
  people_and_relationships: "People",
  places_and_experiences: "Places",
  future_legacy: "Future",
};

function PuzzlePiece({
  filled,
  index,
}: {
  filled: boolean;
  index: number;
}) {
  // Eight interlocking silhouettes: tab/blank variation by index.
  const tabs = [
    "M4 20 V8 H8 C8 4 16 4 16 8 H28 V12 C32 12 32 20 28 20 H16 C16 24 8 24 8 20 Z",
    "M4 20 V12 C0 12 0 4 4 4 H16 C16 0 24 0 24 4 H28 V20 H16 C16 24 8 24 8 20 Z",
    "M4 20 V8 H8 C8 4 16 4 16 8 H28 V20 H24 C24 24 16 24 16 20 H4 Z",
    "M4 16 V4 H16 C16 0 24 0 24 4 H28 V20 H16 C16 24 8 24 8 20 H4 C0 20 0 12 4 12 Z",
    "M4 20 V8 H16 C16 4 24 4 24 8 H28 V20 H16 C16 24 8 24 8 20 Z",
    "M4 20 V4 H16 C16 0 24 0 24 4 H28 V12 C32 12 32 20 28 20 H8 C8 24 0 24 0 20 Z",
    "M4 20 V8 H8 C8 4 16 4 16 8 H28 V20 H4 Z",
    "M4 16 V4 H28 V20 H16 C16 24 8 24 8 20 H4 C0 20 0 12 4 12 Z",
  ];
  const d = tabs[index % tabs.length];
  return (
    <svg
      className={styles.pieceSvg}
      viewBox="0 0 32 28"
      aria-hidden
    >
      <path
        d={d}
        className={filled ? styles.pieceFilled : styles.pieceEmpty}
      />
    </svg>
  );
}

export default function LegacyMap({
  active,
  nonce,
  sectionSlug,
  onSectionChange,
}: {
  active: boolean;
  nonce: number;
  sectionSlug: string | null;
  onSectionChange: (slug: string | null) => void;
}) {
  const [sections, setSections] = useState<MapSection[]>([]);
  const [treeStage, setTreeStage] = useState<TreeStage>(0);
  const [treeSummary, setTreeSummary] = useState("Seed");

  const selectedKey = slugToSection(sectionSlug);
  const selected = useMemo(
    () => sections.find((s) => s.section === selectedKey) ?? null,
    [sections, selectedKey],
  );

  const placed = sections.filter((s) => s.fill >= 35).length;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/legacy", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch("/api/state", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([legacy, state]) => {
        if (cancelled) return;
        if (legacy?.sections) setSections(legacy.sections as MapSection[]);
        if (state?.treeStage != null) setTreeStage(state.treeStage as TreeStage);
        if (state?.treeSummary) setTreeSummary(String(state.treeSummary));
      })
      .catch(() => {
        /* keep last known */
      });
    return () => {
      cancelled = true;
    };
  }, [active, nonce]);

  useEffect(() => {
    if (!sectionSlug) return;
    if (slugToSection(sectionSlug) == null) onSectionChange(null);
  }, [sectionSlug, onSectionChange]);

  if (selected) {
    return (
      <div className={styles.scroll}>
        <div className={styles.detailInner}>
          <button
            type="button"
            className={styles.back}
            onClick={() => onSectionChange(null)}
          >
            Back to Living Legacy
          </button>
          <h1 className={styles.detailTitle}>{selected.label}</h1>
          {selected.entries.length === 0 ? (
            <p className={styles.empty}>Nothing gathered here yet.</p>
          ) : (
            <ul className={styles.entries}>
              {selected.entries.map((e, i) => (
                <li key={`${e.title}-${i}`} className={styles.entry}>
                  <p className={styles.entryTitle}>{e.title}</p>
                  <p className={styles.entryContent}>{e.content}</p>
                  <p className={styles.entryDate}>{fmtDate(e.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <h1 className={styles.heading}>Living Legacy</h1>
        <p className={styles.sub}>{treeSummary}</p>

        <div className={styles.treeHero} aria-live="polite">
          <TreeMark stage={treeStage} size={160} animate />
        </div>

        <p className={styles.puzzleHint}>
          {placed === 0
            ? "Eight pieces. Each chapter you name locks one into place."
            : `${placed} of 8 pieces placed.`}
        </p>

        <div className={styles.puzzle} role="list" aria-label="Legacy puzzle">
          {sections.map((s, i) => {
            const filled = s.fill >= 35;
            const complete = s.fill >= 100;
            const label =
              TILE_LABELS[s.section as LegacySection] ?? s.label;
            return (
              <button
                key={s.section}
                type="button"
                role="listitem"
                className={`${styles.tile} ${filled ? styles.tileFilled : ""} ${complete ? styles.tileComplete : ""}`}
                onClick={() => onSectionChange(sectionToSlug(s.section))}
                aria-label={`${s.label}, ${Math.round(s.fill)} percent`}
              >
                <PuzzlePiece filled={filled} index={i} />
                <span className={styles.tileLabel}>{label}</span>
                {filled ? (
                  <span className={styles.tilePct}>{Math.round(s.fill)}%</span>
                ) : (
                  <span className={styles.tileOpen}>Open</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
