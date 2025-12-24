-- Migration 034: Fix user_organizations RLS policies
-- Issue: Users cannot create membership records during initialization

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization owners can manage members" ON user_organizations;

-- CREATE permissive policies

-- SELECT: Users can view their own memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_organizations'
      AND policyname = 'Users can view their memberships'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view their memberships"
        ON public.user_organizations
        FOR SELECT
        USING (user_id = auth.uid())
    $policy$;
  END IF;
END $$;

-- INSERT: Users can create their own memberships OR org owners can add members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_organizations'
      AND policyname = 'Users and owners can create memberships'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users and owners can create memberships"
        ON public.user_organizations
        FOR INSERT
        WITH CHECK (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.user_organizations uo_owner
            WHERE uo_owner.org_id = user_organizations.org_id
              AND uo_owner.user_id = auth.uid()
              AND uo_owner.role = 'owner'
              AND uo_owner.is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

-- UPDATE: Users can update their own memberships OR org owners can update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_organizations'
      AND policyname = 'Users and owners can update memberships'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users and owners can update memberships"
        ON public.user_organizations
        FOR UPDATE
        USING (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.user_organizations uo_owner
            WHERE uo_owner.org_id = user_organizations.org_id
              AND uo_owner.user_id = auth.uid()
              AND uo_owner.role = 'owner'
              AND uo_owner.is_active = true
          )
        )
        WITH CHECK (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.user_organizations uo_owner
            WHERE uo_owner.org_id = user_organizations.org_id
              AND uo_owner.user_id = auth.uid()
              AND uo_owner.role = 'owner'
              AND uo_owner.is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

-- DELETE: Users can remove themselves OR org owners can remove members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_organizations'
      AND policyname = 'Users and owners can delete memberships'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users and owners can delete memberships"
        ON public.user_organizations
        FOR DELETE
        USING (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.user_organizations uo_owner
            WHERE uo_owner.org_id = user_organizations.org_id
              AND uo_owner.user_id = auth.uid()
              AND uo_owner.role = 'owner'
              AND uo_owner.is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

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
