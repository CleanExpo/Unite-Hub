-- Check which tables from migration 038 actually exist
SELECT
  tablename,
  'EXISTS' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails', 'test_fk')
ORDER BY tablename;

-- Check if projects table was created (from 038_TWO_STEP.sql)
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
ORDER BY ordinal_position;
