# Data Safety Contract

Authoritative ownership of client data during updates, offline moments, and reconnect.

## Supabase (authoritative vault)

- User identity and auth session (via Supabase Auth cookies)
- Profiles (preferred name, timezone, reminder prefs)
- Conversations and messages
- Memories (episodic, semantic, procedural)
- Living Legacy entries and Story evidence
- Push subscriptions and reminder delivery logs

Never store the authoritative vault in Cache Storage.

## IndexedDB (`nextact-local`)

Allowed only:

- Unsent composer draft (`draft:<conversationId>`)
- Minimal recoverable UI metadata if required later

Never:

- Full conversation history as source of truth
- Memories, Legacy, profile, or push subscriptions

## Cache Storage (`nextact-shell-<buildSha>`)

Allowed only:

- Versioned static app shell assets
- Safe public icons and `/offline.html`

Must never:

- Cache `/api/*`
- Cache Supabase endpoints
- Cache chat streams
- Cache auth responses
- Delete IndexedDB or auth state on activation

## Service worker activation rules

1. Waiting worker activates only after the user taps **Update NextAct** (`SKIP_WAITING`).
2. Activation deletes only stale `nextact-shell-*` caches.
3. Activation must not touch IndexedDB, cookies, or remote vault data.
4. Navigations use network-first; offline falls back to `/offline.html` only.

## Update recovery

1. Before reload, persist the current composer draft to IndexedDB.
2. After reload, restore the draft for the same conversation id.
3. Supabase session cookies must survive the reload.
4. Conversations, Legacy, and profile reload from Supabase.
