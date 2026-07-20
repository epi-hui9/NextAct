# PWA Update Lifecycle

## Goal

One-tap production updates without Home Screen reinstall, without losing auth, conversations, Legacy, profile, or an unsent draft.

## Flow

1. `/api/version` returns the short Git SHA for the build.
2. `ServiceWorker` registers `/sw.js?v=<shortSha>` so each deploy gets a new script URL and cache name `nextact-shell-<sha>`.
3. When a new worker reaches `installed` while an old controller exists, `UpdateBanner` shows:
   - title: NextAct is ready to update
   - action: Update NextAct
4. On tap:
   - save composer draft to IndexedDB
   - post `{ type: "SKIP_WAITING" }` to the waiting worker
   - wait for `controllerchange`
   - reload exactly once (8s timeout recovery if the event is missed)
5. Activation deletes only older `nextact-shell-*` caches.
6. Draft restores from IndexedDB after reload.

## Non-goals

- Auto `skipWaiting()` on install
- Cache-first HTML or API responses
- Clearing IndexedDB or auth during activation
