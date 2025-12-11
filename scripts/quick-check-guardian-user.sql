-- Quick Guardian User Check
-- Run this in Supabase SQL Editor to verify your setup

-- 1. List all users with their Guardian roles
SELECT
  email,
  raw_user_meta_data->>'guardian_role' as guardian_role,
  CASE
    WHEN raw_user_meta_data->>'guardian_role' IS NULL THEN '❌ NO ROLE SET'
    WHEN raw_user_meta_data->>'guardian_role' = 'guardian_admin' THEN '✓ Admin Access'
    WHEN raw_user_meta_data->>'guardian_role' = 'guardian_analyst' THEN '✓ Analyst Access'
    WHEN raw_user_meta_data->>'guardian_role' = 'guardian_viewer' THEN '✓ Viewer Access'
    ELSE '⚠️  Unknown Role'
  END as status,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. If you see "NO ROLE SET" above, run this (replace YOUR email):
--
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{guardian_role}',
--   '"guardian_admin"'
-- )
-- WHERE email = 'YOUR-EMAIL@example.com';
--
-- Then RE-RUN this script to verify.
