-- =====================================================
-- RLS POLICY TEST SUITE
-- =====================================================
-- Purpose: Validate that RLS policies are working correctly
-- Run this AFTER applying migration 020
-- Expected: All tests should return TRUE

-- =====================================================
-- TEST 1: Verify RLS is enabled on all tables
-- =====================================================
SELECT 'TEST 1: RLS Enabled Check' AS test_name,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - ' || COUNT(*) || ' tables missing RLS'
  END AS result,
  array_agg(tablename) FILTER (WHERE NOT rowsecurity) AS tables_without_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'workspaces', 'contacts', 'emails', 'campaigns',
    'generated_content', 'audit_logs', 'team_members', 'projects',
    'approvals', 'drip_campaigns', 'campaign_steps', 'campaign_enrollments',
    'campaign_execution_logs', 'whatsapp_messages', 'whatsapp_templates',
    'whatsapp_conversations', 'calendar_posts', 'marketing_personas',
    'marketing_strategies', 'subscriptions', 'invoices', 'payment_methods'
  )
  AND NOT rowsecurity;

-- =====================================================
-- TEST 2: Verify org_id columns are all UUID type
-- =====================================================
SELECT 'TEST 2: Organization ID Type Check' AS test_name,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - ' || COUNT(*) || ' tables with wrong type'
  END AS result,
  array_agg(table_name || '.' || column_name || ' (' || data_type || ')') FILTER (WHERE data_type != 'uuid') AS wrong_types
FROM information_schema.columns
WHERE column_name = 'org_id'
  AND table_schema = 'public'
  AND data_type != 'uuid';

-- =====================================================
-- TEST 3: Verify foreign key constraints exist
-- =====================================================
SELECT 'TEST 3: Foreign Key Constraints' AS test_name,
  CASE
    WHEN COUNT(*) >= 10 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' FK constraints found'
  END AS result,
  COUNT(*) AS fk_count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%org_id%';

-- =====================================================
-- TEST 4: Verify helper functions exist
-- =====================================================
SELECT 'TEST 4: Helper Functions' AS test_name,
  CASE
    WHEN COUNT(*) = 2 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Missing functions: ' || array_agg(missing)::text
  END AS result
FROM (
  SELECT unnest(ARRAY['get_user_workspaces', 'user_has_role_in_org']) AS missing
  EXCEPT
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
) AS missing_funcs;

-- =====================================================
-- TEST 5: Verify no USING (true) policies remain
-- =====================================================
SELECT 'TEST 5: No Placeholder Policies' AS test_name,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - ' || COUNT(*) || ' tables still have USING (true)'
  END AS result,
  array_agg(DISTINCT tablename) FILTER (WHERE qual::text = 'true') AS tables_with_placeholder
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text = 'true'
  AND policyname NOT LIKE '%Service role%'  -- Service role policies legitimately use true
  AND policyname NOT LIKE '%Anyone can%';   -- Public access policies legitimately use true

-- =====================================================
-- TEST 6: Verify policy count per table
-- =====================================================
SELECT 'TEST 6: Policy Coverage' AS test_name,
  CASE
    WHEN MIN(policy_count) >= 1 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Some tables have no policies'
  END AS result,
  json_object_agg(tablename, policy_count) AS policy_counts
FROM (
  SELECT
    tablename,
    COUNT(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) AS counts;

-- =====================================================
-- TEST 7: Verify workspace-scoped tables have proper policies
-- =====================================================
SELECT 'TEST 7: Workspace-Scoped Policies' AS test_name,
  CASE
    WHEN COUNT(*) >= 8 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' workspace policies found'
  END AS result,
  array_agg(DISTINCT tablename) AS tables_with_workspace_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text LIKE '%workspace_id%'
  AND cmd = 'SELECT';

-- =====================================================
-- TEST 8: Verify organization-scoped tables have proper policies
-- =====================================================
SELECT 'TEST 8: Organization-Scoped Policies' AS test_name,
  CASE
    WHEN COUNT(*) >= 5 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Only ' || COUNT(*) || ' org policies found'
  END AS result,
  array_agg(DISTINCT tablename) AS tables_with_org_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text LIKE '%org_id%'
  AND qual::text LIKE '%user_organizations%'
  AND cmd = 'SELECT';

-- =====================================================
-- TEST SUMMARY
-- =====================================================
SELECT
  '========== RLS SECURITY TEST SUMMARY ==========' AS summary,
  NOW() AS tested_at;

-- Expected output: All tests should show PASS ✓
-- If any test shows FAIL ✗, review the migration and re-apply if needed
