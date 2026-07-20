# Reminders / Web Push

## What was broken

`nextact-client-instrument` returned `webPush: missing` because `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` were not set. After Allow, the client called `/api/reminders/vapid-public` and received **503**, which surfaced as “Reminders need a moment to finish server setup.”

## Fix (2026-07-20)

VAPID keys were generated and written to Production + Preview for `nextact-client-instrument`, then redeployed. Health now reports `webPush: configured`.

## Client flow

1. Prefer Home Screen PWA (standalone).
2. `Notification.requestPermission()`.
3. Fetch VAPID public key.
4. `pushManager.subscribe`.
5. POST `/api/reminders/subscribe`.

Daily send uses `/api/reminders/cron` with `CRON_SECRET`.
