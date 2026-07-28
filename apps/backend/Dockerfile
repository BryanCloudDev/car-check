FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ──────────────────────────────────────────────
# Stage 1: Install all deps + build
# ──────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
# Dummy URL satisfies prisma.config.ts during "prisma generate" (no real connection needed)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter backend build

# ──────────────────────────────────────────────
# Stage 2: Prune to production deps only
# ──────────────────────────────────────────────
FROM base AS deployer
WORKDIR /app
COPY --from=builder /app ./
RUN pnpm deploy --filter=backend --prod /deploy/backend

# ──────────────────────────────────────────────
# Stage 3: Minimal production runner
# ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deployer /deploy/backend/node_modules ./node_modules
COPY --from=deployer /deploy/backend/package.json ./package.json
COPY --from=builder  /app/apps/backend/dist       ./dist
COPY --from=builder  /app/apps/backend/generated  ./generated
COPY --from=builder  /app/apps/backend/prisma     ./prisma
# schema.prisma declares no datasource url — "prisma migrate deploy" reads it
# from here at startup, so the config has to ship with the image.
COPY --from=builder  /app/apps/backend/prisma.config.ts ./prisma.config.ts

EXPOSE 3001
# nest build emits dist/src/** (prisma.config.ts at the package root widens the
# TS rootDir), which is also what nest-cli.json assumes for the i18n assets.
CMD ["node", "dist/src/main"]
