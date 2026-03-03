#!/bin/bash

# NodeJS-Starter-V1 Verification Script
# Checks all services and configurations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for pass/fail
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

check_pass() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✅ PASS:${NC} $1"
}

check_fail() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${RED}❌ FAIL:${NC} $1"
}

check_warn() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Main verification
print_header "🔍 NodeJS-Starter-V1 Verification"

echo "Checking system configuration and service status..."
echo ""

# Check 1: Prerequisites
print_header "1. Prerequisites"

if check_command docker; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
    check_pass "Docker installed (version $DOCKER_VERSION)"
else
    check_fail "Docker is not installed"
fi

if docker ps >/dev/null 2>&1; then
    check_pass "Docker daemon is running"
else
    check_fail "Docker daemon is not running"
fi

if check_command node; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js is not installed"
fi

if check_command pnpm; then
    PNPM_VERSION=$(pnpm --version)
    check_pass "pnpm installed (version $PNPM_VERSION)"
else
    check_fail "pnpm is not installed"
fi

if check_command python || check_command python3; then
    if check_command python3; then
        PYTHON_CMD=python3
    else
        PYTHON_CMD=python
    fi
    PYTHON_VERSION=$($PYTHON_CMD --version | cut -d ' ' -f2)
    check_pass "Python installed (version $PYTHON_VERSION)"
else
    check_fail "Python is not installed"
fi

if check_command uv; then
    UV_VERSION=$(uv --version | cut -d ' ' -f2)
    check_pass "uv installed (version $UV_VERSION)"
else
    check_fail "uv is not installed"
fi

# Check 2: Docker Services
print_header "2. Docker Services"

