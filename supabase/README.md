# Supabase

Migrations and seed for the NextAct vault.

```
supabase/
  migrations/   # ordered SQL
  seed.sql
  functions/    # edge functions (optional)
  tests/        # pgTAP / DB tests (optional)
  config.toml   # when using Supabase CLI locally
```

Apply migrations in filename order. See `docs/03-engineering/03-database-workflow.md`.
