# Round 3 Production Truth

Captured during Phase 0 before Round 3 UI work. Evidence that explains why the iPhone appeared “almost unchanged.”

## Git truth

| Item | Value |
| --- | --- |
| Current branch (audit) | `cursor/client-instrument-round-2` |
| Current HEAD | `c514f2ca752c98bb4d2eb9613e3ade80e48243a5` (`c514f2c`) |
| Default branch | `main` |
| Origin | `https://github.com/epi-hui9/beyond-the-title.git` |
| Package | `beyond-the-title@0.1.0` |
| Working tree at audit | clean |
| Commit `c514f2c` exists | Yes |
| Branches containing `c514f2c` | `cursor/client-instrument-round-2` only (local + origin) |
| Does `main` contain `c514f2c` | **No** |
| `origin/main` tip | `f1135d3` Round 1 vertical slice |
| Diff `main`…`round-2` | 75 files, +3709 / −391 (Round 2 only on feature branch) |

## Vercel truth

| Item | Value |
| --- | --- |
| Local `.vercel` project link | **Absent** |
| Vercel CLI authenticated in this environment | **No** (CLI downloads but no auth session / no project) |
| `gh` CLI | Not installed |
| Production URL | **Unknown / not discoverable from this machine** |
| Production branch | **Unknown**; GitHub default branch is `main` |
| Latest production deployment SHA | **Unknown without Vercel access** |
| Does production contain `c514f2c` | **Cannot confirm via Vercel API.** If production tracks `main`, it serves **`f1135d3` (Round 1), not Round 2.** |

## Expected vs actual SHA

| | SHA | Meaning |
| --- | --- | --- |
| Expected for Round 2 | `c514f2c` | Round 2 Trust Loop foundation |
| Actual if Vercel deploys `main` | `f1135d3` | Round 1 only |
| Actual production SHA measured via `/api/version` | **Not available** (no production URL + endpoint not yet on Round 1) |

## Service-worker diagnosis

| Item | Finding |
| --- | --- |
| SW file | `public/sw.js` |
| Cache name (Round 2 code) | Hardcoded `nextact-shell-v2` |
| Navigation strategy | Network-first, then **writes the HTML response into Cache Storage** |
| Precache | Includes `/` (app shell HTML) |
| Activation | `skipWaiting` + `clientsClaim` without an “Update available” prompt |
| Risk | An installed iPhone PWA can keep serving a previous HTML shell from cache when offline or after a failed fetch; cache name is not tied to Git SHA, so deployments can look sticky |
| Round 1 SW (on `main`) | Earlier `nextact-shell-v1` pattern; installed devices may still hold old caches until a new SW activates and deletes them |

## Was Round 2 actually deployed?

**Almost certainly no, if Vercel production follows the GitHub default branch.**

Proof:

1. Round 2 commit `c514f2c` is not an ancestor of `origin/main`.
2. `origin/main` remains at Round 1 `f1135d3`.
3. This environment has no Vercel project link and cannot read a live deployment SHA.
4. Round 2 was only pushed to `origin/cursor/client-instrument-round-2`.

## Gate 0 answers

1. **Was Round 2 present in production?** Not on `main`. Without a measured production SHA, treat production as Round 1 unless Vercel is proven to track the Round 2 branch.
2. **Was the installed PWA serving an old cached shell?** Plausible and consistent with the SW design (HTML cached; fixed cache name; aggressive `skipWaiting`). Must be cleared or force-updated after the correct SHA is deployed.
3. **Is Vercel deploying the correct branch?** Unknown without Vercel access. Default GitHub branch is `main`, which does **not** contain Round 2.
4. **What exact SHA does production serve?** **Unknown until `/api/version` is hit on the live URL.** Most likely `f1135d3` if production = `main`.

## Evidence paths

- Before screenshots (Round 1 baseline, local production build of `main` tip): `docs/qa/round-3/before/`
- This document: `docs/qa/round-3/PRODUCTION_TRUTH.md`
- Credential rotation (no secret values): `docs/security/ROUND_3_CREDENTIAL_ROTATION.md`
