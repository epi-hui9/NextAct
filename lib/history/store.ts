"use client";

import type { UIMessage } from "ai";
import type { Thread } from "./types";
import {
  loadActiveId,
  loadThreads,
  newId,
  saveActiveId,
  saveThreads,
  titleFromMessages,
} from "./storage";

/**
 * A tiny external store for thread history, consumed via `useSyncExternalStore`.
 *
 * Using an external store (rather than component state + effects) is the
 * idiomatic React way to read from and hydrate an external system like local
 * storage. It keeps hydration off the render path, avoids SSR/CSR mismatches,
 * and needs no in-effect setState.
 */

interface State {
  threads: Thread[];
  activeId: string;
  hydrated: boolean;
}

// Constant server/first-paint snapshot so SSR and the first client render match.
const SERVER_STATE: State = { threads: [], activeId: "", hydrated: false };

let state: State = SERVER_STATE;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function set(next: State): void {
  state = next;
  emit();
}

function hydrate(): void {
  if (state.hydrated) return;
  const threads = loadThreads();
  const storedActive = loadActiveId();
  const activeId =
    storedActive && threads.some((t) => t.id === storedActive)
      ? storedActive
      : newId();
  set({ threads, activeId, hydrated: true });
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Hydrate on first subscription (runs in React's subscribe effect, off-render).
  hydrate();
  return () => {
    listeners.delete(callback);
  };
}

export function getSnapshot(): State {
  return state;
}

export function getServerSnapshot(): State {
  return SERVER_STATE;
}

/** Begin a fresh, unsaved conversation. It only enters history once it has a message. */
export function startNew(): void {
  const id = newId();
  saveActiveId(id);
  set({ ...state, activeId: id });
}

export function select(id: string): void {
  saveActiveId(id);
  set({ ...state, activeId: id });
}

export function remove(id: string): void {
  const threads = state.threads.filter((t) => t.id !== id);
  saveThreads(threads);
  let activeId = state.activeId;
  if (id === activeId) {
    activeId = newId();
    saveActiveId(activeId);
  }
  set({ ...state, threads, activeId });
}

/** Persist the active thread's messages, creating the thread record if needed. */
export function commit(messages: UIMessage[]): void {
  if (messages.length === 0) return;
  const id = state.activeId;
  const now = Date.now();
  const existing = state.threads.find((t) => t.id === id);

  const updated: Thread = existing
    ? {
        ...existing,
        messages,
        updatedAt: now,
        // Refresh a still-default title once a real user message exists.
        title:
          existing.title === "New conversation"
            ? titleFromMessages(messages)
            : existing.title,
      }
    : {
        id,
        title: titleFromMessages(messages),
        createdAt: now,
        updatedAt: now,
        messages,
      };

  const threads = existing
    ? state.threads.map((t) => (t.id === id ? updated : t))
    : [...state.threads, updated];

  saveThreads(threads);
  saveActiveId(id);
  set({ ...state, threads });
}
