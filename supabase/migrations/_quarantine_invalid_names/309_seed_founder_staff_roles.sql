-- Migration 309: Seed Founder and Staff Roles
-- Run this after users have logged in at least once to create their profiles
-- Date: 2025-11-28

BEGIN;

-- Create profiles for any auth.users that don't have profiles yet
-- This ensures the role update queries below will work
INSERT INTO profiles (id, email, role)
SELECT
  id,
  email,
  'CLIENT'::user_role
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Set founder role for Phill
UPDATE profiles
SET role = 'FOUNDER'::user_role
WHERE email = 'phill.mcgurk@gmail.com';

-- Set staff role for Claire
UPDATE profiles
SET role = 'STAFF'::user_role
WHERE email = 'support@carsi.com.au';

-- Set staff role for Rana
UPDATE profiles
SET role = 'STAFF'::user_role
WHERE email = 'ranamuzamil1199@gmail.com';

COMMIT;

-- Verification query (run separately to check results):
-- SELECT id, email, role FROM profiles WHERE email IN ('phill.mcgurk@gmail.com', 'support@carsi.com.au', 'ranamuzamil1199@gmail.com');
