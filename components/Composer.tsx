"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useRecorder } from "@/hooks/useRecorder";
import styles from "./Composer.module.css";

const MAX_HEIGHT = 160;
const ACCEPT =
  ".pdf,.txt,.md,.png,.jpg,.jpeg,application/pdf,text/plain,text/markdown,image/png,image/jpeg";

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  onFile,
  onNotice,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  onFile: (file: File) => void;
  onNotice: (message: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const appendTranscript = useCallback(
    (text: string) => {
      const cur = valueRef.current;
      onChange(cur ? `${cur} ${text}` : text);
      requestAnimationFrame(() => ref.current?.focus());
    },
    [onChange],
  );

  const recorder = useRecorder({
    onTranscript: appendTranscript,
    onError: onNotice,
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  }

  const recording = recorder.status === "recording";
  const transcribing = recorder.status === "transcribing";
  const canSend = value.trim().length > 0 && !disabled && !recording;

  return (
    <div className={styles.wrap}>
      {recording ? (
        <div className={styles.recording} role="status">
          <span className={styles.pulse} aria-hidden />
          <span>Listening… {fmt(recorder.elapsedMs)}</span>
        </div>
      ) : transcribing ? (
        <div className={styles.recording} role="status">
          <span className={styles.pulse} aria-hidden />
          <span>Writing that down…</span>
        </div>
      ) : null}

      <div className={styles.composer}>
        <button
          type="button"
          className={`${styles.iconBtn} ${recording ? styles.stop : ""}`}
          aria-label={recording ? "Stop recording" : "Record voice"}
          aria-pressed={recording}
          onClick={() => (recording ? recorder.stop() : recorder.start())}
          disabled={transcribing || disabled}
        >
          {recording ? (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <rect x="5" y="5" width="8" height="8" rx="1.5" fill="currentColor" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect
                x="9"
                y="3"
                width="6"
                height="11"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Add a file"
          onClick={() => fileRef.current?.click()}
          disabled={recording || transcribing || disabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className={styles.fileInput}
          onChange={handleFileChange}
          aria-label="Add a file"
          tabIndex={-1}
        />

        <textarea
          ref={ref}
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say what's on your mind."
          rows={1}
          spellCheck
          aria-label="Message"
        />

        <button
          type="button"
          className={styles.sendBtn}
          aria-label="Send"
          onClick={onSubmit}
          disabled={!canSend}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h13M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
