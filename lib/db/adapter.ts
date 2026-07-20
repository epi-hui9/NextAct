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

/**
 * The single persistence boundary. Every method is scoped by `client_id` so no
 * caller can reach across tenants. A Supabase-backed adapter can implement this
 * exact interface later without touching any feature code.
 */
export interface StorageAdapter {
  /** Human-readable label for the final report ("demo" vs "supabase"). */
  readonly kind: "demo" | "supabase";

  getClient(clientId: string): Promise<Client | null>;
  ensureClient(clientId: string, preferredName: string | null): Promise<Client>;
  setPreferredName(clientId: string, name: string): Promise<void>;

  createConversation(
    clientId: string,
    title: string,
    id?: string,
  ): Promise<Conversation>;
  getConversation(clientId: string, id: string): Promise<Conversation | null>;
  touchConversation(clientId: string, id: string): Promise<void>;

  addMessage(msg: Omit<StoredMessage, "created_at">): Promise<StoredMessage>;
  getMessage(clientId: string, id: string): Promise<StoredMessage | null>;
  listMessages(clientId: string, conversationId: string): Promise<StoredMessage[]>;

  addEvent(ev: Omit<EventRecord, "id" | "created_at">): Promise<EventRecord>;

  addEpisodic(
    m: Omit<EpisodicMemory, "id" | "created_at">,
  ): Promise<EpisodicMemory>;
  listEpisodic(clientId: string): Promise<EpisodicMemory[]>;

  addSemantic(
    m: Omit<SemanticMemory, "id" | "created_at" | "updated_at">,
  ): Promise<SemanticMemory>;
  listSemantic(
    clientId: string,
    opts?: { status?: SemanticMemory["status"] },
  ): Promise<SemanticMemory[]>;
  supersedeSemantic(
    clientId: string,
    oldId: string,
    newId: string | null,
    nextStatus: "stale" | "superseded",
  ): Promise<void>;

  addProcedural(
    m: Omit<ProceduralMemory, "id" | "created_at" | "updated_at">,
  ): Promise<ProceduralMemory>;
  listProcedural(
    clientId: string,
    opts?: { status?: ProceduralMemory["status"] },
  ): Promise<ProceduralMemory[]>;

  getStyleProfile(clientId: string): Promise<StyleProfile | null>;
  upsertStyleProfile(profile: StyleProfile): Promise<StyleProfile>;

  addFile(f: Omit<UploadedFile, "created_at">): Promise<UploadedFile>;
  updateFile(
    clientId: string,
    id: string,
    patch: Partial<Pick<UploadedFile, "status" | "note">>,
  ): Promise<void>;
  getFile(clientId: string, id: string): Promise<UploadedFile | null>;
  listFiles(clientId: string): Promise<UploadedFile[]>;

  addChunks(chunks: Omit<DocumentChunk, "created_at">[]): Promise<void>;
  listChunks(clientId: string): Promise<DocumentChunk[]>;

  getStoryEvidence(clientId: string): Promise<StoryEvidenceRecord[]>;
  upsertStoryEvidence(rec: StoryEvidenceRecord): Promise<void>;
  getStoryArea(
    clientId: string,
    area: StoryArea,
  ): Promise<StoryEvidenceRecord | null>;

  addLegacyEntry(
    e: Omit<LegacyEntry, "id" | "created_at" | "updated_at">,
  ): Promise<LegacyEntry>;
  listLegacyEntries(clientId: string): Promise<LegacyEntry[]>;

  addAiRun(r: Omit<AiRun, "id" | "created_at">): Promise<void>;

  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(input: {
    user_id: string;
    client_id: string;
    preferred_name?: string | null;
    timezone?: string;
    reminder_enabled?: boolean;
  }): Promise<Profile>;
  setOnboardingComplete(userId: string): Promise<void>;
  setReminderPrefs(
    userId: string,
    prefs: { enabled: boolean; timezone: string },
  ): Promise<void>;

  listPushSubscriptions(userId: string): Promise<PushSubscriptionRecord[]>;
  upsertPushSubscription(input: {
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent?: string | null;
  }): Promise<PushSubscriptionRecord>;
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;

  setConversationPrompt(
    clientId: string,
    conversationId: string,
    prompt: string,
  ): Promise<void>;
  getConversationPrompt(
    clientId: string,
    conversationId: string,
  ): Promise<string | null>;
}
