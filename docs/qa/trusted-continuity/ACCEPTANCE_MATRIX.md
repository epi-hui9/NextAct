# Trusted Continuity Acceptance Matrix

| Item | Root cause (pre-fix) | Files | Automated test | Prod evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Lost connection on send | Client abort canceled generation; UI removed user msg; no reconcile | `app/api/chat/route.ts`, `ConversationView.tsx`, `app/api/chat/messages/route.ts` | privacy + unit suite | Deployed `41744f1` | REQUIRES_REAL_IPHONE for interrupt path |
| Reminders not configured | Missing VAPID/CRON | reminder routes, Vercel env | scheduler tests | health `webPush: configured`, vapid 200 | VERIFIED (server); REQUIRES_REAL_IPHONE for Home Screen push |
| Identity / password / sign out | No Account surface | `AccountSheet.tsx`, `app/api/account`, `AppShell.tsx` | typecheck/build | Deployed | REQUIRES_REAL_IPHONE for pilot login UX |
| One-tap PWA update | Auto skipWaiting; no banner | `public/sw.js`, `UpdateBanner.tsx`, `draft-store.ts` | `data-safety.test.ts` | Deployed SW | REQUIRES_REAL_IPHONE |
| Legacy mixed state | Overlay left overview visible | `LegacyMap.tsx` hash modes | build | Deployed | REQUIRES_REAL_IPHONE visual |
| Tree + percentage | Missing % | `lib/story/tree.ts`, `Home.tsx` | `tests/tree.test.ts` | Deployed | VERIFIED locally; REQUIRES_REAL_IPHONE visual |
| Banned quiet / em dash | Present in copy | product paths + `scripts/banned-copy.mjs` | `pnpm scan:banned-copy` | CI script | VERIFIED |
| Change password | Missing | Account sheet `updateUser` | build | Deployed | REQUIRES_REAL_IPHONE |
| Sign out | Incomplete | Account + draft clear | build | Deployed | REQUIRES_REAL_IPHONE |

Statuses: VERIFIED | BLOCKED_BY_EXTERNAL_CREDENTIAL | REQUIRES_REAL_IPHONE | PLATFORM_LIMITATION
