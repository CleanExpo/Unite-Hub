-- Migration 320: Fix RLS Infinite Recursion
-- Issue: user_organizations_admin_manage policy queries user_organizations from within
-- a policy on user_organizations, causing infinite recursion.
-- Same issue affects organizations and workspaces tables.
--
-- Solution: Use SECURITY DEFINER function to check admin status without triggering RLS.
-- Date: 2025-12-03

BEGIN;

-- ============================================
-- STEP 1: Create helper function to check admin status
-- This function uses SECURITY DEFINER to bypass RLS when checking roles
-- ============================================

CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query without RLS (SECURITY DEFINER bypasses it)
  SELECT role INTO user_role
  FROM user_organizations
  WHERE org_id = check_org_id
    AND user_id = auth.uid()
    AND is_active = true;

  RETURN user_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_org_admin(UUID) TO authenticated;

-- ============================================
-- STEP 2: Fix user_organizations policies
-- ============================================

-- Drop ALL existing policies on user_organizations to start fresh
DROP POLICY IF EXISTS "Users can view own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org admins can view org members" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can manage members" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization owners can manage members" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users and owners can create memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users and owners can update memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users and owners can delete memberships" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_select_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_self_select" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_admin_manage" ON user_organizations;

-- Ensure RLS is enabled
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own memberships (no recursion)
CREATE POLICY "user_orgs_self_select"
  ON user_organizations
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Users can INSERT themselves into an org they own
-- (Used during org creation - the creator becomes the owner)
CREATE POLICY "user_orgs_self_insert"
  ON user_organizations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Either they're creating themselves as owner of a new org
      role = 'owner'
      -- Or they're accepting an invite (role will be from invite)
      OR EXISTS (
        SELECT 1 FROM organization_invites
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND org_id = user_organizations.org_id
        AND accepted_at IS NULL
        AND expires_at > NOW()
      )
    )
  );

-- Policy 3: Org admins can SELECT all members (using helper function)
CREATE POLICY "user_orgs_admin_select"
  ON user_organizations
  FOR SELECT
  USING (is_org_admin(org_id));

-- Policy 4: Org admins can INSERT new members (using helper function)
CREATE POLICY "user_orgs_admin_insert"
  ON user_organizations
  FOR INSERT
  WITH CHECK (is_org_admin(org_id));

-- Policy 5: Org admins can UPDATE members (using helper function)
CREATE POLICY "user_orgs_admin_update"
  ON user_organizations
  FOR UPDATE
  USING (is_org_admin(org_id));

-- Policy 6: Org admins can DELETE members (using helper function)
CREATE POLICY "user_orgs_admin_delete"
  ON user_organizations
  FOR DELETE
  USING (is_org_admin(org_id));

-- ============================================
-- STEP 3: Fix organizations policies
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "organizations_admin_manage" ON organizations;
DROP POLICY IF EXISTS "org_admin_all" ON organizations;
DROP POLICY IF EXISTS "org_member_select" ON organizations;
DROP POLICY IF EXISTS "org_owner_modify" ON organizations;

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT orgs they're members of
CREATE POLICY "org_member_select"
  ON organizations
  FOR SELECT
  USING (
    -- User is admin of this org (using helper function avoids recursion)
    is_org_admin(id)
    OR
    -- User has any membership in this org
    id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only org admins can modify orgs
CREATE POLICY "org_admin_modify"
  ON organizations
  FOR ALL
  USING (is_org_admin(id));

-- ============================================
-- STEP 4: Fix workspaces policies
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "workspaces_admin_manage" ON workspaces;
DROP POLICY IF EXISTS "workspace_admin_all" ON workspaces;

-- Ensure RLS is enabled
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Simple select policy - workspace belongs to an org user is in
DROP POLICY IF EXISTS "workspace_member_select" ON workspaces;
CREATE POLICY "workspace_member_select"
  ON workspaces
  FOR SELECT
  USING (
    is_org_admin(org_id)
    OR
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

-- Only org admins can modify workspaces
DROP POLICY IF EXISTS "workspace_admin_modify" ON workspaces;
CREATE POLICY "workspace_admin_modify"
  ON workspaces
  FOR ALL
  USING (is_org_admin(org_id));

-- ============================================
-- STEP 5: Ensure signup triggers work with SECURITY DEFINER
-- The handle_new_user trigger already uses SECURITY DEFINER which bypasses RLS
-- ============================================

-- Verify the trigger function has SECURITY DEFINER
-- (This is informational - the function should already have it from migration 003)

COMMIT;

-- ============================================
-- VERIFICATION QUERY (run after migration)
-- ============================================
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('user_organizations', 'organizations', 'workspaces')
-- ORDER BY tablename, policyname;
