"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import MessageList from "./MessageList";
import Composer from "./Composer";
import styles from "./ConversationView.module.css";

interface UploadChip {
  key: string;
  name: string;
  status: "processing" | "added" | "pending" | "error";
  note?: string;
}

function openerFor(prompt: string | null): UIMessage {
  const text = prompt
    ? `Let's stay with this: ${prompt}`
    : "I'm glad you're here. There is no agenda. What feels most true to say first?";
  return {
    id: "opener",
    role: "assistant",
    parts: [{ type: "text", text }],
  };
}

export default function ConversationView({
  conversationId,
  activePrompt,
  onReset,
}: {
  conversationId: string;
  activePrompt: string | null;
  onReset: () => void;
}) {
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadChip[]>([]);
  const lastSentRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId, activePrompt: activePrompt ?? undefined },
      }),
    [conversationId, activePrompt],
  );

  const initialMessages = useMemo(
    () => [openerFor(activePrompt)],
    [activePrompt],
  );

  const { messages, sendMessage, status, error, setMessages, clearError } =
    useChat({
      id: conversationId,
      messages: initialMessages,
      transport,
      onError: () => {
        const saved = lastSentRef.current;
        setInput((cur) => cur || saved);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "user") return prev.slice(0, -1);
          return prev;
        });
      },
    });

  // Seed remote prompt once per conversation id (avoid duplicate openers).
  useEffect(() => {
    if (seededRef.current || !activePrompt) return;
    seededRef.current = true;
    void fetch("/api/chat/prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId, activePrompt }),
    }).catch(() => {
      /* non-blocking */
    });
  }, [conversationId, activePrompt]);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status, uploads]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (error && lastSentRef.current) {
      setInput((cur) => cur || lastSentRef.current);
    }
  }, [error]);

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    lastSentRef.current = text;
    setInput("");
    clearError();
    void sendMessage({ text });
  }

  function retry() {
    const text = lastSentRef.current;
    if (!text || busy) return;
    clearError();
    void sendMessage({ text });
  }

  const handleFile = useCallback(async (file: File) => {
    const key = `${file.name}-${Date.now()}`;
    setUploads((u) => [...u, { key, name: file.name, status: "processing" }]);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => null)) as {
        status?: string;
        note?: string;
        error?: string;
      } | null;
      if (!res.ok || !data) {
        setUploads((u) =>
          u.map((c) => (c.key === key ? { ...c, status: "error" } : c)),
        );
        setNotice(
          data?.error ??
            "I could not finish that upload. Please try it once more.",
        );
        return;
      }
      setUploads((u) =>
        u.map((c) =>
          c.key === key
            ? {
                ...c,
                status: data.status === "pending" ? "pending" : "added",
                note: data.note,
              }
            : c,
        ),
      );
    } catch {
      setUploads((u) =>
        u.map((c) => (c.key === key ? { ...c, status: "error" } : c)),
      );
      setNotice("I could not finish that upload. Please try it once more.");
    }
  }, []);

  return (
    <div className={styles.surface}>
      <header className={styles.topbar}>
        <span className={styles.title}>Talk</span>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            seededRef.current = false;
            setMessages([openerFor(activePrompt)]);
            setUploads([]);
            onReset();
          }}
          aria-label="Start a fresh conversation"
        >
          New
        </button>
      </header>

      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.column}>
          <MessageList messages={messages} status={status} />

          {uploads.length > 0 ? (
            <div className={styles.chips}>
              {uploads.map((c) => (
                <span
                  key={c.key}
                  className={`${styles.chip} ${
                    c.status === "error" ? styles.chipError : ""
                  }`}
                >
                  <span className={styles.chipName}>{c.name}</span>
                  <span className={styles.chipStatus}>
                    {c.status === "processing"
                      ? "reading…"
                      : c.status === "added"
                        ? "added"
                        : c.status === "pending"
                          ? "saved"
                          : "try again"}
                  </span>
                </span>
              ))}
            </div>
          ) : null}

          {error ? (
            <button type="button" className={styles.retry} onClick={retry}>
              I lost the connection for a moment. Your words are still here.
              Tap to try again.
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.column}>
          {notice ? (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          ) : null}
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={submit}
            disabled={busy}
            onFile={handleFile}
            onNotice={showNotice}
          />
        </div>
      </div>
    </div>
  );
}
