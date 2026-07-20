# Architecture

## Runtime

Next.js App Router on Vercel. Supabase Postgres + Auth + RLS for private vaults. Anthropic for conversation and structured extraction. Service worker for shell + Web Push display.

## Main request paths

1. Sign-in → session cookie / Supabase JWT
2. `/api/state` → Home prompt + tree stage
3. `/api/chat` → retrieve → generate → persist → capture
4. `/api/reminders/cron` → timezone-aware push

## Trust boundaries

Browser never receives service-role keys, model keys, or VAPID private keys. RLS is the privacy boundary for exposed tables. The StorageAdapter always filters by the session-derived `client_id`.

## Why one codebase

Three pilots share one product. Isolation is data-plane (vaults), not repository-plane.
