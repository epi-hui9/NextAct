# Testing

## Commands

```bash
pnpm typecheck
pnpm test          # vitest
pnpm test:e2e      # playwright iPhone
pnpm build
pnpm lint
```

## Coverage

- Unit: story math, tree stages, legacy fill, RRF, calculator, guards, validation, files, gateway, memory, scheduler, adapter isolation
- E2E: manifest, overflow, Home→Talk, composer reachability, failed-request text retention, Legacy, file accept, 44px targets
- Not automated here: live Supabase RLS against a provisioned project, real iPhone Web Push delivery, Lighthouse on production URL

## Real-device checklist

See the Round 2 delivery report / `00-docs/11-rounds/history/ROUND_2_EXECUTION.md`.
