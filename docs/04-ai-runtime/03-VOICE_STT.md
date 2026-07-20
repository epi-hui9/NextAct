# Voice transcription

High-quality STT only:

1. Prefer `DEEPGRAM_API_KEY` (Deepgram nova-2)
2. Else `OPENAI_API_KEY` (OpenAI Whisper `whisper-1`)

If neither is set:

- `GET /api/transcribe` returns `{ available: false }`
- Composer mic is disabled
- Tap shows: “Voice typing is unavailable right now. Please type your message.”
- `POST /api/transcribe` returns 503

Browser / iPhone `SpeechRecognition` is never used.
