import "server-only";
import { db } from "@/lib/db";
import type {
  LegacySection,
  StoryArea,
  StoryEvidenceRecord,
  StyleProfile,
} from "@/lib/db/types";
import { computeStatus, STATUS_SCORE } from "@/lib/story/config";
import { validateArtifact } from "./validate";
import { runExtraction } from "./extract";

/**
 * The capture loop. Runs after a successful exchange:
 *   raw messages (persisted by the route) -> episodic + emotional state ->
 *   semantic candidates -> Story evidence -> Living Legacy -> style ->
 *   procedural (only on explicit correction). Raw source is never overwritten.
 */

const DETAILED = "detailed_first_person";

function defaultStoryRecord(
  clientId: string,
  area: StoryArea,
): StoryEvidenceRecord {
  return {
    client_id: clientId,
    area,
    status: "empty",
    coverage_score: 0,
    evidence_count: 0,
    source_ids: [],
    last_updated_at: null,
  };
}

async function updateStoryArea(
  clientId: string,
  area: StoryArea,
  strength: "mention" | typeof DETAILED,
  sourceId: string,
): Promise<void> {
  const rec = (await db.getStoryArea(clientId, area)) ??
    defaultStoryRecord(clientId, area);
  const ids = new Set(rec.source_ids);
  ids.add(sourceId);
  if (strength === DETAILED) ids.add(`detailed:${sourceId}`);

  const all = [...ids];
  const spans = all.filter((id) => !id.startsWith("detailed:"));
  const hasDetailed = all.some((id) => id.startsWith("detailed:"));

  const status = computeStatus({
    distinctSourceSpans: spans.length,
    hasDetailedFirstPerson: hasDetailed,
    hasUnresolvedContradiction: false,
  });

  await db.upsertStoryEvidence({
    client_id: clientId,
    area,
    status,
    coverage_score: STATUS_SCORE[status],
    evidence_count: spans.length,
    source_ids: all,
    last_updated_at: Date.now(),
  });
}

function mergeStyle(
  existing: StyleProfile | null,
  clientId: string,
  incoming: NonNullable<Awaited<ReturnType<typeof runExtraction>>>["style"],
  sourceId: string,
): StyleProfile {
  const base: StyleProfile =
    existing ?? {
      client_id: clientId,
      sentence_length: "",
      formality: "",
      directness: "",
      warmth: "",
      use_of_metaphor: "",
      preferred_vocabulary: [],
      avoided_phrases: [],
      rhythm_notes: "",
      sample_source_ids: [],
      last_updated_at: Date.now(),
    };
  if (!incoming) return base;
  const uniq = (a: string[]) => [...new Set(a)].slice(0, 24);
  return {
    ...base,
    sentence_length: incoming.sentence_length || base.sentence_length,
    formality: incoming.formality || base.formality,
    directness: incoming.directness || base.directness,
    warmth: incoming.warmth || base.warmth,
    use_of_metaphor: incoming.use_of_metaphor || base.use_of_metaphor,
    preferred_vocabulary: uniq([
      ...base.preferred_vocabulary,
      ...incoming.preferred_vocabulary,
    ]),
    avoided_phrases: uniq([...base.avoided_phrases, ...incoming.avoided_phrases]),
    rhythm_notes: incoming.rhythm_notes || base.rhythm_notes,
    sample_source_ids: uniq([...base.sample_source_ids, sourceId]),
    last_updated_at: Date.now(),
  };
}

export interface CaptureResult {
  legacyAddedSection: LegacySection | null;
  ok: boolean;
}

export async function captureExchange(input: {
  clientId: string;
  userMessageId: string;
  userText: string;
  assistantMessageId: string;
  assistantText: string;
}): Promise<CaptureResult> {
  const { clientId, userMessageId, userText, assistantText } = input;
  const extraction = await runExtraction(userText, assistantText);
  if (!extraction) return { legacyAddedSection: null, ok: false };

  // Episodic + emotional state.
  if (extraction.episodic) {
    await db.addEpisodic({
      client_id: clientId,
      occurred_at: Date.now(),
      summary: extraction.episodic.summary,
      emotional_state: extraction.episodic.emotional_state,
      source_message_ids: [userMessageId],
      source_file_ids: [],
    });
  }

  // Semantic candidates: never silently overwrite an active conclusion.
  const active = await db.listSemantic(clientId, { status: "active" });
  for (const cand of extraction.semantic_candidates) {
    const conflictExists = active.some(
      (m) =>
        m.category.toLowerCase() === cand.category.toLowerCase() &&
        m.statement.trim().toLowerCase() !== cand.statement.trim().toLowerCase(),
    );
    const sameExists = active.some(
      (m) =>
        m.statement.trim().toLowerCase() === cand.statement.trim().toLowerCase(),
    );
    if (sameExists) continue;
    await db.addSemantic({
      client_id: clientId,
      category: cand.category,
      statement: cand.statement,
      confidence: cand.confidence,
      // Conflicts stay as candidates for later confirmation, not auto-applied.
      status: conflictExists ? "candidate" : "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: [userMessageId],
      supersedes_id: null,
      last_confirmed_at: conflictExists ? null : Date.now(),
    });
  }

  // Story evidence.
  const hasDetailedAnywhere = extraction.story_areas.some(
    (a) => a.strength === DETAILED,
  );
  for (const a of extraction.story_areas) {
    await updateStoryArea(clientId, a.area, a.strength, userMessageId);
  }

  // Living Legacy: validate that every sentence has a source before storing.
  let legacyAddedSection: LegacySection | null = null;
  if (extraction.legacy_candidate) {
    const sentences = extraction.legacy_candidate.content
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text, sourceIds: [userMessageId] }));
    const validated = validateArtifact(sentences);
    const content = validated.supportedStatements.join(" ");
    if (content) {
      await db.addLegacyEntry({
        client_id: clientId,
        section: extraction.legacy_candidate.section,
        title: extraction.legacy_candidate.title,
        content,
        source_ids: [userMessageId],
        evidence_status: hasDetailedAnywhere ? "verified" : "supported",
      });
      legacyAddedSection = extraction.legacy_candidate.section;
    }
  }

  // Style profile.
  if (extraction.style) {
    const existing = await db.getStyleProfile(clientId);
    await db.upsertStyleProfile(
      mergeStyle(existing, clientId, extraction.style, userMessageId),
    );
  }

  // Procedural memory only on explicit correction; strictly client-scoped.
  if (extraction.correction) {
    await db.addProcedural({
      client_id: clientId,
      trigger: extraction.correction.trigger,
      mistake: extraction.correction.mistake,
      correction: extraction.correction.correction,
      rule: extraction.correction.rule,
      source_message_id: userMessageId,
      status: "active",
    });
  }

  return { legacyAddedSection, ok: true };
}
