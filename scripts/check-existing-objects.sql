-- =====================================================
-- CHECK EXISTING DATABASE OBJECTS
-- =====================================================
-- Run this to see what's currently in the database

-- 1. Check existing functions and their definitions
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%workspace%' OR p.proname LIKE '%org%' OR p.proname LIKE '%role%')
ORDER BY p.proname;

-- 2. Check existing policies and their definitions
SELECT
  schemaname,
  tablename,
  policyname,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check views that might reference these functions
SELECT
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public';
