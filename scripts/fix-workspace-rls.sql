-- =====================================================
-- FIX WORKSPACE RLS POLICY
-- =====================================================
-- The workspace exists but RLS is blocking access
-- This adds a policy to allow users to see their org's workspace
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view workspaces in their organizations" ON workspaces;
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON workspaces;

-- Create permissive policy for workspace viewing
CREATE POLICY "Users can view workspaces in their organizations"
ON workspaces
FOR SELECT
USING (
  -- User can see workspaces in organizations they belong to
  org_id IN (
    SELECT org_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Also allow service role to manage workspaces
DROP POLICY IF EXISTS "Service role can manage workspaces" ON workspaces;
CREATE POLICY "Service role can manage workspaces"
ON workspaces
FOR ALL
USING (true);

-- Verify the workspace exists
SELECT
  id,
  name,
  org_id,
  created_at
FROM workspaces
WHERE org_id = 'adedf006-ca69-47d4-adbf-fc91bd7f225d';

-- Expected output: One row showing your workspace
-- If empty: Run the create workspace command below

-- If workspace doesn't exist, create it:
-- INSERT INTO workspaces (name, org_id, created_by)
-- VALUES ('Default Workspace', 'adedf006-ca69-47d4-adbf-fc91bd7f225d', '0082768b-c40a-4c4e-8150-84a3dd406cbc')
-- RETURNING *;
