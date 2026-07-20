# Data and Privacy

## Architecture

One codebase. One production app. Three private vaults (Mio, Elizabeth, George) as separate `client_id` / `auth.uid()` bindings inside one Supabase project.

## Ownership

- Every client-owned row carries `client_id`.
- `profiles.user_id = auth.uid()` and maps 1:1 to `client_id`.
- The server never trusts a client-supplied owner id. Session resolution derives the vault.

## RLS

Migrations enable RLS on exposed client tables. Policies require membership via `app_client_ids()` or `user_id = auth.uid()` for profiles and push subscriptions.

## Secrets

| Location | Allowed |
| --- | --- |
| Browser | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC` VAPID public key via API |
| Server only | service role, Anthropic, VAPID private, cron secret, Deepgram |

## Logging

`ai_runs` stores metadata only (model, tokens, latency, status). No raw prompts, transcripts, or memory text.

## Cross-user tests

- Adapter isolation unit tests in `tests/privacy-isolation.test.ts`.
- Live Supabase RLS matrix must be run after project provisioning (see ROUND_2_EXECUTION.md blockers).

## Limitations

Until Supabase credentials are configured in production, the live privacy boundary is not exercised. Local demo mode is explicit and forbidden on Vercel production.
