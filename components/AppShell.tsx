"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Home from "./Home";
import ConversationView from "./ConversationView";
import LegacyMap from "./LegacyMap";
import NavBar, { type Tab } from "./NavBar";
import styles from "./AppShell.module.css";

const CONV_KEY = "nextact.conversationId";

function loadConversationId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(CONV_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(CONV_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function AppShell() {
  const [tab, setTab] = useState<Tab>("home");
  const [conversationId, setConversationId] = useState("");
  // Bump to nudge Home/Legacy to refetch when the user returns to them.
  const [homeNonce, setHomeNonce] = useState(0);
  const [legacyNonce, setLegacyNonce] = useState(0);
  const prevTab = useRef<Tab>("home");

  useEffect(() => {
    setConversationId(loadConversationId());
  }, []);

  useEffect(() => {
    if (prevTab.current !== tab) {
      if (tab === "home") setHomeNonce((n) => n + 1);
      if (tab === "legacy") setLegacyNonce((n) => n + 1);
      prevTab.current = tab;
    }
  }, [tab]);

  const openConversation = useCallback(() => setTab("conversation"), []);
  const openLegacy = useCallback(() => setTab("legacy"), []);

  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        <section
          className={styles.surface}
          hidden={tab !== "home"}
          aria-hidden={tab !== "home"}
        >
          <Home
            active={tab === "home"}
            nonce={homeNonce}
            onOpenConversation={openConversation}
            onOpenLegacy={openLegacy}
          />
        </section>

        <section
          className={styles.surface}
          hidden={tab !== "conversation"}
          aria-hidden={tab !== "conversation"}
        >
          {conversationId ? (
            <ConversationView
              conversationId={conversationId}
              onReset={() => {
                const id = crypto.randomUUID();
                try {
                  window.localStorage.setItem(CONV_KEY, id);
                } catch {
                  /* ignore */
                }
                setConversationId(id);
              }}
            />
          ) : null}
        </section>

        <section
          className={styles.surface}
          hidden={tab !== "legacy"}
          aria-hidden={tab !== "legacy"}
        >
          <LegacyMap active={tab === "legacy"} nonce={legacyNonce} />
        </section>
      </main>

      <NavBar tab={tab} onChange={setTab} />
    </div>
  );
}
