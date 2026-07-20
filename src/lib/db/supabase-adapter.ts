import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import type { StorageAdapter } from "./adapter";
import type {
  AiRun,
  Client,
  Conversation,
  DocumentChunk,
  EpisodicMemory,
  EventRecord,
  LegacyEntry,
  ProceduralMemory,
  Profile,
  PushSubscriptionRecord,
  SemanticMemory,
  StoredMessage,
  StoryArea,
  StoryEvidenceRecord,
  StyleProfile,
  UploadedFile,
} from "./types";

type Timestamptz = string | null | undefined;

function toMs(ts: Timestamptz): number | null {
  if (ts == null) return null;
  return new Date(ts).getTime();
}

function requireMs(ts: Timestamptz, label: string): number {
  const ms = toMs(ts);
  if (ms == null) throw new Error(`${label}: missing timestamp`);
  return ms;
}

function toIso(ms: number | null | undefined): string | null {
  if (ms == null) return null;
  return new Date(ms).toISOString();
}

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

function mapClient(row: {
  id: string;
  preferred_name: string | null;
  created_at: string;
}): Client {
  return {
    id: row.id,
    preferred_name: row.preferred_name,
    created_at: requireMs(row.created_at, "clients.created_at"),
  };
}

function mapConversation(row: {
  id: string;
  client_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}): Conversation {
  return {
    id: row.id,
    client_id: row.client_id,
    title: row.title,
    created_at: requireMs(row.created_at, "conversations.created_at"),
    updated_at: requireMs(row.updated_at, "conversations.updated_at"),
  };
}

function mapMessage(row: {
  id: string;
  client_id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}): StoredMessage {
  return {
    id: row.id,
    client_id: row.client_id,
    conversation_id: row.conversation_id,
    role: row.role as StoredMessage["role"],
    content: row.content,
    created_at: requireMs(row.created_at, "messages.created_at"),
  };
}

function mapEvent(row: {
  id: string;
  client_id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
}): EventRecord {
  return {
    id: row.id,
    client_id: row.client_id,
    type: row.type,
    data: row.data ?? {},
    created_at: requireMs(row.created_at, "events.created_at"),
  };
}

function mapEpisodic(row: {
  id: string;
  client_id: string;
  occurred_at: string;
  summary: string;
  emotional_state: string;
  source_message_ids: string[];
  source_file_ids: string[];
  created_at: string;
}): EpisodicMemory {
  return {
    id: row.id,
    client_id: row.client_id,
    occurred_at: requireMs(row.occurred_at, "episodic_memories.occurred_at"),
    summary: row.summary,
    emotional_state: row.emotional_state,
    source_message_ids: row.source_message_ids ?? [],
    source_file_ids: row.source_file_ids ?? [],
    created_at: requireMs(row.created_at, "episodic_memories.created_at"),
  };
}

function mapSemantic(row: {
  id: string;
  client_id: string;
  category: string;
  statement: string;
  confidence: number;
  status: string;
  valid_from: string;
  valid_to: string | null;
  source_ids: string[];
  supersedes_id: string | null;
  last_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}): SemanticMemory {
  return {
    id: row.id,
    client_id: row.client_id,
    category: row.category,
    statement: row.statement,
    confidence: row.confidence,
    status: row.status as SemanticMemory["status"],
    valid_from: requireMs(row.valid_from, "semantic_memories.valid_from"),
    valid_to: toMs(row.valid_to),
    source_ids: row.source_ids ?? [],
    supersedes_id: row.supersedes_id,
    last_confirmed_at: toMs(row.last_confirmed_at),
    created_at: requireMs(row.created_at, "semantic_memories.created_at"),
    updated_at: requireMs(row.updated_at, "semantic_memories.updated_at"),
  };
}

function mapProcedural(row: {
  id: string;
  client_id: string;
  trigger: string;
  mistake: string;
  correction: string;
  rule: string;
  source_message_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}): ProceduralMemory {
  return {
    id: row.id,
    client_id: row.client_id,
    trigger: row.trigger,
    mistake: row.mistake,
    correction: row.correction,
    rule: row.rule,
    source_message_id: row.source_message_id,
    status: row.status as ProceduralMemory["status"],
    created_at: requireMs(row.created_at, "procedural_memories.created_at"),
    updated_at: requireMs(row.updated_at, "procedural_memories.updated_at"),
  };
}

