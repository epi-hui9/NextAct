"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "transcribing";

const MAX_MS = 5 * 60 * 1000;

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
 * Tap-to-start / tap-to-stop recording, then upload for Deepgram or Whisper.
 * Never uses browser SpeechRecognition. Never auto-sends.
 */
export function useRecorder(opts: {
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
  enabled?: boolean;
}) {
  const { onTranscript, onError, enabled = true } = opts;
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const mountedRef = useRef(true);

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

  const transcribe = useCallback(
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
          code?: string;
        } | null;
        if (!mountedRef.current) return;
        if (!res.ok || !data) {
          if (res.status === 503 || data?.code === "stt_unconfigured") {
            onError(
              "Voice typing is unavailable right now. Please type your message.",
            );
          } else {
            onError(data?.error ?? "I couldn't turn that into words.");
          }
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

  const start = useCallback(async () => {
    if (!enabled) {
      onError(
        "Voice typing is unavailable right now. Please type your message.",
      );
      return;
    }
    if (status !== "idle") return;
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      onError("Voice input isn't available in this browser.");
      return;
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
      return;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
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
        onError("Voice input isn't supported here.");
        return;
      }
    }
    recorderRef.current = rec;

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
      void transcribe(blob);
    };

    startedAtRef.current = Date.now();
    setElapsedMs(0);
    try {
      rec.start(1000);
    } catch {
      rec.start();
    }
    setStatus("recording");

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    capRef.current = setTimeout(stop, MAX_MS);
  }, [enabled, status, onError, cleanup, transcribe, stop]);

  return { status, elapsedMs, start, stop };
}
