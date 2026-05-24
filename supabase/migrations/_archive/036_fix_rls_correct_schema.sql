-- Migration 036: Fix RLS policies based on ACTUAL table schema
-- Previous migrations failed because they referenced non-existent created_by column
-- Ownership is determined via user_organizations table with role='owner'

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Organization members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON organizations;
DROP POLICY IF EXISTS "Organization owners can delete" ON organizations;

-- SELECT: Users can view organizations they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Any authenticated user can create organizations
-- (CRITICAL for first-time user initialization)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Organization owners can update
CREATE POLICY "Organization owners can update"
  ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- DELETE: Organization owners can delete
CREATE POLICY "Organization owners can delete"
  ON organizations
  FOR DELETE
  USING (
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_ORGANIZATIONS TABLE (Join Table)
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization owners can manage members" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users and owners can create memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users and owners can update memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users and owners can delete memberships" ON user_organizations;

-- SELECT: Users can view their own memberships
CREATE POLICY "Users can view their memberships"
  ON user_organizations
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own memberships (as owner)
-- OR existing owners can add members
CREATE POLICY "Users and owners can create memberships"
  ON user_organizations
  FOR INSERT
  WITH CHECK (
    -- User is adding themselves (critical for initialization)
    user_id = auth.uid()
    OR
    -- User is an owner of the organization
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- UPDATE: Users can update their own role OR owners can update members
CREATE POLICY "Users and owners can update memberships"
  ON user_organizations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- DELETE: Users can leave OR owners can remove members
CREATE POLICY "Users and owners can delete memberships"
  ON user_organizations
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view workspaces in their organizations" ON workspaces;
DROP POLICY IF EXISTS "Organization owners can manage workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can delete workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view workspaces in their orgs" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces in their orgs" ON workspaces;
DROP POLICY IF EXISTS "Org owners can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org owners can delete workspaces" ON workspaces;

-- SELECT: Users can view workspaces in their organizations
CREATE POLICY "Users can view their workspaces"
  ON workspaces
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create workspaces in their organizations
-- (CRITICAL for first-time user initialization)
CREATE POLICY "Users can create workspaces in their orgs"
  ON workspaces
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Organization owners can update workspaces
CREATE POLICY "Org owners can update workspaces"
  ON workspaces
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- DELETE: Organization owners can delete workspaces
CREATE POLICY "Org owners can delete workspaces"
  ON workspaces
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all policies are in place
SELECT
  tablename,
  policyname,
  cmd,
  SUBSTRING(qual::text, 1, 50) as qual_preview,
  SUBSTRING(with_check::text, 1, 50) as check_preview
FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
ORDER BY tablename, policyname;

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
GROUP BY tablename
ORDER BY tablename;
