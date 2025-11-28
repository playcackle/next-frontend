# syntax=docker/dockerfile:1

# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f pnpm-lock.yaml ]; then \
        corepack enable pnpm && pnpm i --no-frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
        npm ci; \
    else \
        echo "Lockfile not found." && exit 1; \
    fi

# Development stage - can be used for dev with volume mounts
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for Next.js environment variables
ARG NEXTAUTH_URL=http://localhost:3000
ARG AUTH_SECRET
ARG NEXT_PUBLIC_LOBBY_MANAGER_URL=http://localhost:8001

# Set environment variables for build - use placeholder URLs since services aren't available during build
ENV BACKEND_URL=http://placeholder:8001
ENV NEXT_PUBLIC_LOBBY_MANAGER_URL=$NEXT_PUBLIC_LOBBY_MANAGER_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV AUTH_SECRET=$AUTH_SECRET

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN \
    if [ -f pnpm-lock.yaml ]; then \
        corepack enable pnpm && pnpm build; \
    elif [ -f package-lock.json ]; then \
        npm run build; \
    else \
        echo "Lockfile not found." && exit 1; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder (create empty one if it doesn't exist)  
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
