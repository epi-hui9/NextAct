"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Welcome from "./Welcome";
import MessageList from "./MessageList";
import Composer from "./Composer";
import styles from "./Chat.module.css";

export default function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  const hasStarted = messages.length > 0;
  const busy = status === "submitted" || status === "streaming";
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest words in view as they stream in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  }

  return (
    <main className={styles.screen}>
      <div
        className={`${styles.column} ${hasStarted ? styles.started : styles.resting}`}
      >
        {!hasStarted && <Welcome />}

        {hasStarted && (
          <div className={styles.conversation}>
            <MessageList messages={messages} status={status} />
            <div ref={endRef} />
          </div>
        )}

        <div className={styles.composerWrap}>
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={submit}
            disabled={busy}
          />
        </div>
      </div>
    </main>
  );
}
