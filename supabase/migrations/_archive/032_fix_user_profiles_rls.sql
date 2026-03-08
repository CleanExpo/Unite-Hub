-- Migration 032: Fix user_profiles RLS policies for user initialization
-- Issue: Users cannot create their own profile during initialization
-- Error: "new row violates row-level security policy for table user_profiles"

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create permissive policies that allow users to manage their own profiles

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Users can create their own profile (critical for initialization)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own profile (for account deletion)
CREATE POLICY "Users can delete their own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
