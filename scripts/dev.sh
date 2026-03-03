#!/bin/bash
set -e

echo "========================================"
echo "  Starting Development Environment"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    echo "Run ./scripts/setup.sh first"
    exit 1
fi

# Parse arguments
START_SUPABASE=true
START_BACKEND=true
START_FRONTEND=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-supabase)
            START_SUPABASE=false
            shift
            ;;
        --no-backend)
            START_BACKEND=false
            shift
            ;;
        --no-frontend)
            START_FRONTEND=false
            shift
            ;;
        --frontend-only)
            START_SUPABASE=false
            START_BACKEND=false
            shift
            ;;
        --backend-only)
            START_FRONTEND=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Start Supabase
if [ "$START_SUPABASE" = true ]; then
    if command -v supabase &> /dev/null; then
        echo "Starting Supabase..."
        supabase start &
        SUPABASE_PID=$!
    else
        echo -e "${YELLOW}Supabase CLI not found, skipping...${NC}"
    fi
fi

# Start backend
if [ "$START_BACKEND" = true ]; then
    echo "Starting backend..."
    cd apps/backend
    uv run uvicorn src.api.main:app --reload --port 8000 &
    BACKEND_PID=$!
    cd ../..
fi

# Start frontend
if [ "$START_FRONTEND" = true ]; then
    echo "Starting frontend..."
    pnpm dev --filter=web &
    FRONTEND_PID=$!
fi

echo ""
echo -e "${GREEN}Development environment started!${NC}"
echo ""
echo "Services:"
[ "$START_FRONTEND" = true ] && echo "  Frontend: http://localhost:3000"
[ "$START_BACKEND" = true ] && echo "  Backend:  http://localhost:8000"
[ "$START_SUPABASE" = true ] && echo "  Supabase: http://localhost:54323"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait
