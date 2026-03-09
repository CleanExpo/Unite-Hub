-- Migration 309: Seed Founder and Staff Roles
-- Tags Phill as FOUNDER and optionally seeds staff roles

BEGIN;

-- Ensure Phill is correctly tagged as FOUNDER
UPDATE profiles
SET role = 'FOUNDER'
WHERE email = 'phill.mcgurk@gmail.com';

-- Also update user_profiles if it exists and has role column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    UPDATE user_profiles
    SET role = 'FOUNDER'
    WHERE email = 'phill.mcgurk@gmail.com';
  END IF;
END $$;

-- OPTIONAL: seed staff roles here as needed (safe to leave as-is if emails not present)
-- UPDATE profiles
-- SET role = 'STAFF'
-- WHERE email IN (
--   'claire.booth@yourdomain.com',
--   'staff@unite-group.in'
-- );

COMMIT;
