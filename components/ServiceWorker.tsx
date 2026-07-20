"use client";

import { useEffect } from "react";

/**
 * Registers the offline-shell service worker in production only.
 * Version query comes from /api/version so each deploy gets a new cache name.
 * Development unregisters workers so stale shells never hide local changes.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const data = res.ok
          ? ((await res.json()) as { shortSha?: string })
          : null;
        if (cancelled) return;
        const v = data?.shortSha || "prod";
        await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(v)}`);
      } catch {
        if (!cancelled) {
          await navigator.serviceWorker.register("/sw.js?v=prod").catch(() => {});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
