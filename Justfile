# NodeJS-Starter-V1 Task Runner
# Usage: just <recipe> [args]
# Install: https://github.com/casey/just

default:
    @just --list

# ─── Development ───────────────────────────────────────────

# Start all services (frontend + backend + docker)
dev:
    pnpm dev

# Start frontend only
dev-web:
    pnpm dev --filter=web

# Start backend only
dev-backend:
    cd apps/backend && uv run uvicorn src.api.main:app --reload

# Start Docker services (PostgreSQL + Redis)
docker-up:
    pnpm run docker:up

# Stop Docker services
docker-down:
    pnpm run docker:down

# Reset database (destructive)
docker-reset:
    pnpm run docker:reset

# ─── Quality ──────────────────────────────────────────────

# Run all tests
test:
    pnpm turbo run test

# Run backend tests (pytest)
test-backend:
    cd apps/backend && uv run pytest

# Run frontend tests (vitest)
test-web:
    pnpm test --filter=web

# Run E2E tests (playwright)
test-e2e:
    pnpm --filter=web test:e2e

# Run linter
lint:
    pnpm turbo run lint

# Run type checker
type-check:
    pnpm turbo run type-check

# Run all quality checks (type-check + lint + test)
verify:
    pnpm turbo run type-check lint test

# Full health check
health:
    pnpm run verify

# ─── Browser Automation ───────────────────────────────────

# Install Playwright browsers
playwright-install:
    cd apps/web && npx playwright install chromium

# Run UI review stories (use /ui-review command in Claude Code)
test-ui:
    @echo "Use /ui-review run in Claude Code to execute UI stories"

# Run browser automation workflow (use /automate-browser command)
automate workflow:
    @echo "Use /automate-browser {{workflow}} in Claude Code"

# ─── Beads (AI Agent Memory) ─────────────────────────────

# Show unblocked tasks
beads-ready:
    .bin/bd.exe ready

# Create a new task
beads-create title:
    .bin/bd.exe create "{{title}}"

# Close a task
beads-close id reason:
    .bin/bd.exe close {{id}} --reason "{{reason}}"

# Sync beads to git
beads-sync:
    .bin/bd.exe sync

# ─── Setup ────────────────────────────────────────────────

# Run initial setup
setup:
    pnpm run setup

# Setup for Windows
setup-windows:
    pnpm run setup:windows

# Install dependencies cleanly
deps-clean:
    pnpm deps:clean

# Verify dependencies
deps-verify:
    pnpm verify:fix
