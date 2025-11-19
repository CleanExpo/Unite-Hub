# Tenant Container Dockerfile - Phase 3 Step 8 Priority 3
# Isolated per-tenant runtime with resource constraints
#
# Purpose:
# - Provides isolated execution environment per client
# - Ensures resource limits (CPU, memory) are enforced
# - Enables independent scaling per tenant
# - Supports tenant-specific configuration

# Use Node.js 20 Alpine for minimal footprint
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./
COPY .npmrc* ./

# Install production dependencies
RUN npm ci --omit=dev --prefer-offline --no-audit

# Rebuild source code
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/docker/tenant/entrypoint.sh ./entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (configurable per tenant)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Set entrypoint
ENTRYPOINT ["./entrypoint.sh"]
