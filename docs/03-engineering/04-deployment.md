# Deployment

## One-time setup

1. Create one Supabase project (shared app, private per-user vaults).
2. Run migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_round2_vaults.sql`
3. In Auth settings: disable public signup. Invite Mio, Elizabeth, and George with email/password.
4. Create a Vercel project from this GitHub repository.
5. Set production environment variables from `.env.example` (never commit values).
6. Set Auth redirect URLs to the production domain and `/auth/callback`.
7. Schedule `POST /api/reminders/cron` every 15 minutes with header `Authorization: Bearer $CRON_SECRET` (Supabase Cron or Vercel Cron).

## Required production variables

| Name | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Chat and extraction |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + user-scoped server client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only adapter and cron |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push |
| `CRON_SECRET` | Protects the reminder cron route |

## Local demo (non-production)

```bash
NEXTACT_ALLOW_DEMO=1
GATE_PASSWORD=...
AUTH_SECRET=...
ANTHROPIC_API_KEY=...
```

Demo mode is blocked when `VERCEL_ENV=production`.

## Health

`GET /api/health` reports configuration presence without secrets.

## Rollback

Redeploy the previous Vercel deployment. Database migrations are additive; do not drop client tables without an explicit backup.
