"use client";

import { useState } from "react";
import { useThreadStore } from "@/hooks/useThreadStore";
import Conversation from "./Conversation";
import HistoryPanel from "./HistoryPanel";
import styles from "./Chat.module.css";

export default function Chat() {
  const store = useThreadStore();
  const [historyOpen, setHistoryOpen] = useState(false);

  function handleNew() {
    setHistoryOpen(false);
    store.startNew();
  }

  function handleSelect(id: string) {
    setHistoryOpen(false);
    store.select(id);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setHistoryOpen(true)}
          aria-label="Open conversations"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M2.5 4.5h13M2.5 9h13M2.5 13.5h9"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          type="button"
          className={styles.iconButton}
          onClick={handleNew}
          aria-label="New conversation"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M9 3.5v11M3.5 9h11"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div className={styles.main}>
        <Conversation
          key={store.activeId || "bootstrap"}
          threadId={store.activeId || "bootstrap"}
          initialMessages={store.activeMessages}
          onCommit={store.commit}
        />
      </div>

      <HistoryPanel
        open={historyOpen}
        summaries={store.summaries}
        activeId={store.activeId}
        onSelect={handleSelect}
        onRemove={store.remove}
        onClose={() => setHistoryOpen(false)}
      />
    </main>
  );
}
