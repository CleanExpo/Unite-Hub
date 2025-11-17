-- =====================================================
-- MIGRATION 022 FORCE CLEAN: Most aggressive approach
-- =====================================================
-- Forces PostgreSQL to clear all cached objects

-- =====================================================
-- STEP 1: TERMINATE ALL CONNECTIONS (except current)
-- =====================================================
-- This forces PostgreSQL to clear query plan cache
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
  AND usename <> 'supabase_admin';

-- =====================================================
-- STEP 2: DISABLE RLS
-- =====================================================
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drip_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: DROP ALL FUNCTIONS (including hidden ones)
-- =====================================================
DO $$
DECLARE
  func_name TEXT;
BEGIN
  FOR func_name IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND (
        p.proname LIKE '%workspace%'
        OR p.proname LIKE '%org%'
        OR p.proname LIKE '%role%'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_name || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', func_name;
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: DROP ALL POLICIES
-- =====================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE',
      pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Dropped policy: %.%.%', pol.schemaname, pol.tablename, pol.policyname;
  END LOOP;
END $$;

-- =====================================================
-- STEP 5: RESET QUERY PLAN CACHE
-- =====================================================
-- Force PostgreSQL to recompile all queries
DISCARD PLANS;

-- =====================================================
-- STEP 6: CREATE FUNCTIONS (UUID-native)
-- =====================================================

-- Function 1: Get user workspaces
CREATE OR REPLACE FUNCTION get_user_workspaces()
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
    ON uo.org_id = w.org_id  -- UUID = UUID (no casting)
  WHERE uo.user_id = auth.uid()
    AND uo.is_active = true;
END;
$$;

-- Function 2: Role hierarchy check
CREATE OR REPLACE FUNCTION user_has_role_in_org_simple(
  p_org_id UUID,  -- UUID parameter
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
    AND org_id = p_org_id  -- UUID = UUID (no casting)
    AND is_active = true;

  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Role hierarchy check
  RETURN CASE p_required_role
    WHEN 'viewer' THEN v_user_role IN ('viewer', 'member', 'admin', 'owner')
    WHEN 'member' THEN v_user_role IN ('member', 'admin', 'owner')
    WHEN 'admin' THEN v_user_role IN ('admin', 'owner')
    WHEN 'owner' THEN v_user_role = 'owner'
    ELSE false
  END;
END;
$$;

-- Verify functions created
DO $$
DECLARE
  func_count INT;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_workspaces', 'user_has_role_in_org_simple');

  IF func_count = 2 THEN
    RAISE NOTICE '✅ Functions created successfully';
  ELSE
    RAISE WARNING '❌ Expected 2 functions, found %', func_count;
  END IF;
END $$;

-- =====================================================
-- STEP 7: CREATE POLICIES (UUID-native)
-- =====================================================

-- ORGANIZATIONS
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Service role can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Org owners and admins can update organization"
  ON organizations FOR UPDATE
  USING (user_has_role_in_org_simple(id, 'admin'));

CREATE POLICY "Org owners can delete organization"
  ON organizations FOR DELETE
  USING (user_has_role_in_org_simple(id, 'owner'));

-- WORKSPACES
CREATE POLICY "Users can view workspaces in their orgs"
  ON workspaces FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Org members can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Org admins can update workspaces"
  ON workspaces FOR UPDATE
  USING (user_has_role_in_org_simple(org_id, 'admin'));

CREATE POLICY "Org owners can delete workspaces"
  ON workspaces FOR DELETE
  USING (user_has_role_in_org_simple(org_id, 'owner'));

-- USER_PROFILES
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Service role can create profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- USER_ORGANIZATIONS
CREATE POLICY "Users can view their org memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can create memberships"
  ON user_organizations FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Org owners can update memberships"
  ON user_organizations FOR UPDATE
  USING (user_has_role_in_org_simple(org_id, 'owner'));

CREATE POLICY "Org owners can delete memberships"
  ON user_organizations FOR DELETE
  USING (user_has_role_in_org_simple(org_id, 'owner'));

-- CONTACTS
CREATE POLICY "contacts_workspace_select"
  ON contacts FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "contacts_workspace_insert"
  ON contacts FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "contacts_workspace_update"
  ON contacts FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "contacts_workspace_delete"
  ON contacts FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- EMAILS
CREATE POLICY "emails_workspace_select"
  ON emails FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "emails_workspace_insert"
  ON emails FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "emails_workspace_update"
  ON emails FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "emails_workspace_delete"
  ON emails FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- CAMPAIGNS
CREATE POLICY "campaigns_workspace_select"
  ON campaigns FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "campaigns_workspace_insert"
  ON campaigns FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "campaigns_workspace_update"
  ON campaigns FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "campaigns_workspace_delete"
  ON campaigns FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- DRIP_CAMPAIGNS
CREATE POLICY "drip_campaigns_workspace_select"
  ON drip_campaigns FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "drip_campaigns_workspace_insert"
  ON drip_campaigns FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "drip_campaigns_workspace_update"
  ON drip_campaigns FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "drip_campaigns_workspace_delete"
  ON drip_campaigns FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- SUBSCRIPTIONS
CREATE POLICY "subscriptions_org_select"
  ON subscriptions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "subscriptions_org_insert"
  ON subscriptions FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "subscriptions_org_update"
  ON subscriptions FOR UPDATE
  USING (user_has_role_in_org_simple(org_id, 'admin'));

CREATE POLICY "subscriptions_org_delete"
  ON subscriptions FOR DELETE
  USING (user_has_role_in_org_simple(org_id, 'owner'));

-- =====================================================
-- STEP 8: RE-ENABLE RLS
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 9: FINAL VERIFICATION
-- =====================================================
DO $$
DECLARE
  rls_count INT;
  func_count INT;
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
    );

  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_workspaces', 'user_has_role_in_org_simple');

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
    );

  RAISE NOTICE '========================================';
  RAISE NOTICE '=== MIGRATION 022 RESULTS ===';
  RAISE NOTICE 'Tables with RLS: % / 9', rls_count;
  RAISE NOTICE 'Functions created: % / 2', func_count;
  RAISE NOTICE 'Policies created: %', policy_count;

  IF rls_count = 9 AND func_count = 2 AND policy_count >= 36 THEN
    RAISE NOTICE '✅ SUCCESS: Database is SECURE';
  ELSE
    RAISE WARNING '⚠️ INCOMPLETE MIGRATION';
  END IF;
  RAISE NOTICE '========================================';
END $$;
