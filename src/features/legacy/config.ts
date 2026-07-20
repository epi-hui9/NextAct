import type { LegacySection, LegacyStatus } from "@/server/db/types";
import { LEGACY_SECTION_LABELS } from "@/server/db/types";

/**
 * Deterministic Living Legacy map fill.
 *
 * Fill is a pure function of entry counts by status. Verified entries drive
 * completion; supported entries add a little fill but can never complete a
 * section on their own.
 */

export interface SectionCounts {
  verified: number;
  supported: number;
}

const SUPPORTED_BONUS_EACH = 8;
const SUPPORTED_BONUS_CAP = 20;
/** Ceiling for a section that has no verified entry that fully completes it. */
const UNVERIFIED_CEILING = 95;

/** Fill percentage (0..100) for one section, deterministic. */
export function sectionFill(counts: SectionCounts): number {
  const verified = Math.max(0, counts.verified);
  const supported = Math.max(0, counts.supported);

  if (verified >= 3) return 100;

  const base = verified === 0 ? 0 : verified === 1 ? 35 : 65;
  const bonus = Math.min(supported * SUPPORTED_BONUS_EACH, SUPPORTED_BONUS_CAP);
  return Math.min(base + bonus, UNVERIFIED_CEILING);
}

/** Count entries by status into the two buckets that affect fill. */
export function countsFromStatuses(statuses: LegacyStatus[]): SectionCounts {
  let verified = 0;
  let supported = 0;
  for (const s of statuses) {
    if (s === "verified") verified += 1;
    else if (s === "supported") supported += 1;
  }
  return { verified, supported };
}

/** A warm home-screen update line for a section that just changed. */
export function sectionUpdateLine(section: LegacySection): string {
  const label = LEGACY_SECTION_LABELS[section];
  return `Your ${label} is beginning to take shape.`;
}
