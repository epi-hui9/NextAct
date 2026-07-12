"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import Welcome from "./Welcome";
import MessageList from "./MessageList";
import Composer from "./Composer";
import styles from "./Conversation.module.css";

/**
 * One conversation surface. Mounted with a `key` of its thread id, so switching
 * threads gives a clean useChat instance seeded with that thread's messages.
 *
 * Layout is the fixed-shell model: a flexible, `min-height: 0` message region
 * that scrolls only when needed, and a non-scrolling composer footer. The
 * composer never moves.
 */
export default function Conversation({
  threadId,
  initialMessages,
  onCommit,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onCommit: (messages: UIMessage[]) => void;
}) {
  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
  });
  const [input, setInput] = useState("");

  const hasStarted = messages.length > 0;
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest words in view by scrolling the message region only. This
  // never scrolls the document itself.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Persist the thread whenever it settles (not mid-stream) and has content.
  useEffect(() => {
    if (status === "streaming") return;
    if (messages.length === 0) return;
    onCommit(messages);
  }, [status, messages, onCommit]);

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  }

  return (
    <div className={styles.surface}>
      <div
        ref={scrollRef}
        className={`${styles.scroll} ${hasStarted ? styles.started : styles.resting}`}
      >
        <div className={styles.column}>
          {hasStarted ? (
            <MessageList messages={messages} status={status} />
          ) : (
            <Welcome />
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.column}>
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={submit}
            disabled={busy}
          />
        </div>
      </div>
    </div>
  );
}
