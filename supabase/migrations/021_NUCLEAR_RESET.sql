-- =====================================================
-- MIGRATION 021 NUCLEAR RESET: Clean slate approach
-- =====================================================
-- This assumes migration 019 V3 successfully converted all org_id to UUID
-- All columns are now UUID type, so NO casting needed

-- =====================================================
-- STEP 1: DISABLE RLS ON ALL TABLES
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
-- STEP 2: DROP ALL EXISTING POLICIES (CASCADE)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations CASCADE;
DROP POLICY IF EXISTS "Service role can create organizations" ON organizations CASCADE;
DROP POLICY IF EXISTS "Org owners and admins can update organization" ON organizations CASCADE;
DROP POLICY IF EXISTS "Org owners can delete organization" ON organizations CASCADE;

DROP POLICY IF EXISTS "Users can view workspaces in their orgs" ON workspaces CASCADE;
DROP POLICY IF EXISTS "Org members can create workspaces" ON workspaces CASCADE;
DROP POLICY IF EXISTS "Org admins can update workspaces" ON workspaces CASCADE;
DROP POLICY IF EXISTS "Org owners can delete workspaces" ON workspaces CASCADE;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Service role can create profiles" ON user_profiles CASCADE;

DROP POLICY IF EXISTS "Users can view their org memberships" ON user_organizations CASCADE;
DROP POLICY IF EXISTS "Service role can create memberships" ON user_organizations CASCADE;
DROP POLICY IF EXISTS "Org owners can update memberships" ON user_organizations CASCADE;
DROP POLICY IF EXISTS "Org owners can delete memberships" ON user_organizations CASCADE;

DROP POLICY IF EXISTS "contacts_workspace_select" ON contacts CASCADE;
DROP POLICY IF EXISTS "contacts_workspace_insert" ON contacts CASCADE;
DROP POLICY IF EXISTS "contacts_workspace_update" ON contacts CASCADE;
DROP POLICY IF EXISTS "contacts_workspace_delete" ON contacts CASCADE;

DROP POLICY IF EXISTS "emails_workspace_select" ON emails CASCADE;
DROP POLICY IF EXISTS "emails_workspace_insert" ON emails CASCADE;
DROP POLICY IF EXISTS "emails_workspace_update" ON emails CASCADE;
DROP POLICY IF EXISTS "emails_workspace_delete" ON emails CASCADE;

DROP POLICY IF EXISTS "campaigns_workspace_select" ON campaigns CASCADE;
DROP POLICY IF EXISTS "campaigns_workspace_insert" ON campaigns CASCADE;
DROP POLICY IF EXISTS "campaigns_workspace_update" ON campaigns CASCADE;
DROP POLICY IF EXISTS "campaigns_workspace_delete" ON campaigns CASCADE;

DROP POLICY IF EXISTS "drip_campaigns_workspace_select" ON drip_campaigns CASCADE;
DROP POLICY IF EXISTS "drip_campaigns_workspace_insert" ON drip_campaigns CASCADE;
DROP POLICY IF EXISTS "drip_campaigns_workspace_update" ON drip_campaigns CASCADE;
DROP POLICY IF EXISTS "drip_campaigns_workspace_delete" ON drip_campaigns CASCADE;

DROP POLICY IF EXISTS "subscriptions_org_select" ON subscriptions CASCADE;
DROP POLICY IF EXISTS "subscriptions_org_insert" ON subscriptions CASCADE;
DROP POLICY IF EXISTS "subscriptions_org_update" ON subscriptions CASCADE;
DROP POLICY IF EXISTS "subscriptions_org_delete" ON subscriptions CASCADE;

-- =====================================================
-- STEP 3: DROP ALL EXISTING FUNCTIONS (CASCADE)
-- =====================================================
DROP FUNCTION IF EXISTS get_user_workspaces() CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org_text(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org_simple(TEXT, TEXT) CASCADE;

-- =====================================================
-- STEP 4: CREATE HELPER FUNCTIONS (UUID-native, NO CASTING)
-- =====================================================

-- Returns workspace IDs user has access to
CREATE FUNCTION get_user_workspaces()
RETURNS SETOF TEXT AS $$
BEGIN
  RETURN QUERY
  SELECT w.id
  FROM workspaces w
  INNER JOIN user_organizations uo ON uo.org_id = w.org_id  -- No casting!
  WHERE uo.user_id = auth.uid() AND uo.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Role hierarchy check
CREATE FUNCTION user_has_role_in_org_simple(
  p_org_id UUID,  -- UUID parameter, not TEXT
  p_required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_role_hierarchy TEXT[] := ARRAY['viewer', 'member', 'admin', 'owner'];
  v_user_level INT;
  v_required_level INT;
BEGIN
  SELECT role INTO v_user_role
  FROM user_organizations
  WHERE user_id = auth.uid()
    AND org_id = p_org_id  -- No casting!
    AND is_active = true;

  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  v_user_level := array_position(v_role_hierarchy, v_user_role);
  v_required_level := array_position(v_role_hierarchy, p_required_role);

  RETURN v_user_level >= v_required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 5: CREATE POLICIES (UUID-native, NO CASTING)
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
-- STEP 6: RE-ENABLE RLS ON ALL TABLES
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
-- STEP 7: VERIFICATION
-- =====================================================
DO $$
DECLARE
  rls_enabled_count INT;
  function_count INT;
  policy_count INT;
BEGIN
  -- Count RLS-enabled tables
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
    );

  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_workspaces', 'user_has_role_in_org_simple');

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
    );

  RAISE NOTICE '==================================';
  RAISE NOTICE '=== MIGRATION 021 RESULTS ===';
  RAISE NOTICE 'RLS Enabled: % / 9 tables', rls_enabled_count;
  RAISE NOTICE 'Functions Created: % / 2', function_count;
  RAISE NOTICE 'Policies Created: %', policy_count;

  IF rls_enabled_count = 9 AND function_count = 2 AND policy_count >= 36 THEN
    RAISE NOTICE '✅ SUCCESS: Database is now SECURE';
  ELSE
    RAISE WARNING '⚠️ INCOMPLETE: Check the counts above';
  END IF;
  RAISE NOTICE '==================================';
END $$;
