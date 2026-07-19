# NextAct — Client Instrument (Round 1)

A private, mobile-first space where an executive turns a lifetime of judgment
into a visible living legacy, one natural conversation at a time.

Round 1 ships a single complete Story-stage vertical slice: **Home**,
**Conversation** (with voice and file upload), and the **Living Legacy Map**,
backed by four-layer memory, deterministic Story progress, and automatic
evidence validation.

## Run locally

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Required env (`.env.local`):

```
ANTHROPIC_API_KEY=...
GATE_PASSWORD=...        # the word to enter the app
AUTH_SECRET=...          # long random string
```

Optional: `DEEPGRAM_API_KEY` (voice-to-text), `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (live persistence),
`MODEL_WORKHORSE` / `MODEL_SMALL` / `MODEL_FRONTIER` / `MODEL_VERIFIER`. See
`.env.example`.

## Verify

```bash
pnpm typecheck
pnpm test           # vitest unit + security
pnpm test:e2e       # Playwright, iPhone viewport (needs: playwright install)
pnpm build
```

## iPhone testing

Build and start on your LAN, then open the printed URL in iOS Safari and
**Add to Home Screen** to install the PWA:

```bash
pnpm build
pnpm start -H 0.0.0.0 -p 3000
```

## Architecture (Round 1)

- **Model gateway** (`lib/ai/gateway.ts`): deterministic role routing
  (small / workhorse / frontier / verifier), falling back to one known-good
  model when only one is configured.
- **Four-layer memory** (`lib/memory`, `lib/db`): episodic, semantic (with
  supersession), procedural (separate rule library), and per-client style.
- **Story evidence** (`lib/story`): twelve fixed areas, weighted deterministic
  progress. Never shown as a checklist.
- **Living Legacy** (`lib/legacy`): eight fixed sections, deterministic map fill.
- **Storage** (`lib/db`): a `StorageAdapter` interface with a local demo adapter;
  Supabase migrations + RLS live in `supabase/` for later provisioning.

The demo adapter is local, not production privacy. Live vs demo status is stated
in the engineering handoff.
