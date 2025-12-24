-- Migration 037: Clean up duplicate RLS policies
-- Issue: Migration 036 didn't drop all old policies, causing duplicates
-- Old policies use helper functions (user_has_role_in_org) that may not exist
-- New policies use direct subqueries to user_organizations table

-- ============================================================================
-- ORGANIZATIONS TABLE - Remove old policies with helper functions
-- ============================================================================

-- Drop old policies that use helper functions
DROP POLICY IF EXISTS "Org admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Org owners can delete organizations" ON organizations;
DROP POLICY IF EXISTS "Service role can create organizations" ON organizations;

-- Keep these policies from Migration 036:
-- ✅ "Authenticated users can create organizations" (INSERT)
-- ✅ "Organization owners can update" (UPDATE with subquery)
-- ✅ "Organization owners can delete" (DELETE with subquery)
-- ✅ "Users can view their organizations" (SELECT with subquery)

-- Verify no duplicate policies remain
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'organizations';

  IF policy_count != 4 THEN
    RAISE WARNING 'Expected 4 policies for organizations table, found %', policy_count;
  ELSE
    RAISE NOTICE '✅ Organizations table has exactly 4 policies';
  END IF;
END $$;

-- ============================================================================
-- WORKSPACES TABLE - Remove old policies with helper functions
-- ============================================================================

-- Drop old policies that use helper functions or service role
DROP POLICY IF EXISTS "Org admins can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Service role can manage workspaces" ON workspaces;

-- Keep these policies from Migration 036:
-- ✅ "Users can view their workspaces" (SELECT)
-- ✅ "Users can create workspaces in their orgs" (INSERT)
-- ✅ "Org owners can update workspaces" (UPDATE with subquery)
-- ✅ "Org owners can delete workspaces" (DELETE with subquery)

-- Verify no duplicate policies remain
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'workspaces';

  IF policy_count != 4 THEN
    RAISE WARNING 'Expected 4 policies for workspaces table, found %', policy_count;
  ELSE
    RAISE NOTICE '✅ Workspaces table has exactly 4 policies';
  END IF;
END $$;

-- ============================================================================
-- USER_ORGANIZATIONS TABLE - Already correct (4 policies)
-- ============================================================================

-- Verify user_organizations policies are correct
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_organizations';

  IF policy_count != 4 THEN
    RAISE WARNING 'Expected 4 policies for user_organizations table, found %', policy_count;
  ELSE
    RAISE NOTICE '✅ User_organizations table has exactly 4 policies';
  END IF;
END $$;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Show final policy counts
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
GROUP BY tablename
ORDER BY tablename;

-- Expected output:
-- organizations      | 4
-- user_organizations | 4
-- workspaces         | 4

-- Show all policies with their types
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
ORDER BY tablename, cmd, policyname;

-- Expected 12 policies total:
-- Organizations (4):
--   1. "Authenticated users can create organizations" (INSERT)
--   2. "Organization owners can delete" (DELETE)
--   3. "Organization owners can update" (UPDATE)
--   4. "Users can view their organizations" (SELECT)
--
-- User_Organizations (4):
--   1. "Users and owners can create memberships" (INSERT)
--   2. "Users and owners can delete memberships" (DELETE)
--   3. "Users and owners can update memberships" (UPDATE)
--   4. "Users can view their memberships" (SELECT)
--
-- Workspaces (4):
--   1. "Org owners can delete workspaces" (DELETE)
--   2. "Org owners can update workspaces" (UPDATE)
--   3. "Users can create workspaces in their orgs" (INSERT)
--   4. "Users can view their workspaces" (SELECT)
