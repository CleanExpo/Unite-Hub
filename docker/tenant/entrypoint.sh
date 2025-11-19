#!/bin/sh
# Tenant Container Entrypoint - Phase 3 Step 8 Priority 3
# Startup script for per-tenant runtime with configuration and health checks
#
# Purpose:
# - Load tenant-specific configuration
# - Set environment variables
# - Perform pre-flight checks
# - Start Next.js application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}========================================${NC}"
echo "${GREEN}Unite-Hub Tenant Container${NC}"
echo "${GREEN}========================================${NC}"

# Load tenant ID from environment or file
if [ -f /etc/tenant_id ]; then
  export TENANT_ID=$(cat /etc/tenant_id)
  echo "${GREEN}✓${NC} Loaded tenant ID from /etc/tenant_id: ${TENANT_ID}"
elif [ -n "$TENANT_ID" ]; then
  echo "${GREEN}✓${NC} Using tenant ID from environment: ${TENANT_ID}"
else
  echo "${RED}✗${NC} ERROR: TENANT_ID not set and /etc/tenant_id not found"
  exit 1
fi

# Validate tenant ID format (UUID)
if ! echo "$TENANT_ID" | grep -qE '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; then
  echo "${YELLOW}⚠${NC}  WARNING: TENANT_ID is not a valid UUID: ${TENANT_ID}"
fi

# Set tenant-specific environment variables
echo "${GREEN}✓${NC} Configuring tenant environment..."

# Tenant-specific URL (if not already set)
if [ -z "$NEXT_PUBLIC_TENANT_URL" ]; then
  export NEXT_PUBLIC_TENANT_URL="http://tenant-${TENANT_ID}.localhost:3000"
  echo "  NEXT_PUBLIC_TENANT_URL=${NEXT_PUBLIC_TENANT_URL}"
fi

# Tenant-specific database schema (if using schema-per-tenant approach)
if [ -n "$DATABASE_URL" ]; then
  export TENANT_SCHEMA="tenant_${TENANT_ID}"
  echo "  TENANT_SCHEMA=${TENANT_SCHEMA}"
fi

# Pre-flight checks
echo "${GREEN}✓${NC} Running pre-flight checks..."

# Check required files exist
if [ ! -f "server.js" ]; then
  echo "${RED}✗${NC} ERROR: server.js not found"
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "  Node.js version: ${NODE_VERSION}"

# Check memory limits (if available)
if [ -f "/sys/fs/cgroup/memory/memory.limit_in_bytes" ]; then
  MEMORY_LIMIT=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
  MEMORY_LIMIT_MB=$((MEMORY_LIMIT / 1024 / 1024))
  echo "  Memory limit: ${MEMORY_LIMIT_MB}MB"
fi

# Health check endpoint setup
echo "${GREEN}✓${NC} Health check endpoint: http://localhost:3000/api/health"

# Log startup time
STARTUP_TIME=$(date +"%Y-%m-%d %H:%M:%S")
echo "${GREEN}✓${NC} Startup time: ${STARTUP_TIME}"

# Set process limits
ulimit -n 4096 2>/dev/null || true

# Start application
echo "${GREEN}========================================${NC}"
echo "${GREEN}Starting Next.js server...${NC}"
echo "${GREEN}========================================${NC}"

# Execute Node.js server
# Use exec to replace shell process with node process (for proper signal handling)
exec node server.js

# This line should never be reached
echo "${RED}✗${NC} ERROR: Failed to start server"
exit 1