if docker compose ps postgres | grep -q "healthy\|running"; then
    check_pass "PostgreSQL container is running"

    # Check if PostgreSQL is accepting connections
    if docker compose exec -T postgres pg_isready -U starter_user -d starter_db >/dev/null 2>&1; then
        check_pass "PostgreSQL is accepting connections"
    else
        check_fail "PostgreSQL is not accepting connections"
    fi

    # Check if tables exist
    TABLE_COUNT=$(docker compose exec -T postgres psql -U starter_user -d starter_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    if [ "$TABLE_COUNT" -gt 0 ]; then
        check_pass "Database schema is initialized ($TABLE_COUNT tables)"
    else
        check_fail "Database schema is empty (no tables found)"
    fi
else
    check_fail "PostgreSQL container is not running"
fi

if docker compose ps redis | grep -q "healthy\|running\|Up"; then
    check_pass "Redis container is running"

    # Check if Redis is responding
    if docker compose exec -T redis redis-cli PING 2>/dev/null | grep -q "PONG"; then
        check_pass "Redis is responding to commands"
    else
        check_fail "Redis is not responding to commands"
    fi
else
    check_fail "Redis container is not running"
fi

# Check 3: Ollama
print_header "3. Ollama (Local AI)"

if check_command ollama; then
    OLLAMA_VERSION=$(ollama --version 2>&1 | head -n1)
    check_pass "Ollama is installed ($OLLAMA_VERSION)"

    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        check_pass "Ollama service is running"

        # Check for required models
        if ollama list | grep -q "llama3.1:8b"; then
            check_pass "Model llama3.1:8b is installed"
        else
            check_warn "Model llama3.1:8b is not installed (run: ollama pull llama3.1:8b)"
        fi

        if ollama list | grep -q "nomic-embed-text"; then
            check_pass "Model nomic-embed-text is installed"
        else
            check_warn "Model nomic-embed-text is not installed (run: ollama pull nomic-embed-text)"
        fi
    else
        check_warn "Ollama service is not running (start: ollama serve)"
    fi
else
    check_warn "Ollama is not installed (optional: https://ollama.com/)"
fi

# Check 4: Project Structure
print_header "4. Project Structure"

if [ -f "package.json" ]; then
    check_pass "Root package.json exists"
else
    check_fail "Root package.json not found"
fi

if [ -d "apps/web" ] && [ -f "apps/web/package.json" ]; then
    check_pass "Frontend app exists (apps/web)"
else
    check_fail "Frontend app not found"
fi

if [ -d "apps/backend" ] && [ -f "apps/backend/pyproject.toml" ]; then
    check_pass "Backend app exists (apps/backend)"
else
    check_fail "Backend app not found"
fi

if [ -f "docker-compose.yml" ]; then
    check_pass "docker-compose.yml exists"
else
    check_fail "docker-compose.yml not found"
fi

if [ -f "scripts/init-db.sql" ]; then
    check_pass "Database initialization script exists"
else
    check_fail "scripts/init-db.sql not found"
fi

# Check 5: Configuration
print_header "5. Configuration"

if [ -f ".env" ]; then
    check_pass ".env file exists"

    # Check for required environment variables
    if grep -q "DATABASE_URL" .env; then
        check_pass "DATABASE_URL is configured"
    else
        check_fail "DATABASE_URL not found in .env"
    fi

    if grep -q "JWT_SECRET_KEY" .env; then
        check_pass "JWT_SECRET_KEY is configured"
    else
        check_fail "JWT_SECRET_KEY not found in .env"
    fi

    if grep -q "AI_PROVIDER" .env; then
        AI_PROVIDER=$(grep "AI_PROVIDER" .env | cut -d '=' -f2 | tr -d ' "')
        check_pass "AI_PROVIDER is configured ($AI_PROVIDER)"
    else
        check_warn "AI_PROVIDER not found in .env (will default to ollama)"
    fi
else
    check_fail ".env file not found (copy from .env.example)"
fi

if [ -f ".env.example" ]; then
    check_pass ".env.example file exists"
else
    check_warn ".env.example file not found"
fi

# Check 6: Dependencies
print_header "6. Dependencies"

if [ -d "node_modules" ]; then
    check_pass "Root node_modules exists"
else
    check_fail "Root node_modules not found (run: pnpm install)"
fi

if [ -d "apps/web/node_modules" ]; then
    check_pass "Frontend node_modules exists"
else
    check_fail "Frontend node_modules not found (run: pnpm install)"
fi

if [ -d "apps/backend/.venv" ]; then
    check_pass "Backend virtual environment exists"
else
    check_fail "Backend .venv not found (run: cd apps/backend && uv sync)"
fi

# Check 6.5: Dependency Integrity
print_header "6.5 Dependency Integrity"

# Source dependency check functions
if [ -f "scripts/dependency-checks.sh" ]; then
    source scripts/dependency-checks.sh
else
    check_fail "scripts/dependency-checks.sh not found"
fi

# Check lockfile integrity
check_info "Checking pnpm-lock.yaml integrity..."
LOCKFILE_RESULT=$(check_lockfile_integrity)
LOCKFILE_EXIT=$?

if [ $LOCKFILE_EXIT -eq 0 ]; then
    check_pass "Lockfile is valid and synchronized"
elif [ $LOCKFILE_EXIT -eq 1 ]; then
    check_fail "$(echo "$LOCKFILE_RESULT" | cut -d':' -f3-)"
    echo "   Fix: pnpm install"
else
    check_warn "$(echo "$LOCKFILE_RESULT" | cut -d':' -f3-)"
    echo "   Recommended: pnpm install"
fi

# Check each workspace
WORKSPACES=("." "apps/web" "packages/config")
for WORKSPACE in "${WORKSPACES[@]}"; do
    if [ ! -f "$WORKSPACE/package.json" ]; then
        continue
    fi

    check_info "Verifying: $WORKSPACE"

    # Check dependency synchronization
    SYNC_OUTPUT=$(check_dependency_sync "$WORKSPACE" 2>&1)
    SYNC_EXIT=$?

    if [ $SYNC_EXIT -eq 0 ]; then
        check_pass "$WORKSPACE: Dependencies synchronized"
    else
        # Parse issues
        MISSING_COUNT=$(echo "$SYNC_OUTPUT" | grep -c "^MISSING:" || true)
        MISMATCH_COUNT=$(echo "$SYNC_OUTPUT" | grep -c "^MISMATCH:" || true)

        if [ $MISSING_COUNT -gt 0 ]; then
            check_fail "$WORKSPACE: $MISSING_COUNT missing dependencies"
            echo "$SYNC_OUTPUT" | grep "^MISSING:" | head -3 | while IFS=: read TYPE PKG VERSION INSTALLED; do
                echo "     - $PKG@$VERSION not installed"
            done
            if [ $MISSING_COUNT -gt 3 ]; then
                echo "     ... and $((MISSING_COUNT - 3)) more"
            fi
            echo "   Fix: pnpm install --filter=$WORKSPACE"
        fi

        if [ $MISMATCH_COUNT -gt 0 ]; then
            check_warn "$WORKSPACE: $MISMATCH_COUNT version mismatches"
            echo "$SYNC_OUTPUT" | grep "^MISMATCH:" | head -3 | while IFS=: read TYPE PKG VERSION INSTALLED; do
                echo "     - $PKG: declared=$VERSION, installed=$INSTALLED"
            done
            if [ $MISMATCH_COUNT -gt 3 ]; then
                echo "     ... and $((MISMATCH_COUNT - 3)) more"
            fi
            echo "   Fix: pnpm install"
        fi
    fi

    # Check for orphaned dependencies (warning only)
    ORPHAN_OUTPUT=$(check_orphaned_dependencies "$WORKSPACE" 2>&1 || true)
    ORPHAN_COUNT=$(echo "$ORPHAN_OUTPUT" | grep -c "^ORPHANED:" || true)

    if [ $ORPHAN_COUNT -gt 0 ]; then
        check_warn "$WORKSPACE: $ORPHAN_COUNT orphaned dependencies"
        echo "$ORPHAN_OUTPUT" | grep "^ORPHANED:" | head -3 | while IFS=: read TYPE PKG VERSION; do
            echo "     - $PKG@$VERSION (not in package.json)"
        done
        if [ $ORPHAN_COUNT -gt 3 ]; then
            echo "     ... and $((ORPHAN_COUNT - 3)) more"
        fi
        echo "   Fix: pnpm prune"
    fi
done

# Check workspace consistency
check_info "Checking workspace consistency..."
CONSISTENCY_OUTPUT=$(check_workspace_consistency 2>&1 || true)
CONSISTENCY_EXIT=$?

if [ $CONSISTENCY_EXIT -eq 0 ]; then
    check_pass "Workspace dependencies are consistent"
else
    CONFLICT_COUNT=$(echo "$CONSISTENCY_OUTPUT" | grep -c "^CONFLICT:" || true)
    if [ $CONFLICT_COUNT -gt 0 ]; then
        check_warn "Found $CONFLICT_COUNT dependency conflicts"
        echo "$CONSISTENCY_OUTPUT" | head -15
        echo "   Recommended: Align dependency versions across workspaces"
    fi
fi

# Check 7: Service Health (if services are supposed to be running)
print_header "7. Service Health"

# Check if frontend is running
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    check_pass "Frontend is accessible (http://localhost:3000)"
else
    check_info "Frontend is not running (start: pnpm dev)"
fi

# Check if backend is running
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    check_pass "Backend is accessible (http://localhost:8000)"

    # Try to get health status
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    if echo "$HEALTH_RESPONSE" | grep -q "status"; then
        check_pass "Backend health check responds correctly"
    fi
else
    check_info "Backend is not running (start: pnpm dev)"
fi

# Summary
print_header "📊 Verification Summary"

echo ""
echo "Total checks:   $TOTAL_CHECKS"
echo -e "${GREEN}Passed:         $PASSED_CHECKS${NC}"
if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}Failed:         $FAILED_CHECKS${NC}"
fi
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Warnings:       $WARNINGS${NC}"
fi
echo ""

# Determine overall status
if [ $FAILED_CHECKS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your environment is fully configured.${NC}"
    echo ""
    exit 0
elif [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup is functional but has some warnings (see above).${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above and run verification again.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Missing prerequisites: Install from https://github.com/CleanExpo/NodeJS-Starter-V1"
    echo "  - Docker not running: Start Docker Desktop"
    echo "  - Services not started: Run 'docker compose up -d'"
    echo "  - Dependencies not installed: Run 'pnpm install' and 'cd apps/backend && uv sync'"
    echo "  - No .env file: Copy from .env.example"
    echo ""
    exit 1
fi
