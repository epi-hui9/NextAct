# Notifications

## Production chain

1. Installed Home Screen PWA (required on iOS).
2. User taps Enable my 10:00 AM reminder.
3. Notification permission from that gesture.
4. PushManager subscription with VAPID public key from `/api/reminders/vapid-public`.
5. `POST /api/reminders/subscribe` stores the subscription under the authenticated user (RLS) and enables reminder prefs with IANA timezone.
6. Cron: `POST /api/reminders/cron` with `Authorization: Bearer $CRON_SECRET` selects users due at local 10:00 and sends Web Push.
7. Delivery log enforces idempotency per user per local date.
8. Account sheet can send a test notification via `/api/reminders/send-test`.

## Required env

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (e.g. `mailto:ops@nextact.app`)
- `CRON_SECRET`

If these are missing, health reports `webPush: missing` and the UI stays honest.

## UI states

- unavailable on this device
- Home Screen required
- permission denied
- enabled
- test sent
- server setup incomplete (503)
