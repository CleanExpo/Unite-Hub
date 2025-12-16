-- Migration 314b: Workspace-Scoped RLS Policies
-- Purpose: Apply workspace membership RLS policies
-- Generated: 2025-11-29
-- PREREQUISITE: Run 314a_rls_helper_functions.sql FIRST
--
-- DEADLOCK PREVENTION: Each table is processed in a separate transaction
-- If deadlock occurs, wait a few seconds and retry just the failing section

-- ============================================
-- CONTACTS TABLE
-- ============================================
DO $$
BEGIN
  -- Drop old policies
  DROP POLICY IF EXISTS "Users can view contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can insert contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can update contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can delete contacts" ON contacts;
  DROP POLICY IF EXISTS "contacts_select_policy" ON contacts;
  DROP POLICY IF EXISTS "contacts_insert_policy" ON contacts;
  DROP POLICY IF EXISTS "contacts_update_policy" ON contacts;
  DROP POLICY IF EXISTS "contacts_delete_policy" ON contacts;
  DROP POLICY IF EXISTS "contacts_workspace_select" ON contacts;
  DROP POLICY IF EXISTS "contacts_workspace_insert" ON contacts;
  DROP POLICY IF EXISTS "contacts_workspace_update" ON contacts;
  DROP POLICY IF EXISTS "contacts_workspace_delete" ON contacts;

  -- Create new policies
  CREATE POLICY "contacts_workspace_select" ON contacts
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "contacts_workspace_insert" ON contacts
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "contacts_workspace_update" ON contacts
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "contacts_workspace_delete" ON contacts
    FOR DELETE USING (public.is_workspace_admin(workspace_id));

  RAISE NOTICE 'Contacts policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Contacts policies error: %', SQLERRM;
END $$;

-- ============================================
-- EMAILS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view emails" ON emails;
  DROP POLICY IF EXISTS "Users can insert emails" ON emails;
  DROP POLICY IF EXISTS "Users can update emails" ON emails;
  DROP POLICY IF EXISTS "emails_select_policy" ON emails;
  DROP POLICY IF EXISTS "emails_insert_policy" ON emails;
  DROP POLICY IF EXISTS "emails_update_policy" ON emails;
  DROP POLICY IF EXISTS "emails_workspace_select" ON emails;
  DROP POLICY IF EXISTS "emails_workspace_insert" ON emails;
  DROP POLICY IF EXISTS "emails_workspace_update" ON emails;

  CREATE POLICY "emails_workspace_select" ON emails
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "emails_workspace_insert" ON emails
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "emails_workspace_update" ON emails
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

  RAISE NOTICE 'Emails policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Emails policies error: %', SQLERRM;
END $$;

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Users can insert campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Users can update campaigns" ON campaigns;
  DROP POLICY IF EXISTS "campaigns_select_policy" ON campaigns;
  DROP POLICY IF EXISTS "campaigns_insert_policy" ON campaigns;
  DROP POLICY IF EXISTS "campaigns_update_policy" ON campaigns;
  DROP POLICY IF EXISTS "campaigns_workspace_select" ON campaigns;
  DROP POLICY IF EXISTS "campaigns_workspace_insert" ON campaigns;
  DROP POLICY IF EXISTS "campaigns_workspace_update" ON campaigns;
  DROP POLICY IF EXISTS "campaigns_workspace_delete" ON campaigns;

  CREATE POLICY "campaigns_workspace_select" ON campaigns
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "campaigns_workspace_insert" ON campaigns
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "campaigns_workspace_update" ON campaigns
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "campaigns_workspace_delete" ON campaigns
    FOR DELETE USING (public.is_workspace_admin(workspace_id));

  RAISE NOTICE 'Campaigns policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Campaigns policies error: %', SQLERRM;
END $$;

