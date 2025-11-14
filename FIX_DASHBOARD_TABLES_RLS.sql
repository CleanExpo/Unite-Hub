-- =====================================================
-- FIX DASHBOARD TABLES RLS POLICIES
-- =====================================================
-- This fixes the "Error fetching stats" on dashboard overview
-- Adds RLS policies for contacts and campaigns tables

-- =====================================================
-- 1. CAMPAIGNS TABLE RLS
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view campaigns in their workspaces" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their workspaces" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their workspaces" ON campaigns;

-- Allow users to view campaigns in their workspaces
CREATE POLICY "Users can view campaigns in their workspaces"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Allow users to create campaigns
CREATE POLICY "Users can create campaigns in their workspaces"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Allow users to update campaigns
CREATE POLICY "Users can update campaigns in their workspaces"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. CONTACTS TABLE RLS (Update)
-- =====================================================

-- Drop and recreate to ensure consistency
DROP POLICY IF EXISTS "Users can view contacts in their workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts in their workspaces" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their workspaces" ON contacts;

-- Allow users to view contacts
CREATE POLICY "Users can view contacts in their workspaces"
  ON contacts FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Allow users to create contacts
CREATE POLICY "Users can create contacts in their workspaces"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Allow users to update contacts
CREATE POLICY "Users can update contacts in their workspaces"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. WORKSPACES TABLE RLS (Update)
-- =====================================================

DROP POLICY IF EXISTS "Users can view workspaces in their org" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces in their org" ON workspaces;

-- Allow users to view workspaces
CREATE POLICY "Users can view workspaces in their org"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to create workspaces
CREATE POLICY "Users can create workspaces in their org"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. CREATE DEFAULT WORKSPACE FOR USER
-- =====================================================

-- Create a default workspace if user doesn't have one
DO $$
DECLARE
  user_org_id VARCHAR;
  workspace_count INTEGER;
  new_workspace_id UUID;
BEGIN
  -- Get user's organization
  SELECT org_id INTO user_org_id
  FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
  LIMIT 1;

  IF user_org_id IS NOT NULL THEN
    -- Check if user has any workspaces
    SELECT COUNT(*) INTO workspace_count
    FROM workspaces
    WHERE org_id = user_org_id;

    IF workspace_count = 0 THEN
      RAISE NOTICE 'Creating default workspace...';

      -- Create default workspace
      INSERT INTO workspaces (org_id, name, description)
      VALUES (
        user_org_id,
        'Default Workspace',
        'Your main workspace for contacts and campaigns'
      )
      RETURNING id INTO new_workspace_id;

      RAISE NOTICE 'Workspace created: %', new_workspace_id;
    ELSE
      RAISE NOTICE 'User already has % workspace(s)', workspace_count;
    END IF;
  ELSE
    RAISE NOTICE 'User not linked to any organization - run FIX_RLS_POLICIES.sql first';
  END IF;
END $$;

-- =====================================================
-- 5. VERIFY SETUP
-- =====================================================

-- Show user's organizations and workspaces
SELECT
  'Organization' as type,
  o.id,
  o.name,
  uo.role
FROM user_organizations uo
JOIN organizations o ON o.id = uo.org_id
WHERE uo.user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'

UNION ALL

SELECT
  'Workspace' as type,
  w.id::TEXT,
  w.name,
  NULL as role
FROM workspaces w
WHERE w.org_id IN (
  SELECT org_id FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
);

-- =====================================================
-- DONE!
-- =====================================================
-- Dashboard stats should now load without errors
-- Refresh: http://localhost:3008/dashboard/overview
