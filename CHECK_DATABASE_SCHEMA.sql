-- =====================================================
-- DATABASE SCHEMA DIAGNOSTIC
-- =====================================================
-- Run this to see what your database actually looks like
-- =====================================================

-- Check 1: Does workspaces table exist?
SELECT
  'workspaces' as table_name,
  COUNT(*) as exists
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'workspaces';

-- Check 2: What columns does workspaces have?
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workspaces'
ORDER BY ordinal_position;

-- Check 3: Does user_organizations table exist?
SELECT
  'user_organizations' as table_name,
  COUNT(*) as exists
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'user_organizations';

-- Check 4: What columns does user_organizations have?
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_organizations'
ORDER BY ordinal_position;

-- Check 5: Does contacts table exist?
SELECT
  'contacts' as table_name,
  COUNT(*) as exists
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'contacts';

-- Check 6: Does projects table already exist?
SELECT
  'projects' as table_name,
  COUNT(*) as exists,
  CASE WHEN COUNT(*) > 0 THEN 'EXISTS - Migration already applied?' ELSE 'Does not exist - OK to create' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'projects';

-- Check 7: List all existing RLS policies on projects (if table exists)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'projects';

-- Check 8: Are there any orphan policies from Migration 003?
SELECT
  tablename,
  policyname,
  'Orphan policy - table does not exist' as issue
FROM pg_policies
WHERE tablename IN ('team_members', 'approvals')
  AND tablename NOT IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public');