function mapStyleProfile(row: {
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
  last_updated_at: string;
}): StyleProfile {
  return {
    client_id: row.client_id,
    sentence_length: row.sentence_length,
    formality: row.formality,
    directness: row.directness,
    warmth: row.warmth,
    use_of_metaphor: row.use_of_metaphor,
    preferred_vocabulary: row.preferred_vocabulary ?? [],
    avoided_phrases: row.avoided_phrases ?? [],
    rhythm_notes: row.rhythm_notes,
    sample_source_ids: row.sample_source_ids ?? [],
    last_updated_at: requireMs(row.last_updated_at, "style_profiles.last_updated_at"),
  };
}

function mapUploadedFile(row: {
  id: string;
  client_id: string;
  path: string;
  filename: string;
  mime: string;
  size: number | string;
  status: string;
  note: string | null;
  created_at: string;
}): UploadedFile {
  return {
    id: row.id,
    client_id: row.client_id,
    path: row.path,
    filename: row.filename,
    mime: row.mime,
    size: Number(row.size),
    status: row.status as UploadedFile["status"],
    note: row.note,
    created_at: requireMs(row.created_at, "uploaded_files.created_at"),
  };
}

function mapDocumentChunk(row: {
  id: string;
  client_id: string;
  file_id: string;
  ordinal: number;
  content: string;
  section: string | null;
  page: number | null;
  created_at: string;
}): DocumentChunk {
  return {
    id: row.id,
    client_id: row.client_id,
    file_id: row.file_id,
    ordinal: row.ordinal,
    content: row.content,
    section: row.section,
    page: row.page,
    created_at: requireMs(row.created_at, "document_chunks.created_at"),
  };
}

function mapStoryEvidence(row: {
  client_id: string;
  area: string;
  status: string;
  coverage_score: number;
  evidence_count: number;
  source_ids: string[];
  last_updated_at: string | null;
}): StoryEvidenceRecord {
  return {
    client_id: row.client_id,
    area: row.area as StoryArea,
    status: row.status as StoryEvidenceRecord["status"],
    coverage_score: row.coverage_score,
    evidence_count: row.evidence_count,
    source_ids: row.source_ids ?? [],
    last_updated_at: toMs(row.last_updated_at),
  };
}

function mapLegacyEntry(row: {
  id: string;
  client_id: string;
  section: string;
  title: string;
  content: string;
  source_ids: string[];
  evidence_status: string;
  created_at: string;
  updated_at: string;
}): LegacyEntry {
  return {
    id: row.id,
    client_id: row.client_id,
    section: row.section as LegacyEntry["section"],
    title: row.title,
    content: row.content,
    source_ids: row.source_ids ?? [],
    evidence_status: row.evidence_status as LegacyEntry["evidence_status"],
    created_at: requireMs(row.created_at, "legacy_entries.created_at"),
    updated_at: requireMs(row.updated_at, "legacy_entries.updated_at"),
  };
}

function mapProfile(row: {
  user_id: string;
  client_id: string;
  preferred_name: string | null;
  onboarding_completed_at: string | null;
  timezone: string;
  reminder_enabled: boolean;
  reminder_last_sent_local_date: string | null;
  created_at: string;
  updated_at: string;
}): Profile {
  return {
    user_id: row.user_id,
    client_id: row.client_id,
    preferred_name: row.preferred_name,
    onboarding_completed_at: toMs(row.onboarding_completed_at),
    timezone: row.timezone,
    reminder_enabled: row.reminder_enabled,
    reminder_last_sent_local_date: row.reminder_last_sent_local_date,
    created_at: requireMs(row.created_at, "profiles.created_at"),
    updated_at: requireMs(row.updated_at, "profiles.updated_at"),
  };
}

function mapPushSubscription(row: {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}): PushSubscriptionRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    user_agent: row.user_agent,
    created_at: requireMs(row.created_at, "push_subscriptions.created_at"),
    updated_at: requireMs(row.updated_at, "push_subscriptions.updated_at"),
  };
}

