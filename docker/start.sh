#!/bin/bash

# ==================================================
# Unite-Hub Docker - Start Script
# Starts all Docker services
# ==================================================

set -e

echo "🚀 Starting Unite-Hub Docker Services..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  Warning: .env.local not found${NC}"
    echo "Copying .env.example to .env.local..."
    cp .env.example .env.local
    echo -e "${YELLOW}⚠️  Please edit .env.local with your actual values before proceeding${NC}"
    exit 1
fi

# Parse command line arguments
PROFILE=""
COMPOSE_FILE="docker-compose.yml"

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            COMPOSE_FILE="docker-compose.yml -f docker-compose.dev.yml"
            echo -e "${BLUE}ℹ️  Using development mode${NC}"
            shift
            ;;
        --local-db)
            PROFILE="--profile local-db"
            echo -e "${BLUE}ℹ️  Using local PostgreSQL database${NC}"
            shift
            ;;
        --proxy)
            PROFILE="$PROFILE --profile proxy"
            echo -e "${BLUE}ℹ️  Using Nginx reverse proxy${NC}"
            shift
            ;;
        --build)
            BUILD_FLAG="--build"
            echo -e "${BLUE}ℹ️  Rebuilding images${NC}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./docker/start.sh [--dev] [--local-db] [--proxy] [--build]"
            exit 1
            ;;
    esac
done

# Start services
echo -e "${BLUE}📦 Starting containers...${NC}"
docker-compose -f $COMPOSE_FILE $PROFILE up -d $BUILD_FLAG

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Check service status
echo -e "${GREEN}✅ Services started successfully!${NC}"
echo ""
docker-compose ps

echo ""
echo -e "${GREEN}🎉 Unite-Hub is ready!${NC}"
echo -e "${BLUE}📍 Application: http://localhost:3008${NC}"
echo -e "${BLUE}📍 Redis: localhost:6379${NC}"

if [[ $PROFILE == *"local-db"* ]]; then
    echo -e "${BLUE}📍 PostgreSQL: localhost:5432${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "  View logs:    docker-compose logs -f"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Shell:        docker-compose exec app sh"
echo ""
