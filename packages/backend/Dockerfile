# Multi-stage build: shared (typecheck/compile) + backend (compile)
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @al/shared build && pnpm --filter @al/backend build

# Runtime: minimal deps; built artifacts overlayed from the builder
FROM node:20-alpine AS runtime
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/tsconfig.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
RUN addgroup -S adaptivelearning && adduser -S -G adaptivelearning adaptivelearning
USER adaptivelearning
EXPOSE 8000
CMD ["node", "packages/backend/dist/main.js"]
