-- Add guardian_role column to profiles table
-- Run in Supabase Dashboard → SQL Editor

-- Step 1: Add guardian_role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'guardian_role'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN guardian_role TEXT CHECK (guardian_role IN ('guardian_viewer', 'guardian_analyst', 'guardian_admin'));
  END IF;
END $$;

-- Step 2: Set guardian_admin for contact@unite-group.in
UPDATE profiles 
SET guardian_role = 'guardian_admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'contact@unite-group.in'
);

-- Step 3: Verify
SELECT 
  u.email,
  p.guardian_role
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'contact@unite-group.in';
