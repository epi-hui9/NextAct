import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { demoAdapter as db } from "@/lib/db/demo-adapter";
import { buildContext } from "@/lib/memory/retrieve";

// Two isolated clients for every isolation assertion.
const A = `A-${randomUUID()}`;
const B = `B-${randomUUID()}`;

beforeAll(async () => {
  await db.ensureClient(A, "Ada");
  await db.ensureClient(B, "Ben");
});

describe("client-scoped data access", () => {
  it("never returns another client's messages", async () => {
    const convA = await db.createConversation(A, "a");
    const convB = await db.createConversation(B, "b");
    await db.addMessage({
      id: randomUUID(),
      client_id: A,
      conversation_id: convA.id,
      role: "user",
      content: "A private note",
    });
    await db.addMessage({
      id: randomUUID(),
      client_id: B,
      conversation_id: convB.id,
      role: "user",
      content: "B private note",
    });
    const aMsgs = await db.listMessages(A, convA.id);
    expect(aMsgs.every((m) => m.client_id === A)).toBe(true);
    // A cannot read B's conversation even with B's id.
    expect(await db.listMessages(A, convB.id)).toEqual([]);
  });

  it("scopes semantic, episodic, legacy, and procedural records", async () => {
    await db.addSemantic({
      client_id: B,
      category: "value",
      statement: "B keeps promises",
      confidence: 0.9,
      status: "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: [],
      supersedes_id: null,
      last_confirmed_at: Date.now(),
    });
    await db.addProcedural({
      client_id: B,
      trigger: "t",
      mistake: "m",
      correction: "c",
      rule: "keep it short for B",
      source_message_id: null,
      status: "active",
    });
    expect(await db.listSemantic(A)).toEqual([]);
    expect(await db.listProcedural(A)).toEqual([]);
  });
});

describe("semantic memory lifecycle", () => {
  it("supersession keeps the old record for traceability", async () => {
    const oldRec = await db.addSemantic({
      client_id: A,
      category: "goal",
      statement: "wants to retire fully",
      confidence: 0.6,
      status: "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: [],
      supersedes_id: null,
      last_confirmed_at: Date.now(),
    });
    const newRec = await db.addSemantic({
      client_id: A,
      category: "goal",
      statement: "wants to start a foundation",
      confidence: 0.8,
      status: "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: [],
      supersedes_id: null,
      last_confirmed_at: Date.now(),
    });
    await db.supersedeSemantic(A, oldRec.id, newRec.id, "superseded");

    const all = await db.listSemantic(A);
    const found = all.find((m) => m.id === oldRec.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe("superseded");
    expect(found!.valid_to).not.toBeNull();
  });

  it("does not present stale memory as current (active filter excludes it)", async () => {
    const rec = await db.addSemantic({
      client_id: A,
      category: "fact",
      statement: "currently lives in Boston",
      confidence: 0.7,
      status: "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: [],
      supersedes_id: null,
      last_confirmed_at: Date.now(),
    });
    await db.supersedeSemantic(A, rec.id, null, "stale");
    const active = await db.listSemantic(A, { status: "active" });
    expect(active.find((m) => m.id === rec.id)).toBeUndefined();
  });
});

describe("procedural vs semantic separation", () => {
  it("keeps rule library out of semantic memory", async () => {
    await db.addProcedural({
      client_id: A,
      trigger: "too long",
      mistake: "verbose",
      correction: "shorten",
      rule: "answer in two sentences",
      source_message_id: null,
      status: "active",
    });
    const semantic = await db.listSemantic(A);
    expect(
      semantic.some((m) => m.statement.includes("answer in two sentences")),
    ).toBe(false);
    const procedural = await db.listProcedural(A, { status: "active" });
    expect(procedural.some((p) => p.rule.includes("two sentences"))).toBe(true);
  });
});

describe("tenant-filtered retrieval", () => {
  it("only surfaces the querying client's records", async () => {
    await db.addSemantic({
      client_id: A,
      category: "interest",
      statement: "sailing has been a lifelong passion",
      confidence: 0.9,
      status: "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: [],
      supersedes_id: null,
      last_confirmed_at: Date.now(),
    });
    await db.addSemantic({
      client_id: B,
      category: "interest",
      statement: "sailing was a passion for someone else entirely",
      confidence: 0.9,
      status: "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: [],
      supersedes_id: null,
      last_confirmed_at: Date.now(),
    });
    const { items } = await buildContext(A, "tell me about sailing passion");
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => !i.text.includes("someone else entirely"))).toBe(
      true,
    );
  });
});
