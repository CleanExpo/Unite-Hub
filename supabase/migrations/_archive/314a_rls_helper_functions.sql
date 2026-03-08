-- Migration 314a: RLS Helper Functions
-- Purpose: Create helper functions for workspace-scoped RLS
-- Generated: 2025-11-29
-- Note: Run this FIRST, then run 314b for policies
--
-- VERIFIED SCHEMA:
-- - profiles.role uses user_role ENUM ('FOUNDER', 'STAFF', 'CLIENT', 'ADMIN')
-- - user_organizations links users to organizations via (user_id, org_id)
-- - Functions go in public schema (not auth)

-- ============================================
-- HELPER FUNCTIONS (in public schema)
-- ============================================

-- Check if user is member of an organization
-- Used for tables where workspace_id = org_id
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
    AND uo.org_id = check_org_id
    AND uo.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is member of workspace (looks up org from workspace)
-- Used for tables that properly reference workspaces(id)
-- Also handles fallback where workspace_id is actually org_id
CREATE OR REPLACE FUNCTION public.is_workspace_member(check_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- First try to find workspace and get its org_id
  SELECT org_id INTO v_org_id FROM workspaces WHERE id = check_workspace_id;

  -- If workspace found, check org membership
  IF v_org_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = v_org_id
      AND uo.is_active = true
    );
  END IF;

  -- Fallback: treat check_workspace_id as org_id directly
  -- (for tables where workspace_id is actually org_id)
  RETURN EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
    AND uo.org_id = check_workspace_id
    AND uo.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin/owner of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(check_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- First try to find workspace and get its org_id
  SELECT org_id INTO v_org_id FROM workspaces WHERE id = check_workspace_id;

  -- If workspace found, check org admin status
  IF v_org_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = v_org_id
      AND uo.role IN ('owner', 'admin')
      AND uo.is_active = true
    );
  END IF;

  -- Fallback: treat as org_id
  RETURN EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
    AND uo.org_id = check_workspace_id
    AND uo.role IN ('owner', 'admin')
    AND uo.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GRANT EXECUTE ON HELPER FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;

-- Verification query (run after migration)
-- SELECT proname FROM pg_proc WHERE proname IN ('is_org_member', 'is_workspace_member', 'is_workspace_admin');
