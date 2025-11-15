#!/bin/bash

# ==================================================
# Unite-Hub Docker - Stop Script
# Stops all Docker services
# ==================================================

set -e

echo "🛑 Stopping Unite-Hub Docker Services..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
REMOVE_VOLUMES=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            REMOVE_VOLUMES="-v"
            echo -e "${YELLOW}⚠️  Removing volumes (data will be deleted)${NC}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./docker/stop.sh [--clean]"
            exit 1
            ;;
    esac
done

# Stop services
echo -e "${BLUE}📦 Stopping containers...${NC}"
docker-compose down $REMOVE_VOLUMES

echo -e "${GREEN}✅ Services stopped successfully!${NC}"

if [ -n "$REMOVE_VOLUMES" ]; then
    echo -e "${YELLOW}⚠️  All data has been removed${NC}"
fi
