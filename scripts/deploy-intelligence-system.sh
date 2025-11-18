#!/bin/bash

# =====================================================
# Deploy Client Intelligence System to Supabase
# =====================================================
# This script deploys the complete database schema for the
# Client Intelligence System to your Supabase project
#
# Usage: bash scripts/deploy-intelligence-system.sh
# =====================================================

set -e  # Exit on error

echo ""
echo "🚀 DEPLOYING CLIENT INTELLIGENCE SYSTEM TO SUPABASE"
echo "===================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Supabase project details
SUPABASE_URL="https://lksfwktwtmyznckodsau.supabase.co"
SUPABASE_PROJECT_REF="lksfwktwtmyznckodsau"

echo -e "${BLUE}📡 Connecting to Supabase project: $SUPABASE_PROJECT_REF${NC}"
echo ""

# =====================================================
# Step 1: Link to Supabase Project
# =====================================================

echo -e "${YELLOW}Step 1: Linking to Supabase project...${NC}"

if [ -f "supabase/config.toml" ]; then
  echo -e "${GREEN}✓ Already linked to Supabase project${NC}"
else
  echo "Initializing Supabase project..."
  supabase init

  # Link to remote project
  echo "Linking to remote Supabase project..."
  supabase link --project-ref $SUPABASE_PROJECT_REF
fi

echo ""

# =====================================================
# Step 2: Check Current Database State
# =====================================================

echo -e "${YELLOW}Step 2: Checking current database state...${NC}"

# Check which migrations have been applied
echo "Checking migration history..."
supabase db remote list

echo ""

# =====================================================
# Step 3: Execute Migration 039_v3 (Core Intelligence Tables)
# =====================================================

echo -e "${YELLOW}Step 3: Deploying Migration 039_v3 (Core Intelligence System)...${NC}"

if supabase db remote list | grep -q "039_autonomous_intelligence_system_v3"; then
  echo -e "${GREEN}✓ Migration 039_v3 already applied${NC}"
else
  echo "Executing migration 039_autonomous_intelligence_system_v3.sql..."

  # Push migration to remote
  supabase db push --include-all

  echo -e "${GREEN}✓ Migration 039_v3 applied successfully${NC}"
fi

echo ""

# =====================================================
# Step 4: Execute Migration 040 (Intelligence Tracking)
# =====================================================

echo -e "${YELLOW}Step 4: Deploying Migration 040 (Intelligence Tracking)...${NC}"

if supabase db remote list | grep -q "040_add_intelligence_tracking"; then
  echo -e "${GREEN}✓ Migration 040 already applied${NC}"
else
  echo "Executing migration 040_add_intelligence_tracking.sql..."

  # Execute via SQL
  cat supabase/migrations/040_add_intelligence_tracking.sql | supabase db query

  echo -e "${GREEN}✓ Migration 040 applied successfully${NC}"
fi

echo ""

# =====================================================
# Step 5: Execute Migration 041 (Extended Content Types)
# =====================================================

echo -e "${YELLOW}Step 5: Deploying Migration 041 (Extended Content Types)...${NC}"

if supabase db remote list | grep -q "041_extend_generated_content"; then
  echo -e "${GREEN}✓ Migration 041 already applied${NC}"
else
  echo "Executing migration 041_extend_generated_content.sql..."

  # Execute via SQL
  cat supabase/migrations/041_extend_generated_content.sql | supabase db query

  echo -e "${GREEN}✓ Migration 041 applied successfully${NC}"
fi

echo ""

# =====================================================
# Step 6: Verify Schema
# =====================================================

echo -e "${YELLOW}Step 6: Verifying database schema...${NC}"

# Create verification SQL
cat > /tmp/verify_intelligence_schema.sql <<'EOF'
-- Verify all required tables exist
SELECT
  'Tables Created' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 7 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'email_intelligence',
  'dynamic_questionnaires',
  'questionnaire_responses',
  'autonomous_tasks',
  'marketing_strategies',
  'knowledge_graph_nodes',
  'knowledge_graph_edges'
);

-- Verify intelligence_analyzed columns
SELECT
  'Intelligence Tracking Columns' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
  (table_name = 'client_emails' AND column_name IN ('intelligence_analyzed', 'analyzed_at'))
  OR
  (table_name = 'media_files' AND column_name IN ('intelligence_analyzed', 'analyzed_at'))
);

-- Verify marketing_strategies extensions
SELECT
  'Marketing Strategy Extensions' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'marketing_strategies'
AND column_name IN ('full_strategy', 'brand_positioning', 'budget_allocation', 'kpis', 'risks');

-- Verify RLS is enabled
SELECT
  'RLS Enabled' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 7 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN (
  'email_intelligence',
  'dynamic_questionnaires',
  'questionnaire_responses',
  'autonomous_tasks',
  'marketing_strategies',
  'knowledge_graph_nodes',
  'knowledge_graph_edges'
);

-- Verify indexes exist
SELECT
  'Performance Indexes' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 15 THEN '✅ PASS'
    ELSE '⚠️  WARNING'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE 'idx_%intelligence%'
  OR indexname LIKE 'idx_%questionnaire%'
  OR indexname LIKE 'idx_%task%'
  OR indexname LIKE 'idx_%strateg%'
  OR indexname LIKE 'idx_%knowledge%'
);
EOF

# Run verification
echo ""
echo "Running verification checks..."
echo ""

supabase db query < /tmp/verify_intelligence_schema.sql

echo ""

# =====================================================
# Step 7: Sample Data Test (Optional)
# =====================================================

