-- Guardian G32 Test Users Setup
-- Create test users with different Guardian access levels
-- Run this in Supabase SQL Editor

-- ============================================
-- SETUP: Guardian Test Users
-- ============================================

-- 1. Find existing users or note their UUIDs
-- You can create users through Supabase Auth UI first, then run these updates

-- ============================================
-- USER 1: Guardian Viewer (guardian_viewer)
-- ============================================
-- Replace <viewer-user-uuid> with actual user UUID

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_viewer"'
)
WHERE email = 'viewer@test.com'; -- Or use: WHERE id = '<viewer-user-uuid>';

-- Verify viewer role
SELECT
  id,
  email,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'viewer@test.com';

-- ============================================
-- USER 2: Guardian Analyst (guardian_analyst)
-- ============================================
-- Replace <analyst-user-uuid> with actual user UUID

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_analyst"'
)
WHERE email = 'analyst@test.com'; -- Or use: WHERE id = '<analyst-user-uuid>';

-- Verify analyst role
SELECT
  id,
  email,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'analyst@test.com';

-- ============================================
-- USER 3: Guardian Admin (guardian_admin)
-- ============================================
-- Replace <admin-user-uuid> with actual user UUID

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_admin"'
)
WHERE email = 'admin@test.com'; -- Or use: WHERE id = '<admin-user-uuid>';

-- Verify admin role
SELECT
  id,
  email,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'admin@test.com';

-- ============================================
-- USER 4: No Role (should default to viewer)
-- ============================================

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'guardian_role'
WHERE email = 'norole@test.com'; -- Or use: WHERE id = '<norole-user-uuid>';

-- Verify no role set
SELECT
  id,
  email,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'norole@test.com';

-- ============================================
-- VERIFICATION: List all Guardian users
-- ============================================

SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'guardian_role', 'guardian_viewer (default)') as guardian_role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email IN (
  'viewer@test.com',
  'analyst@test.com',
  'admin@test.com',
  'norole@test.com'
)
ORDER BY
  CASE raw_user_meta_data->>'guardian_role'
    WHEN 'guardian_admin' THEN 1
    WHEN 'guardian_analyst' THEN 2
    WHEN 'guardian_viewer' THEN 3
    ELSE 4
  END;

-- ============================================
-- HELPER: Update specific user by email
-- ============================================

-- Set user to guardian_admin
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{guardian_role}',
--   '"guardian_admin"'
-- )
-- WHERE email = 'your-email@example.com';

-- Set user to guardian_analyst
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{guardian_role}',
--   '"guardian_analyst"'
-- )
-- WHERE email = 'your-email@example.com';

-- Set user to guardian_viewer
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{guardian_role}',
--   '"guardian_viewer"'
-- )
-- WHERE email = 'your-email@example.com';

-- Remove guardian role (will default to viewer)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data - 'guardian_role'
-- WHERE email = 'your-email@example.com';

-- ============================================
-- CLEANUP: Remove test users (optional)
-- ============================================

-- WARNING: This will permanently delete test users
-- Uncomment to use:

-- DELETE FROM auth.users
-- WHERE email IN (
--   'viewer@test.com',
--   'analyst@test.com',
--   'admin@test.com',
--   'norole@test.com'
-- );
