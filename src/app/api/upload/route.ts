import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { resolveClientId } from "@/features/auth/server/session";
import { db } from "@/server/db";
import {
  clientUploadPath,
  isTextExt,
  validateUpload,
} from "@/server/files/validate";
import { storeObject } from "@/server/files/storage";
import { extractFromBuffer } from "@/server/files/extract";
import { chunkText } from "@/server/files/chunk";
import { computeStatus, STATUS_SCORE } from "@/features/journey/story/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASON_MESSAGE: Record<string, string> = {
  empty: "That file looked empty. Please try another.",
  too_large: "That file is a little large. Please keep it under 10 MB.",
  unsupported_type:
    "I can read PDF, text, Markdown, and image files. Please try one of those.",
  mime_mismatch: "I couldn't recognize that file. Please try another.",
};

export async function POST(req: Request) {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "I couldn't finish that upload. Please try it once more." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "I couldn't find a file to read. Please try again." },
      { status: 400 },
    );
  }

  const outcome = validateUpload({
    filename: file.name,
    mime: file.type,
    size: file.size,
  });
  if (!outcome.ok) {
    return NextResponse.json(
      { error: REASON_MESSAGE[outcome.reason ?? "mime_mismatch"] },
      { status: 400 },
    );
  }
  const ext = outcome.ext!;

  const fileId = randomUUID();
  const path = clientUploadPath(clientId, fileId, ext);
  const bytes = new Uint8Array(await file.arrayBuffer());

  // Store privately and record the file as processing.
  storeObject(path, bytes);
  await db.addFile({
    id: fileId,
    client_id: clientId,
    path,
    filename: file.name,
    mime: file.type,
    size: file.size,
    status: "processing",
    note: null,
  });

  // Extract + index.
  const result = await extractFromBuffer(bytes, ext, file.type);
  if (result.pending) {
    await db.updateFile(clientId, fileId, {
      status: "pending",
      note: result.note,
    });
    return NextResponse.json({
      id: fileId,
      filename: file.name,
      status: "pending",
      note: result.note,
    });
  }

  const chunks = chunkText(result.text, { section: file.name });
  await db.addChunks(
    chunks.map((c) => ({
      id: randomUUID(),
      client_id: clientId,
      file_id: fileId,
      ordinal: c.ordinal,
      content: c.content,
      section: c.section,
      page: c.page,
    })),
  );

  // First-person writing gently contributes to voice_and_language evidence.
  if (isTextExt(ext) && chunks.length > 0) {
    const area = "voice_and_language" as const;
    const rec = await db.getStoryArea(clientId, area);
    const ids = new Set(rec?.source_ids ?? []);
    ids.add(`file:${fileId}`);
    const all = [...ids];
    const spans = all.filter((id) => !id.startsWith("detailed:"));
    const status = computeStatus({
      distinctSourceSpans: spans.length,
      hasDetailedFirstPerson: all.some((id) => id.startsWith("detailed:")),
      hasUnresolvedContradiction: false,
    });
    await db.upsertStoryEvidence({
      client_id: clientId,
      area,
      status,
      coverage_score: STATUS_SCORE[status],
      evidence_count: spans.length,
      source_ids: all,
      last_updated_at: Date.now(),
    });
  }

  await db.updateFile(clientId, fileId, { status: "indexed", note: null });

  return NextResponse.json({
    id: fileId,
    filename: file.name,
    status: "indexed",
    chunks: chunks.length,
  });
}
