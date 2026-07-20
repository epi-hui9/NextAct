/**
 * Chunk extracted text with structural context. Splits on blank lines
 * (paragraphs), then packs paragraphs up to a target size so chunks keep
 * meaning. Pure and testable.
 */

export interface TextChunk {
  ordinal: number;
  content: string;
  section: string | null;
  page: number | null;
}

const TARGET = 900;
const HARD_MAX = 1400;

export function chunkText(
  text: string,
  opts?: { section?: string | null },
): TextChunk[] {
  const section = opts?.section ?? null;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized === "") return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf.trim()) chunks.push(buf.trim());
    buf = "";
  };

  for (const para of paragraphs) {
    if (para.length >= HARD_MAX) {
      flush();
      // Split very long paragraphs on sentence boundaries.
      const sentences = para.split(/(?<=[.!?])\s+/);
      let sub = "";
      for (const s of sentences) {
        if ((sub + " " + s).length > TARGET) {
          if (sub.trim()) chunks.push(sub.trim());
          sub = s;
        } else {
          sub = sub ? `${sub} ${s}` : s;
        }
      }
      if (sub.trim()) chunks.push(sub.trim());
      continue;
    }
    if ((buf + "\n\n" + para).length > TARGET && buf) {
      flush();
      buf = para;
    } else {
      buf = buf ? `${buf}\n\n${para}` : para;
    }
  }
  flush();

  return chunks.map((content, ordinal) => ({
    ordinal,
    content,
    section,
    page: null,
  }));
}
