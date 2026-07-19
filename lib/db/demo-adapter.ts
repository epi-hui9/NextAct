import "server-only";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
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
  SemanticMemory,
  StoredMessage,
  StoryArea,
  StoryEvidenceRecord,
  StyleProfile,
  UploadedFile,
} from "./types";

/**
 * Local demo persistence. In-memory maps, backed by a JSON file so data
 * survives across requests within a running server process. This is NOT
 * production privacy: it has no row-level security and lives on local disk.
 * The final report labels this clearly.
 */

interface Tables {
  clients: Client[];
  conversations: Conversation[];
  messages: StoredMessage[];
  events: EventRecord[];
  episodic: EpisodicMemory[];
  semantic: SemanticMemory[];
  procedural: ProceduralMemory[];
  styles: StyleProfile[];
  files: UploadedFile[];
  chunks: DocumentChunk[];
  story: StoryEvidenceRecord[];
  legacy: LegacyEntry[];
  aiRuns: AiRun[];
}

function emptyTables(): Tables {
  return {
    clients: [],
    conversations: [],
    messages: [],
    events: [],
    episodic: [],
    semantic: [],
    procedural: [],
    styles: [],
    files: [],
    chunks: [],
    story: [],
    legacy: [],
    aiRuns: [],
  };
}

const DATA_DIR = process.env.NEXTACT_DATA_DIR || join(tmpdir(), "nextact-demo");
const DATA_FILE = join(DATA_DIR, "store.json");

// Persist across hot reloads / route module instances within one process.
const globalKey = "__nextact_demo_db__";
type GlobalWithDb = typeof globalThis & { [globalKey]?: Tables };
const g = globalThis as GlobalWithDb;

function load(): Tables {
  if (g[globalKey]) return g[globalKey]!;
  let tables = emptyTables();
  try {
    if (existsSync(DATA_FILE)) {
      const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8")) as Partial<Tables>;
      tables = { ...emptyTables(), ...parsed };
    }
  } catch {
    tables = emptyTables();
  }
  g[globalKey] = tables;
  return tables;
}

const db = load();

function persist(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(db));
  } catch {
    // Best-effort only; in-memory copy remains authoritative for the session.
  }
}

