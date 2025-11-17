-- =====================================================
-- PRE-MIGRATION CHECK - Run this BEFORE migrations
-- =====================================================
-- This checks the exact data types in your database

-- Check ALL ID and org_id columns
SELECT
  table_name,
  column_name,
  data_type,
  udt_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'organizations' AND column_name = 'id')
    OR (table_name = 'workspaces' AND column_name IN ('id', 'org_id'))
    OR column_name = 'org_id'
    OR column_name = 'workspace_id'
  )
ORDER BY table_name, column_name;

-- Check workspace structure specifically
\d workspaces

-- Sample data to verify types
SELECT
  'organizations' as table_name,
  id,
  pg_typeof(id) as type_of_id
FROM organizations
LIMIT 1;

SELECT
  'workspaces' as table_name,
  id,
  pg_typeof(id) as type_of_id,
  org_id,
  pg_typeof(org_id) as type_of_org_id
FROM workspaces
LIMIT 1;
