"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "transcribing";

const MAX_MS = 5 * 60 * 1000; // 5 minute cap for Round 1

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
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
 * Tap-to-start / tap-to-stop recording, then upload for transcription. Never
 * auto-sends. Reliability over realtime: a recorded clip transcribes far more
 * dependably on iOS Safari than a live socket.
 */
export function useRecorder(opts: {
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}) {
  const { onTranscript, onError } = opts;
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
      // Stop hardware and timers if the component unmounts mid-recording.
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
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
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
          onError(data?.error ?? "I couldn't turn that into words.");
        } else if (data.transcript && data.transcript.trim()) {
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
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      cleanup();
      onError("Voice input isn't supported here.");
      return;
    }
    recorderRef.current = rec;

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const type = mimeType || chunksRef.current[0]?.type || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      cleanup();
      void transcribe(blob);
    };

    startedAtRef.current = Date.now();
    setElapsedMs(0);
    rec.start();
    setStatus("recording");

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    capRef.current = setTimeout(stop, MAX_MS);
  }, [status, onError, cleanup, transcribe, stop]);

  return { status, elapsedMs, start, stop };
}
