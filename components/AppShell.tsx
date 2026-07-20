"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Home from "./Home";
import Onboarding from "./Onboarding";
import NavBar, { type Tab } from "./NavBar";
import styles from "./AppShell.module.css";

const ConversationView = dynamic(() => import("./ConversationView"), {
  ssr: false,
  loading: () => <div className={styles.lazy} aria-busy="true" />,
});
const LegacyMap = dynamic(() => import("./LegacyMap"), {
  ssr: false,
  loading: () => <div className={styles.lazy} aria-busy="true" />,
});

const CONV_KEY = "nextact.conversationId";
const PROMPT_KEY = "nextact.activePrompt";

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

export default function AppShell({
  initialOnboardingComplete,
}: {
  initialOnboardingComplete: boolean;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [conversationId, setConversationId] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(initialOnboardingComplete);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [homeNonce, setHomeNonce] = useState(0);
  const [legacyNonce, setLegacyNonce] = useState(0);
  const prevTab = useRef<Tab>("home");

  useEffect(() => {
    setConversationId(loadConversationId());
    try {
      setActivePrompt(window.localStorage.getItem(PROMPT_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (prevTab.current !== tab) {
      if (tab === "home") setHomeNonce((n) => n + 1);
      if (tab === "legacy") setLegacyNonce((n) => n + 1);
      prevTab.current = tab;
    }
  }, [tab]);

  // Visual Viewport: hide bottom nav while the software keyboard is open.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const occluded = window.innerHeight - vv.height > 120;
      setKeyboardOpen(occluded);
      document.documentElement.style.setProperty(
        "--vv-offset",
        `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`,
      );
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const openConversation = useCallback((prompt?: string) => {
    if (prompt) {
      setActivePrompt(prompt);
      try {
        window.localStorage.setItem(PROMPT_KEY, prompt);
      } catch {
        /* ignore */
      }
    }
    setTab("conversation");
  }, []);

  const openLegacy = useCallback(() => setTab("legacy"), []);

  if (!onboarded) {
    return (
      <div className={styles.shell}>
        <Onboarding onComplete={() => setOnboarded(true)} />
      </div>
    );
  }

  return (
    <div className={`${styles.shell} ${keyboardOpen ? styles.keyboardOpen : ""}`}>
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
              activePrompt={activePrompt}
              onReset={() => {
                const id = crypto.randomUUID();
                try {
                  window.localStorage.setItem(CONV_KEY, id);
                  window.localStorage.removeItem(PROMPT_KEY);
                } catch {
                  /* ignore */
                }
                setActivePrompt(null);
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

      {!keyboardOpen ? <NavBar tab={tab} onChange={setTab} /> : null}
    </div>
  );
}
