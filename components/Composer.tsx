"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import styles from "./Composer.module.css";

// Maximum grown height (px) before the textarea scrolls internally. Kept in
// sync with `max-height` in the CSS module.
const MAX_HEIGHT = 200;

export default function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow from one line up to MAX_HEIGHT. Only show the scrollbar once the
  // content genuinely exceeds the maximum height, so short input stays clean.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  return (
    <div className={styles.composer}>
      <textarea
        ref={ref}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Say what's on your mind."
        rows={1}
        autoFocus
        spellCheck
        aria-label="Message"
      />
    </div>
  );
}
