-- Verification Script for E16-E18 Migrations
-- Run this AFTER applying migrations 431, 432, 433 via Supabase Dashboard

-- ============================================
-- E16: Observability & Audit Trails (431)
-- ============================================

-- E16: Checking audit_events table
SELECT 'E16: audit_events table' as check_name,
  EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'audit_events'
  ) as exists;

-- E16: Checking api_request_logs table
SELECT 'E16: api_request_logs table' as check_name,
  EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'api_request_logs'
  ) as exists;

-- E16: Checking audit_event_type enum
SELECT 'E16: audit_event_type enum' as check_name,
  EXISTS (
    SELECT FROM pg_type
    WHERE typname = 'audit_event_type'
  ) as exists;

-- E16: Checking functions
SELECT
  'record_audit_event' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'record_audit_event') as exists
UNION ALL
SELECT
  'record_api_request' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'record_api_request') as exists
UNION ALL
SELECT
  'get_audit_summary' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'get_audit_summary') as exists
UNION ALL
SELECT
  'cleanup_old_audit_logs' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_old_audit_logs') as exists;

-- E16: Checking RLS policies
SELECT
  'E16: RLS policies' as check_name,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('audit_events', 'api_request_logs')
ORDER BY tablename, policyname;

-- ============================================
-- E17: Backup & Export Infrastructure (432)
-- ============================================

-- E17: Checking export_jobs table
SELECT 'E17: export_jobs table' as check_name,
  EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'export_jobs'
  ) as exists;

-- E17: Checking export_job_items table
SELECT 'E17: export_job_items table' as check_name,
  EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'export_job_items'
  ) as exists;

-- E17: Checking export_type enum
SELECT 'E17: export_type enum' as check_name,
  EXISTS (
    SELECT FROM pg_type
    WHERE typname = 'export_type'
  ) as exists;

-- E17: Checking export_job_status enum
SELECT 'E17: export_job_status enum' as check_name,
  EXISTS (
    SELECT FROM pg_type
    WHERE typname = 'export_job_status'
  ) as exists;

-- E17: Checking functions
SELECT
  'queue_export_job' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'queue_export_job') as exists
UNION ALL
SELECT
  'start_export_job' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'start_export_job') as exists
UNION ALL
SELECT
  'complete_export_job' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'complete_export_job') as exists
UNION ALL
SELECT
  'cleanup_old_export_jobs' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_old_export_jobs') as exists;

-- E17: Checking RLS policies
SELECT
  'E17: RLS policies' as check_name,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('export_jobs', 'export_job_items')
ORDER BY tablename, policyname;

-- ============================================
-- E18: Kill-Switch Controls (433)
-- ============================================

-- E18: Checking kill_switch_flags table
SELECT 'E18: kill_switch_flags table' as check_name,
  EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'kill_switch_flags'
  ) as exists;

-- E18: Checking kill_switch_overrides table
SELECT 'E18: kill_switch_overrides table' as check_name,
  EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'kill_switch_overrides'
  ) as exists;

-- E18: Checking feature_flag_category enum
SELECT 'E18: feature_flag_category enum' as check_name,
  EXISTS (
    SELECT FROM pg_type
    WHERE typname = 'feature_flag_category'
  ) as exists;

-- E18: Checking functions
SELECT
  'check_feature_flag' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'check_feature_flag') as exists
UNION ALL
SELECT
  'enable_feature_flag' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'enable_feature_flag') as exists
UNION ALL
SELECT
  'disable_feature_flag' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'disable_feature_flag') as exists
UNION ALL
SELECT
  'set_feature_override' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'set_feature_override') as exists
UNION ALL
SELECT
  'cleanup_expired_overrides' as function_name,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_expired_overrides') as exists;

-- E18: Checking RLS policies
SELECT
  'E18: RLS policies' as check_name,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('kill_switch_flags', 'kill_switch_overrides')
ORDER BY tablename, policyname;

-- E18: Checking seeded kill-switches
SELECT
  'E18: Seeded kill-switches' as check_name,
  key,
  name,
  category,
  enabled,
  is_kill_switch,
  metadata->>'risk_level' as risk_level
FROM kill_switch_flags
WHERE tenant_id IS NULL
ORDER BY
  CASE category
    WHEN 'delivery' THEN 1
    WHEN 'automation' THEN 2
    WHEN 'ai' THEN 3
    WHEN 'integrations' THEN 4
    WHEN 'experimental' THEN 5
    WHEN 'safety' THEN 6
  END,
  name;

-- ============================================
-- Summary Check
-- ============================================

-- SUMMARY: All Tables Created
SELECT
  'SUMMARY: Tables' as check_type,
  'audit_events' as table_name,
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_events') as exists
UNION ALL SELECT
  'SUMMARY: Tables',
  'api_request_logs',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_request_logs')
UNION ALL SELECT
  'SUMMARY: Tables',
  'export_jobs',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'export_jobs')
UNION ALL SELECT
  'SUMMARY: Tables',
  'export_job_items',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'export_job_items')
UNION ALL SELECT
  'SUMMARY: Tables',
  'kill_switch_flags',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kill_switch_flags')
UNION ALL SELECT
  'SUMMARY: Tables',
  'kill_switch_overrides',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kill_switch_overrides');

-- SUMMARY: Function Count Check
SELECT
  'SUMMARY: Functions' as check_type,
  'E16 Functions' as phase,
  COUNT(*) as count
FROM pg_proc
WHERE proname IN ('record_audit_event', 'record_api_request', 'get_audit_summary', 'cleanup_old_audit_logs')
UNION ALL SELECT
  'SUMMARY: Functions',
  'E17 Functions',
  COUNT(*)
FROM pg_proc
WHERE proname IN ('queue_export_job', 'start_export_job', 'complete_export_job', 'cleanup_old_export_jobs')
UNION ALL SELECT
  'SUMMARY: Functions',
  'E18 Functions',
  COUNT(*)
FROM pg_proc
WHERE proname IN ('check_feature_flag', 'enable_feature_flag', 'disable_feature_flag', 'set_feature_override', 'cleanup_expired_overrides');

-- ✅ Verification Complete
SELECT '✅ Verification Complete' as status, now() as completed_at;
