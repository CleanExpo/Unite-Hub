-- Check primary key and constraints on workspaces table
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'workspaces'
ORDER BY tc.constraint_type, kcu.ordinal_position;
