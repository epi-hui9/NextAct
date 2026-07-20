"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./UpdateBanner.module.css";

/**
 * Detects a waiting service worker and asks the person to update deliberately.
 * Never activates a waiting worker while composing without consent.
 */
export default function UpdateBanner({
  onBeforeReload,
}: {
  onBeforeReload?: () => Promise<void> | void;
}) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const reloading = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;

    async function watch(reg: ServiceWorkerRegistration) {
      if (reg.waiting) {
        if (!cancelled) setReady(true);
      }
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            if (!cancelled) setReady(true);
          }
        });
      });
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) void watch(reg);
    });

    const onController = () => {
      if (reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
    };
  }, []);

  async function update() {
    setBusy(true);
    try {
      await onBeforeReload?.();
      const reg = await navigator.serviceWorker.getRegistration();
      const waiting = reg?.waiting;
      if (!waiting) {
        setReady(false);
        setBusy(false);
        return;
      }
      waiting.postMessage({ type: "SKIP_WAITING" });
      window.setTimeout(() => {
        if (!reloading.current) {
          reloading.current = true;
          window.location.reload();
        }
      }, 8000);
    } catch {
      setBusy(false);
    }
  }

  if (!ready) return null;

  return (
    <div className={styles.banner} role="status">
      <div className={styles.copy}>
        <p className={styles.title}>NextAct is ready to update</p>
        <p className={styles.body}>Your conversations and Legacy stay with you.</p>
      </div>
      <button type="button" className={styles.action} onClick={() => void update()} disabled={busy}>
        {busy ? "Updating…" : "Update NextAct"}
      </button>
    </div>
  );
}
