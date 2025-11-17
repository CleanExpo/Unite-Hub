-- =====================================================
-- TEAM 2 SECURITY MISSION - VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify all fixes
-- =====================================================

-- 1. VERIFY INTERACTIONS TABLE EXISTS
SELECT
  'interactions table exists' AS check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'interactions';

-- 2. VERIFY INTERACTIONS TABLE SCHEMA
SELECT
  'interactions schema' AS check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'interactions'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NOT NULL)
-- workspace_id (uuid, NOT NULL)
-- contact_id (uuid, NOT NULL)
-- interaction_type (varchar, NOT NULL)
-- subject (varchar, NULL)
-- details (jsonb, NOT NULL)
-- interaction_date (timestamptz, NOT NULL)
-- created_by (uuid, NULL)
-- created_at (timestamptz, NULL)
-- updated_at (timestamptz, NULL)

-- 3. VERIFY INTERACTIONS INDEXES
SELECT
  'interactions indexes' AS check_name,
  indexname,
  '✅ EXISTS' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'interactions'
ORDER BY indexname;

-- Expected indexes:
-- idx_interactions_contact
-- idx_interactions_contact_date
-- idx_interactions_date
-- idx_interactions_type
-- idx_interactions_workspace
-- idx_interactions_workspace_date

-- 4. VERIFY RLS POLICIES ON INTERACTIONS
SELECT
  'interactions RLS policies' AS check_name,
  policyname,
  cmd AS operation,
  '✅ EXISTS' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'interactions'
ORDER BY policyname;

-- Expected policies:
-- Users can view interactions in their workspace (SELECT)
-- Users can insert interactions in their workspace (INSERT)
-- Users can update interactions in their workspace (UPDATE)
-- Users can delete interactions in their workspace (DELETE)

-- 5. VERIFY PERFORMANCE INDEXES ON CONTACTS
SELECT
  'contacts indexes' AS check_name,
  indexname,
  '✅ EXISTS' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'contacts'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Expected key indexes:
-- idx_contacts_workspace_id
-- idx_contacts_ai_score
-- idx_contacts_status
-- idx_contacts_workspace_status
-- idx_contacts_workspace_score (hot leads!)
-- idx_contacts_email
-- idx_contacts_workspace_email

-- 6. VERIFY PERFORMANCE INDEXES ON EMAILS
SELECT
  'emails indexes' AS check_name,
  indexname,
  '✅ EXISTS' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'emails'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Expected key indexes:
-- idx_emails_workspace_id
-- idx_emails_contact_id
-- idx_emails_contact_created (composite!)
-- idx_emails_workspace_processed (partial!)
-- idx_emails_created_at

-- 7. VERIFY PERFORMANCE INDEXES ON CAMPAIGNS
SELECT
  'campaigns indexes' AS check_name,
  indexname,
  '✅ EXISTS' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'campaigns'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Expected key indexes:
-- idx_campaigns_workspace_status
-- idx_campaigns_status
-- idx_campaigns_created_at

-- 8. VERIFY SENT_EMAILS HAS WORKSPACE_ID
SELECT
  'sent_emails workspace_id column' AS check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sent_emails'
  AND column_name = 'workspace_id';

-- 9. TEST INTERACTION INSERT (should succeed with workspace_id)
-- NOTE: Only run if you have test data
-- INSERT INTO interactions (workspace_id, contact_id, interaction_type, details)
-- SELECT
--   w.id AS workspace_id,
--   c.id AS contact_id,
--   'test_verification' AS interaction_type,
--   '{"test": true}'::jsonb AS details
-- FROM workspaces w
-- CROSS JOIN contacts c
-- WHERE w.id = (SELECT id FROM workspaces LIMIT 1)
--   AND c.id = (SELECT id FROM contacts LIMIT 1)
-- LIMIT 1;

-- 10. CLEANUP TEST DATA (if you ran test insert)
-- DELETE FROM interactions WHERE interaction_type = 'test_verification';

-- 11. VERIFY TABLE STATISTICS ARE UP TO DATE
SELECT
  'table statistics' AS check_name,
  schemaname,
  tablename,
  last_analyze,
  CASE
    WHEN last_analyze > NOW() - INTERVAL '7 days' THEN '✅ RECENT'
    ELSE '⚠️ OLD'
  END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('contacts', 'emails', 'campaigns', 'interactions', 'generated_content')
ORDER BY tablename;

-- 12. PERFORMANCE TEST: Hot Leads Query
EXPLAIN ANALYZE
SELECT
  id,
  email,
  full_name,
  ai_score,
  status
FROM contacts
WHERE workspace_id = (SELECT id FROM workspaces LIMIT 1)
  AND ai_score >= 80
ORDER BY ai_score DESC
LIMIT 10;

-- Should use Index Scan on idx_contacts_workspace_score

-- 13. PERFORMANCE TEST: Email History Query
EXPLAIN ANALYZE
SELECT
  id,
  subject,
  created_at,
  is_processed
FROM emails
WHERE contact_id = (SELECT id FROM contacts LIMIT 1)
ORDER BY created_at DESC
LIMIT 20;

-- Should use Index Scan on idx_emails_contact_created

-- =====================================================
-- SUMMARY: Check all results show ✅ PASS or ✅ EXISTS
-- If any show ❌ FAIL, migrations may not be applied
-- =====================================================

-- Final Count Check
SELECT
  'FINAL SUMMARY' AS section,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'interactions') AS interactions_indexes,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'interactions') AS interactions_policies,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'contacts' AND indexname LIKE 'idx_%') AS contacts_indexes,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'emails' AND indexname LIKE 'idx_%') AS emails_indexes,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'campaigns' AND indexname LIKE 'idx_%') AS campaigns_indexes;

-- Expected results:
-- interactions_indexes: 6+
-- interactions_policies: 4
-- contacts_indexes: 9+
-- emails_indexes: 6+
-- campaigns_indexes: 3+
