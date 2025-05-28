#!/bin/bash
# UNITE Group Deployment Script
# This script prepares and deploys the UNITE Group application to production

set -e  # Exit immediately if a command exits with a non-zero status

# Color codes for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   UNITE Group Deployment Script        ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Make sure you're in the project root directory.${NC}"
  exit 1
fi

# Validate environment variables
echo -e "\n${YELLOW}Checking environment variables...${NC}"

if [ ! -f ".env.local" ]; then
  echo -e "${RED}Error: .env.local file not found. Please create one based on .env.local.example${NC}"
  exit 1
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# Run database migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Database migrations completed successfully!${NC}"
else
  echo -e "${RED}Database migration failed. Please check your Prisma schema and database connection.${NC}"
  exit 1
fi

# Run pre-deployment check
echo -e "\n${YELLOW}Running pre-deployment checks...${NC}"
if command -v pwsh &> /dev/null; then
  pwsh -File pre-deployment-check.ps1
elif command -v powershell &> /dev/null; then
  powershell -File pre-deployment-check.ps1
else
  echo -e "${YELLOW}Warning: PowerShell not found. Skipping pre-deployment checks.${NC}"
  echo -e "${YELLOW}Please run the pre-deployment checks manually before deployment.${NC}"
fi

# Build application
echo -e "\n${YELLOW}Building application...${NC}"
npm run build

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"
if npm test; then
  echo -e "${GREEN}Tests passed successfully!${NC}"
else
  echo -e "${RED}Tests failed. Please fix the issues before deploying.${NC}"
  exit 1
fi

# Generate deployment directory
echo -e "\n${YELLOW}Generating deployment package...${NC}"
mkdir -p deployment
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp vercel.json deployment/
cp next.config.js deployment/
cp -r database deployment/
cp .env.local deployment/.env.production.local

echo -e "\n${GREEN}Deployment package created successfully in the 'deployment' directory${NC}"

# Deploy instructions
echo -e "\n${YELLOW}Deployment Instructions:${NC}"
echo -e "1. Connect your Vercel account: ${BLUE}vercel login${NC}"
echo -e "2. Deploy to preview: ${BLUE}vercel${NC}"
echo -e "3. Deploy to production: ${BLUE}vercel --prod${NC}"

echo -e "\n${YELLOW}Alternatively, use GitHub Integration in Vercel:${NC}"
echo -e "1. Push your changes to GitHub"
echo -e "2. Connect your GitHub repository to Vercel"
echo -e "3. Configure environment variables in Vercel dashboard"
echo -e "4. Deploy from the Vercel dashboard"

echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}   Deployment preparation complete    ${NC}"
echo -e "${GREEN}==================================${NC}"
