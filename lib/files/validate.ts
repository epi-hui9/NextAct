/**
 * Server-side upload validation. Pure and testable.
 * Allowed for Round 1: PDF, PNG, JPG/JPEG, TXT, MD. Max 10 MB.
 */

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed extension -> acceptable MIME types. */
export const ALLOWED_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/x-markdown", "text/plain"],
};

// Browsers are inconsistent about MIME for text/markdown; tolerate generic.
const GENERIC_MIME = new Set(["application/octet-stream", ""]);

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot + 1).toLowerCase();
}

export interface ValidationOutcome {
  ok: boolean;
  reason?: "empty" | "too_large" | "unsupported_type" | "mime_mismatch";
  ext?: string;
}

export function validateUpload(input: {
  filename: string;
  mime: string;
  size: number;
}): ValidationOutcome {
  const { filename, mime, size } = input;
  if (size <= 0) return { ok: false, reason: "empty" };
  if (size > MAX_FILE_SIZE) return { ok: false, reason: "too_large" };

  const ext = extensionOf(filename);
  const allowedMimes = ALLOWED_TYPES[ext];
  if (!allowedMimes) return { ok: false, reason: "unsupported_type" };

  const normalized = (mime || "").toLowerCase().split(";")[0].trim();
  const mimeOk =
    allowedMimes.includes(normalized) || GENERIC_MIME.has(normalized);
  if (!mimeOk) return { ok: false, reason: "mime_mismatch", ext };

  return { ok: true, ext };
}

/** Private, client-scoped storage path. Always begins with the client id. */
export function clientUploadPath(
  clientId: string,
  fileId: string,
  ext: string,
): string {
  return `${clientId}/${fileId}${ext ? "." + ext : ""}`;
}

export function isImageExt(ext: string): boolean {
  return ext === "png" || ext === "jpg" || ext === "jpeg";
}

export function isTextExt(ext: string): boolean {
  return ext === "txt" || ext === "md";
}
