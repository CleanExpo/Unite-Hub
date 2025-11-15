#!/bin/bash

# ==================================================
# Unite-Hub Docker - Rebuild Script
# Rebuilds Docker images from scratch
# ==================================================

set -e

echo "🔨 Rebuilding Unite-Hub Docker Images..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
NO_CACHE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            echo -e "${BLUE}ℹ️  Building without cache${NC}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./docker/rebuild.sh [--no-cache]"
            exit 1
            ;;
    esac
done

# Stop existing containers
echo -e "${BLUE}📦 Stopping existing containers...${NC}"
docker-compose down

# Remove old images
echo -e "${BLUE}🗑️  Removing old images...${NC}"
docker-compose rm -f

# Build new images
echo -e "${BLUE}🔨 Building new images...${NC}"
docker-compose build $NO_CACHE

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Rebuild complete!${NC}"
echo -e "${BLUE}📍 Application: http://localhost:3008${NC}"
echo ""
docker-compose ps
