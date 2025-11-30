# ==================================================
# Multi-stage Dockerfile for Unite-Hub
# Optimized for Next.js 16 with standalone output
# ==================================================

# Base stage - Common dependencies
FROM node:22-alpine AS base
LABEL maintainer="Unite-Hub Team"
LABEL version="1.0.0"

# Install security updates and dependencies
RUN apk add --no-cache \
    libc6-compat \
    ca-certificates \
    && apk upgrade --no-cache

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_LOGLEVEL=warn

# ==================================================
# Dependencies stage - Install node_modules
# ==================================================
FROM base AS deps

# Copy package files (ignore yarn.lock if exists)
COPY package.json package-lock.json* ./

# Install all dependencies for build stage
# Using --legacy-peer-deps for compatibility with older packages
RUN npm install --legacy-peer-deps --ignore-scripts

# ==================================================
# Builder stage - Build Next.js application
# ==================================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create .env.production placeholder (will be overridden by docker-compose)
RUN touch .env.production

# Build Next.js application with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==================================================
# Runner stage - Production runtime
# ==================================================
FROM base AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set correct permissions for directories
RUN mkdir -p .next/cache && \
    chown -R nextjs:nodejs /app

# Copy only necessary files from builder
COPY --from=builder /app/public ./public

# Copy standalone output (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy scripts for agent execution
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

# Expose port 3008 (Unite-Hub default)
EXPOSE 3008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3008/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set port environment variable
ENV PORT=3008
ENV HOSTNAME="0.0.0.0"

# Start Next.js standalone server
CMD ["node", "server.js"]
