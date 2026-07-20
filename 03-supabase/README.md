# 03 · Supabase

Postgres schema for private vaults.

| Path | Role |
| --- | --- |
| `migrations/0001_init.sql` | Core tables + RLS |
| `migrations/0002_round2_vaults.sql` | Round 2 vault / profile extensions |
| `seed.sql` | Optional seed data |

Apply migrations in Supabase before production use. See `00-docs/07-deployment/01-DEPLOYMENT.md`.
