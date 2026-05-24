#!/bin/bash
set -e

echo "========================================"
echo "  Nexus — Manual Production Deploy"
echo "========================================"
echo ""

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Pre-deployment checks ────────────────────────────────────────────

echo "Running pre-deployment checks..."
echo ""

echo "  1/3  Type checking..."
pnpm run type-check
echo -e "  ${GREEN}✓${NC} Types OK"

echo "  2/3  Linting..."
pnpm run lint
echo -e "  ${GREEN}✓${NC} Lint OK"

echo "  3/3  Building..."
pnpm run build
echo -e "  ${GREEN}✓${NC} Build OK"

echo ""
echo -e "${GREEN}All pre-deploy checks passed.${NC}"
echo ""

# ── Deploy to Vercel ─────────────────────────────────────────────────

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI not found${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi

echo "Deploying to Vercel (production)..."
vercel --prod

echo ""
echo "========================================"
echo -e "${GREEN}  Deployment complete!${NC}"
echo "========================================"
echo ""
echo "Post-deploy:"
echo "  1. Verify smoke tests pass: https://github.com/Unite-Group/Unite-Group/actions"
echo "  2. Spot-check production:   https://unite-group.in/api/health"
echo ""
