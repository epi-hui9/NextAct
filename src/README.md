# Source layout

```
src/
  app/           # routes, layout, API
  features/      # domain vertical slices
  components/    # shared ui/ + brand/
  server/        # ai, supabase, retrieval, db, files, security
  lib/           # env, validation, utilities
  styles/        # globals
  types/         # ambient types
  proxy.ts       # request auth gate
```

Path alias: `@/*` → `src/*`.
