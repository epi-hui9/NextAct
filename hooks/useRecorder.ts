"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "transcribing";

const MAX_MS = 5 * 60 * 1000;

type SpeechRec = SpeechRecognition;

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg",
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return "";
}

/**
 * Tap-to-start / tap-to-stop voice input.
 * Prefer on-device SpeechRecognition (works on iPhone Safari PWA).
 * Fall back to MediaRecorder + /api/transcribe when needed.
 * Never auto-sends.
 */
export function useRecorder(opts: {
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}) {
  const { onTranscript, onError } = opts;
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const speechRef = useRef<SpeechRec | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const interimRef = useRef("");
  const finalRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const mountedRef = useRef(true);
  const modeRef = useRef<"speech" | "media" | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (capRef.current) clearTimeout(capRef.current);
    timerRef.current = null;
    capRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    if (speechRef.current) {
      try {
        speechRef.current.onresult = null;
        speechRef.current.onerror = null;
        speechRef.current.onend = null;
        speechRef.current.stop();
      } catch {
        /* ignore */
      }
      speechRef.current = null;
    }
    modeRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      cleanup();
    };
  }, [cleanup]);

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      if (blob.size === 0) {
        setStatus("idle");
        onError("That recording came through empty. Please try again.");
        return;
      }
      setStatus("transcribing");
      try {
        const form = new FormData();
        const ext =
          blob.type.includes("mp4") || blob.type.includes("aac")
            ? "mp4"
            : "webm";
        form.append("audio", blob, `clip.${ext}`);
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        const data = (await res.json().catch(() => null)) as {
          transcript?: string;
          error?: string;
        } | null;
        if (!mountedRef.current) return;
        if (!res.ok || !data) {
          onError(
            data?.error ??
              (res.status === 503
                ? "Voice typing needs a quick server setup. Please try again soon."
                : "I couldn't turn that into words."),
          );
        } else if (data.transcript?.trim()) {
          onTranscript(data.transcript.trim());
        } else {
          onError("I didn't catch any words there. Please try again.");
        }
      } catch {
        if (mountedRef.current) {
          onError("I couldn't turn that into words. Please try again.");
        }
      } finally {
        if (mountedRef.current) setStatus("idle");
      }
    },
    [onTranscript, onError],
  );

  const stop = useCallback(() => {
    if (modeRef.current === "speech" && speechRef.current) {
      try {
        speechRef.current.stop();
      } catch {
        cleanup();
        setStatus("idle");
      }
      return;
    }
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        cleanup();
        setStatus("idle");
      }
    }
  }, [cleanup]);

  const startSpeech = useCallback((): boolean => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return false;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    interimRef.current = "";
    finalRef.current = "";
    speechRef.current = rec;
    modeRef.current = "speech";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = finalRef.current;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += piece;
        else interim += piece;
      }
      finalRef.current = finalText;
      interimRef.current = interim;
    };
    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      cleanup();
      if (mountedRef.current) {
        setStatus("idle");
        onError("I couldn't hear that clearly. Please try again.");
      }
    };
    rec.onend = () => {
      const text = `${finalRef.current} ${interimRef.current}`.trim();
      cleanup();
      if (!mountedRef.current) return;
      if (text) onTranscript(text);
      else onError("I didn't catch any words there. Please try again.");
      setStatus("idle");
    };

    try {
      rec.start();
    } catch {
      cleanup();
      return false;
    }
    return true;
  }, [cleanup, onError, onTranscript]);

  const startMedia = useCallback(async (): Promise<boolean> => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      return false;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
    } catch {
      onError(
        "I couldn't reach the microphone. You can allow access in Settings and try again.",
      );
      return false;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      try {
        rec = new MediaRecorder(stream);
      } catch {
        cleanup();
        return false;
      }
    }
    recorderRef.current = rec;
    modeRef.current = "media";

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onerror = () => {
      cleanup();
      if (mountedRef.current) {
        setStatus("idle");
        onError("Recording stopped unexpectedly. Please try again.");
      }
    };
    rec.onstop = () => {
      const type = mimeType || chunksRef.current[0]?.type || "audio/mp4";
      const blob = new Blob(chunksRef.current, { type });
      cleanup();
      void transcribeBlob(blob);
    };

    try {
      rec.start(1000);
    } catch {
      rec.start();
    }
    return true;
  }, [cleanup, onError, transcribeBlob]);

  const start = useCallback(async () => {
    if (status !== "idle") return;

    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setStatus("recording");
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    capRef.current = setTimeout(stop, MAX_MS);

    if (startSpeech()) return;

    const ok = await startMedia();
    if (!ok && mountedRef.current) {
      cleanup();
      setStatus("idle");
      onError("Voice input isn't available in this browser.");
    }
  }, [status, startSpeech, startMedia, stop, cleanup, onError]);

  return { status, elapsedMs, start, stop };
}
