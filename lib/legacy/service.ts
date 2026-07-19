import "server-only";
import { db } from "@/lib/db";
import {
  LEGACY_SECTIONS,
  LEGACY_SECTION_LABELS,
  type LegacySection,
} from "@/lib/db/types";
import { countsFromStatuses, sectionFill, sectionUpdateLine } from "./config";

export interface LegacyMapEntry {
  title: string;
  content: string;
  status: string;
  created_at: number;
}

export interface LegacyMapSection {
  section: LegacySection;
  label: string;
  fill: number;
  entryCount: number;
  entries: LegacyMapEntry[];
}

export async function getLegacyMap(
  clientId: string,
): Promise<LegacyMapSection[]> {
  const all = await db.listLegacyEntries(clientId);
  return LEGACY_SECTIONS.map((section) => {
    const entries = all.filter((e) => e.section === section);
    const counts = countsFromStatuses(entries.map((e) => e.evidence_status));
    return {
      section,
      label: LEGACY_SECTION_LABELS[section],
      fill: sectionFill(counts),
      entryCount: entries.length,
      entries: entries.map((e) => ({
        title: e.title,
        content: e.content,
        status: e.evidence_status,
        created_at: e.created_at,
      })),
    };
  });
}

/** One quiet update line, or null when nothing has changed. */
export async function getLegacyUpdate(clientId: string): Promise<string | null> {
  const all = await db.listLegacyEntries(clientId);
  if (all.length === 0) return null;
  const latest = all.reduce((a, b) => (b.updated_at > a.updated_at ? b : a));
  return sectionUpdateLine(latest.section);
}
