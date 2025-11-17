-- =====================================================
-- RLS DIAGNOSTICS - Run this FIRST before any RLS work
-- =====================================================
-- This script shows the CURRENT STATE of RLS in your database

\echo ''
\echo '========================================'
\echo '=== RLS DIAGNOSTIC REPORT ==='
\echo '========================================'
\echo ''

-- 1. Check RLS Helper Functions
\echo '=== 1. RLS HELPER FUNCTIONS ==='
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%workspace%' OR p.proname LIKE '%org%' OR p.proname LIKE '%role%')
ORDER BY p.proname;

\echo ''
\echo 'Expected functions:'
\echo '  - get_user_workspaces'
\echo '  - user_has_role_in_org_simple'
\echo ''

-- 2. Check RLS Status on Core Tables
\echo '=== 2. RLS STATUS (Core Tables) ==='
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'workspaces', 'user_profiles', 'user_organizations',
    'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
  )
ORDER BY tablename;

\echo ''

-- 3. Count Policies Per Table
\echo '=== 3. POLICY COUNT BY TABLE ==='
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo 'Expected: ~4 policies per table (SELECT, INSERT, UPDATE, DELETE)'
\echo ''

-- 4. Check Column Types (for UUID vs TEXT issues)
\echo '=== 4. COLUMN TYPES (ID columns) ==='
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'organizations' AND column_name = 'id')
    OR (table_name = 'workspaces' AND column_name IN ('id', 'org_id'))
    OR (table_name = 'user_organizations' AND column_name IN ('user_id', 'org_id'))
    OR (table_name = 'subscriptions' AND column_name = 'org_id')
    OR (column_name IN ('workspace_id'))
  )
ORDER BY table_name, column_name;

\echo ''
\echo 'Expected: All ID columns should be UUID type'
\echo ''

-- 5. Sample Policy Definitions (for debugging)
\echo '=== 5. SAMPLE POLICY DEFINITIONS ==='
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN LENGTH(qual) > 60 THEN LEFT(qual, 57) || '...'
    ELSE qual
  END as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'workspaces', 'contacts')
ORDER BY tablename, policyname
LIMIT 10;

\echo ''
\echo '========================================'
\echo '=== DIAGNOSTIC SUMMARY ==='
\echo '========================================'
\echo ''

-- Summary Check
DO $$
DECLARE
  func_count INT;
  rls_count INT;
  policy_count INT;
  all_ok BOOLEAN := true;
BEGIN
  -- Count functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_workspaces', 'user_has_role_in_org_simple');

  -- Count tables with RLS
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
    );

  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Report
  RAISE NOTICE 'Functions found: % / 2', func_count;
  RAISE NOTICE 'Tables with RLS: % / 9', rls_count;
  RAISE NOTICE 'Total policies: %', policy_count;
  RAISE NOTICE '';

  -- Check each requirement
  IF func_count < 2 THEN
    RAISE WARNING '❌ Missing RLS helper functions';
    RAISE WARNING '   → Run migration 023_CREATE_FUNCTIONS_ONLY.sql first';
    all_ok := false;
  ELSE
    RAISE NOTICE '✅ RLS helper functions exist';
  END IF;

  IF rls_count < 9 THEN
    RAISE WARNING '❌ Not all core tables have RLS enabled';
    RAISE WARNING '   → Run migration 025_COMPLETE_RLS.sql';
    all_ok := false;
  ELSE
    RAISE NOTICE '✅ All core tables have RLS enabled';
  END IF;

  IF policy_count < 36 THEN
    RAISE WARNING '❌ Missing policies (expected ~36+)';
    RAISE WARNING '   → Run migration 025_COMPLETE_RLS.sql';
    all_ok := false;
  ELSE
    RAISE NOTICE '✅ Policies appear complete';
  END IF;

  RAISE NOTICE '';
  IF all_ok THEN
    RAISE NOTICE '✅ ✅ ✅ DATABASE SECURITY: HEALTHY ✅ ✅ ✅';
  ELSE
    RAISE WARNING '⚠️ ⚠️ ⚠️ DATABASE SECURITY: INCOMPLETE ⚠️ ⚠️ ⚠️';
    RAISE WARNING 'Follow the recommendations above to fix';
  END IF;
  RAISE NOTICE '';
END $$;

\echo '========================================'
\echo 'Diagnostic complete. Review output above.'
\echo '========================================'
