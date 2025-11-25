-- RLS Policy Verification Script
-- Run this in Supabase SQL Editor to verify Row Level Security

-- 1. Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'contacts',
    'campaigns',
    'drip_campaigns',
    'emails',
    'generatedContent',
    'mindmaps',
    'projects',
    'tasks',
    'user_profiles',
    'organizations',
    'workspaces'
  )
ORDER BY tablename;

-- 2. List all RLS policies and their definitions
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command_type,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'contacts',
    'campaigns',
    'drip_campaigns',
    'emails',
    'generatedContent',
    'mindmaps',
    'projects',
    'tasks'
  )
ORDER BY tablename, policyname;

-- 3. Check for workspace_id columns (critical for isolation)
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'workspace_id'
ORDER BY table_name;

-- 4. Check for foreign key constraints on workspace_id
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'workspace_id'
ORDER BY tc.table_name;

-- 5. Test workspace isolation (requires existing workspace)
-- This will show if RLS is working by attempting to access data
-- You should only see data from your authenticated workspace

-- IMPORTANT: Replace 'your-workspace-id-here' with an actual workspace ID from your database
-- SELECT
--   workspace_id,
--   COUNT(*) as contact_count
-- FROM contacts
-- GROUP BY workspace_id;

-- 6. Verify helper functions exist (required for RLS policies)
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_workspace_id',
    'has_workspace_access',
    'is_workspace_owner'
  )
ORDER BY routine_name;
