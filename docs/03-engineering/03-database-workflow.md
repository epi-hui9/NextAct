# Database workflow

Supabase schema lives in this repo under `supabase/`.

## Migrations

- Add files under `supabase/migrations/` with timestamp names, e.g. `202607201430_create_reminder_preferences.sql`.
- Prefer additive changes. Document RLS intent in the migration comment.
- Seed data: `supabase/seed.sql`.

## Local recreate

Anyone should be able to recreate the vault from migrations + seed. Apply with the Supabase CLI or the project SQL editor in the same order as the filenames.

## Tests

Cross-cutting Vitest coverage lives in `tests/integration/`. Feature-local tests may sit under `src/features/<domain>/tests/`. Database RLS pgTAP suites belong in `supabase/tests/` when added.
