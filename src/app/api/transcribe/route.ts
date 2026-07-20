import { NextResponse } from "next/server";
import { resolveClientId } from "@/features/auth/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const DEEPGRAM_URL =
  "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true";

function sttProvider(): "deepgram" | "whisper" | null {
  if (process.env.DEEPGRAM_API_KEY) return "deepgram";
  if (process.env.OPENAI_API_KEY) return "whisper";
  return null;
}

/** Availability probe for the Composer mic (no secrets returned). */
export async function GET() {
  const provider = sttProvider();
  return NextResponse.json({
    available: Boolean(provider),
    provider: provider ?? null,
  });
}

/**
 * Transcribe a recorded audio clip with Deepgram or OpenAI Whisper only.
 * No browser SpeechRecognition. Never invent a transcript.
 */
export async function POST(req: Request) {
  const clientId = await resolveClientId();
  if (!clientId) return new NextResponse("Unauthorized", { status: 401 });

  const provider = sttProvider();
  if (!provider) {
    return NextResponse.json(
      {
        error: "Voice typing is unavailable right now. Please type your message.",
        code: "stt_unconfigured",
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
    const transcript =
      provider === "deepgram"
        ? await withDeepgram(process.env.DEEPGRAM_API_KEY!, audio)
        : await withOpenAI(process.env.OPENAI_API_KEY!, audio);
    return NextResponse.json({ transcript, provider });
  } catch {
    return NextResponse.json(
      { error: "I couldn't turn that into words. Please try again." },
      { status: 502 },
    );
  }
}

async function withDeepgram(key: string, audio: File): Promise<string> {
  const res = await fetch(DEEPGRAM_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": audio.type || "audio/webm",
    },
    body: await audio.arrayBuffer(),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`deepgram_${res.status}`);
  const data = (await res.json()) as {
    results?: {
      channels?: { alternatives?: { transcript?: string }[] }[];
    };
  };
  return (
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? ""
  );
}

async function withOpenAI(key: string, audio: File): Promise<string> {
  const body = new FormData();
  const name =
    audio.name || (audio.type.includes("mp4") ? "clip.mp4" : "clip.webm");
  body.append("file", audio, name);
  body.append("model", "whisper-1");
  body.append("response_format", "json");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`openai_${res.status}`);
  const data = (await res.json()) as { text?: string };
  return data.text?.trim() ?? "";
}
