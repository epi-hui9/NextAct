"use client";

import { useEffect, useMemo, useState } from "react";
import TreeMark from "./TreeMark";
import type { TreeStage } from "@/lib/story/tree";
import { LEGACY_SECTIONS, type LegacySection } from "@/lib/db/types";
import {
  LEGACY_PUZZLE_PIECES,
  PUZZLE_VIEWBOX,
} from "@/lib/legacy/puzzle-paths";
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
            Back to the archive
          </button>
          <h1 className={`serif ${styles.detailTitle}`}>{selected.label}</h1>
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

  const ordered =
    sections.length === 8
      ? sections
      : LEGACY_SECTIONS.map((key) => {
          const found = sections.find((s) => s.section === key);
          return (
            found ?? {
              section: key,
              label: TILE_LABELS[key],
              fill: 0,
              entryCount: 0,
              entries: [],
            }
          );
        });

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <h1 className={`serif ${styles.heading}`}>Living Legacy</h1>
        <p className={styles.sub}>{treeSummary}</p>

        <div className={styles.treeHero} aria-live="polite">
          <TreeMark stage={treeStage} size={120} animate />
        </div>

        <p className={styles.puzzleHint}>
          {placed === 0
            ? "One board. Eight pieces. Each chapter you name locks into place."
            : `${placed} of 8 pieces in place.`}
        </p>

        <div className={styles.boardWrap}>
          <svg
            className={styles.board}
            viewBox={PUZZLE_VIEWBOX}
            role="list"
            aria-label="Legacy puzzle"
          >
            {ordered.map((s, i) => {
              const piece = LEGACY_PUZZLE_PIECES[i];
              const filled = s.fill >= 35;
              const complete = s.fill >= 100;
              const label =
                TILE_LABELS[s.section as LegacySection] ?? s.label;
              const dimOthers = selectedKey != null;
              return (
                <g
                  key={s.section}
                  role="listitem"
                  className={`${styles.piece} ${filled ? styles.pieceOn : ""} ${complete ? styles.pieceDone : ""} ${dimOthers ? styles.pieceDim : ""}`}
                >
                  <path
                    d={piece.d}
                    className={styles.piecePath}
                    onClick={() => onSectionChange(sectionToSlug(s.section))}
                    tabIndex={0}
                    role="button"
                    aria-label={s.label}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSectionChange(sectionToSlug(s.section));
                      }
                    }}
                  />
                  <text
                    x={piece.cx}
                    y={piece.cy}
                    className={styles.pieceLabel}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
