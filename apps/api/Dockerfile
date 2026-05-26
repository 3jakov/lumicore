# ── Builder ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (needed for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

# Build shared-types then API
RUN pnpm --filter @lumicore/shared-types build
RUN pnpm --filter @lumicore/api prisma:generate
RUN pnpm --filter @lumicore/api build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace manifests for prod install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output and prisma files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
