# Round 3 Execution Ledger

## Base

| Item | Value |
| --- | --- |
| Round 3 branch (to create after Gate 0) | `cursor/client-instrument-round-3` |
| Correct base for Round 3 | `c514f2c` on `cursor/client-instrument-round-2` |
| Do not implement Round 3 on | `main` at `f1135d3` (Round 1 only) |

## Phase 0 Gate answers

1. Round 2 was **not** on `main`; production tracking `main` would serve Round 1.
2. Stale PWA shell is **plausible** (HTML was cached; fixed cache name).
3. Vercel branch unknown without auth; GitHub default is `main` (wrong for Round 2).
4. Production SHA **unmeasured**; likely `f1135d3` if default branch deployed.

## Phase checklist

- [x] Gate 0 production truth docs + credential rotation doc
- [x] `/api/version` build identity
- [x] Service worker: no HTML cache; versioned cache names
- [ ] Before screenshots in `docs/qa/round-3/before/`
- [ ] Round 3 branch from `c514f2c`
- [ ] Baseline suite on Round 3 branch
- [ ] Remaining Round 3 phases after Gate 0 evidence complete
