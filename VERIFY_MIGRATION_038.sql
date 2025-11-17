-- =====================================================
-- VERIFY MIGRATION 038 - Check if tables were created
-- =====================================================
-- Run this after applying Migration 038 to verify success
-- =====================================================

-- Check if all 6 tables exist
SELECT
  tablename,
  'EXISTS ✅' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails')
ORDER BY tablename;

-- Count total (should be 6)
SELECT
  COUNT(*) as tables_created,
  CASE
    WHEN COUNT(*) = 6 THEN '✅ SUCCESS: All 6 tables created'
    WHEN COUNT(*) > 0 THEN '⚠️ PARTIAL: Only ' || COUNT(*) || ' of 6 tables created'
    ELSE '❌ FAILED: No tables created'
  END as result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails');

-- Show column details for each table
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails')
ORDER BY table_name, ordinal_position;
