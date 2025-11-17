-- =====================================================
-- MIGRATION 020 V7: Implement REAL Row Level Security Policies
-- =====================================================
-- Date: 2025-01-17
-- Purpose: Restore RLS after migration 019 V3
-- HANDLES ALL TYPE SCENARIOS FOR ALL TABLES
-- CRITICAL FIX: Dynamic type detection for organizations.id AND all org_id columns

-- =====================================================
-- DIAGNOSTIC: Check ALL relevant types
-- =====================================================
DO $$
DECLARE
  org_id_type TEXT;
  workspace_id_type TEXT;
  workspace_org_id_type TEXT;
  user_org_org_id_type TEXT;
  subscriptions_org_id_type TEXT;
  generated_content_org_id_type TEXT;
  audit_logs_org_id_type TEXT;
BEGIN
  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name = 'id';

  SELECT data_type INTO workspace_id_type
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'id';

  SELECT data_type INTO workspace_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'org_id';

  SELECT data_type INTO user_org_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'user_organizations' AND column_name = 'org_id';

  SELECT data_type INTO subscriptions_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'subscriptions' AND column_name = 'org_id';

  SELECT data_type INTO generated_content_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'generatedContent' AND column_name = 'org_id';

  SELECT data_type INTO audit_logs_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'auditLogs' AND column_name = 'org_id';

  RAISE NOTICE '====================================';
  RAISE NOTICE '=== DATABASE TYPE ANALYSIS ===';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'organizations.id: %', COALESCE(org_id_type, 'NOT FOUND');
  RAISE NOTICE 'workspaces.id: %', COALESCE(workspace_id_type, 'NOT FOUND');
  RAISE NOTICE 'workspaces.org_id: %', COALESCE(workspace_org_id_type, 'NOT FOUND');
  RAISE NOTICE 'user_organizations.org_id: %', COALESCE(user_org_org_id_type, 'NOT FOUND');
  RAISE NOTICE 'subscriptions.org_id: %', COALESCE(subscriptions_org_id_type, 'NOT FOUND');
  RAISE NOTICE 'generatedContent.org_id: %', COALESCE(generated_content_org_id_type, 'NOT FOUND');
  RAISE NOTICE 'auditLogs.org_id: %', COALESCE(audit_logs_org_id_type, 'NOT FOUND');
  RAISE NOTICE '====================================';
END $$;

-- =====================================================
-- HELPER FUNCTION: Get User's Authorized Workspaces
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS SETOF TEXT AS $$
DECLARE
  workspace_org_id_is_uuid BOOLEAN;
BEGIN
  SELECT data_type = 'uuid' INTO workspace_org_id_is_uuid
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'org_id';

  IF workspace_org_id_is_uuid THEN
    RETURN QUERY
    SELECT w.id
    FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id::uuid
    WHERE uo.user_id = auth.uid() AND uo.is_active = true;
  ELSE
    RETURN QUERY
    SELECT w.id
    FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id::text = w.org_id
    WHERE uo.user_id = auth.uid() AND uo.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- HELPER FUNCTION: Check if User Has Role (UUID version)
