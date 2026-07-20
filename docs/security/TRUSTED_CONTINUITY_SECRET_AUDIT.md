# Trusted Continuity Secret Audit

No secret values are recorded in this file.

| Category | Status | Notes |
| --- | --- | --- |
| Tracked Git files with Anthropic / JWT / sb_secret shaped literals | Clear at audit | `git grep` found no tracked matches |
| `.env.local` | Present, gitignored | Must not be committed |
| Production Vercel env | Names present | Values Encrypted; previously pasted credentials must remain treated as compromised and rotated |
| Chat / Notion paste exposure | Compromised by history | Continue using rotated values only |
| Browser bundle secret scan | Pending each deploy | Service role must never appear in `.next/static` |

## Required ongoing actions

1. Keep rotating any credential that appears in chat or shared docs.
2. Never print env values in reports.
3. Prefer Supabase Auth for identity; do not rely on shared GATE_PASSWORD in production.