-- ============================================
-- DRIP_CAMPAIGNS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view drip_campaigns" ON drip_campaigns;
  DROP POLICY IF EXISTS "Users can manage drip_campaigns" ON drip_campaigns;
  DROP POLICY IF EXISTS "drip_campaigns_select_policy" ON drip_campaigns;
  DROP POLICY IF EXISTS "drip_campaigns_workspace_select" ON drip_campaigns;
  DROP POLICY IF EXISTS "drip_campaigns_workspace_insert" ON drip_campaigns;
  DROP POLICY IF EXISTS "drip_campaigns_workspace_update" ON drip_campaigns;
  DROP POLICY IF EXISTS "drip_campaigns_workspace_delete" ON drip_campaigns;

  CREATE POLICY "drip_campaigns_workspace_select" ON drip_campaigns
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "drip_campaigns_workspace_insert" ON drip_campaigns
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "drip_campaigns_workspace_update" ON drip_campaigns
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "drip_campaigns_workspace_delete" ON drip_campaigns
    FOR DELETE USING (public.is_workspace_admin(workspace_id));

  RAISE NOTICE 'Drip campaigns policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Drip campaigns policies error: %', SQLERRM;
END $$;

-- ============================================
-- GENERATED_CONTENT TABLE (snake_case!)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view generated_content" ON generated_content;
  DROP POLICY IF EXISTS "generated_content_select_policy" ON generated_content;
  DROP POLICY IF EXISTS "generated_content_workspace_select" ON generated_content;
  DROP POLICY IF EXISTS "generated_content_workspace_insert" ON generated_content;
  DROP POLICY IF EXISTS "generated_content_workspace_update" ON generated_content;

  CREATE POLICY "generated_content_workspace_select" ON generated_content
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "generated_content_workspace_insert" ON generated_content
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "generated_content_workspace_update" ON generated_content
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

  RAISE NOTICE 'Generated content policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Generated content policies error: %', SQLERRM;
END $$;

-- ============================================
-- INTEGRATIONS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can access integrations" ON integrations;
  DROP POLICY IF EXISTS "integrations_select_policy" ON integrations;
  DROP POLICY IF EXISTS "integrations_workspace_select" ON integrations;
  DROP POLICY IF EXISTS "integrations_workspace_insert" ON integrations;
  DROP POLICY IF EXISTS "integrations_workspace_update" ON integrations;
  DROP POLICY IF EXISTS "integrations_workspace_delete" ON integrations;

  CREATE POLICY "integrations_workspace_select" ON integrations
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "integrations_workspace_insert" ON integrations
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "integrations_workspace_update" ON integrations
    FOR UPDATE USING (public.is_workspace_admin(workspace_id));

  CREATE POLICY "integrations_workspace_delete" ON integrations
    FOR DELETE USING (public.is_workspace_admin(workspace_id));

  RAISE NOTICE 'Integrations policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Integrations policies error: %', SQLERRM;
END $$;

-- ============================================
-- LEADS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can access leads" ON leads;
  DROP POLICY IF EXISTS "leads_select_policy" ON leads;
  DROP POLICY IF EXISTS "leads_workspace_select" ON leads;
  DROP POLICY IF EXISTS "leads_workspace_insert" ON leads;
  DROP POLICY IF EXISTS "leads_workspace_update" ON leads;
  DROP POLICY IF EXISTS "leads_workspace_delete" ON leads;

  CREATE POLICY "leads_workspace_select" ON leads
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "leads_workspace_insert" ON leads
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "leads_workspace_update" ON leads
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "leads_workspace_delete" ON leads
    FOR DELETE USING (public.is_workspace_admin(workspace_id));

  RAISE NOTICE 'Leads policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Leads policies error: %', SQLERRM;
END $$;

-- ============================================
-- CLIENTS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can access clients" ON clients;
  DROP POLICY IF EXISTS "clients_select_policy" ON clients;
  DROP POLICY IF EXISTS "clients_workspace_select" ON clients;
  DROP POLICY IF EXISTS "clients_workspace_insert" ON clients;
  DROP POLICY IF EXISTS "clients_workspace_update" ON clients;
  DROP POLICY IF EXISTS "clients_workspace_delete" ON clients;

  CREATE POLICY "clients_workspace_select" ON clients
    FOR SELECT USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "clients_workspace_insert" ON clients
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

  CREATE POLICY "clients_workspace_update" ON clients
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

  CREATE POLICY "clients_workspace_delete" ON clients
    FOR DELETE USING (public.is_workspace_admin(workspace_id));

  RAISE NOTICE 'Clients policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Clients policies error: %', SQLERRM;
