-- =====================================================
-- COMPREHENSIVE DATABASE DIAGNOSTIC
-- =====================================================
-- Run this in Supabase SQL Editor to see EXACT current state

-- Check ALL column types
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
    OR (table_name = 'user_organizations' AND column_name = 'org_id')
    OR (table_name = 'subscriptions' AND column_name = 'org_id')
    OR (table_name = 'generatedContent' AND column_name = 'org_id')
    OR (table_name = 'auditLogs' AND column_name = 'org_id')
  )
ORDER BY table_name, column_name;

-- Check existing functions
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
  AND p.proname IN ('get_user_workspaces', 'user_has_role_in_org', 'user_has_role_in_org_text', 'user_has_role_in_org_simple')
ORDER BY p.proname;

-- Check existing policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'workspaces', 'user_profiles', 'user_organizations',
    'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
  )
ORDER BY tablename, policyname;

-- Check RLS status
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'workspaces', 'user_profiles', 'user_organizations',
    'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
  )
ORDER BY tablename;

-- Check for foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (kcu.column_name = 'org_id' OR ccu.column_name = 'id')
ORDER BY tc.table_name;

-- Sample data (to see actual UUID/TEXT values)
SELECT 'organizations' as table_name, id, pg_typeof(id) as actual_type FROM organizations LIMIT 1;
SELECT 'workspaces' as table_name, id, org_id, pg_typeof(org_id) as org_id_type FROM workspaces LIMIT 1;
SELECT 'user_organizations' as table_name, org_id, pg_typeof(org_id) as org_id_type FROM user_organizations LIMIT 1;

-- Try the actual JOIN that's failing
-- This will show us the EXACT error location
SELECT 'Testing JOIN...' as test;
SELECT w.id
FROM workspaces w
INNER JOIN user_organizations uo ON uo.org_id::text = w.org_id::text
WHERE uo.user_id = 'test-user-id'::uuid
LIMIT 1;
