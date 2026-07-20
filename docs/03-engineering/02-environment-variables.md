# Environment variables

Copy `.env.example` to `.env.local`. Never commit secrets.

| Variable | Where used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | User JWT only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never expose to client |
| `ANTHROPIC_API_KEY` | Server AI gateway | Pages must not call Anthropic directly |
| `OPENAI_API_KEY` | Server STT | Whisper when Deepgram unset |
| `DEEPGRAM_API_KEY` | Server STT | Optional preferred STT |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push | Reminders |
| `CRON_SECRET` | Reminder cron | Authorization for `/api/reminders/cron` |
| `NEXTACT_ALLOW_DEMO` | Local / e2e | Demo adapter without Supabase |
| `AUTH_PASSWORD` / session secrets | Demo gate | See `.env.example` |

Rule: the browser only holds the user JWT. Service role, AI keys, and admin operations stay on the server.
