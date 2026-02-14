-- Migration 033: Fix organizations RLS policies for user initialization
-- Issue: Users cannot create their own organization during initialization
-- Error: "new row violates row-level security policy for table organizations"

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Organization members can view organizations" ON organizations;

-- Create permissive policies for organization management

-- SELECT: Users can view organizations they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  USING (
    -- User is the owner
    created_by = auth.uid()
    OR
    -- User is a member of this organization
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create organizations
-- (Critical for first-time user initialization)
CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Organization owners can update their organizations
CREATE POLICY "Organization owners can update"
  ON organizations
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: Organization owners can delete their organizations
CREATE POLICY "Organization owners can delete"
  ON organizations
  FOR DELETE
  USING (created_by = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;
