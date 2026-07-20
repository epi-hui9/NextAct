import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("data safety contract", () => {
  const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");

  it("does not cache API routes", () => {
    expect(sw).toMatch(/pathname\.startsWith\("\/api\/"\)/);
    expect(sw).toMatch(/if \(url\.pathname\.startsWith\("\/api\/"\)\) return;/);
  });

  it("does not cache-first HTML navigations into Cache Storage", () => {
    expect(sw).not.toMatch(/cache\.put\(req/);
    expect(sw).toMatch(/req\.mode === "navigate"/);
  });

  it("only deletes versioned nextact-shell caches", () => {
    expect(sw).toMatch(/nextact-shell-/);
    expect(sw).not.toMatch(/indexedDB\.deleteDatabase/);
  });
});
