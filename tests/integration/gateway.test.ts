import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_MODEL_ID, roleModelIds } from "@/server/ai/gateway";

const KEYS = ["MODEL_SMALL", "MODEL_WORKHORSE", "MODEL_FRONTIER", "MODEL_VERIFIER"];

afterEach(() => {
  for (const k of KEYS) delete process.env[k];
});

describe("model gateway", () => {
  it("falls back to one known-good model when nothing is configured", () => {
    for (const k of KEYS) delete process.env[k];
    const ids = roleModelIds();
    expect(ids.small).toBe(DEFAULT_MODEL_ID);
    expect(ids.workhorse).toBe(DEFAULT_MODEL_ID);
    expect(ids.frontier).toBe(DEFAULT_MODEL_ID);
    expect(ids.verifier).toBe(DEFAULT_MODEL_ID);
  });

  it("uses the configured workhorse as the fallback for other roles", () => {
    process.env.MODEL_WORKHORSE = "custom-workhorse";
    const ids = roleModelIds();
    expect(ids.workhorse).toBe("custom-workhorse");
    expect(ids.small).toBe("custom-workhorse");
    expect(ids.frontier).toBe("custom-workhorse");
  });

  it("honors explicit per-role overrides", () => {
    process.env.MODEL_SMALL = "small-x";
    process.env.MODEL_VERIFIER = "verify-x";
    const ids = roleModelIds();
    expect(ids.small).toBe("small-x");
    expect(ids.verifier).toBe("verify-x");
  });
});
