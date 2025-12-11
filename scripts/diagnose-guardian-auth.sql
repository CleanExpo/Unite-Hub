-- Guardian Authentication Diagnostics
-- Run this in Supabase SQL Editor to check Guardian setup

-- ============================================
-- 1. CHECK: Do any users exist?
-- ============================================
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'guardian_role' IS NOT NULL THEN 1 END) as users_with_guardian_role
FROM auth.users;

-- ============================================
-- 2. LIST: All users and their Guardian roles
-- ============================================
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'guardian_role', 'NONE (will default to guardian_viewer)') as guardian_role,
  created_at,
  last_sign_in_at,
  CASE
    WHEN last_sign_in_at IS NULL THEN '⚠️ Never signed in'
    WHEN last_sign_in_at < NOW() - INTERVAL '7 days' THEN '⚠️ Last sign-in > 7 days ago'
    ELSE '✓ Recently active'
  END as activity_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 3. CHECK: Guardian tables exist?
-- ============================================
SELECT
  tablename,
  CASE
    WHEN tablename LIKE 'guardian_%' THEN '✓ Exists'
    ELSE ''
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'guardian_%'
ORDER BY tablename;

-- ============================================
-- 4. CHECK: Guardian RLS policies
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN cmd = 'ALL' THEN '✓ Full access'
    WHEN cmd = 'SELECT' THEN 'Read-only'
    ELSE cmd
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'guardian_%'
ORDER BY tablename, policyname;

-- ============================================
-- 5. CHECK: Recent Guardian activity
-- ============================================

-- Check guardian_alert_events
SELECT
  'guardian_alert_events' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  MAX(created_at) as most_recent
FROM guardian_alert_events;

-- Check guardian_simulation_runs
SELECT
  'guardian_simulation_runs' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  MAX(started_at) as most_recent
FROM guardian_simulation_runs;

-- Check guardian_qa_schedules
SELECT
  'guardian_qa_schedules' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  MAX(created_at) as most_recent
FROM guardian_qa_schedules;

-- ============================================
-- 6. DIAGNOSTIC SUMMARY
-- ============================================
WITH user_stats AS (
  SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN raw_user_meta_data->>'guardian_role' IS NOT NULL THEN 1 END) as users_with_roles,
    COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 1 END) as active_users
  FROM auth.users
),
table_stats AS (
  SELECT COUNT(*) as guardian_tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename LIKE 'guardian_%'
)
SELECT
  CASE
    WHEN u.total_users = 0 THEN '❌ CRITICAL: No users exist. Create users via Auth UI or Google OAuth.'
    WHEN u.users_with_roles = 0 THEN '❌ CRITICAL: No users have Guardian roles. Run setup-guardian-test-users.sql'
    WHEN u.active_users = 0 THEN '⚠️  WARNING: No recent user activity. Users may need to re-authenticate.'
    WHEN t.guardian_tables < 10 THEN '⚠️  WARNING: Missing Guardian tables. Run migrations.'
    ELSE '✓ Guardian setup looks good!'
  END as status,
  u.total_users,
  u.users_with_roles,
  u.active_users,
  t.guardian_tables
FROM user_stats u, table_stats t;

-- ============================================
-- NEXT STEPS
-- ============================================
-- Based on the diagnostic above:
--
-- If "No users exist":
--   1. Go to http://localhost:3008/auth/signin
--   2. Sign in with Google OAuth
--   3. Re-run this diagnostic
--
-- If "No users have Guardian roles":
--   1. Run: scripts/setup-guardian-test-users.sql
--   OR
--   2. Manually add role to your user (see GUARDIAN_DEV_SETUP.md)
--
-- If "Missing Guardian tables":
--   1. Check: supabase/migrations/*.sql files exist
--   2. Apply migrations via Supabase Dashboard → SQL Editor
--
-- Full setup guide: GUARDIAN_DEV_SETUP.md
