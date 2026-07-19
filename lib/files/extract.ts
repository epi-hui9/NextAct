import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { generateText } from "ai";
import { modelFor } from "@/lib/ai/gateway";
import { isImageExt, isTextExt } from "./validate";

export interface ExtractResult {
  text: string;
  pending: boolean;
  note: string | null;
}

async function extractPdf(buffer: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n\n") : text;
}

/**
 * Images pass through the configured multimodal model (Anthropic) to transcribe
 * any text and add a short description. If that call fails, the file is
 * preserved and marked pending rather than lost.
 */
async function extractImage(
  buffer: Uint8Array,
  mime: string,
): Promise<ExtractResult> {
  try {
    const { model } = modelFor("workhorse");
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe any readable text in this image verbatim. Then add one short sentence describing it. If there is no text, just describe it briefly.",
            },
            { type: "image", image: buffer, mediaType: mime },
          ],
        },
      ],
      maxOutputTokens: 1500,
      abortSignal: AbortSignal.timeout(30_000),
    });
    const clean = text.trim();
    if (!clean) {
      return { text: "", pending: true, note: "No text found in image." };
    }
    return { text: clean, pending: false, note: null };
  } catch {
    return {
      text: "",
      pending: true,
      note: "Image understanding is temporarily unavailable.",
    };
  }
}

export async function extractFromBuffer(
  buffer: Uint8Array,
  ext: string,
  mime: string,
): Promise<ExtractResult> {
  if (isTextExt(ext)) {
    const text = Buffer.from(buffer).toString("utf8").trim();
    if (!text) return { text: "", pending: true, note: "The file was empty." };
    return { text, pending: false, note: null };
  }

  if (ext === "pdf") {
    try {
      const text = (await extractPdf(buffer)).trim();
      if (!text) {
        return {
          text: "",
          pending: true,
          note: "This PDF has no selectable text yet.",
        };
      }
      return { text, pending: false, note: null };
    } catch {
      return {
        text: "",
        pending: true,
        note: "This PDF could not be read.",
      };
    }
  }

  if (isImageExt(ext)) {
    return extractImage(buffer, mime);
  }

  return { text: "", pending: true, note: "Unsupported file." };
}
