# Incident response

1. **Contain:** rotate leaked secrets immediately; revoke compromised sessions if needed.
2. **Assess:** check Vercel logs, Supabase auth/logs, `/api/health`.
3. **Fix:** prefer a small forward fix on `main`; document root cause in `docs/07-decisions/` or archive notes if historical.
4. **Verify:** production smoke on the private PWA; confirm no cross-user data paths.

Privacy incidents involving vault content are highest priority. Prefer locking down access over preserving convenience.
