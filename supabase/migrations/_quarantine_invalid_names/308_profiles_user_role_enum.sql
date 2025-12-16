-- Migration 308: User Role Enum and profiles.role migration
-- Introduces FOUNDER, STAFF, CLIENT, ADMIN role system

BEGIN;

-- 1) Create user_role enum if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('FOUNDER', 'STAFF', 'CLIENT', 'ADMIN');
  END IF;
END $$;

-- 2) Drop any old CHECK constraint on profiles.role (like profiles_role_check)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3) Check if role column exists; if not, add it as text first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT;
  END IF;
END $$;

-- 4) Drop the default BEFORE converting the type (fixes cast error)
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- 5) Convert the column to user_role enum with proper casting
ALTER TABLE profiles
  ALTER COLUMN role TYPE user_role
  USING (
    CASE
      WHEN role ILIKE 'founder' THEN 'FOUNDER'::user_role
      WHEN role ILIKE 'staff' THEN 'STAFF'::user_role
      WHEN role ILIKE 'admin' THEN 'ADMIN'::user_role
      WHEN role ILIKE 'client' THEN 'CLIENT'::user_role
      WHEN role IS NULL THEN 'CLIENT'::user_role
      ELSE 'CLIENT'::user_role
    END
  );

-- 6) Set sane default AFTER conversion (new users default to CLIENT)
ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'CLIENT'::user_role;

-- 7) Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMIT;