const now = () => Date.now();
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const demoAdapter: StorageAdapter = {
  kind: "demo",

  async getClient(clientId) {
    return clone(db.clients.find((c) => c.id === clientId) ?? null);
  },

  async ensureClient(clientId, preferredName) {
    let c = db.clients.find((x) => x.id === clientId);
    if (!c) {
      c = { id: clientId, preferred_name: preferredName, created_at: now() };
      db.clients.push(c);
      persist();
    }
    return clone(c);
  },

  async setPreferredName(clientId, name) {
    const c = db.clients.find((x) => x.id === clientId);
    if (c) {
      c.preferred_name = name;
      persist();
    }
  },

  async createConversation(clientId, title, id) {
    const conv: Conversation = {
      id: id ?? randomUUID(),
      client_id: clientId,
      title,
      created_at: now(),
      updated_at: now(),
    };
    db.conversations.push(conv);
    persist();
    return clone(conv);
  },

  async getConversation(clientId, id) {
    return clone(
      db.conversations.find((c) => c.id === id && c.client_id === clientId) ??
        null,
    );
  },

  async touchConversation(clientId, id) {
    const c = db.conversations.find(
      (x) => x.id === id && x.client_id === clientId,
    );
    if (c) {
      c.updated_at = now();
      persist();
    }
  },

  async addMessage(msg) {
    const m: StoredMessage = { ...msg, created_at: now() };
    db.messages.push(m);
    persist();
    return clone(m);
  },

  async listMessages(clientId, conversationId) {
    return clone(
      db.messages
        .filter(
          (m) => m.client_id === clientId && m.conversation_id === conversationId,
        )
        .sort((a, b) => a.created_at - b.created_at),
    );
  },

  async addEvent(ev) {
    const e: EventRecord = { ...ev, id: randomUUID(), created_at: now() };
    db.events.push(e);
    persist();
    return clone(e);
  },

  async addEpisodic(m) {
    const rec: EpisodicMemory = { ...m, id: randomUUID(), created_at: now() };
    db.episodic.push(rec);
    persist();
    return clone(rec);
  },

  async listEpisodic(clientId) {
    return clone(
      db.episodic
        .filter((m) => m.client_id === clientId)
        .sort((a, b) => b.occurred_at - a.occurred_at),
    );
  },

  async addSemantic(m) {
    const rec: SemanticMemory = {
      ...m,
      id: randomUUID(),
      created_at: now(),
      updated_at: now(),
    };
    db.semantic.push(rec);
    persist();
    return clone(rec);
  },

  async listSemantic(clientId, opts) {
    return clone(
      db.semantic
        .filter(
          (m) =>
            m.client_id === clientId &&
            (!opts?.status || m.status === opts.status),
        )
        .sort((a, b) => b.updated_at - a.updated_at),
    );
  },

  async supersedeSemantic(clientId, oldId, newId, nextStatus) {
    const rec = db.semantic.find(
      (m) => m.id === oldId && m.client_id === clientId,
    );
    if (rec) {
      rec.status = nextStatus;
      rec.valid_to = now();
      rec.updated_at = now();
      if (newId) rec.supersedes_id = newId;
      persist();
    }
  },

  async addProcedural(m) {
    const rec: ProceduralMemory = {
      ...m,
      id: randomUUID(),
      created_at: now(),
      updated_at: now(),
    };
    db.procedural.push(rec);
    persist();
    return clone(rec);
  },

  async listProcedural(clientId, opts) {
    return clone(
      db.procedural
        .filter(
          (m) =>
            m.client_id === clientId &&
            (!opts?.status || m.status === opts.status),
        )
        .sort((a, b) => b.updated_at - a.updated_at),
    );
  },

  async getStyleProfile(clientId) {
    return clone(db.styles.find((s) => s.client_id === clientId) ?? null);
  },

  async upsertStyleProfile(profile) {
    const idx = db.styles.findIndex((s) => s.client_id === profile.client_id);
    if (idx >= 0) db.styles[idx] = profile;
    else db.styles.push(profile);
    persist();
    return clone(profile);
  },

  async addFile(f) {
    const rec: UploadedFile = { ...f, created_at: now() };
    db.files.push(rec);
    persist();
    return clone(rec);
  },

  async updateFile(clientId, id, patch) {
    const f = db.files.find((x) => x.id === id && x.client_id === clientId);
    if (f) {
      if (patch.status !== undefined) f.status = patch.status;
      if (patch.note !== undefined) f.note = patch.note;
      persist();
    }
  },

  async getFile(clientId, id) {
    return clone(
      db.files.find((f) => f.id === id && f.client_id === clientId) ?? null,
    );
  },

  async listFiles(clientId) {
    return clone(
      db.files
        .filter((f) => f.client_id === clientId)
        .sort((a, b) => b.created_at - a.created_at),
    );
  },

  async addChunks(chunks) {
    for (const c of chunks) db.chunks.push({ ...c, created_at: now() });
    persist();
  },

  async listChunks(clientId) {
    return clone(db.chunks.filter((c) => c.client_id === clientId));
  },

  async getStoryEvidence(clientId) {
    return clone(db.story.filter((s) => s.client_id === clientId));
  },

  async getStoryArea(clientId, area: StoryArea) {
    return clone(
      db.story.find((s) => s.client_id === clientId && s.area === area) ?? null,
    );
  },

  async upsertStoryEvidence(rec) {
    const idx = db.story.findIndex(
      (s) => s.client_id === rec.client_id && s.area === rec.area,
    );
    if (idx >= 0) db.story[idx] = rec;
    else db.story.push(rec);
    persist();
  },

  async addLegacyEntry(e) {
    const rec: LegacyEntry = {
      ...e,
      id: randomUUID(),
      created_at: now(),
      updated_at: now(),
    };
    db.legacy.push(rec);
    persist();
    return clone(rec);
  },

  async listLegacyEntries(clientId) {
    return clone(
      db.legacy
        .filter((l) => l.client_id === clientId)
        .sort((a, b) => b.created_at - a.created_at),
    );
  },

  async addAiRun(r) {
    db.aiRuns.push({ ...r, id: randomUUID(), created_at: now() });
    persist();
  },
};
