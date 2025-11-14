-- =====================================================
-- FIX RLS - Remove Infinite Recursion
-- =====================================================
-- The "Org admins can view members" policy causes infinite recursion
-- We need to remove it and keep only the simple policy

-- =====================================================
-- 1. DROP ALL POLICIES ON USER_ORGANIZATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can create own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org admins can view members" ON user_organizations;

-- =====================================================
-- 2. CREATE SIMPLE NON-RECURSIVE POLICIES
-- =====================================================

-- Allow users to view their own organization memberships ONLY
CREATE POLICY "Users can view own org memberships"
  ON user_organizations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own organization memberships
CREATE POLICY "Users can create own org memberships"
  ON user_organizations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own organization memberships
CREATE POLICY "Users can update own org memberships"
  ON user_organizations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. VERIFY IT WORKS
-- =====================================================

-- This should now work without 500 errors
SELECT
  id,
  user_id,
  org_id,
  role,
  is_active
FROM user_organizations
WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- After running this script:
-- 1. Refresh your browser
-- 2. Sign in with Google
-- 3. No more 500 errors!
