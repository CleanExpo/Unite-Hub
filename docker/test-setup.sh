#!/bin/bash

# ==================================================
# Unite-Hub Docker - Setup Test Script
# Validates Docker configuration
# ==================================================

set -e

echo "🧪 Testing Unite-Hub Docker Setup..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Test 1: Docker installation
echo -e "\n${BLUE}1. Checking Docker installation...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}✗ Docker not found. Please install Docker Desktop.${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 2: Docker Compose
echo -e "\n${BLUE}2. Checking Docker Compose...${NC}"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓ Docker Compose installed: $COMPOSE_VERSION${NC}"
else
    echo -e "${RED}✗ Docker Compose not found.${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 3: Docker running
echo -e "\n${BLUE}3. Checking if Docker is running...${NC}"
if docker info &> /dev/null; then
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
else
    echo -e "${RED}✗ Docker daemon is not running. Please start Docker Desktop.${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 4: Environment file
echo -e "\n${BLUE}4. Checking environment configuration...${NC}"
if [ -f .env.local ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"

    # Check required variables
    REQUIRED_VARS=(
        "NEXTAUTH_SECRET"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "ANTHROPIC_API_KEY"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )

    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$VAR=" .env.local && ! grep -q "^$VAR=your-" .env.local; then
            echo -e "${GREEN}  ✓ $VAR is set${NC}"
        else
            echo -e "${YELLOW}  ⚠ $VAR is not configured${NC}"
        fi
    done
else
    echo -e "${RED}✗ .env.local not found${NC}"
    echo -e "${YELLOW}  Run: cp .env.example .env.local${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 5: Docker files
echo -e "\n${BLUE}5. Checking Docker files...${NC}"
if [ -f Dockerfile ]; then
    echo -e "${GREEN}✓ Dockerfile exists${NC}"
else
    echo -e "${RED}✗ Dockerfile not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f docker-compose.yml ]; then
    echo -e "${GREEN}✓ docker-compose.yml exists${NC}"
else
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f .dockerignore ]; then
    echo -e "${GREEN}✓ .dockerignore exists${NC}"
else
    echo -e "${YELLOW}⚠ .dockerignore not found (recommended)${NC}"
fi

# Test 6: next.config.mjs
echo -e "\n${BLUE}6. Checking Next.js configuration...${NC}"
if grep -q "output.*standalone" next.config.mjs; then
    echo -e "${GREEN}✓ Standalone output configured${NC}"
else
    echo -e "${YELLOW}⚠ Standalone output not configured${NC}"
    echo -e "${YELLOW}  Add to next.config.mjs: output: 'standalone'${NC}"
fi

# Test 7: Port availability
echo -e "\n${BLUE}7. Checking port availability...${NC}"
if lsof -Pi :3008 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port 3008 is already in use${NC}"
    lsof -i :3008
else
    echo -e "${GREEN}✓ Port 3008 is available${NC}"
fi

# Test 8: Helper scripts
echo -e "\n${BLUE}8. Checking helper scripts...${NC}"
SCRIPTS=("start.sh" "stop.sh" "rebuild.sh" "logs.sh")
for SCRIPT in "${SCRIPTS[@]}"; do
    if [ -f "docker/$SCRIPT" ]; then
        if [ -x "docker/$SCRIPT" ]; then
            echo -e "${GREEN}✓ docker/$SCRIPT exists and is executable${NC}"
        else
            echo -e "${YELLOW}⚠ docker/$SCRIPT exists but not executable${NC}"
            echo -e "${YELLOW}  Run: chmod +x docker/$SCRIPT${NC}"
        fi
    else
        echo -e "${RED}✗ docker/$SCRIPT not found${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Test 9: Try building (optional)
echo -e "\n${BLUE}9. Testing Docker build...${NC}"
read -p "Do you want to test build the image? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Building Docker image...${NC}"
    if docker-compose build app; then
        echo -e "${GREEN}✓ Docker build successful${NC}"
    else
        echo -e "${RED}✗ Docker build failed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo -e "\n${BLUE}Ready to start Docker:${NC}"
    echo -e "  ./docker/start.sh           # Production mode"
    echo -e "  ./docker/start.sh --dev     # Development mode"
else
    echo -e "${RED}⚠️  $ERRORS issue(s) found. Please fix before starting.${NC}"
    exit 1
fi
