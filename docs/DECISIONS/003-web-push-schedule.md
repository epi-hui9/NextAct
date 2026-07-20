# ADR 003: Web Push scheduling

## Decision

Store push subscriptions and IANA timezones per user. A secured cron route selects users whose local hour is 10 and who have not been sent a reminder for that local date.

## Why

Client timers are unreliable. Server-side idempotent scheduling respects daylight saving via IANA zones.
