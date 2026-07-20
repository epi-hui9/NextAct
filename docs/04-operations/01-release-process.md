# Release process

1. Land changes on `main` via PR or direct push when authorized.
2. Vercel builds production from `main` (`nextact-client-instrument`).
3. Confirm health: `/api/health` (auth, voice, webPush signals).
4. Smoke on iPhone Home Screen PWA: Home, Talk, Path, Legacy, reminders.
5. If schema changed, apply `supabase/migrations/` before or with the deploy.

Preview deployments validate risky UI or API changes before promoting.
