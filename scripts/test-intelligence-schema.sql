-- =====================================================
-- Test Intelligence System Schema
-- =====================================================
-- This script verifies all tables and columns exist

\echo ''
\echo '🔍 VERIFYING CLIENT INTELLIGENCE SYSTEM SCHEMA'
\echo '=============================================='
\echo ''

-- Check 1: Verify all required tables exist
\echo '📊 Check 1: Verifying tables...'
SELECT
  'email_intelligence' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_intelligence') THEN '✅' ELSE '❌' END as exists
UNION ALL
SELECT 'dynamic_questionnaires', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dynamic_questionnaires') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'questionnaire_responses', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questionnaire_responses') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'autonomous_tasks', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'autonomous_tasks') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'marketing_strategies', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_strategies') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'knowledge_graph_nodes', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_graph_nodes') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'knowledge_graph_edges', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_graph_edges') THEN '✅' ELSE '❌' END;

\echo ''
\echo '📊 Check 2: Verifying intelligence tracking columns...'
SELECT
  'client_emails.intelligence_analyzed' as column_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_emails' AND column_name = 'intelligence_analyzed') THEN '✅' ELSE '❌' END as exists
UNION ALL
SELECT 'client_emails.analyzed_at', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_emails' AND column_name = 'analyzed_at') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'media_files.intelligence_analyzed', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_files' AND column_name = 'intelligence_analyzed') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'media_files.analyzed_at', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_files' AND column_name = 'analyzed_at') THEN '✅' ELSE '❌' END;

\echo ''
\echo '📊 Check 3: Verifying marketing strategy extensions...'
SELECT
  'full_strategy' as column_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'full_strategy') THEN '✅' ELSE '❌' END as exists
UNION ALL
SELECT 'brand_positioning', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'brand_positioning') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'budget_allocation', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'budget_allocation') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'kpis', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'kpis') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'risks', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'risks') THEN '✅' ELSE '❌' END;

\echo ''
\echo '📊 Check 4: Verifying RLS is enabled...'
SELECT
  tablename,
  CASE WHEN rowsecurity = true THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'email_intelligence',
  'dynamic_questionnaires',
  'questionnaire_responses',
  'autonomous_tasks',
  'marketing_strategies',
  'knowledge_graph_nodes',
  'knowledge_graph_edges'
)
ORDER BY tablename;

\echo ''
\echo '📊 Check 5: Counting indexes...'
SELECT
  COUNT(*) as total_indexes,
  CASE
    WHEN COUNT(*) >= 15 THEN '✅ Good performance coverage'
    ELSE '⚠️  Consider adding more indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE 'idx_%intelligence%'
  OR indexname LIKE 'idx_%questionnaire%'
  OR indexname LIKE 'idx_%task%'
  OR indexname LIKE 'idx_%strateg%'
  OR indexname LIKE 'idx_%knowledge%'
  OR indexname LIKE 'idx_%calendar%'
);

\echo ''
\echo '✅ SCHEMA VERIFICATION COMPLETE'
\echo ''
