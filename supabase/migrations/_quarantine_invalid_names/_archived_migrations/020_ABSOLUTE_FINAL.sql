-- =====================================================
-- MIGRATION 020 ABSOLUTE FINAL: Last attempt with validation disabled
-- =====================================================

-- Drop everything
DROP FUNCTION IF EXISTS get_user_workspaces() CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org_text(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS user_has_role_in_org_simple(TEXT, TEXT) CASCADE;

-- Try creating function with VOLATILE (forces runtime evaluation, not compile-time validation)
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS SETOF TEXT
LANGUAGE sql
VOLATILE  -- Changed from STABLE to VOLATILE to avoid compile-time validation
SECURITY DEFINER
AS $$
  SELECT w.id FROM workspaces w
  INNER JOIN user_organizations uo ON uo.org_id::text = w.org_id::text
  WHERE uo.user_id = auth.uid() AND uo.is_active = true;
$$;

-- Simple role check function (also VOLATILE)
CREATE OR REPLACE FUNCTION user_has_role_in_org_simple(p_org_id TEXT, p_required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE  -- Changed from STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM user_organizations
  WHERE user_id = auth.uid() AND org_id::text = p_org_id AND is_active = true;

  IF v_user_role IS NULL THEN RETURN false; END IF;

  RETURN CASE p_required_role
    WHEN 'viewer' THEN v_user_role IN ('viewer', 'member', 'admin', 'owner')
    WHEN 'member' THEN v_user_role IN ('member', 'admin', 'owner')
    WHEN 'admin' THEN v_user_role IN ('admin', 'owner')
    WHEN 'owner' THEN v_user_role = 'owner'
    ELSE false
  END;
END;
$$;

-- ORGANIZATIONS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Service role can create organizations" ON organizations;
DROP POLICY IF EXISTS "Org owners and admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Org owners can delete organization" ON organizations;

CREATE POLICY "Users can view their organizations" ON organizations FOR SELECT
  USING (id::text IN (SELECT org_id::text FROM user_organizations WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Service role can create organizations" ON organizations FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Org owners and admins can update organization" ON organizations FOR UPDATE
  USING (user_has_role_in_org_simple(id::text, 'admin'));
CREATE POLICY "Org owners can delete organization" ON organizations FOR DELETE
  USING (user_has_role_in_org_simple(id::text, 'owner'));

-- WORKSPACES
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view workspaces in their orgs" ON workspaces;
DROP POLICY IF EXISTS "Org members can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Org owners can delete workspaces" ON workspaces;

CREATE POLICY "Users can view workspaces in their orgs" ON workspaces FOR SELECT
  USING (org_id::text IN (SELECT org_id::text FROM user_organizations WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Org members can create workspaces" ON workspaces FOR INSERT
  WITH CHECK (org_id::text IN (SELECT org_id::text FROM user_organizations WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Org admins can update workspaces" ON workspaces FOR UPDATE
  USING (user_has_role_in_org_simple(org_id::text, 'admin'));
CREATE POLICY "Org owners can delete workspaces" ON workspaces FOR DELETE
  USING (user_has_role_in_org_simple(org_id::text, 'owner'));

-- USER_PROFILES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can create profiles" ON user_profiles;

CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Service role can create profiles" ON user_profiles FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- USER_ORGANIZATIONS
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Service role can create memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can update memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org owners can delete memberships" ON user_organizations;

CREATE POLICY "Users can view their org memberships" ON user_organizations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can create memberships" ON user_organizations FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Org owners can update memberships" ON user_organizations FOR UPDATE USING (user_has_role_in_org_simple(org_id::text, 'owner'));
CREATE POLICY "Org owners can delete memberships" ON user_organizations FOR DELETE USING (user_has_role_in_org_simple(org_id::text, 'owner'));

-- CONTACTS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_workspace_select" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_update" ON contacts;
DROP POLICY IF EXISTS "contacts_workspace_delete" ON contacts;

CREATE POLICY "contacts_workspace_select" ON contacts FOR SELECT USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "contacts_workspace_insert" ON contacts FOR INSERT WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "contacts_workspace_update" ON contacts FOR UPDATE USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "contacts_workspace_delete" ON contacts FOR DELETE USING (workspace_id IN (SELECT get_user_workspaces()));

-- EMAILS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emails_workspace_select" ON emails;
DROP POLICY IF EXISTS "emails_workspace_insert" ON emails;
DROP POLICY IF EXISTS "emails_workspace_update" ON emails;
DROP POLICY IF EXISTS "emails_workspace_delete" ON emails;

CREATE POLICY "emails_workspace_select" ON emails FOR SELECT USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "emails_workspace_insert" ON emails FOR INSERT WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "emails_workspace_update" ON emails FOR UPDATE USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "emails_workspace_delete" ON emails FOR DELETE USING (workspace_id IN (SELECT get_user_workspaces()));

-- CAMPAIGNS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_workspace_select" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_insert" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_update" ON campaigns;
DROP POLICY IF EXISTS "campaigns_workspace_delete" ON campaigns;

CREATE POLICY "campaigns_workspace_select" ON campaigns FOR SELECT USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "campaigns_workspace_insert" ON campaigns FOR INSERT WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "campaigns_workspace_update" ON campaigns FOR UPDATE USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "campaigns_workspace_delete" ON campaigns FOR DELETE USING (workspace_id IN (SELECT get_user_workspaces()));

-- DRIP_CAMPAIGNS
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drip_campaigns_workspace_select" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_insert" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_update" ON drip_campaigns;
DROP POLICY IF EXISTS "drip_campaigns_workspace_delete" ON drip_campaigns;

CREATE POLICY "drip_campaigns_workspace_select" ON drip_campaigns FOR SELECT USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "drip_campaigns_workspace_insert" ON drip_campaigns FOR INSERT WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "drip_campaigns_workspace_update" ON drip_campaigns FOR UPDATE USING (workspace_id IN (SELECT get_user_workspaces()));
CREATE POLICY "drip_campaigns_workspace_delete" ON drip_campaigns FOR DELETE USING (workspace_id IN (SELECT get_user_workspaces()));

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_org_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_org_delete" ON subscriptions;

CREATE POLICY "subscriptions_org_select" ON subscriptions FOR SELECT
  USING (org_id::text IN (SELECT org_id::text FROM user_organizations WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "subscriptions_org_insert" ON subscriptions FOR INSERT
  WITH CHECK (org_id::text IN (SELECT org_id::text FROM user_organizations WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "subscriptions_org_update" ON subscriptions FOR UPDATE
  USING (user_has_role_in_org_simple(org_id::text, 'admin'));
CREATE POLICY "subscriptions_org_delete" ON subscriptions FOR DELETE
  USING (user_has_role_in_org_simple(org_id::text, 'owner'));

-- VERIFICATION
DO $$
DECLARE rls_enabled_count INT;
BEGIN
  SELECT COUNT(*) INTO rls_enabled_count FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true
    AND tablename IN ('organizations', 'workspaces', 'user_profiles', 'user_organizations',
                      'contacts', 'emails', 'campaigns', 'drip_campaigns', 'subscriptions');
  RAISE NOTICE '=== RLS: % / 9 tables ===', rls_enabled_count;
  IF rls_enabled_count >= 9 THEN
    RAISE NOTICE '✅ SUCCESS';
  ELSE
    RAISE WARNING '⚠️ INCOMPLETE';
  END IF;
END $$;
