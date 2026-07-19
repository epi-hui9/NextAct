import { NextResponse } from "next/server";
import { resolveClientId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // ~5 min of compressed audio
const DEEPGRAM_URL =
  "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true";

/**
 * Transcribe a recorded audio clip with Deepgram. The API key stays on the
 * server. The transcript is returned to the composer for the client to edit and
 * send explicitly; we never auto-send.
 */
export async function POST(req: Request) {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });

  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    // Honest: voice-to-text is not configured. Do not fake a transcript.
    return NextResponse.json(
      {
        error: "Voice typing isn't set up on this device yet.",
        code: "deepgram_unconfigured",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "I couldn't hear that clearly. Please try again." },
      { status: 400 },
    );
  }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { error: "That recording came through empty. Please try again." },
      { status: 400 },
    );
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "That recording was a little long. Please try a shorter one." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(DEEPGRAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": audio.type || "audio/webm",
      },
      body: await audio.arrayBuffer(),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "I couldn't turn that into words. Please try again." },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      results?: {
        channels?: { alternatives?: { transcript?: string }[] }[];
      };
    };
    const transcript =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json(
      { error: "I couldn't turn that into words. Please try again." },
      { status: 502 },
    );
  }
}
