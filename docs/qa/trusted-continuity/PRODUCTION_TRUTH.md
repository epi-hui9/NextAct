# Production Truth (Trusted Continuity)

Captured at sprint start and updated at delivery.

## Start (before)

- Branch: `cursor/trusted-continuity-sprint` (from `91540cf`)
- Production URL: `https://beyond-the-title-steel.vercel.app`
- Production `/api/version` shortSha: `91540cf` (matched Git HEAD)
- Health: `ok: true`, supabase configured, ai configured, `webPush: missing`
- SW: auto skipWaiting risk (pre-fix); no Update banner

## After delivery

- Feature branch: `cursor/trusted-continuity-sprint`
- Production branch: `main` @ `41744f1`
- Production `/api/version` shortSha: `41744f1` (matches Git)
- Health: `ok: true`, supabase configured, ai configured, **webPush: configured**
- `/api/reminders/vapid-public`: HTTP 200

## Env names present in production (values never logged)

- ANTHROPIC_API_KEY
- AUTH_SECRET
- SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
- NEXT_PUBLIC_VAPID_PUBLIC_KEY
- CRON_SECRET

## Before screenshots

See `docs/qa/trusted-continuity/before/`
