# Adaptive Learning Platform — Production Skeleton (Phase 1: Backend + Infra)

Docs-first UI/UX prototypes: [ui-prototype/](ui-prototype) (interactive; EdX + Coursera aesthetic).

## Overview

- `packages/shared` (`@al/shared`) — domain types/constants shared by web, mobile, backend.
- `packages/backend` (`@al/backend`) — Node/TypeScript modular monolith ("API + service modules"):
  - Auth: JWT access + refresh tokens (rotation, hashing), TOTP 2FA, RBAC guards.
  - Modules (routes per plan): users, classes (arms, enrollment), live sessions + attendance + time-boxed sneaking peek (120s, per-parent rate limits), courses/lessons/progress, social feed prefs, billing/invoices/payouts, news (RSS aggregator stub), proctoring (stub).
  - Jobs: BullMQ workers (reminders, progress reports, payouts).
  - Observability: OTel traces (`OTEL_ENDPOINT`), Sentry (`SENTRY_DSN`), pino structured logs.
  - Prisma/PostgreSQL (Neon), Upstash Redis, BullMQ, in-memory rate limiter (NGINX + Redis upgrade noted).
  - `prisma/schema.prisma` + `prisma/seed.js`.
- `apps/web`, `apps/mobile` — built from `ui-prototype/` (Phase 2+).

## Development

```sh
pnpm install
pnpm --filter @al/backend generate
pnpm --filter @al/backend db:push    # push schema to Neon DB
pnpm --filter @al/backend db:seed    # seeds admin/tutor/parent/student + sample data
pnpm dev                             # tsx watch for the backend
```

Env: `packages/backend/.env` (from `.env.example`). Database: Neon Postgres; Redis: Upstash or local (`docker compose up -d redis`).

## Tests / Lint

```sh
pnpm test
pnpm lint
```

## Production

- Render/Fly for prod; GitHub Actions builds `packages/backend` Docker image.
- Security hardening notes in `TODO.md` later:pencil2: (Phase 5 security audits from the plan).
