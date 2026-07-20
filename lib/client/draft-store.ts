/**
 * IndexedDB helpers for unsent drafts and update recovery.
 * Never stores vault content. Never authoritative.
 */

const DB_NAME = "nextact-local";
const STORE = "kv";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(conversationId: string, text: string): Promise<void> {
  await withStore("readwrite", (s) => s.put({ text, at: Date.now() }, `draft:${conversationId}`));
}

export async function loadDraft(conversationId: string): Promise<string> {
  const row = await withStore<{ text?: string } | undefined>("readonly", (s) =>
    s.get(`draft:${conversationId}`),
  );
  return row?.text ?? "";
}

export async function clearDraft(conversationId: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(`draft:${conversationId}`));
}

export async function clearAllDrafts(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith("draft:")) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
