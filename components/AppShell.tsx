"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Home from "./Home";
import Onboarding from "./Onboarding";
import NavBar, { type Tab } from "./NavBar";
import UpdateBanner from "./UpdateBanner";
import AccountSheet from "./AccountSheet";
import { clearDraft, loadDraft, saveDraft } from "@/lib/client/draft-store";
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
const LEGACY_KEY = "nextact.legacySection";

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

function tabFromHash(): Tab {
  if (typeof window === "undefined") return "home";
  const h = window.location.hash.replace(/^#/, "");
  if (h.startsWith("legacy")) return "legacy";
  if (h === "talk" || h === "conversation") return "conversation";
  return "home";
}

function legacySlugFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.replace(/^#/, "");
  const m = /^legacy\/([a-z0-9-]+)$/.exec(h);
  return m?.[1] ?? null;
}

export default function AppShell({
  initialOnboardingComplete,
  preferredName = null,
  email = null,
}: {
  initialOnboardingComplete: boolean;
  preferredName?: string | null;
  email?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [conversationId, setConversationId] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(initialOnboardingComplete);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [homeNonce, setHomeNonce] = useState(0);
  const [legacyNonce, setLegacyNonce] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [legacySlug, setLegacySlug] = useState<string | null>(null);
  const [draftBoot, setDraftBoot] = useState("");
  const prevTab = useRef<Tab>("home");

  useEffect(() => {
    setConversationId(loadConversationId());
    setTab(tabFromHash());
    setLegacySlug(legacySlugFromHash());
    try {
      setActivePrompt(window.localStorage.getItem(PROMPT_KEY));
      const saved = window.localStorage.getItem(LEGACY_KEY);
      if (!legacySlugFromHash() && saved) setLegacySlug(saved);
    } catch {
      /* ignore */
    }
    const onHash = () => {
      setTab(tabFromHash());
      setLegacySlug(legacySlugFromHash());
      if (window.location.hash.replace(/^#/, "") === "account") {
        setAccountOpen(true);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    void loadDraft(conversationId).then((text) => {
      if (text) setDraftBoot(text);
    });
  }, [conversationId]);

  useEffect(() => {
    if (prevTab.current !== tab) {
      if (tab === "home") setHomeNonce((n) => n + 1);
      if (tab === "legacy") setLegacyNonce((n) => n + 1);
      prevTab.current = tab;
    }
    const hash =
      tab === "legacy"
        ? legacySlug
          ? `legacy/${legacySlug}`
          : "legacy"
        : tab === "conversation"
          ? "talk"
          : "home";
    if (typeof window !== "undefined") {
      const next = `#${hash}`;
      if (window.location.hash !== next) {
        window.history.replaceState(null, "", next);
      }
    }
  }, [tab, legacySlug]);

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

  const openLegacy = useCallback((slug?: string | null) => {
    setLegacySlug(slug ?? null);
    try {
      if (slug) window.localStorage.setItem(LEGACY_KEY, slug);
      else window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    setTab("legacy");
  }, []);

  const identityLabel = preferredName
    ? `${preferredName}'s private space`
    : "Your private space";

  if (!onboarded) {
    return (
      <div className={styles.shell}>
        <Onboarding onComplete={() => setOnboarded(true)} />
      </div>
    );
  }

  return (
    <div className={`${styles.shell} ${keyboardOpen ? styles.keyboardOpen : ""}`}>
      <UpdateBanner
        onBeforeReload={async () => {
          if (conversationId && draftBoot) {
            await saveDraft(conversationId, draftBoot);
          }
        }}
      />
      <header className={styles.identity}>
        <button
          type="button"
          className={styles.identityBtn}
          onClick={() => setAccountOpen(true)}
          aria-label="Open account"
        >
          <span className={styles.lock} aria-hidden>
            ⌁
          </span>
          <span className={styles.identityText}>
            <span className={styles.identityName}>{identityLabel}</span>
            {email ? <span className={styles.identityEmail}>{email}</span> : null}
          </span>
        </button>
      </header>

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
            onOpenLegacy={() => openLegacy(null)}
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
              initialDraft={draftBoot}
              onDraftChange={(text) => {
                setDraftBoot(text);
                void saveDraft(conversationId, text);
              }}
              onReset={() => {
                const id = crypto.randomUUID();
                try {
                  window.localStorage.setItem(CONV_KEY, id);
                  window.localStorage.removeItem(PROMPT_KEY);
                } catch {
                  /* ignore */
                }
                void clearDraft(conversationId);
                setActivePrompt(null);
                setDraftBoot("");
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
          <LegacyMap
            active={tab === "legacy"}
            nonce={legacyNonce}
            sectionSlug={legacySlug}
            onSectionChange={(slug) => openLegacy(slug)}
          />
        </section>
      </main>

      <AccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onReplayOnboarding={() => {
          setAccountOpen(false);
          setOnboarded(false);
        }}
      />

      {!keyboardOpen ? <NavBar tab={tab} onChange={setTab} /> : null}
    </div>
  );
}
