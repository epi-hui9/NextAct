import { beforeEach, describe, expect, it } from "vitest";
import { demoAdapter as db } from "@/server/db/demo-adapter";

/**
 * Application-level isolation proofs for the demo adapter.
 * Live Supabase RLS must also be verified against a real project
 * (see docs/03-data-privacy/01-DATA_AND_PRIVACY.md). These tests prove the adapter never
 * returns another vault's rows when queried with a different client_id.
 */
describe("vault isolation (adapter)", () => {
  const mio = "vault_mio";
  const elizabeth = "vault_elizabeth";

  beforeEach(async () => {
    await db.ensureClient(mio, "Mio");
    await db.ensureClient(elizabeth, "Elizabeth");
  });

  it("cannot read another user's conversation messages", async () => {
    const conv = await db.createConversation(mio, "Mio private");
    await db.addMessage({
      id: crypto.randomUUID(),
      client_id: mio,
      conversation_id: conv.id,
      role: "user",
      content: "Mio secret",
    });
    const leaked = await db.listMessages(elizabeth, conv.id);
    expect(leaked).toEqual([]);
  });

  it("cannot update another user's semantic memory via supersede", async () => {
    const mem = await db.addSemantic({
      client_id: mio,
      category: "value",
      statement: "Mio value",
      confidence: 0.9,
      status: "active",
      valid_from: Date.now(),
      valid_to: null,
      source_ids: ["m1"],
      supersedes_id: null,
      last_confirmed_at: null,
    });
    await db.supersedeSemantic(elizabeth, mem.id, null, "stale");
    const still = await db.listSemantic(mio, { status: "active" });
    expect(still.some((m) => m.id === mem.id)).toBe(true);
  });

  it("push subscriptions are user-scoped", async () => {
    await db.upsertPushSubscription({
      user_id: "user_mio",
      endpoint: "https://push.example/mio",
      p256dh: "x",
      auth: "y",
      user_agent: null,
    });
    const elizabethSubs = await db.listPushSubscriptions("user_elizabeth");
    expect(elizabethSubs).toEqual([]);
    const mioSubs = await db.listPushSubscriptions("user_mio");
    expect(mioSubs).toHaveLength(1);
  });
});
