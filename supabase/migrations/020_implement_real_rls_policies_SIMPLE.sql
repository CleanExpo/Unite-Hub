-- =====================================================
-- MIGRATION 020 SIMPLE: Implement REAL Row Level Security Policies
-- =====================================================
-- Date: 2025-01-17
-- Purpose: Restore RLS after migration 019 V3
-- SIMPLE APPROACH: Cast EVERYTHING to TEXT to avoid ALL type mismatches

-- =====================================================
-- DIAGNOSTIC
-- =====================================================
DO $$
DECLARE
  org_id_type TEXT;
  workspace_org_id_type TEXT;
  user_org_org_id_type TEXT;
BEGIN
  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name = 'id';

  SELECT data_type INTO workspace_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'org_id';

  SELECT data_type INTO user_org_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'user_organizations' AND column_name = 'org_id';

  RAISE NOTICE '=== TYPE CHECK ===';
  RAISE NOTICE 'organizations.id: %', org_id_type;
  RAISE NOTICE 'workspaces.org_id: %', workspace_org_id_type;
  RAISE NOTICE 'user_organizations.org_id: %', user_org_org_id_type;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get user's workspaces (returns TEXT, casts everything to TEXT)
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS SETOF TEXT AS $$
BEGIN
  RETURN QUERY
  SELECT w.id
  FROM workspaces w
  INNER JOIN user_organizations uo ON uo.org_id::text = w.org_id::text
  WHERE uo.user_id = auth.uid()
    AND uo.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has role (accepts TEXT, casts to TEXT internally)
CREATE OR REPLACE FUNCTION user_has_role_in_org_simple(
  p_org_id TEXT,
  p_required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_role_hierarchy TEXT[] := ARRAY['viewer', 'member', 'admin', 'owner'];
  v_user_level INT;
  v_required_level INT;
BEGIN
  -- Cast everything to TEXT for comparison
  SELECT role INTO v_user_role
  FROM user_organizations
  WHERE user_id = auth.uid()
    AND org_id::text = p_org_id
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
-- ORGANIZATIONS TABLE
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Service role can create organizations" ON organizations;
DROP POLICY IF EXISTS "Org owners and admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Org owners can delete organization" ON organizations;

-- Cast EVERYTHING to TEXT
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Service role can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Org owners and admins can update organization"
  ON organizations FOR UPDATE
  USING (user_has_role_in_org_simple(id::text, 'admin'));

CREATE POLICY "Org owners can delete organization"
  ON organizations FOR DELETE
  USING (user_has_role_in_org_simple(id::text, 'owner'));

-- =====================================================
-- WORKSPACES TABLE
-- =====================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspaces in their orgs" ON workspaces;
DROP POLICY IF EXISTS "Org members can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org owners can delete workspaces" ON workspaces;

-- Cast EVERYTHING to TEXT
CREATE POLICY "Users can view workspaces in their orgs"
  ON workspaces FOR SELECT
  USING (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Org members can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Org admins can update workspaces"
  ON workspaces FOR UPDATE
  USING (user_has_role_in_org_simple(org_id::text, 'admin'));

CREATE POLICY "Org owners can delete workspaces"
  ON workspaces FOR DELETE
  USING (user_has_role_in_org_simple(org_id::text, 'owner'));

-- =====================================================
-- USER_PROFILES TABLE
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can create profiles" ON user_profiles;

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
-- USER_ORGANIZATIONS TABLE
-- =====================================================
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Service role can create memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can update memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can delete memberships" ON user_organizations;

CREATE POLICY "Users can view their org memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can create memberships"
  ON user_organizations FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Org owners can update memberships"
  ON user_organizations FOR UPDATE
  USING (user_has_role_in_org_simple(org_id::text, 'owner'));

CREATE POLICY "Org owners can delete memberships"
  ON user_organizations FOR DELETE
  USING (user_has_role_in_org_simple(org_id::text, 'owner'));

-- =====================================================
-- WORKSPACE-SCOPED TABLES
-- =====================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_workspace_select" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_update" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_delete" ON contacts;

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

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emails_workspace_select" ON emails;
DROP POLICY IF EXISTS "emails_workspace_insert" ON emails;
DROP POLICY IF EXISTS "emails_workspace_update" ON emails;
DROP POLICY IF EXISTS "emails_workspace_delete" ON emails;

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

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_workspace_select" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_insert" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_update" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_delete" ON campaigns;

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

ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drip_campaigns_workspace_select" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_insert" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_update" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_delete" ON drip_campaigns;

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
-- ORGANIZATION-SCOPED TABLES (ALL CAST TO TEXT)
-- =====================================================

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_org_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_delete" ON subscriptions;

CREATE POLICY "subscriptions_org_select"
  ON subscriptions FOR SELECT
  USING (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "subscriptions_org_insert"
  ON subscriptions FOR INSERT
  WITH CHECK (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "subscriptions_org_update"
  ON subscriptions FOR UPDATE
  USING (user_has_role_in_org_simple(org_id::text, 'admin'));

CREATE POLICY "subscriptions_org_delete"
  ON subscriptions FOR DELETE
  USING (user_has_role_in_org_simple(org_id::text, 'owner'));

-- GENERATED CONTENT
ALTER TABLE "generatedContent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generatedContent_org_select" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_insert" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_update" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_delete" ON "generatedContent";

CREATE POLICY "generatedContent_org_select"
  ON "generatedContent" FOR SELECT
  USING (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "generatedContent_org_insert"
  ON "generatedContent" FOR INSERT
  WITH CHECK (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "generatedContent_org_update"
  ON "generatedContent" FOR UPDATE
  USING (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "generatedContent_org_delete"
  ON "generatedContent" FOR DELETE
  USING (user_has_role_in_org_simple(org_id::text, 'admin'));

-- AUDIT LOGS
ALTER TABLE "auditLogs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditLogs_org_select" ON "auditLogs";
DROP POLICY IF EXISTS "auditLogs_org_insert" ON "auditLogs";

CREATE POLICY "auditLogs_org_select"
  ON "auditLogs" FOR SELECT
  USING (
    org_id::text IN (
      SELECT org_id::text FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "auditLogs_org_insert"
  ON "auditLogs" FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  rls_enabled_count INT;
BEGIN
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns',
      'subscriptions', 'generatedContent', 'auditLogs'
    );

  RAISE NOTICE '=== RLS VERIFICATION ===';
  RAISE NOTICE 'Tables with RLS: % / 11', rls_enabled_count;

  IF rls_enabled_count >= 10 THEN
    RAISE NOTICE '✅ SUCCESS: RLS policies restored';
  ELSE
    RAISE WARNING '⚠️ INCOMPLETE: Only % tables have RLS', rls_enabled_count;
  END IF;
END $$;

COMMENT ON FUNCTION get_user_workspaces() IS 'Returns TEXT workspace IDs - casts everything to TEXT';
COMMENT ON FUNCTION user_has_role_in_org_simple(TEXT, TEXT) IS 'Role check - accepts TEXT, casts internally';
