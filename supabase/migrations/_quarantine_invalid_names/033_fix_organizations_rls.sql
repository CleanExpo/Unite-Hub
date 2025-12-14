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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Users can view their organizations'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view their organizations"
        ON public.organizations
        FOR SELECT
        USING (
          id IN (
            SELECT org_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
              AND is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

-- INSERT: Authenticated users can create organizations
-- (Critical for first-time user initialization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Users can create organizations'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can create organizations"
        ON public.organizations
        FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL)
    $policy$;
  END IF;
END $$;

-- UPDATE: Organization owners can update their organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Organization owners can update'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Organization owners can update"
        ON public.organizations
        FOR UPDATE
        USING (
          id IN (
            SELECT org_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
              AND role = 'owner'
              AND is_active = true
          )
        )
        WITH CHECK (
          id IN (
            SELECT org_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
              AND role = 'owner'
              AND is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

-- DELETE: Organization owners can delete their organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Organization owners can delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Organization owners can delete"
        ON public.organizations
        FOR DELETE
        USING (
          id IN (
            SELECT org_id
            FROM public.user_organizations
            WHERE user_id = auth.uid()
              AND role = 'owner'
              AND is_active = true
          )
        )
    $policy$;
  END IF;
END $$;

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
