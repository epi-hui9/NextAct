import "server-only";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Demo private file storage. Objects live on local disk under a client-scoped
 * path and are never served publicly. With Supabase configured this would write
 * to a private Storage bucket with RLS instead. This is not production privacy.
 */
const DATA_DIR = process.env.NEXTACT_DATA_DIR || join(tmpdir(), "nextact-demo");
const UPLOAD_ROOT = join(DATA_DIR, "uploads");

export function storeObject(relPath: string, bytes: Uint8Array): void {
  const full = join(UPLOAD_ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, bytes);
}
