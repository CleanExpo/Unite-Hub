-- Migration 035: Fix RLS policies for ALL initialization-critical tables
-- This migration combines fixes for organizations, user_organizations, and workspaces
-- to allow smooth user initialization flow

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Drop existing restrictive policies
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
        AND is_active = true
    )
  );

-- INSERT: Authenticated users can create organizations (CRITICAL for init)
CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Organization owners can update
CREATE POLICY "Organization owners can update"
  ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
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
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
  );

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_ORGANIZATIONS TABLE (Join Table)
-- ============================================================================

-- Drop existing policies
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

-- INSERT: Users can add themselves OR org owners can add members
CREATE POLICY "Users and owners can create memberships"
  ON user_organizations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM user_organizations uo_owner
      WHERE uo_owner.org_id = user_organizations.org_id
        AND uo_owner.user_id = auth.uid()
        AND uo_owner.role = 'owner'
        AND uo_owner.is_active = true
    )
  );

-- UPDATE: Users or org owners can update memberships
CREATE POLICY "Users and owners can update memberships"
  ON user_organizations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM user_organizations uo_owner
      WHERE uo_owner.org_id = user_organizations.org_id
        AND uo_owner.user_id = auth.uid()
        AND uo_owner.role = 'owner'
        AND uo_owner.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM user_organizations uo_owner
      WHERE uo_owner.org_id = user_organizations.org_id
        AND uo_owner.user_id = auth.uid()
        AND uo_owner.role = 'owner'
        AND uo_owner.is_active = true
    )
  );

-- DELETE: Users can remove themselves OR org owners can remove members
CREATE POLICY "Users and owners can delete memberships"
  ON user_organizations
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM user_organizations uo_owner
      WHERE uo_owner.org_id = user_organizations.org_id
        AND uo_owner.user_id = auth.uid()
        AND uo_owner.role = 'owner'
        AND uo_owner.is_active = true
    )
  );

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================

-- Drop existing restrictive policies
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'Users can view workspaces in their orgs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view workspaces in their orgs"
        ON public.workspaces
        FOR SELECT
        USING (
          org_id IN (
            SELECT org_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
              AND is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

-- INSERT: Authenticated users can create workspaces in their orgs (CRITICAL for init)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'Users can create workspaces in their orgs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can create workspaces in their orgs"
        ON public.workspaces
        FOR INSERT
        WITH CHECK (
          org_id IN (
            SELECT org_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
              AND is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

-- UPDATE: Org owners can update workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'Org owners can update workspaces'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Org owners can update workspaces"
        ON public.workspaces
        FOR UPDATE
        USING (
          EXISTS (
            SELECT 1
            FROM public.user_organizations uo_owner
            WHERE uo_owner.org_id = workspaces.org_id
              AND uo_owner.user_id = auth.uid()
              AND uo_owner.role = 'owner'
              AND uo_owner.is_active = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.user_organizations uo_owner
            WHERE uo_owner.org_id = workspaces.org_id
              AND uo_owner.user_id = auth.uid()
              AND uo_owner.role = 'owner'
              AND uo_owner.is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

-- DELETE: Org owners can delete workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'Org owners can delete workspaces'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Org owners can delete workspaces"
        ON public.workspaces
        FOR DELETE
        USING (
          EXISTS (
            SELECT 1
            FROM public.user_organizations uo_owner
            WHERE uo_owner.org_id = workspaces.org_id
              AND uo_owner.user_id = auth.uid()
              AND uo_owner.role = 'owner'
              AND uo_owner.is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all policies are in place
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
ORDER BY tablename, policyname;
