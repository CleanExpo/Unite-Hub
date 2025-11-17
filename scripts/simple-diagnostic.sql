-- =====================================================
-- SIMPLE DIAGNOSTIC - Run each query separately
-- =====================================================

-- QUERY 1: Check column types
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'organizations' AND column_name = 'id')
    OR (table_name = 'workspaces' AND column_name IN ('id', 'org_id'))
    OR (table_name = 'user_organizations' AND column_name = 'org_id')
    OR (table_name = 'subscriptions' AND column_name = 'org_id')
  )
ORDER BY table_name, column_name;
