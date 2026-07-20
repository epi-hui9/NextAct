# ADR 0002: Supabase as source of truth

## Context

The product is a private vault. Client-side storage cannot be the system of record for legacy entries, story progress, or reminders across devices.

## Decision

Supabase (Postgres + Auth + RLS) is the source of truth. Migrations and seed live in `supabase/`. The app talks to data through server adapters; the browser uses the user JWT only.

## Consequences

- Demo mode may use an in-memory adapter for local/e2e only.
- Schema changes require migrations in git.
- Cross-user isolation is enforced with RLS, not UI conventions.