END $$;

-- ============================================
-- CLIENT_ACTIONS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can access client_actions" ON client_actions;
  DROP POLICY IF EXISTS "client_actions_select_policy" ON client_actions;
  DROP POLICY IF EXISTS "client_actions_workspace_select" ON client_actions;
  DROP POLICY IF EXISTS "client_actions_workspace_insert" ON client_actions;

  CREATE POLICY "client_actions_workspace_select" ON client_actions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM clients c
        WHERE c.id = client_actions.client_id
        AND public.is_workspace_member(c.workspace_id)
      )
    );

  CREATE POLICY "client_actions_workspace_insert" ON client_actions
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM clients c
        WHERE c.id = client_actions.client_id
        AND public.is_workspace_member(c.workspace_id)
      )
    );

  RAISE NOTICE 'Client actions policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Client actions policies error: %', SQLERRM;
END $$;

-- ============================================
-- ADMIN_APPROVALS TABLE (FOUNDER/ADMIN only)
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view approvals" ON admin_approvals;
  DROP POLICY IF EXISTS "admin_approvals_select_policy" ON admin_approvals;
  DROP POLICY IF EXISTS "admin_approvals_admin_select" ON admin_approvals;
  DROP POLICY IF EXISTS "admin_approvals_admin_manage" ON admin_approvals;

  CREATE POLICY "admin_approvals_admin_select" ON admin_approvals
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    );

  CREATE POLICY "admin_approvals_admin_manage" ON admin_approvals
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    );

  RAISE NOTICE 'Admin approvals policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Admin approvals policies error: %', SQLERRM;
END $$;

-- ============================================
-- ADMIN_TRUSTED_DEVICES TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view trusted_devices" ON admin_trusted_devices;
  DROP POLICY IF EXISTS "admin_trusted_devices_select_policy" ON admin_trusted_devices;
  DROP POLICY IF EXISTS "admin_trusted_devices_admin_select" ON admin_trusted_devices;

  CREATE POLICY "admin_trusted_devices_admin_select" ON admin_trusted_devices
    FOR SELECT USING (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    );

  RAISE NOTICE 'Admin trusted devices policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Admin trusted devices policies error: %', SQLERRM;
END $$;

-- ============================================
-- USER_PROFILES TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_self_select" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_self_update" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;

  CREATE POLICY "user_profiles_self_select" ON user_profiles
    FOR SELECT USING (id = auth.uid());

  CREATE POLICY "user_profiles_self_update" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

  CREATE POLICY "user_profiles_admin_all" ON user_profiles
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    );

  RAISE NOTICE 'User profiles policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User profiles policies error: %', SQLERRM;
END $$;

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
  DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
  DROP POLICY IF EXISTS "organizations_member_select" ON organizations;
  DROP POLICY IF EXISTS "organizations_owner_manage" ON organizations;

  CREATE POLICY "organizations_member_select" ON organizations
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.org_id = organizations.id
        AND uo.user_id = auth.uid()
      )
    );

  CREATE POLICY "organizations_owner_manage" ON organizations
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.org_id = organizations.id
        AND uo.user_id = auth.uid()
        AND uo.role = 'owner'
      )
    );

  RAISE NOTICE 'Organizations policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Organizations policies error: %', SQLERRM;
END $$;

-- ============================================
-- USER_ORGANIZATIONS TABLE
-- ============================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own memberships" ON user_organizations;
  DROP POLICY IF EXISTS "user_organizations_select_policy" ON user_organizations;
  DROP POLICY IF EXISTS "user_organizations_self_select" ON user_organizations;
  DROP POLICY IF EXISTS "user_organizations_admin_manage" ON user_organizations;

  CREATE POLICY "user_organizations_self_select" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());

  CREATE POLICY "user_organizations_admin_manage" ON user_organizations
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.org_id = user_organizations.org_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('owner', 'admin')
      )
    );

  RAISE NOTICE 'User organizations policies applied successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User organizations policies error: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify policies were created:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE policyname LIKE '%workspace%' OR policyname LIKE '%admin%' ORDER BY tablename;