function createAdapter(sb: SupabaseClient): StorageAdapter {
  return {
    kind: "supabase",

    async getClient(clientId) {
      const { data, error } = await sb
        .from("clients")
        .select("id, preferred_name, created_at")
        .eq("id", clientId)
        .maybeSingle();
      if (error) fail("getClient", error);
      return data ? mapClient(data) : null;
    },

    async ensureClient(clientId, preferredName) {
      const existing = await this.getClient(clientId);
      if (existing) return existing;

      const { data, error } = await sb
        .from("clients")
        .insert({ id: clientId, preferred_name: preferredName })
        .select("id, preferred_name, created_at")
        .single();
      if (error) fail("ensureClient", error);
      return mapClient(data);
    },

    async setPreferredName(clientId, name) {
      const { error } = await sb
        .from("clients")
        .update({ preferred_name: name })
        .eq("id", clientId);
      if (error) fail("setPreferredName", error);
    },

    async createConversation(clientId, title, id) {
      const row: Record<string, unknown> = {
        client_id: clientId,
        title,
      };
      if (id) row.id = id;

      const { data, error } = await sb
        .from("conversations")
        .insert(row)
        .select("*")
        .single();
      if (error) fail("createConversation", error);
      return mapConversation(data);
    },

    async getConversation(clientId, id) {
      const { data, error } = await sb
        .from("conversations")
        .select("*")
        .eq("client_id", clientId)
        .eq("id", id)
        .maybeSingle();
      if (error) fail("getConversation", error);
      return data ? mapConversation(data) : null;
    },

    async listConversations(clientId) {
      const { data, error } = await sb
        .from("conversations")
        .select("*")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false });
      if (error) fail("listConversations", error);
      return (data ?? []).map(mapConversation);
    },

    async touchConversation(clientId, id) {
      const { error } = await sb
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("client_id", clientId)
        .eq("id", id);
      if (error) fail("touchConversation", error);
    },

    async addMessage(msg) {
      const { data, error } = await sb
        .from("messages")
        .insert({
          id: msg.id,
          client_id: msg.client_id,
          conversation_id: msg.conversation_id,
          role: msg.role,
          content: msg.content,
        })
        .select("*")
        .single();
      if (error) fail("addMessage", error);
      return mapMessage(data);
    },

    async getMessage(clientId, id) {
      const { data, error } = await sb
        .from("messages")
        .select("*")
        .eq("client_id", clientId)
        .eq("id", id)
        .maybeSingle();
      if (error) fail("getMessage", error);
      return data ? mapMessage(data) : null;
    },

    async listMessages(clientId, conversationId) {
      const { data, error } = await sb
        .from("messages")
        .select("*")
        .eq("client_id", clientId)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) fail("listMessages", error);
      return (data ?? []).map(mapMessage);
    },

    async addEvent(ev) {
      const { data, error } = await sb
        .from("events")
        .insert({
          client_id: ev.client_id,
          type: ev.type,
          data: ev.data,
        })
        .select("*")
        .single();
      if (error) fail("addEvent", error);
      return mapEvent(data);
    },

    async addEpisodic(m) {
      const { data, error } = await sb
        .from("episodic_memories")
        .insert({
          client_id: m.client_id,
          occurred_at: toIso(m.occurred_at),
          summary: m.summary,
          emotional_state: m.emotional_state,
          source_message_ids: m.source_message_ids,
          source_file_ids: m.source_file_ids,
        })
        .select("*")
        .single();
      if (error) fail("addEpisodic", error);
      return mapEpisodic(data);
    },

    async listEpisodic(clientId) {
      const { data, error } = await sb
        .from("episodic_memories")
        .select("*")
        .eq("client_id", clientId)
        .order("occurred_at", { ascending: false });
      if (error) fail("listEpisodic", error);
      return (data ?? []).map(mapEpisodic);
    },

    async addSemantic(m) {
      const { data, error } = await sb
        .from("semantic_memories")
        .insert({
          client_id: m.client_id,
          category: m.category,
          statement: m.statement,
          confidence: m.confidence,
          status: m.status,
          valid_from: toIso(m.valid_from),
          valid_to: toIso(m.valid_to),
          source_ids: m.source_ids,
          supersedes_id: m.supersedes_id,
          last_confirmed_at: toIso(m.last_confirmed_at),
        })
        .select("*")
        .single();
      if (error) fail("addSemantic", error);
      return mapSemantic(data);
    },

    async listSemantic(clientId, opts) {
      let q = sb
        .from("semantic_memories")
        .select("*")
        .eq("client_id", clientId);
      if (opts?.status) q = q.eq("status", opts.status);
      const { data, error } = await q.order("updated_at", { ascending: false });
      if (error) fail("listSemantic", error);
      return (data ?? []).map(mapSemantic);
    },

    async supersedeSemantic(clientId, oldId, newId, nextStatus) {
      const { error } = await sb
        .from("semantic_memories")
        .update({
          status: nextStatus,
          valid_to: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(newId ? { supersedes_id: newId } : {}),
        })
        .eq("client_id", clientId)
        .eq("id", oldId);
      if (error) fail("supersedeSemantic", error);
    },

    async addProcedural(m) {
      const { data, error } = await sb
        .from("procedural_memories")
        .insert({
          client_id: m.client_id,
          trigger: m.trigger,
          mistake: m.mistake,
          correction: m.correction,
          rule: m.rule,
          source_message_id: m.source_message_id,
          status: m.status,
        })
        .select("*")
        .single();
      if (error) fail("addProcedural", error);
      return mapProcedural(data);
    },

    async listProcedural(clientId, opts) {
      let q = sb
        .from("procedural_memories")
        .select("*")
        .eq("client_id", clientId);
      if (opts?.status) q = q.eq("status", opts.status);
      const { data, error } = await q.order("updated_at", { ascending: false });
      if (error) fail("listProcedural", error);
      return (data ?? []).map(mapProcedural);
    },

    async getStyleProfile(clientId) {
      const { data, error } = await sb
        .from("style_profiles")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) fail("getStyleProfile", error);
      return data ? mapStyleProfile(data) : null;
    },

    async upsertStyleProfile(profile) {
      const { data, error } = await sb
        .from("style_profiles")
        .upsert(
          {
            client_id: profile.client_id,
            sentence_length: profile.sentence_length,
            formality: profile.formality,
            directness: profile.directness,
            warmth: profile.warmth,
            use_of_metaphor: profile.use_of_metaphor,
            preferred_vocabulary: profile.preferred_vocabulary,
            avoided_phrases: profile.avoided_phrases,
            rhythm_notes: profile.rhythm_notes,
            sample_source_ids: profile.sample_source_ids,
            last_updated_at: toIso(profile.last_updated_at),
          },
          { onConflict: "client_id" },
        )
        .select("*")
        .single();
      if (error) fail("upsertStyleProfile", error);
      return mapStyleProfile(data);
    },

    async addFile(f) {
      const { data, error } = await sb
        .from("uploaded_files")
        .insert({
          id: f.id,
          client_id: f.client_id,
          path: f.path,
          filename: f.filename,
          mime: f.mime,
          size: f.size,
          status: f.status,
          note: f.note,
        })
        .select("*")
        .single();
      if (error) fail("addFile", error);
      return mapUploadedFile(data);
    },

    async updateFile(clientId, id, patch) {
      const update: Record<string, unknown> = {};
      if (patch.status !== undefined) update.status = patch.status;
      if (patch.note !== undefined) update.note = patch.note;
      if (Object.keys(update).length === 0) return;

      const { error } = await sb
        .from("uploaded_files")
        .update(update)
        .eq("client_id", clientId)
        .eq("id", id);
      if (error) fail("updateFile", error);
    },

    async getFile(clientId, id) {
      const { data, error } = await sb
        .from("uploaded_files")
        .select("*")
        .eq("client_id", clientId)
        .eq("id", id)
        .maybeSingle();
      if (error) fail("getFile", error);
      return data ? mapUploadedFile(data) : null;
    },

    async listFiles(clientId) {
      const { data, error } = await sb
        .from("uploaded_files")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) fail("listFiles", error);
      return (data ?? []).map(mapUploadedFile);
    },

    async addChunks(chunks) {
      if (chunks.length === 0) return;
      const rows = chunks.map((c) => ({
        id: c.id,
        client_id: c.client_id,
        file_id: c.file_id,
        ordinal: c.ordinal,
        content: c.content,
        section: c.section,
        page: c.page,
      }));
      const { error } = await sb.from("document_chunks").insert(rows);
      if (error) fail("addChunks", error);
    },

    async listChunks(clientId) {
      const { data, error } = await sb
        .from("document_chunks")
        .select("id, client_id, file_id, ordinal, content, section, page, created_at")
        .eq("client_id", clientId);
      if (error) fail("listChunks", error);
      return (data ?? []).map(mapDocumentChunk);
    },

    async getStoryEvidence(clientId) {
      const { data, error } = await sb
        .from("story_evidence")
        .select("*")
        .eq("client_id", clientId);
      if (error) fail("getStoryEvidence", error);
      return (data ?? []).map(mapStoryEvidence);
    },

    async upsertStoryEvidence(rec) {
      const { error } = await sb.from("story_evidence").upsert(
        {
          client_id: rec.client_id,
          area: rec.area,
          status: rec.status,
          coverage_score: rec.coverage_score,
          evidence_count: rec.evidence_count,
          source_ids: rec.source_ids,
          last_updated_at: toIso(rec.last_updated_at),
        },
        { onConflict: "client_id,area" },
      );
      if (error) fail("upsertStoryEvidence", error);
    },

    async getStoryArea(clientId, area) {
      const { data, error } = await sb
        .from("story_evidence")
        .select("*")
        .eq("client_id", clientId)
        .eq("area", area)
        .maybeSingle();
      if (error) fail("getStoryArea", error);
      return data ? mapStoryEvidence(data) : null;
    },

    async addLegacyEntry(e) {
      const { data, error } = await sb
        .from("legacy_entries")
        .insert({
          client_id: e.client_id,
          section: e.section,
          title: e.title,
          content: e.content,
          source_ids: e.source_ids,
          evidence_status: e.evidence_status,
        })
        .select("*")
        .single();
      if (error) fail("addLegacyEntry", error);
      return mapLegacyEntry(data);
    },

    async listLegacyEntries(clientId) {
      const { data, error } = await sb
        .from("legacy_entries")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) fail("listLegacyEntries", error);
      return (data ?? []).map(mapLegacyEntry);
    },

    async addAiRun(r) {
      const { error } = await sb.from("ai_runs").insert({
        client_id: r.client_id,
        skill: r.skill,
        model: r.model,
        input_tokens: r.input_tokens,
        output_tokens: r.output_tokens,
        latency_ms: r.latency_ms,
        status: r.status,
        error_category: r.error_category,
      });
      if (error) fail("addAiRun", error);
    },

    async getProfile(userId) {
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) fail("getProfile", error);
      return data ? mapProfile(data) : null;
    },

    async upsertProfile(input) {
      const row: Record<string, unknown> = {
        user_id: input.user_id,
        client_id: input.client_id,
        updated_at: new Date().toISOString(),
      };
      if (input.preferred_name !== undefined) row.preferred_name = input.preferred_name;
      if (input.timezone !== undefined) row.timezone = input.timezone;
      if (input.reminder_enabled !== undefined) {
        row.reminder_enabled = input.reminder_enabled;
      }

      const { data, error } = await sb
        .from("profiles")
        .upsert(row, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) fail("upsertProfile", error);
      return mapProfile(data);
    },

    async setOnboardingComplete(userId) {
      const { error } = await sb
        .from("profiles")
        .update({
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) fail("setOnboardingComplete", error);
    },

    async setReminderPrefs(userId, prefs) {
      const { error } = await sb
        .from("profiles")
        .update({
          reminder_enabled: prefs.enabled,
          timezone: prefs.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) fail("setReminderPrefs", error);
    },

    async listPushSubscriptions(userId) {
      const { data, error } = await sb
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) fail("listPushSubscriptions", error);
      return (data ?? []).map(mapPushSubscription);
    },

    async upsertPushSubscription(input) {
      const { data, error } = await sb
        .from("push_subscriptions")
        .upsert(
          {
            user_id: input.user_id,
            endpoint: input.endpoint,
            p256dh: input.p256dh,
            auth: input.auth,
            user_agent: input.user_agent ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,endpoint" },
        )
        .select("*")
        .single();
      if (error) fail("upsertPushSubscription", error);
      return mapPushSubscription(data);
    },

    async deletePushSubscription(userId, endpoint) {
      const { error } = await sb
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint);
      if (error) fail("deletePushSubscription", error);
    },

    async setConversationPrompt(clientId, conversationId, prompt) {
      const { error } = await sb
        .from("conversations")
        .update({
          active_prompt: prompt,
          updated_at: new Date().toISOString(),
        })
        .eq("client_id", clientId)
        .eq("id", conversationId);
      if (error) fail("setConversationPrompt", error);
    },

    async getConversationPrompt(clientId, conversationId) {
      const { data, error } = await sb
        .from("conversations")
        .select("active_prompt")
        .eq("client_id", clientId)
        .eq("id", conversationId)
        .maybeSingle();
      if (error) fail("getConversationPrompt", error);
      const row = data as { active_prompt?: string | null } | null;
      return row?.active_prompt ?? null;
    },
  };
}

export function createSupabaseAdapter(): StorageAdapter {
  return createAdapter(createServiceClient());
}
