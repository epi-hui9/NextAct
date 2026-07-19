import type { EvidenceStatus, StoryArea } from "@/lib/db/types";
import { STORY_AREAS } from "@/lib/db/types";

/**
 * Deterministic Story progress model.
 *
 * This is the single configuration file for evidence weights and status math.
 * Progress is a pure function of stored statuses — the model can never invent
 * evidence to move the number. Never surfaced to the client as a checklist.
 */

export const STATUS_SCORE: Record<EvidenceStatus, number> = {
  empty: 0,
  emerging: 0.35,
  supported: 0.7,
  verified: 1,
};

/** Higher-value areas carry more weight in the progress average. */
export const AREA_WEIGHT: Record<StoryArea, number> = {
  transition_context: 2,
  identity_beyond_title: 2,
  career_chapters: 1,
  defining_moments: 2,
  challenges_and_recovery: 1,
  judgment_and_strengths: 2,
  values_and_non_negotiables: 2,
  impact_and_proof: 2,
  relationships_and_influences: 1,
  future_direction: 2,
  voice_and_language: 1,
  tensions_and_contradictions: 1,
};

/**
 * A private, natural invitation phrased for each area. Never shown as a
 * requirement; used to derive "one small thing for today" and to gently steer
 * the next question. Feels possible in ~10 minutes.
 */
export const AREA_INVITATION: Record<StoryArea, string> = {
  transition_context:
    "What's shifting for you right now, and what still feels unsettled about it?",
  identity_beyond_title:
    "When you set the title aside, how would you describe who you are?",
  career_chapters:
    "If your working life had chapters, what would you name the one that shaped you most?",
  defining_moments:
    "Tell me about a decision you made when the obvious answer felt wrong.",
  challenges_and_recovery:
    "Was there a season that tested you, and what did you carry out of it?",
  judgment_and_strengths:
    "What's a call only you could have made, that others might have gotten wrong?",
  values_and_non_negotiables:
    "What's a line you've never been willing to cross, even under pressure?",
  impact_and_proof:
    "Whose path changed because of something you built or decided?",
  relationships_and_influences:
    "Who shaped how you think, and what did they leave with you?",
  future_direction:
    "What would you like this next chapter to make possible?",
  voice_and_language:
    "Is there a phrase or idea you find yourself returning to again and again?",
  tensions_and_contradictions:
    "Is there something you once believed strongly that you see differently now?",
};

export interface StoryAreaState {
  area: StoryArea;
  status: EvidenceStatus;
}

/**
 * Weighted-average progress as a whole-number percentage.
 * progress = sum(weight * statusScore) / sum(weight), rounded.
 */
export function storyProgress(areas: StoryAreaState[]): number {
  const byArea = new Map<StoryArea, EvidenceStatus>();
  for (const a of areas) byArea.set(a.area, a.status);

  let weighted = 0;
  let totalWeight = 0;
  for (const area of STORY_AREAS) {
    const status = byArea.get(area) ?? "empty";
    const weight = AREA_WEIGHT[area];
    weighted += weight * STATUS_SCORE[status];
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weighted / totalWeight) * 100);
}

/**
 * Determine an area's status deterministically from evidence signals.
 *
 * - emerging: at least one relevant source.
 * - supported: at least two distinct source spans OR one detailed first-person
 *   account.
 * - verified: clear first-person evidence AND no unresolved contradiction.
 */
export function computeStatus(input: {
  distinctSourceSpans: number;
  hasDetailedFirstPerson: boolean;
  hasUnresolvedContradiction: boolean;
}): EvidenceStatus {
  const { distinctSourceSpans, hasDetailedFirstPerson, hasUnresolvedContradiction } =
    input;

  if (distinctSourceSpans <= 0) return "empty";

  const supported = distinctSourceSpans >= 2 || hasDetailedFirstPerson;

  if (supported && hasDetailedFirstPerson && !hasUnresolvedContradiction) {
    return "verified";
  }
  if (supported) return "supported";
  return "emerging";
}

/**
 * Pick the highest-value area still needing evidence, for the natural next
 * invitation. Prefers lower status, then higher weight, then fixed order.
 */
export function nextInvitationArea(areas: StoryAreaState[]): StoryArea {
  const byArea = new Map<StoryArea, EvidenceStatus>();
  for (const a of areas) byArea.set(a.area, a.status);

  const ranked = [...STORY_AREAS].sort((a, b) => {
    const sa = STATUS_SCORE[byArea.get(a) ?? "empty"];
    const sb = STATUS_SCORE[byArea.get(b) ?? "empty"];
    if (sa !== sb) return sa - sb; // lower coverage first
    if (AREA_WEIGHT[a] !== AREA_WEIGHT[b]) return AREA_WEIGHT[b] - AREA_WEIGHT[a];
    return STORY_AREAS.indexOf(a) - STORY_AREAS.indexOf(b);
  });
  return ranked[0];
}
