import { describe, expect, it } from "vitest";
import {
  clientUploadPath,
  MAX_FILE_SIZE,
  validateUpload,
} from "@/server/files/validate";
import { chunkText } from "@/server/files/chunk";

describe("upload validation", () => {
  it("accepts the allowed types", () => {
    expect(validateUpload({ filename: "a.txt", mime: "text/plain", size: 10 }).ok).toBe(true);
    expect(validateUpload({ filename: "a.md", mime: "text/markdown", size: 10 }).ok).toBe(true);
    expect(validateUpload({ filename: "a.pdf", mime: "application/pdf", size: 10 }).ok).toBe(true);
    expect(validateUpload({ filename: "a.png", mime: "image/png", size: 10 }).ok).toBe(true);
    expect(validateUpload({ filename: "a.jpg", mime: "image/jpeg", size: 10 }).ok).toBe(true);
  });

  it("rejects unsupported extensions and mismatched mime", () => {
    expect(validateUpload({ filename: "a.exe", mime: "application/x-msdownload", size: 10 }).ok).toBe(false);
    expect(validateUpload({ filename: "a.png", mime: "application/zip", size: 10 }).reason).toBe("mime_mismatch");
  });

  it("enforces the size limit and rejects empty files", () => {
    expect(validateUpload({ filename: "a.txt", mime: "text/plain", size: 0 }).reason).toBe("empty");
    expect(
      validateUpload({ filename: "a.txt", mime: "text/plain", size: MAX_FILE_SIZE + 1 }).reason,
    ).toBe("too_large");
  });

  it("scopes storage paths under the client id", () => {
    const path = clientUploadPath("client_abc", "file123", "pdf");
    expect(path.startsWith("client_abc/")).toBe(true);
    expect(path).toBe("client_abc/file123.pdf");
  });
});

describe("chunking", () => {
  it("returns nothing for empty text", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("keeps section metadata and produces ordered chunks", () => {
    const text = "Para one.\n\nPara two.\n\nPara three.";
    const chunks = chunkText(text, { section: "notes.md" });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].section).toBe("notes.md");
    expect(chunks[0].ordinal).toBe(0);
  });

  it("splits very long text into multiple chunks", () => {
    const long = Array.from(
      { length: 120 },
      (_, i) => `Sentence number ${i} carries a little more detail here.`,
    ).join(" ");
    const chunks = chunkText(long);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
