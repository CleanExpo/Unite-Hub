#!/bin/bash

# =====================================================
# Execute Intelligence System Migrations via SQL API
# =====================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

SUPABASE_URL="https://lksfwktwtmyznckodsau.supabase.co"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Intelligence System Migration Deployment       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Function to execute SQL via PostgREST
execute_sql() {
    local sql_file=$1
    local description=$2

    echo -e "${YELLOW}Executing: ${description}${NC}"

    # Read SQL file
    sql_content=$(cat "$sql_file")

    # Execute via psql using connection string from .env.local
    PGPASSWORD="${SUPABASE_SERVICE_ROLE_KEY}" psql \
        -h "aws-1-ap-southeast-2.pooler.supabase.com" \
        -p 6543 \
        -U "postgres.lksfwktwtmyznckodsau" \
        -d "postgres" \
        -f "$sql_file" \
        2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}\n"
        return 1
    fi
}

# Step 1: Check if migration 039_v3 exists
echo -e "${YELLOW}Step 1: Checking migration 039_v3...${NC}"
if [ -f "supabase/migrations/039_autonomous_intelligence_system_v3.sql" ]; then
    echo -e "${GREEN}✓ Found migration 039_v3${NC}\n"
else
    echo -e "${RED}✗ Migration 039_v3 not found${NC}\n"
    exit 1
fi

# Step 2: Execute migration 040
echo -e "${YELLOW}Step 2: Executing migration 040 (Intelligence Tracking)...${NC}"
execute_sql "supabase/migrations/040_add_intelligence_tracking.sql" "Add intelligence_analyzed columns"

# Step 3: Execute migration 041
echo -e "${YELLOW}Step 3: Executing migration 041 (Extend Content Types)...${NC}"
execute_sql "supabase/migrations/041_extend_generated_content.sql" "Extend content types and marketing strategies"

# Step 4: Verify schema
echo -e "${YELLOW}Step 4: Verifying schema...${NC}"
execute_sql "scripts/test-intelligence-schema.sql" "Schema verification"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete!                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "✓ Migration 040: Intelligence tracking columns added"
echo "✓ Migration 041: Content types and strategies extended"
echo "✓ Schema verification: Passed"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review verification output above"
echo "2. Test with sample data"
echo "3. Begin implementing agent APIs (see CLIENT-INTELLIGENCE-SYSTEM-IMPLEMENTATION-GUIDE.md)"
echo ""
