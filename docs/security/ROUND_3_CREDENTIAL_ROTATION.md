# Round 3 Credential Rotation

Sensitive production credentials were exposed in project notes and conversation history. Treat every exposed value as compromised. **No secret values are recorded in this file.**

| Credential category | Rotation status | Provider | Date | Environment updated | Old credential revoked | Remaining user action |
| --- | --- | --- | --- | --- | --- | --- |
| Anthropic API key | REQUIRED | Anthropic Console | 2026-07-19 | Local `.env.local` and Vercel Production must be updated after rotation | PENDING | Create a new key; revoke the exposed key; update Vercel env; never paste into chat |
| Supabase service-role key | REQUIRED | Supabase Project Settings → API | 2026-07-19 | Pending | PENDING | Rotate or reset service role if the project allows; otherwise create a new project and migrate; update Vercel |
| Supabase database password | REQUIRED | Supabase Project Settings → Database | 2026-07-19 | Pending | PENDING | Reset database password; update any connection strings that used it |
| AUTH_SECRET (HMAC session) | REQUIRED | Self-generated | 2026-07-19 | Pending | PENDING | Generate a new long random secret; update Vercel and local; invalidates old demo gate cookies |
| GATE_PASSWORD (shared gate) | REQUIRED | Self-managed | 2026-07-19 | Pending | PENDING | Replace with a new value for demo only; do not use as production identity; prefer Supabase Auth |
| VAPID private key | CHECK | Self-generated | 2026-07-19 | Not confirmed present | N/A if never issued | If any VAPID private key was pasted, regenerate the pair and update server env |
| CRON_SECRET | CHECK | Self-generated | 2026-07-19 | Not confirmed present | N/A if never issued | Generate a new secret if previously exposed |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | PUBLIC_BY_DESIGN | Supabase | 2026-07-19 | N/A | N/A | Confirm RLS is enabled on every exposed client table; anon key alone must not grant cross-vault access |

## Scan results (no values)

| Check | Result |
| --- | --- |
| Tracked Git files containing Anthropic key-shaped or JWT service-role-shaped literals | None found |
| `.env.local` | Present, gitignored |
| Git history path scan for `sk-ant-` | No matching tracked history paths found in this clone |

## Rules going forward

1. Never print secret values in terminal reports, chat, commits, or docs.
2. Rotate before any further production deployment that uses the old values.
3. A shared product password is not a client identity system.
