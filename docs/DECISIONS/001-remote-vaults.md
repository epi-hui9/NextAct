# ADR 001: One codebase, private per-user vaults

## Decision

Use one Git repository and one production application with Supabase Auth + RLS for Mio, Elizabeth, and George. Do not fork three repositories.

## Why

Duplicated repos multiply security patches and drift. RLS with `auth.uid()`-bound rows is the standard multi-tenant boundary for this pilot.
