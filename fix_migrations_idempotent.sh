#!/bin/bash
#
# Script to make Synthex migrations 407-427 idempotent
# Adds DROP INDEX/TRIGGER/POLICY statements before CREATE statements
#

set -e

MIGRATIONS_DIR="D:/Unite-Hub/supabase/migrations"

echo "Making Synthex migrations 407-427 idempotent..."
echo "================================================"

# Function to add DROP INDEX IF EXISTS before CREATE INDEX statements
add_drop_index() {
    local file="$1"
    echo "Processing indexes in: $(basename $file)"

    # Use sed to add DROP INDEX IF EXISTS before each CREATE INDEX
    # Match lines like: CREATE INDEX IF NOT EXISTS idx_name
    # Insert: DROP INDEX IF EXISTS idx_name; before them
    sed -i.bak '/^CREATE INDEX IF NOT EXISTS \([a-z_]*\)/i\
DROP INDEX IF EXISTS \1;
' "$file"
}

# Function to add DROP TRIGGER IF EXISTS before CREATE TRIGGER statements
add_drop_trigger() {
    local file="$1"
    echo "Processing triggers in: $(basename $file)"

    # Match lines like: CREATE TRIGGER trigger_name
    # Insert: DROP TRIGGER IF EXISTS trigger_name ON table_name; before them
    # This requires more complex logic - will handle manually for accuracy
}

# Function to add DROP POLICY IF EXISTS before CREATE POLICY statements
add_drop_policy() {
    local file="$1"
    echo "Processing policies in: $(basename $file)"

    # Match lines like: CREATE POLICY "policy name"
    # Insert: DROP POLICY IF EXISTS "policy name" ON table_name; before them
    # This requires extracting policy name and table name from context
}

echo "Note: Due to complexity of trigger and policy DROP statements,"
echo "this script provides a template. Manual review recommended."
echo ""
echo "For each migration file, you need to add:"
echo "1. DROP INDEX IF EXISTS idx_name; before CREATE INDEX IF NOT EXISTS idx_name"
echo "2. DROP TRIGGER IF EXISTS trigger_name ON table_name; before CREATE TRIGGER trigger_name"
echo "3. DROP POLICY IF EXISTS \"policy name\" ON table_name; before CREATE POLICY \"policy name\""
echo ""
echo "Pattern examples:"
echo "=================="
echo ""
echo "INDEX:"
echo "DROP INDEX IF EXISTS idx_campaigns_tenant_created;"
echo "CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_created..."
echo ""
echo "TRIGGER:"
echo "DROP TRIGGER IF EXISTS trigger_synthex_campaigns_updated_at ON synthex_campaigns;"
echo "CREATE TRIGGER trigger_synthex_campaigns_updated_at..."
echo ""
echo "POLICY:"
echo "DROP POLICY IF EXISTS \"Tenant owners can view campaigns\" ON synthex_campaigns;"
echo "CREATE POLICY \"Tenant owners can view campaigns\"..."
echo ""
echo "Files 407-409 are already complete."
echo "Remaining files: 410-427 (18 files)"
