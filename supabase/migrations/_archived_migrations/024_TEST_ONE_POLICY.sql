-- =====================================================
-- MIGRATION 024: Test ONE policy to find the error
-- =====================================================
-- Add policies for just organizations table to isolate error

-- Drop existing policies on organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Service role can create organizations" ON organizations;
DROP POLICY IF EXISTS "Org owners and admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Org owners can delete organization" ON organizations;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Test Policy 1: SELECT (simple subquery, no function)
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Policy 1 created: SELECT';
END $$;

-- Test Policy 2: INSERT (service role only, no joins)
CREATE POLICY "Service role can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

DO $$
BEGIN
  RAISE NOTICE '✅ Policy 2 created: INSERT';
END $$;

-- Test Policy 3: UPDATE (uses helper function with UUID parameter)
CREATE POLICY "Org owners and admins can update organization"
  ON organizations FOR UPDATE
  USING (user_has_role_in_org_simple(id, 'admin'));

DO $$
BEGIN
  RAISE NOTICE '✅ Policy 3 created: UPDATE';
END $$;

-- Test Policy 4: DELETE (uses helper function with UUID parameter)
CREATE POLICY "Org owners can delete organization"
  ON organizations FOR DELETE
  USING (user_has_role_in_org_simple(id, 'owner'));

DO $$
BEGIN
  RAISE NOTICE '✅ Policy 4 created: DELETE';
END $$;

-- Verification
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'organizations';

  RAISE NOTICE '========================================';
  RAISE NOTICE '=== MIGRATION 024 RESULTS ===';
  RAISE NOTICE 'Policies created on organizations: %', policy_count;

  IF policy_count = 4 THEN
    RAISE NOTICE '✅ SUCCESS: All 4 policies created';
  ELSE
    RAISE WARNING '❌ INCOMPLETE: Expected 4 policies, found %', policy_count;
  END IF;
  RAISE NOTICE '========================================';
END $$;