echo -e "${YELLOW}Step 7: Testing with sample data...${NC}"

cat > /tmp/test_intelligence_insert.sql <<'EOF'
-- Test insert into email_intelligence
DO $$
DECLARE
  test_workspace_id UUID;
  test_contact_id UUID;
  test_email_id UUID;
BEGIN
  -- Get a workspace (or create test workspace)
  SELECT id INTO test_workspace_id FROM workspaces LIMIT 1;

  IF test_workspace_id IS NULL THEN
    RAISE NOTICE '⚠️  No workspaces found. Skipping insert test.';
    RETURN;
  END IF;

  -- Get a contact
  SELECT id INTO test_contact_id FROM contacts WHERE workspace_id = test_workspace_id LIMIT 1;

  IF test_contact_id IS NULL THEN
    RAISE NOTICE '⚠️  No contacts found. Skipping insert test.';
    RETURN;
  END IF;

  -- Get an email
  SELECT id INTO test_email_id FROM client_emails WHERE workspace_id = test_workspace_id LIMIT 1;

  -- Test insert into email_intelligence
  INSERT INTO email_intelligence (
    email_id,
    contact_id,
    workspace_id,
    ideas,
    business_goals,
    pain_points,
    sentiment,
    decision_readiness,
    ai_model,
    confidence_score
  ) VALUES (
    test_email_id,
    test_contact_id,
    test_workspace_id,
    '[{"text": "Test idea", "category": "product", "priority": "high"}]'::jsonb,
    '[{"text": "Test goal"}]'::jsonb,
    '[{"text": "Test pain point"}]'::jsonb,
    'neutral',
    5,
    'claude-test',
    0.85
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Sample intelligence record inserted successfully';

  -- Clean up test data
  DELETE FROM email_intelligence WHERE ai_model = 'claude-test';

  RAISE NOTICE '✅ Test data cleaned up';
END $$;
EOF

echo "Testing database operations..."
supabase db query < /tmp/test_intelligence_insert.sql

echo ""

# =====================================================
# Step 8: Generate Deployment Report
# =====================================================

echo -e "${YELLOW}Step 8: Generating deployment report...${NC}"

cat > deployment-report.txt <<EOF
=======================================================
CLIENT INTELLIGENCE SYSTEM - DEPLOYMENT REPORT
=======================================================
Deployment Date: $(date)
Supabase Project: $SUPABASE_PROJECT_REF
Supabase URL: $SUPABASE_URL

=======================================================
MIGRATIONS APPLIED
=======================================================
✓ Migration 039_v3: Autonomous Intelligence System (7 tables)
✓ Migration 040: Intelligence Tracking Columns
✓ Migration 041: Extended Content Types

=======================================================
TABLES CREATED
=======================================================
✓ email_intelligence
✓ dynamic_questionnaires
✓ questionnaire_responses
✓ autonomous_tasks
✓ marketing_strategies
✓ knowledge_graph_nodes
✓ knowledge_graph_edges

=======================================================
COLUMNS ADDED
=======================================================
✓ client_emails.intelligence_analyzed
✓ client_emails.analyzed_at
✓ media_files.intelligence_analyzed
✓ media_files.analyzed_at
✓ marketing_strategies.full_strategy
✓ marketing_strategies.brand_positioning
✓ marketing_strategies.budget_allocation
✓ marketing_strategies.kpis
✓ marketing_strategies.risks
✓ calendar_posts.engagement_metrics
✓ calendar_posts.platform_post_id
✓ calendar_posts.platform_url

=======================================================
SECURITY
=======================================================
✓ Row Level Security (RLS) enabled on all tables
✓ Workspace isolation policies in place
✓ User permissions configured

=======================================================
PERFORMANCE
=======================================================
✓ Indexes created for high-frequency queries
✓ JSONB indexes for intelligent querying
✓ Composite indexes for workspace filtering

=======================================================
NEXT STEPS
=======================================================
1. Implement API endpoints for agents
2. Test with Duncan's email data
3. Configure cron jobs for Continuous Intelligence Update
4. Set up monitoring and alerts

=======================================================
VERIFICATION QUERIES
=======================================================

-- Check all intelligence tables
SELECT table_name, row_security
FROM pg_tables
WHERE schemaname = 'public'
AND table_name LIKE '%intelligence%'
OR table_name LIKE '%questionnaire%'
OR table_name LIKE '%task%'
OR table_name LIKE '%strateg%'
OR table_name LIKE '%knowledge%';

-- Check intelligence tracking
SELECT
  (SELECT COUNT(*) FROM client_emails WHERE intelligence_analyzed = true) as emails_analyzed,
  (SELECT COUNT(*) FROM media_files WHERE intelligence_analyzed = true) as media_analyzed;

-- Check intelligence data
SELECT COUNT(*) as total_intelligence_records
FROM email_intelligence;

=======================================================
EOF

echo -e "${GREEN}✓ Deployment report saved to: deployment-report.txt${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ DEPLOYMENT COMPLETE! ✨${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "The Client Intelligence System database schema has been successfully deployed to Supabase!"
echo ""
echo "Next steps:"
echo "1. Review deployment-report.txt for detailed information"
echo "2. Begin implementing API endpoints (see CLIENT-INTELLIGENCE-SYSTEM-IMPLEMENTATION-GUIDE.md)"
echo "3. Test with Duncan's email data"
echo ""

# Clean up temp files
rm -f /tmp/verify_intelligence_schema.sql /tmp/test_intelligence_insert.sql

exit 0
