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

  return (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <h1 className={`serif ${styles.heading}`}>Living Legacy</h1>
        <p className={styles.sub}>{treeSummary}</p>

        <div className={styles.treeHero} aria-live="polite">
          <TreeMark stage={treeStage} size={200} animate />
        </div>

        <p className={styles.sub}>
          Chapters gather beneath the tree as your story becomes clear.
        </p>

        <div className={styles.landscape} role="list">
          {sections.map((s) => (
            <button
              key={s.section}
              type="button"
              role="listitem"
              className={styles.region}
              onClick={() => onSectionChange(sectionToSlug(s.section))}
            >
              <span
                className={styles.fill}
                style={{ opacity: Math.min(1, s.fill / 100) }}
                aria-hidden
              />
              <span className={styles.regionLabel}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
