-- =====================================================
-- MIGRATION 025: Complete RLS for all 9 tables
-- =====================================================
-- Apply RLS policies to all core tables

-- =====================================================
-- WORKSPACES
-- =====================================================
DROP POLICY IF EXISTS "Users can view workspaces in their orgs" ON workspaces;
DROP POLICY IF EXISTS "Org members can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org owners can delete workspaces" ON workspaces;

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- USER_PROFILES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can create profiles" ON user_profiles;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Service role can create profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- USER_ORGANIZATIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Service role can create memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can update memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can delete memberships" ON user_organizations;

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- CONTACTS
-- =====================================================
DROP POLICY IF EXISTS "contacts_workspace_select" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_update" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_delete" ON contacts;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- EMAILS
-- =====================================================
DROP POLICY IF EXISTS "emails_workspace_select" ON emails;
DROP POLICY IF EXISTS "emails_workspace_insert" ON emails;
DROP POLICY IF EXISTS "emails_workspace_update" ON emails;
DROP POLICY IF EXISTS "emails_workspace_delete" ON emails;

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- CAMPAIGNS
-- =====================================================
DROP POLICY IF EXISTS "campaigns_workspace_select" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_insert" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_update" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_delete" ON campaigns;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- DRIP_CAMPAIGNS
-- =====================================================
DROP POLICY IF EXISTS "drip_campaigns_workspace_select" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_insert" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_update" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_delete" ON drip_campaigns;

ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================
DROP POLICY IF EXISTS "subscriptions_org_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_delete" ON subscriptions;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_org_select"
  ON subscriptions FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
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
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND user_has_role_in_org_simple(org_id, 'admin'));

CREATE POLICY "subscriptions_org_delete"
  ON subscriptions FOR DELETE
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND user_has_role_in_org_simple(org_id, 'owner'));

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
DO $$
DECLARE
  rls_count INT;
  policy_count INT;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
    );

  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions'
    );

  RAISE NOTICE '========================================';
  RAISE NOTICE '=== MIGRATION 025 COMPLETE ===';
  RAISE NOTICE 'Tables with RLS: % / 9', rls_count;
  RAISE NOTICE 'Total policies created: %', policy_count;
  RAISE NOTICE '';

  IF rls_count = 9 AND policy_count >= 36 THEN
    RAISE NOTICE '✅ ✅ ✅ SUCCESS ✅ ✅ ✅';
    RAISE NOTICE 'Database is now FULLY SECURED';
    RAISE NOTICE 'All 9 core tables have RLS enabled';
    RAISE NOTICE 'All % policies are active', policy_count;
  ELSE
    RAISE WARNING '⚠️ INCOMPLETE MIGRATION';
    RAISE WARNING 'Expected: 9 tables with RLS, ~36 policies';
    RAISE WARNING 'Found: % tables, % policies', rls_count, policy_count;
  END IF;
  RAISE NOTICE '========================================';
END $$;
