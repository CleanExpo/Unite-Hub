-- Query to see all existing RLS policies for our tables
SELECT
  tablename,
  policyname,
  cmd,
  SUBSTRING(qual::text, 1, 80) as qual_preview,
  SUBSTRING(with_check::text, 1, 80) as check_preview
FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
ORDER BY tablename, policyname;
