# Trusted Continuity Acceptance Matrix

| Item | Root cause (pre-fix) | Status |
| --- | --- | --- |
| Lost connection on send | Client disconnect aborted generation; optimistic UI removed user message on error; no reconcile | Partial local fix; production verify after deploy |
| Reminders not configured | Missing VAPID/CRON env in production | BLOCKED_BY_EXTERNAL_CREDENTIAL until VAPID env confirmed |
| Identity / password / sign out | No Account surface | Implemented locally |
| One-tap PWA update | SW auto skipWaiting; no Update banner | Implemented locally |
| Legacy mixed overview/detail | Detail overlay left overview visible | Exclusive modes via `#legacy` / `#legacy/<slug>` |
| Tree + percentage | Percentage missing on Home | Deterministic progress + stage labels |
| Banned word quiet / em dash | Present in copy and comments | CI `scan:banned-copy` |
| Change password | Missing | Account sheet `updateUser` |
| Sign out | Partial | Account sheet + draft clear |

Statuses allowed: VERIFIED | BLOCKED_BY_EXTERNAL_CREDENTIAL | REQUIRES_REAL_IPHONE | PLATFORM_LIMITATION