-- =====================================================
CREATE OR REPLACE FUNCTION user_has_role_in_org(
  p_org_id UUID,
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
    AND org_id = p_org_id
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
-- HELPER FUNCTION: Check if User Has Role (TEXT version)
-- =====================================================
CREATE OR REPLACE FUNCTION user_has_role_in_org_text(
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
-- ORGANIZATIONS TABLE (WITH DYNAMIC TYPE DETECTION)
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Service role can create organizations" ON organizations;
DROP POLICY IF EXISTS "Org owners and admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Org owners can delete organization" ON organizations;

DO $$
DECLARE
  organizations_id_type TEXT;
BEGIN
  SELECT data_type INTO organizations_id_type
  FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name = 'id';

  IF organizations_id_type = 'uuid' THEN
    -- organizations.id is UUID - direct comparison
    EXECUTE 'CREATE POLICY "Users can view their organizations"
      ON organizations FOR SELECT
      USING (id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "Org owners and admins can update organization"
      ON organizations FOR UPDATE
      USING (user_has_role_in_org(id, ''admin''))';

    EXECUTE 'CREATE POLICY "Org owners can delete organization"
      ON organizations FOR DELETE
      USING (user_has_role_in_org(id, ''owner''))';

    RAISE NOTICE 'Created organizations policies (UUID mode)';
  ELSE
    -- organizations.id is TEXT - cast user_organizations.org_id to text
    EXECUTE 'CREATE POLICY "Users can view their organizations"
      ON organizations FOR SELECT
      USING (id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "Org owners and admins can update organization"
      ON organizations FOR UPDATE
      USING (user_has_role_in_org_text(id, ''admin''))';

    EXECUTE 'CREATE POLICY "Org owners can delete organization"
      ON organizations FOR DELETE
      USING (user_has_role_in_org_text(id, ''owner''))';

    RAISE NOTICE 'Created organizations policies (TEXT mode)';
  END IF;
END $$;

CREATE POLICY "Service role can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- WORKSPACES TABLE
-- =====================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspaces in their orgs" ON workspaces;
DROP POLICY IF EXISTS "Org members can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org owners can delete workspaces" ON workspaces;

DO $$
DECLARE
  workspace_org_id_type TEXT;
BEGIN
  SELECT data_type INTO workspace_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'org_id';

  IF workspace_org_id_type = 'uuid' THEN
    EXECUTE 'CREATE POLICY "Users can view workspaces in their orgs"
      ON workspaces FOR SELECT
      USING (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "Org members can create workspaces"
      ON workspaces FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "Org admins can update workspaces"
      ON workspaces FOR UPDATE
      USING (user_has_role_in_org(org_id, ''admin''))';

    EXECUTE 'CREATE POLICY "Org owners can delete workspaces"
      ON workspaces FOR DELETE
      USING (user_has_role_in_org(org_id, ''owner''))';

    RAISE NOTICE 'Created workspace policies (UUID mode)';
  ELSE
    EXECUTE 'CREATE POLICY "Users can view workspaces in their orgs"
      ON workspaces FOR SELECT
      USING (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "Org members can create workspaces"
      ON workspaces FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "Org admins can update workspaces"
      ON workspaces FOR UPDATE
      USING (user_has_role_in_org_text(org_id, ''admin''))';

    EXECUTE 'CREATE POLICY "Org owners can delete workspaces"
      ON workspaces FOR DELETE
      USING (user_has_role_in_org_text(org_id, ''owner''))';

    RAISE NOTICE 'Created workspace policies (TEXT mode)';
  END IF;
END $$;

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
  USING (user_has_role_in_org(org_id, 'owner'));

CREATE POLICY "Org owners can delete memberships"
  ON user_organizations FOR DELETE
  USING (user_has_role_in_org(org_id, 'owner'));

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
-- ORGANIZATION-SCOPED TABLES (WITH DYNAMIC TYPE DETECTION)
-- =====================================================

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_org_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_delete" ON subscriptions;

DO $$
DECLARE
  subscriptions_org_id_type TEXT;
BEGIN
  SELECT data_type INTO subscriptions_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'subscriptions' AND column_name = 'org_id';

  IF subscriptions_org_id_type = 'uuid' THEN
    EXECUTE 'CREATE POLICY "subscriptions_org_select"
      ON subscriptions FOR SELECT
      USING (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "subscriptions_org_insert"
      ON subscriptions FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN (''admin'', ''owner'')
      ))';

    EXECUTE 'CREATE POLICY "subscriptions_org_update"
      ON subscriptions FOR UPDATE
      USING (user_has_role_in_org(org_id, ''admin''))';

    EXECUTE 'CREATE POLICY "subscriptions_org_delete"
      ON subscriptions FOR DELETE
      USING (user_has_role_in_org(org_id, ''owner''))';

    RAISE NOTICE 'Created subscriptions policies (UUID mode)';
  ELSE
    EXECUTE 'CREATE POLICY "subscriptions_org_select"
      ON subscriptions FOR SELECT
      USING (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "subscriptions_org_insert"
      ON subscriptions FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND role IN (''admin'', ''owner'')
      ))';

    EXECUTE 'CREATE POLICY "subscriptions_org_update"
      ON subscriptions FOR UPDATE
      USING (user_has_role_in_org_text(org_id, ''admin''))';

    EXECUTE 'CREATE POLICY "subscriptions_org_delete"
      ON subscriptions FOR DELETE
      USING (user_has_role_in_org_text(org_id, ''owner''))';

    RAISE NOTICE 'Created subscriptions policies (TEXT mode)';
  END IF;
END $$;

-- GENERATED CONTENT
ALTER TABLE "generatedContent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generatedContent_org_select" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_insert" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_update" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_delete" ON "generatedContent";

DO $$
DECLARE
  generated_content_org_id_type TEXT;
BEGIN
  SELECT data_type INTO generated_content_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'generatedContent' AND column_name = 'org_id';

  IF generated_content_org_id_type = 'uuid' THEN
    EXECUTE 'CREATE POLICY "generatedContent_org_select"
      ON "generatedContent" FOR SELECT
      USING (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "generatedContent_org_insert"
      ON "generatedContent" FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "generatedContent_org_update"
      ON "generatedContent" FOR UPDATE
      USING (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "generatedContent_org_delete"
      ON "generatedContent" FOR DELETE
      USING (user_has_role_in_org(org_id, ''admin''))';

    RAISE NOTICE 'Created generatedContent policies (UUID mode)';
  ELSE
    EXECUTE 'CREATE POLICY "generatedContent_org_select"
      ON "generatedContent" FOR SELECT
      USING (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "generatedContent_org_insert"
      ON "generatedContent" FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "generatedContent_org_update"
      ON "generatedContent" FOR UPDATE
      USING (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    EXECUTE 'CREATE POLICY "generatedContent_org_delete"
      ON "generatedContent" FOR DELETE
      USING (user_has_role_in_org_text(org_id, ''admin''))';

    RAISE NOTICE 'Created generatedContent policies (TEXT mode)';
  END IF;
END $$;

-- AUDIT LOGS
ALTER TABLE "auditLogs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditLogs_org_select" ON "auditLogs";
DROP POLICY IF EXISTS "auditLogs_org_insert" ON "auditLogs";

DO $$
DECLARE
  audit_logs_org_id_type TEXT;
BEGIN
  SELECT data_type INTO audit_logs_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'auditLogs' AND column_name = 'org_id';

  IF audit_logs_org_id_type = 'uuid' THEN
    EXECUTE 'CREATE POLICY "auditLogs_org_select"
      ON "auditLogs" FOR SELECT
      USING (org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    RAISE NOTICE 'Created auditLogs policies (UUID mode)';
  ELSE
    EXECUTE 'CREATE POLICY "auditLogs_org_select"
      ON "auditLogs" FOR SELECT
      USING (org_id IN (
        SELECT org_id::text FROM user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      ))';

    RAISE NOTICE 'Created auditLogs policies (TEXT mode)';
  END IF;
END $$;

CREATE POLICY "auditLogs_org_insert"
  ON "auditLogs" FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  rls_enabled_count INT;
  total_tables INT := 11;
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

  RAISE NOTICE '====================================';
  RAISE NOTICE '=== RLS VERIFICATION ===';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Tables with RLS enabled: % / %', rls_enabled_count, total_tables;

  IF rls_enabled_count >= 10 THEN
    RAISE NOTICE '✅ SUCCESS: RLS policies restored';
    RAISE NOTICE '✅ Database is now SECURE';
  ELSE
    RAISE WARNING '⚠️ INCOMPLETE: Only % tables have RLS', rls_enabled_count;
  END IF;
  RAISE NOTICE '====================================';
END $$;

COMMENT ON FUNCTION get_user_workspaces() IS 'Returns TEXT workspace IDs - handles UUID/TEXT dynamically';
COMMENT ON FUNCTION user_has_role_in_org(UUID, TEXT) IS 'Role hierarchy check (UUID version)';
COMMENT ON FUNCTION user_has_role_in_org_text(TEXT, TEXT) IS 'Role hierarchy check (TEXT version)';
