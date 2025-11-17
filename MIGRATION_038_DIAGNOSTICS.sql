-- =====================================================
-- MIGRATION 038 PRE-FLIGHT DIAGNOSTICS
-- =====================================================
-- Run this BEFORE applying Migration 038
-- This will verify all prerequisites are met
-- =====================================================

-- Check 1: Verify core tables exist
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('workspaces', 'organizations', 'contacts', 'campaigns', 'drip_campaigns')
ORDER BY tablename;

-- Expected: All 5 tables should exist

-- Check 2: Verify workspaces table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workspaces'
ORDER BY ordinal_position;

-- Expected: Should see id, org_id, name, description, created_at, updated_at

-- Check 3: Check if any of the new tables already exist
SELECT
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails')
ORDER BY tablename;

-- Expected: None of these should exist yet (or some might from previous attempts)

-- Check 4: Verify foreign key constraints can be created
-- Test that we can reference these tables
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid::regclass::text IN ('workspaces', 'organizations', 'contacts', 'campaigns', 'drip_campaigns')
LIMIT 10;

-- Expected: Should see existing foreign keys to these tables

-- Check 5: Verify RLS helper functions exist (from Migration 023)
SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname IN ('get_user_org_id', 'is_org_member', 'is_org_owner')
ORDER BY proname;

-- Expected: All 3 functions should exist

-- =====================================================
-- RESULTS INTERPRETATION:
-- =====================================================
-- If Check 1 shows missing tables → Apply earlier migrations first
-- If Check 2 shows no columns → workspaces table corrupted, restore from backup
-- If Check 3 shows existing tables → Drop them first or use IF NOT EXISTS pattern
-- If Check 4 shows no results → Foreign key system might be broken
-- If Check 5 shows missing functions → Apply Migration 023 first
-- =====================================================
