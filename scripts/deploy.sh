#!/bin/bash
set -e

echo "========================================"
echo "  Manual Deployment Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
DEPLOY_FRONTEND=false
DEPLOY_BACKEND=false
DEPLOY_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)
            DEPLOY_FRONTEND=true
            shift
            ;;
        --backend)
            DEPLOY_BACKEND=true
            shift
            ;;
        --all)
            DEPLOY_ALL=true
            shift
            ;;
        *)
            echo "Usage: ./scripts/deploy.sh [--frontend] [--backend] [--all]"
            exit 1
            ;;
    esac
done

if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_FRONTEND=true
    DEPLOY_BACKEND=true
fi

if [ "$DEPLOY_FRONTEND" = false ] && [ "$DEPLOY_BACKEND" = false ]; then
    echo "Please specify what to deploy:"
    echo "  --frontend  Deploy frontend to Vercel"
    echo "  --backend   Deploy backend to DigitalOcean"
    echo "  --all       Deploy everything"
    exit 1
fi

# Pre-deployment checks
echo "Running pre-deployment checks..."

echo "  Type checking..."
pnpm turbo run type-check

echo "  Linting..."
pnpm turbo run lint

echo "  Building..."
pnpm turbo run build

echo -e "${GREEN}✓ All checks passed${NC}"
echo ""

# Deploy frontend
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "Deploying frontend to Vercel..."

    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}Error: Vercel CLI not found${NC}"
        echo "Install with: npm install -g vercel"
        exit 1
    fi

    cd apps/web
    vercel --prod
    cd ../..

    echo -e "${GREEN}✓ Frontend deployed${NC}"
fi

# Deploy backend
if [ "$DEPLOY_BACKEND" = true ]; then
    echo "Deploying backend to DigitalOcean..."

    if ! command -v doctl &> /dev/null; then
        echo -e "${RED}Error: doctl CLI not found${NC}"
        echo "Install from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi

    # Check for required env vars
    if [ -z "$DO_APP_ID" ]; then
        echo -e "${RED}Error: DO_APP_ID not set${NC}"
        exit 1
    fi

    doctl apps create-deployment $DO_APP_ID --wait

    echo -e "${GREEN}✓ Backend deployed${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Deployment complete!${NC}"
echo "========================================"
echo ""
