import { z } from "zod";

/**
 * Domain types for the Client Instrument.
 *
 * Every client-owned record carries `client_id`. The StorageAdapter is the only
 * place that reads/writes these; all access is filtered by client_id so it is
 * safe to provision isolated Supabase projects per client later.
 */

export type EvidenceStatus = "empty" | "emerging" | "supported" | "verified";
export type LegacyStatus = "emerging" | "supported" | "verified";
export type SemanticStatus = "candidate" | "active" | "stale" | "superseded";
export type ProceduralStatus = "active" | "retired";
export type FileStatus = "pending" | "processing" | "indexed" | "failed";

/** The twelve fixed Story evidence areas. */
export const STORY_AREAS = [
  "transition_context",
  "identity_beyond_title",
  "career_chapters",
  "defining_moments",
  "challenges_and_recovery",
  "judgment_and_strengths",
  "values_and_non_negotiables",
  "impact_and_proof",
  "relationships_and_influences",
  "future_direction",
  "voice_and_language",
  "tensions_and_contradictions",
] as const;
export type StoryArea = (typeof STORY_AREAS)[number];

/** The eight fixed Living Legacy map sections. */
export const LEGACY_SECTIONS = [
  "personal_philosophy",
  "defining_stories",
  "judgment_and_decisions",
  "courage_and_turning_points",
  "work_and_contribution",
  "people_and_relationships",
  "places_and_experiences",
  "future_legacy",
] as const;
export type LegacySection = (typeof LEGACY_SECTIONS)[number];

export const LEGACY_SECTION_LABELS: Record<LegacySection, string> = {
  personal_philosophy: "Personal Philosophy",
  defining_stories: "Defining Stories",
  judgment_and_decisions: "Judgment and Decisions",
  courage_and_turning_points: "Courage and Turning Points",
  work_and_contribution: "Work and Contribution",
  people_and_relationships: "People and Relationships",
  places_and_experiences: "Places and Experiences",
  future_legacy: "Future Legacy",
};

export interface Client {
  id: string;
  preferred_name: string | null;
  created_at: number;
}

export interface ClientMembership {
  id: string;
  client_id: string;
  user_key: string; // opaque session subject
  role: string;
  created_at: number;
}

export interface Conversation {
  id: string;
  client_id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface StoredMessage {
  id: string;
  client_id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: number;
}

export interface EventRecord {
  id: string;
  client_id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: number;
}

export interface EpisodicMemory {
  id: string;
  client_id: string;
  occurred_at: number;
  summary: string;
  emotional_state: string;
  source_message_ids: string[];
  source_file_ids: string[];
  created_at: number;
}

export interface SemanticMemory {
  id: string;
  client_id: string;
  category: string;
  statement: string;
  confidence: number;
  status: SemanticStatus;
  valid_from: number;
  valid_to: number | null;
  source_ids: string[];
  supersedes_id: string | null;
  last_confirmed_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface ProceduralMemory {
  id: string;
  client_id: string;
  trigger: string;
  mistake: string;
  correction: string;
  rule: string;
  source_message_id: string | null;
  status: ProceduralStatus;
  created_at: number;
  updated_at: number;
}

export interface StyleProfile {
  client_id: string;
  sentence_length: string;
  formality: string;
  directness: string;
  warmth: string;
  use_of_metaphor: string;
  preferred_vocabulary: string[];
  avoided_phrases: string[];
  rhythm_notes: string;
  sample_source_ids: string[];
  last_updated_at: number;
}

export interface UploadedFile {
  id: string;
  client_id: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
  status: FileStatus;
  note: string | null;
  created_at: number;
}

export interface DocumentChunk {
  id: string;
  client_id: string;
  file_id: string;
  ordinal: number;
  content: string;
  section: string | null;
  page: number | null;
  created_at: number;
}

export interface StoryEvidenceRecord {
  client_id: string;
  area: StoryArea;
  status: EvidenceStatus;
  coverage_score: number;
  evidence_count: number;
  source_ids: string[];
  last_updated_at: number | null;
}

export interface LegacyEntry {
  id: string;
  client_id: string;
  section: LegacySection;
  title: string;
  content: string;
  source_ids: string[];
  evidence_status: LegacyStatus;
  created_at: number;
  updated_at: number;
}

/** Privacy-safe run metadata only. Never stores prompt/response/private text. */
export interface AiRun {
  id: string;
  client_id: string;
  skill: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number;
  status: "ok" | "error";
  error_category: string | null;
  created_at: number;
}

// ---- Zod schemas for model-generated extraction boundaries ----------------

export const EmotionalStateSchema = z.string().min(1).max(60);

export const ExtractionSchema = z.object({
  episodic: z
    .object({
      summary: z.string().min(1).max(400),
      emotional_state: EmotionalStateSchema,
    })
    .nullable(),
  semantic_candidates: z
    .array(
      z.object({
        category: z.string().min(1).max(40),
        statement: z.string().min(1).max(300),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(6)
    .default([]),
  story_areas: z
    .array(
      z.object({
        area: z.enum(STORY_AREAS),
        // Strength of first-person evidence in THIS exchange for the area.
        strength: z.enum(["mention", "detailed_first_person"]),
      }),
    )
    .max(12)
    .default([]),
  legacy_candidate: z
    .object({
      section: z.enum(LEGACY_SECTIONS),
      title: z.string().min(1).max(80),
      content: z.string().min(1).max(500),
    })
    .nullable()
    .default(null),
  correction: z
    .object({
      trigger: z.string().min(1).max(200),
      mistake: z.string().min(1).max(200),
      correction: z.string().min(1).max(200),
      rule: z.string().min(1).max(240),
    })
    .nullable()
    .default(null),
  style: z
    .object({
      sentence_length: z.string().max(40),
      formality: z.string().max(40),
      directness: z.string().max(40),
      warmth: z.string().max(40),
      use_of_metaphor: z.string().max(40),
      preferred_vocabulary: z.array(z.string().max(40)).max(12).default([]),
      avoided_phrases: z.array(z.string().max(60)).max(12).default([]),
      rhythm_notes: z.string().max(200).default(""),
    })
    .nullable()
    .default(null),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
