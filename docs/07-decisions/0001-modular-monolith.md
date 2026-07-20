# ADR 0001: Modular monolith

## Context

NextAct is one Next.js PWA, one Supabase backend, and one Vercel deploy line. Introducing Turborepo, microservices, or a multi-package monorepo would add coordination cost without serving a second deployable product.

## Decision

Keep a **single repository + modular monolith**: feature-first domains under `src/features`, shared server capabilities under `src/server`, framework-owned `src/app` / `public` / `supabase`, and numbered docs only under `docs/`.

## Consequences

- Faster local onboarding and simpler CI.
- Clear ownership per domain (auth, conversation, journey, legacy, reminders, settings).
- If a second deployable service appears later, extract from a feature boundary; do not preemptively split the repo.
