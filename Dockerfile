# ==================================================
# Multi-stage Dockerfile for Unite-Hub
# Optimized for Next.js 16 with standalone output
# ==================================================
#
# MEMORY CONFIGURATION (Updated: 2025-11-30)
# ==========================================
# Current: professional-l (8GB RAM) → Node heap: 6GB
#
# WARNING SIGNS (check build logs for these):
#   - "JavaScript heap out of memory"
#   - "Allocation failed"
#   - "Last few GCs" appearing in logs
#   - Build hanging during "Finalizing page optimization"
#
# UPGRADE PATH if OOM occurs:
#   1. professional-l  (8GB)  → NODE_OPTIONS=6144  (current)
#   2. professional-xl (16GB) → NODE_OPTIONS=12288
#   3. professional-2xl(32GB) → NODE_OPTIONS=24576
#
# To upgrade: Change instance_size_slug in .do/app.yaml
# Run: npm run check:build-memory to analyze recent builds
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

# Install ALL dependencies including devDependencies for build stage
# NODE_ENV=development ensures devDependencies are installed
# Using --legacy-peer-deps for compatibility with older packages
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps --ignore-scripts
ENV NODE_ENV=production

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
# Skip TypeScript checking to reduce memory usage (checked in CI)
ENV SKIP_TYPE_CHECK=1
# Increase Node memory for large builds (590 static pages)
# professional-l has 8GB RAM, give Node 6GB for build
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Provide valid-looking dummy values for build-time env vars (replaced at runtime)
# These pass format validation but are not real credentials
ENV NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder"
ENV SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.placeholder"
ENV ANTHROPIC_API_KEY="sk-ant-placeholder-00000000000000000000000000000000000000000000000000000000000"

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
# Increase Node.js heap for runtime (professional-l has 8GB, give Node 6GB)
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Start Next.js standalone server
CMD ["node", "server.js"]
