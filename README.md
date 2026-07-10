# Beyond the Title

A private, invitation-only AI conversation for senior executives in transition.
The experience is a single quiet page: a serif welcome line and one input.
Nothing about the internals is ever visible.

This is **Round 1**. It ships the persona (L1) for real and leaves clean,
typed seams for the knowledge graph (L2) and living memory (L3) that arrive in
Rounds 2 and 3.

## Architecture (internal only — never surfaced in the UI)

The chat route calls through three conceptual layers so future rounds are
drop-in:

- **L1 — Persona Core** (`lib/l1-persona/`) — _implemented_. Elizabeth's voice
  and judgment, read from `persona-core.md` and injected as the system prompt
  every turn. The Markdown is clearly-marked **placeholder** to be replaced in
  Round 2.
- **L2 — Knowledge Graph** (`lib/l2-knowledge/`) — _placeholder_. Typed no-op
  `retrieve()` returning `[]`. Future GraphRAG source.
- **L3 — Living Memory** (`lib/l3-memory/`) — _placeholder_. Typed no-op
  `recall()` / `remember()`. Future agentic retrieval + memory loop.

The model provider is isolated in `lib/ai/model.ts` — change the model in one
place.

## Tech

- Next.js 16 (App Router, TypeScript, RSC where sensible)
- Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) — true token
  streaming via `streamText` + `useChat`
- Framer Motion for restrained motion
- pnpm, ESLint + Prettier, strict TypeScript

## Local setup

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `GATE_PASSWORD` — the word the two viewers will type
   - `AUTH_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
3. `pnpm dev` and open http://localhost:3000 to verify locally.

Useful scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm format`.

## Deploy to Vercel

1. `pnpm install`
2. Copy `.env.example` to `.env.local`, fill `ANTHROPIC_API_KEY`,
   `GATE_PASSWORD`, `AUTH_SECRET`.
3. `pnpm dev` to verify locally.
4. Push to a private GitHub repo.
5. Import the repo in Vercel. The framework is auto-detected (Next.js).
6. In Vercel → Project Settings → Environment Variables, add the same three
   variables.
7. Deploy. Share the Vercel URL and the gate password with the two viewers.
