"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import MessageList from "./MessageList";
import Composer from "./Composer";
import { clearDraft } from "@/lib/client/draft-store";
import styles from "./ConversationView.module.css";

interface UploadChip {
  key: string;
  name: string;
  status: "processing" | "added" | "pending" | "error";
  note?: string;
}

interface PastConversation {
  id: string;
  title: string;
  updatedAt: number;
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

function errorCopy(error: Error | undefined): string {
  if (!error) {
    return "Something went wrong. Your words are saved. Tap to try again.";
  }
  const msg = error.message || "";
  if (!navigator.onLine) {
    return "You appear offline. Your draft stays here until you reconnect.";
  }
  if (/session ended|401|unauthorized/i.test(msg)) {
    return "Your session ended. Sign in again to continue.";
  }
  if (/interrupted|504/i.test(msg)) {
    return "The reply was interrupted. Your words are saved. Tap to try again.";
  }
  if (/provider|busy|429/i.test(msg)) {
    return "The model is busy. Your words are saved. Tap to try again.";
  }
  return msg.includes("saved")
    ? msg
    : "Something went wrong. Your words are saved. Tap to try again.";
}

function fmtWhen(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ConversationView({
  conversationId,
  activePrompt,
  onReset,
  onSelectConversation,
  onBackHome,
  initialDraft = "",
  onDraftChange,
}: {
  conversationId: string;
  activePrompt: string | null;
  onReset: () => void;
  onSelectConversation: (id: string) => void;
  onBackHome: () => void;
  initialDraft?: string;
  onDraftChange?: (text: string) => void;
}) {
  const [input, setInput] = useState(initialDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadChip[]>([]);
  const [pastOpen, setPastOpen] = useState(false);
  const [past, setPast] = useState<PastConversation[]>([]);
  const [pastLoading, setPastLoading] = useState(false);
  const lastSentRef = useRef("");
  const lastIdempotencyRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const reconciledRef = useRef(false);

  useEffect(() => {
    if (initialDraft && !input) setInput(initialDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft]);

  useEffect(() => {
    seededRef.current = false;
    reconciledRef.current = false;
    setUploads([]);
    setPastOpen(false);
    lastIdempotencyRef.current = null;
  }, [conversationId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({
          body,
          messages,
          id,
          trigger,
          messageId,
        }) => ({
          body: {
            ...(body ?? {}),
            id,
            messages,
            trigger,
            messageId,
            conversationId,
            activePrompt: activePrompt ?? undefined,
            idempotencyKey: lastIdempotencyRef.current ?? undefined,
          },
        }),
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
        void reconcile();
      },
    });

  const reconcile = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: { id: string; role: "user" | "assistant"; content: string }[];
      };
      if (!data.messages?.length) return;
      const remote: UIMessage[] = data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text" as const, text: m.content }],
      }));
      setMessages([openerFor(activePrompt), ...remote]);
    } catch {
      /* keep local */
    }
  }, [activePrompt, conversationId, setMessages]);

  useEffect(() => {
    if (reconciledRef.current) return;
    reconciledRef.current = true;
    void reconcile();
  }, [reconcile]);

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
    onDraftChange?.(input);
  }, [input, onDraftChange]);

  async function openPast() {
    setPastOpen(true);
    setPastLoading(true);
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const data = res.ok
        ? ((await res.json()) as { conversations?: PastConversation[] })
        : null;
      setPast(data?.conversations ?? []);
    } catch {
      setPast([]);
    } finally {
      setPastLoading(false);
    }
  }

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    if (!navigator.onLine) {
      setNotice("You appear offline. Your draft stays here until you reconnect.");
      return;
    }
    lastSentRef.current = text;
    lastIdempotencyRef.current = crypto.randomUUID();
    setInput("");
    void clearDraft(conversationId);
    clearError();
    void sendMessage({ text });
  }

  function retry() {
    const text = lastSentRef.current;
    if (!text || busy) return;
    if (!lastIdempotencyRef.current) {
      lastIdempotencyRef.current = crypto.randomUUID();
    }
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
        <button type="button" className={styles.back} onClick={onBackHome}>
          Home
        </button>
        <span className={styles.title}>Talk</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.reset}
            onClick={() => void openPast()}
          >
            Past
          </button>
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              seededRef.current = false;
              reconciledRef.current = false;
              setMessages([openerFor(null)]);
              setUploads([]);
              onReset();
            }}
            aria-label="Start a fresh conversation"
          >
            New
          </button>
        </div>
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
              {errorCopy(error)}
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

      {pastOpen ? (
        <div className={styles.sheet} role="dialog" aria-label="Past conversations">
          <div className={styles.sheetInner}>
            <div className={styles.sheetHead}>
              <h2 className={styles.sheetTitle}>Past conversations</h2>
              <button
                type="button"
                className={styles.reset}
                onClick={() => setPastOpen(false)}
              >
                Close
              </button>
            </div>
            {pastLoading ? (
              <p className={styles.empty}>Loading…</p>
            ) : past.length === 0 ? (
              <p className={styles.empty}>No earlier conversations yet.</p>
            ) : (
              <ul className={styles.pastList}>
                {past.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`${styles.pastItem} ${c.id === conversationId ? styles.pastCurrent : ""}`}
                      onClick={() => {
                        setPastOpen(false);
                        if (c.id !== conversationId) onSelectConversation(c.id);
                      }}
                    >
                      <span className={styles.pastTitle}>
                        {c.title.trim() || "Conversation"}
                      </span>
                      <span className={styles.pastWhen}>{fmtWhen(c.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
