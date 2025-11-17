-- Migration 034: Fix user_organizations RLS policies
-- Issue: Users cannot create membership records during initialization

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization owners can manage members" ON user_organizations;

-- CREATE permissive policies

-- SELECT: Users can view their own memberships
CREATE POLICY "Users can view their memberships"
  ON user_organizations
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own memberships OR org owners can add members
CREATE POLICY "Users and owners can create memberships"
  ON user_organizations
  FOR INSERT
  WITH CHECK (
    -- User is adding themselves
    user_id = auth.uid()
    OR
    -- User is the organization owner
    org_id IN (
      SELECT id
      FROM organizations
      WHERE created_by = auth.uid()
    )
  );

-- UPDATE: Users can update their own memberships OR org owners can update
CREATE POLICY "Users and owners can update memberships"
  ON user_organizations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    org_id IN (
      SELECT id
      FROM organizations
      WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    org_id IN (
      SELECT id
      FROM organizations
      WHERE created_by = auth.uid()
    )
  );

-- DELETE: Users can remove themselves OR org owners can remove members
CREATE POLICY "Users and owners can delete memberships"
  ON user_organizations
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    org_id IN (
      SELECT id
      FROM organizations
      WHERE created_by = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY policyname;
