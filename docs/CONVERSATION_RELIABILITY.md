# Conversation Reliability

## Contract

1. Validate session before send (401 → session expired copy).
2. Client generates a UUID `idempotencyKey` per user turn.
3. Server persists the user message **before** model generation.
4. Retry with the same key must not create a duplicate user message.
5. If an assistant reply already exists after that user message, return it.
6. Model generation uses a server timeout only. Client disconnect (`req.signal`) is not forwarded into `generateText`.
7. On reconnect, the client loads `/api/chat/messages?conversationId=…` and reconciles UI from Supabase.
8. Error classes: `session_expired`, `stream_interrupted`, `provider_error`, `server_error`, plus client offline detection.
9. Safe logs: `requestId`, hashed user id, `conversationId`, stage, latency, error class. Never log message bodies.

## Endpoints

- `POST /api/chat` – persist-first generation + stream reveal
- `GET /api/chat/messages` – authoritative history for reconciliation

## Acceptance

A user message accepted by the server is never lost, even when the stream is interrupted.
