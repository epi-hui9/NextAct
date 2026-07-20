# Secrets management

- Store secrets in Vercel env (Production / Preview) and local `.env.local` only.
- Never commit `.env.local`, service role keys, or AI keys.
- Browser code may use `NEXT_PUBLIC_*` anon keys only.
- After a suspected leak, rotate Anthropic, OpenAI/Deepgram, Supabase service role, VAPID, and cron secrets; record the rotation in `docs/99-archive/security-records/` without pasting values.
