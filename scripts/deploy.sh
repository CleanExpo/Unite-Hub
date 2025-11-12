#!/bin/bash

# Unite Hub Deployment Script

set -e

echo "🚀 Unite Hub Deployment"
echo "========================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node version
echo -e "${BLUE}Checking Node version...${NC}"
NODE_VERSION=$(node -v)
echo "✅ Node $NODE_VERSION"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install --frozen-lockfile

# Build
echo -e "${BLUE}Building application...${NC}"
npm run build

# Lint
echo -e "${BLUE}Running linter...${NC}"
npm run lint

# Test (if tests exist)
if [ -f "jest.config.js" ]; then
  echo -e "${BLUE}Running tests...${NC}"
  npm run test
fi

# Environment check
echo -e "${BLUE}Verifying environment variables...${NC}"
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ANTHROPIC_API_KEY"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}❌ Missing: $var${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✅ All variables present${NC}"

# Deploy to Vercel
echo -e "${BLUE}Deploying to Vercel...${NC}"
if command -v vercel &> /dev/null; then
  vercel deploy --prod
else
  echo -e "${RED}❌ Vercel CLI not installed${NC}"
  echo "Install with: npm i -g vercel"
  exit 1
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📍 Your app is live at: $NEXTAUTH_URL"
