-- =====================================================
-- FINAL RLS FIX - Allow User to Access Their Data
-- =====================================================
-- This fixes the 500 error on user_organizations

-- =====================================================
-- 1. FIX USER_ORGANIZATIONS RLS POLICIES
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can create own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can view members" ON user_organizations;

-- Allow authenticated users to view their own organization memberships
CREATE POLICY "Users can view own org memberships"
  ON user_organizations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to insert their own organization memberships
CREATE POLICY "Users can create own org memberships"
  ON user_organizations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow organization owners/admins to view all members in their org
CREATE POLICY "Org admins can view members"
  ON user_organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.org_id = user_organizations.org_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 2. FIX USER_PROFILES RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- 3. FIX ORGANIZATIONS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

-- Allow users to view organizations they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. VERIFY USER SETUP
-- =====================================================

-- Check if user exists in auth.users
SELECT
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Check if profile exists
SELECT
  'user_profiles' as table_name,
  COUNT(*) as count
FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Check if organization link exists
SELECT
  'user_organizations' as table_name,
  COUNT(*) as count
FROM user_organizations
WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Show user's complete setup
SELECT
  up.email,
  up.full_name,
  uo.org_id,
  uo.role,
  o.name as org_name
FROM user_profiles up
LEFT JOIN user_organizations uo ON uo.user_id = up.id
LEFT JOIN organizations o ON o.id = uo.org_id
WHERE up.id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- =====================================================
-- DONE!
-- =====================================================
-- After running this:
-- 1. Clear browser cache/cookies
-- 2. Sign in with Google again
-- 3. Dashboard should load without 500 errors
