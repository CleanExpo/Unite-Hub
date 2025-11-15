#!/bin/bash

# ==================================================
# Unite-Hub Docker - Logs Script
# View logs from Docker services
# ==================================================

set -e

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
SERVICE=""
FOLLOW="-f"

while [[ $# -gt 0 ]]; do
    case $1 in
        app|redis|postgres|nginx)
            SERVICE=$1
            echo -e "${BLUE}📋 Viewing logs for: $SERVICE${NC}"
            shift
            ;;
        --no-follow)
            FOLLOW=""
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./docker/logs.sh [app|redis|postgres|nginx] [--no-follow]"
            exit 1
            ;;
    esac
done

# View logs
if [ -n "$SERVICE" ]; then
    docker-compose logs $FOLLOW $SERVICE
else
    echo -e "${BLUE}📋 Viewing logs for all services${NC}"
    docker-compose logs $FOLLOW
fi
