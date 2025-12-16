-- =====================================================
-- MIGRATION 020 V5: Implement REAL Row Level Security Policies
-- =====================================================
-- Date: 2025-01-17
-- Purpose: Restore RLS after migration 019 V3
-- HANDLES ALL TYPE SCENARIOS: Works if workspaces.org_id is UUID OR TEXT
-- CRITICAL FIX: Avoids user_has_role_in_org() when org_id is TEXT

-- =====================================================
-- DIAGNOSTIC: Check ALL relevant types
-- =====================================================
DO $$
DECLARE
  org_id_type TEXT;
  workspace_id_type TEXT;
  workspace_org_id_type TEXT;
  user_org_org_id_type TEXT;
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

  RAISE NOTICE '====================================';
  RAISE NOTICE '=== DATABASE TYPE ANALYSIS ===';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'organizations.id: %', COALESCE(org_id_type, 'NOT FOUND');
  RAISE NOTICE 'workspaces.id: %', COALESCE(workspace_id_type, 'NOT FOUND');
  RAISE NOTICE 'workspaces.org_id: %', COALESCE(workspace_org_id_type, 'NOT FOUND');
  RAISE NOTICE 'user_organizations.org_id: %', COALESCE(user_org_org_id_type, 'NOT FOUND');
  RAISE NOTICE '====================================';
END $$;

-- =====================================================
-- HELPER FUNCTION: Get User's Authorized Workspaces
-- =====================================================
-- Dynamically handles UUID or TEXT workspace IDs
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS SETOF TEXT AS $$
DECLARE
  workspace_org_id_is_uuid BOOLEAN;
BEGIN
  -- Check if workspaces.org_id is UUID or TEXT
  SELECT data_type = 'uuid' INTO workspace_org_id_is_uuid
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'org_id';

  IF workspace_org_id_is_uuid THEN
    -- Both are UUID - direct join
    RETURN QUERY
    SELECT w.id
    FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id::uuid
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true;
  ELSE
    -- workspaces.org_id is TEXT - cast user_organizations.org_id to TEXT
    RETURN QUERY
    SELECT w.id
    FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id::text = w.org_id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true;
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
-- This version accepts TEXT org_id for when workspaces.org_id is TEXT
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
  -- Try to match by casting user_organizations.org_id to text
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
  USING (user_has_role_in_org(id, 'admin'));

CREATE POLICY "Org owners can delete organization"
  ON organizations FOR DELETE
  USING (user_has_role_in_org(id, 'owner'));

-- =====================================================
-- WORKSPACES TABLE
-- =====================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspaces in their orgs" ON workspaces;
DROP POLICY IF EXISTS "Org members can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org owners can delete workspaces" ON workspaces;

-- Check if workspaces.org_id is UUID or TEXT and create appropriate policies
DO $$
DECLARE
  workspace_org_id_type TEXT;
BEGIN
  SELECT data_type INTO workspace_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'org_id';

  IF workspace_org_id_type = 'uuid' THEN
    -- workspaces.org_id is UUID - use UUID version of function
    EXECUTE '
    CREATE POLICY "Users can view workspaces in their orgs"
      ON workspaces FOR SELECT
      USING (
        org_id IN (
          SELECT org_id FROM user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE '
    CREATE POLICY "Org members can create workspaces"
      ON workspaces FOR INSERT
      WITH CHECK (
        org_id IN (
          SELECT org_id FROM user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE '
    CREATE POLICY "Org admins can update workspaces"
      ON workspaces FOR UPDATE
      USING (user_has_role_in_org(org_id, ''admin''))';

    EXECUTE '
    CREATE POLICY "Org owners can delete workspaces"
      ON workspaces FOR DELETE
      USING (user_has_role_in_org(org_id, ''owner''))';

    RAISE NOTICE 'Created workspace policies (UUID mode)';
  ELSE
    -- workspaces.org_id is TEXT - use TEXT version of function
    EXECUTE '
    CREATE POLICY "Users can view workspaces in their orgs"
      ON workspaces FOR SELECT
      USING (
        org_id IN (
          SELECT org_id::text FROM user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE '
    CREATE POLICY "Org members can create workspaces"
      ON workspaces FOR INSERT
      WITH CHECK (
        org_id IN (
          SELECT org_id::text FROM user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE '
    CREATE POLICY "Org admins can update workspaces"
      ON workspaces FOR UPDATE
      USING (user_has_role_in_org_text(org_id, ''admin''))';

    EXECUTE '
    CREATE POLICY "Org owners can delete workspaces"
      ON workspaces FOR DELETE
      USING (user_has_role_in_org_text(org_id, ''owner''))';

    RAISE NOTICE 'Created workspace policies (TEXT mode with TEXT function)';
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

-- CONTACTS
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

-- EMAILS
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

-- CAMPAIGNS
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

-- DRIP_CAMPAIGNS
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
-- ORGANIZATION-SCOPED TABLES
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
  USING (user_has_role_in_org(org_id, 'admin'));

CREATE POLICY "subscriptions_org_delete"
  ON subscriptions FOR DELETE
  USING (user_has_role_in_org(org_id, 'owner'));

-- generatedContent
ALTER TABLE "generatedContent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generatedContent_org_select" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_insert" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_update" ON "generatedContent";
DROP POLICY IF EXISTS "generatedContent_org_delete" ON "generatedContent";

CREATE POLICY "generatedContent_org_select"
  ON "generatedContent" FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "generatedContent_org_insert"
  ON "generatedContent" FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "generatedContent_org_update"
  ON "generatedContent" FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "generatedContent_org_delete"
  ON "generatedContent" FOR DELETE
  USING (user_has_role_in_org(org_id, 'admin'));

-- auditLogs
ALTER TABLE "auditLogs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditLogs_org_select" ON "auditLogs";
DROP POLICY IF EXISTS "auditLogs_org_insert" ON "auditLogs";

CREATE POLICY "auditLogs_org_select"
  ON "auditLogs" FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
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
COMMENT ON FUNCTION user_has_role_in_org(UUID, TEXT) IS 'Role hierarchy check for organizations (UUID version)';
COMMENT ON FUNCTION user_has_role_in_org_text(TEXT, TEXT) IS 'Role hierarchy check for organizations (TEXT version)';
