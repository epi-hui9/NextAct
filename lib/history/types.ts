import type { UIMessage } from "ai";

/** A stored conversation thread. Messages hold only visible text parts. */
export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
}

/** Lightweight thread descriptor for the history list. */
export interface ThreadSummary {
  id: string;
  title: string;
  updatedAt: number;
}

/** Versioned envelope persisted to local storage. */
export interface StoredThreads {
  version: 1;
  threads: Thread[];
}
