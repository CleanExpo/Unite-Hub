-- Check for functions that might be called by RLS policies
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND prosrc ILIKE '%workspace_id%'
ORDER BY proname;

-- Also check for any functions that reference "current_user" or similar
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (
    prosrc ILIKE '%get_user%'
    OR prosrc ILIKE '%auth.uid%'
    OR prosrc ILIKE '%current_user%'
  )
ORDER BY proname;
