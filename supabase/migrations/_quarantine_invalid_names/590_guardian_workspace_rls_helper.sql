-- =====================================================
-- MIGRATION 590: Guardian Workspace RLS Helper Function
-- =====================================================
-- Defines get_current_workspace_id() for tenant isolation in Guardian tables
-- This function must exist BEFORE migrations 591 (X02) and 592 (X03)

-- Drop if exists
DROP FUNCTION IF EXISTS get_current_workspace_id() CASCADE;

-- Create function: Returns current user's workspace ID for RLS
-- Uses auth.uid() to get current user, then resolves to their default/primary workspace
-- Returns NULL if user has no workspace (RLS will deny access)
CREATE FUNCTION get_current_workspace_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  -- Get the current authenticated user's ID
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch the user's primary/default workspace
  -- Strategy: Join through user_organizations to get workspace
  -- Prefer workspace where user is owner/admin, otherwise first active workspace
  SELECT w.id INTO v_workspace_id
  FROM workspaces w
  INNER JOIN user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
    AND uo.is_active = true
  ORDER BY
    -- Prioritize owner/admin roles
    CASE uo.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END ASC,
    -- Then by creation order
    w.created_at ASC
  LIMIT 1;

  RETURN v_workspace_id;
END;
$$;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== MIGRATION 590: RLS Helper ===';
  RAISE NOTICE 'Created: get_current_workspace_id()';
  RAISE NOTICE '✅ Function ready for Guardian X02/X03';
  RAISE NOTICE '========================================';
END $$;
