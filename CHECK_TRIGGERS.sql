-- Check for triggers that might be interfering

-- Check 1: Are there any triggers on the tables we're trying to create?
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails')
ORDER BY event_object_table, trigger_name;

-- Check 2: Are there any functions that reference workspace_id?
SELECT
  proname AS function_name,
  prosrc AS function_source
FROM pg_proc
WHERE prosrc ILIKE '%workspace_id%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Check 3: Check for any existing RLS policies mentioning workspace_id
SELECT
  schemaname,
  tablename,
  policyname,
  qual AS policy_expression
FROM pg_policies
WHERE qual::text ILIKE '%workspace_id%'
ORDER BY tablename, policyname;
