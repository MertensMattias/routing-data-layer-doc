# Use Alpine 3.16 which includes OpenSSL 1.1 by default (required for Prisma)
FROM node:18-alpine3.16 AS base

# Alpine 3.16 has OpenSSL 1.1 built-in, no need to install compatibility package

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
# Use npm install instead of npm ci since package-lock.json may not exist
# For development, this is acceptable as volumes will override node_modules anyway
RUN npm install
# Generate Prisma client in deps stage to ensure OpenSSL is available
RUN npx prisma generate || true

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client with OpenSSL 1.1 support
RUN npx prisma generate --generator client
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]

