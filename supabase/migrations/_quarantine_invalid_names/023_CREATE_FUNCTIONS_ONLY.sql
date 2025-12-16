-- =====================================================
-- MIGRATION 023: Create RLS Helper Functions ONLY
-- =====================================================
-- Just create the functions - no policies yet
-- This isolates the uuid=text error

-- Drop any existing versions
DROP FUNCTION IF EXISTS get_user_workspaces() CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org_simple(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org_simple(TEXT, TEXT) CASCADE;

-- Function 1: Get user workspaces (UUID-native)
CREATE FUNCTION get_user_workspaces()
RETURNS SETOF TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT w.id
  FROM workspaces w
  INNER JOIN user_organizations uo
    ON uo.org_id = w.org_id  -- Both are UUID - NO casting
  WHERE uo.user_id = auth.uid()
    AND uo.is_active = true;
END;
$$;

-- Function 2: Role hierarchy check (UUID parameter)
CREATE FUNCTION user_has_role_in_org_simple(
  p_org_id UUID,  -- UUID parameter (not TEXT)
  p_required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role
  FROM user_organizations
  WHERE user_id = auth.uid()
    AND org_id = p_org_id  -- UUID = UUID - NO casting
    AND is_active = true;

  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Simple case statement for role hierarchy
  RETURN CASE p_required_role
    WHEN 'viewer' THEN v_user_role IN ('viewer', 'member', 'admin', 'owner')
    WHEN 'member' THEN v_user_role IN ('member', 'admin', 'owner')
    WHEN 'admin' THEN v_user_role IN ('admin', 'owner')
    WHEN 'owner' THEN v_user_role = 'owner'
    ELSE false
  END;
END;
$$;

-- Verification
DO $$
DECLARE
  func_count INT;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_workspaces', 'user_has_role_in_org_simple');

  RAISE NOTICE '========================================';
  RAISE NOTICE '=== MIGRATION 023 RESULTS ===';
  RAISE NOTICE 'Functions created: % / 2', func_count;

  IF func_count = 2 THEN
    RAISE NOTICE '✅ SUCCESS: Both functions created';
  ELSE
    RAISE WARNING '❌ FAILED: Expected 2 functions, found %', func_count;
  END IF;
  RAISE NOTICE '========================================';
END $$;
