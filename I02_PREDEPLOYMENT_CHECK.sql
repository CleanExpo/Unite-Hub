/**
 * Guardian I02 Pre-Deployment Verification Checklist
 * Run these queries in Supabase SQL Editor before applying migration 4276
 *
 * If any check FAILS, the deployment will fail. Fix the issue before proceeding.
 */

-- =====================================================
-- CHECK 1: Verify get_user_workspaces() function exists
-- =====================================================
SELECT
  proname,
  prokind,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_user_workspaces'
LIMIT 1;

-- EXPECTED: Shows function definition
-- If EMPTY: Migration 020 hasn't been applied. Apply 020 first, then I02.
-- If ERROR: Database doesn't have this function. Contact support.

-- =====================================================
-- CHECK 2: Verify guardian_simulation_runs table exists
-- =====================================================
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'guardian_simulation_runs'
LIMIT 1;

-- EXPECTED: Shows "guardian_simulation_runs | public"
-- If EMPTY: Migration I01 hasn't been applied. Apply I01 first, then I02.
-- If ERROR: Check I01 migration status.

-- =====================================================
-- CHECK 3: Count current Guardian tables (for post-deployment comparison)
-- =====================================================
SELECT COUNT(*) as total_guardian_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'guardian_%';

-- EXPECTED: Returns a number (e.g., 12, 15, 20 depending on your setup)
-- IMPORTANT: Note this number for later verification

-- =====================================================
-- CHECK 4: Check if simulation tables already exist (safety check)
-- =====================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('guardian_simulation_events', 'guardian_simulation_pipeline_traces');

-- EXPECTED: Should be EMPTY (tables don't exist yet)
-- If SHOWS TABLES: Tables already exist. Safe to re-run migration (idempotent CREATE IF NOT EXISTS).

-- =====================================================
-- CHECK 5: Verify RLS is available (not a managed read-only database)
-- =====================================================
SELECT current_setting('rls.enabled', TRUE) as rls_enabled;

-- EXPECTED: Shows "on" or enabled
-- If SHOWS "off": RLS disabled on this database. Cannot deploy I02. Contact admin.

-- =====================================================
-- CHECK 6: Sample core Guardian tables to verify they're not empty
-- =====================================================
SELECT
  'guardian_rules' as table_name,
  COUNT(*) as row_count
FROM guardian_rules
UNION ALL
SELECT
  'guardian_alerts',
  COUNT(*)
FROM guardian_alerts
UNION ALL
SELECT
  'guardian_incidents',
  COUNT(*)
FROM guardian_incidents;

-- EXPECTED: Shows row counts for core Guardian tables
-- This verifies production tables are present and queryable

-- =====================================================
-- CHECK 7: Verify database extensions (if needed)
-- =====================================================
SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- EXPECTED: Should show uuid-ossp and pgcrypto installed
-- These are typically pre-installed in Supabase

-- =====================================================
-- CHECK 8: Final safety check - list top 10 migrations
-- =====================================================
SELECT name, executed_at
FROM _realtime.schema_migrations
ORDER BY executed_at DESC
LIMIT 10;

-- EXPECTED: Shows recent migrations including I01 and migration 020
-- Verify I02 migration (4276_*) is NOT in this list yet
