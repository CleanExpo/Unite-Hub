-- Pre-Flight Check: Run this BEFORE applying E16-E18 migrations
-- This checks what's already in your database

-- Check if E16 tables exist
SELECT
  'E16 Tables' as phase,
  EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_events') as audit_events,
  EXISTS (SELECT FROM pg_tables WHERE tablename = 'api_request_logs') as api_request_logs;

-- Check if E17 tables exist
SELECT
  'E17 Tables' as phase,
  EXISTS (SELECT FROM pg_tables WHERE tablename = 'export_jobs') as export_jobs,
  EXISTS (SELECT FROM pg_tables WHERE tablename = 'export_job_items') as export_job_items;

-- Check if E18 tables exist
SELECT
  'E18 Tables' as phase,
  EXISTS (SELECT FROM pg_tables WHERE tablename = 'kill_switch_flags') as kill_switch_flags,
  EXISTS (SELECT FROM pg_tables WHERE tablename = 'kill_switch_overrides') as kill_switch_overrides;

-- Summary
SELECT
  'Status' as check,
  CASE
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_events')
      AND EXISTS (SELECT FROM pg_tables WHERE tablename = 'export_jobs')
      AND EXISTS (SELECT FROM pg_tables WHERE tablename = 'kill_switch_flags')
    THEN '✅ All migrations applied'
    WHEN NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_events')
      AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'export_jobs')
      AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'kill_switch_flags')
    THEN '⏳ Ready to apply - No migrations applied yet'
    ELSE '⚠️ Partial - Some migrations applied, some missing'
  END as status;
