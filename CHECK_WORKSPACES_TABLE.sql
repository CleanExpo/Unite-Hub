-- Check if workspaces table exists and what columns it has
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workspaces'
ORDER BY ordinal_position;
