-- Migration 321: Fix profiles table signup trigger
-- Issue: Signup populates user_profiles but NOT profiles table.
--        Middleware and RBAC code queries profiles for user role.
--
-- Solution: Add trigger to also insert into profiles on signup.
-- Date: 2025-12-03

BEGIN;

-- ============================================
-- STEP 1: Create/update the profiles signup trigger
-- ============================================

-- Ensure profiles table has required columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the handle_new_user function to insert into BOTH tables
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles (original behavior)
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  -- ALSO insert into profiles table (for RBAC/middleware)
  INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'CLIENT'::user_role,  -- Default role for new signups
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Ensure trigger exists on auth.users
-- ============================================

-- Drop and recreate to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STEP 3: Fix profiles RLS policies
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any problematic policies
DROP POLICY IF EXISTS "profiles_self_select" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "rls_profiles_self_view" ON profiles;
DROP POLICY IF EXISTS "rls_profiles_self_update" ON profiles;

-- Users can view their own profile
CREATE POLICY "profiles_view_own"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do anything (for admin operations)
CREATE POLICY "profiles_service_role"
  ON profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- STEP 4: Migrate existing users who have user_profiles but not profiles
-- ============================================

INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT
  up.id,
  up.email,
  'CLIENT'::user_role,
  up.full_name,
  up.created_at,
  NOW()
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = up.id
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
-- SELECT
--   'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
-- UNION ALL
-- SELECT
--   'profiles' as table_name, COUNT(*) as count FROM profiles;
