"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { UIMessage } from "ai";
import type { ThreadSummary } from "@/lib/history/types";
import { toSummaries } from "@/lib/history/storage";
import {
  commit,
  getServerSnapshot,
  getSnapshot,
  remove,
  select,
  startNew,
  subscribe,
} from "@/lib/history/store";

export interface ThreadStore {
  hydrated: boolean;
  activeId: string;
  summaries: ThreadSummary[];
  /** Messages for the active thread, or [] for a fresh unsaved thread. */
  activeMessages: UIMessage[];
  startNew: () => void;
  select: (id: string) => void;
  remove: (id: string) => void;
  /** Persist the active thread's current messages (called by the chat surface). */
  commit: (messages: UIMessage[]) => void;
}

/** React binding over the thread history external store. */
export function useThreadStore(): ThreadStore {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const summaries = useMemo(() => toSummaries(state.threads), [state.threads]);

  const activeMessages = useMemo(
    () => state.threads.find((t) => t.id === state.activeId)?.messages ?? [],
    [state.threads, state.activeId],
  );

  return {
    hydrated: state.hydrated,
    activeId: state.activeId,
    summaries,
    activeMessages,
    startNew,
    select,
    remove,
    commit,
  };
}
