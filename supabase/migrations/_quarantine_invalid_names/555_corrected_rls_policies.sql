-- ============================================================================
-- Migration 555 (CORRECTED): Multi-Tenant RLS Policies
-- ============================================================================
-- Date: December 9, 2025
-- Status: Fixes original 555 which failed on non-existent public.users
--
-- Changes from original:
--   - Removed all public.users references (table doesn't exist)
--   - Fixed audit_log → audit_logs with org_id not workspace_id
--   - Uses get_user_workspaces() helper function
--   - Only targets tables without existing comprehensive RLS
--   - Adds service role bypass for admin operations
-- ============================================================================

-- Verify helper function exists (created in migration 020)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_workspaces'
  ) THEN
    RAISE EXCEPTION 'Helper function get_user_workspaces() not found. Run migration 020 first.';
  END IF;
END $$;

-- ============================================================================
-- SECTION 1: Projects (P0 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;

-- Service role bypass
DROP POLICY IF EXISTS "projects_service_role" ON public.projects;
CREATE POLICY "projects_service_role"
  ON public.projects FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Workspace isolation
DROP POLICY IF EXISTS "projects_workspace_select" ON public.projects;
CREATE POLICY "projects_workspace_select"
  ON public.projects FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "projects_workspace_insert" ON public.projects;
CREATE POLICY "projects_workspace_insert"
  ON public.projects FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "projects_workspace_update" ON public.projects;
CREATE POLICY "projects_workspace_update"
  ON public.projects FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "projects_workspace_delete" ON public.projects;
CREATE POLICY "projects_workspace_delete"
  ON public.projects FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 2: Generated Content (P0 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.generated_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generated_content_service_role" ON public.generated_content;
CREATE POLICY "generated_content_service_role"
  ON public.generated_content FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "generated_content_workspace_select" ON public.generated_content;
CREATE POLICY "generated_content_workspace_select"
  ON public.generated_content FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "generated_content_workspace_insert" ON public.generated_content;
CREATE POLICY "generated_content_workspace_insert"
  ON public.generated_content FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "generated_content_workspace_update" ON public.generated_content;
CREATE POLICY "generated_content_workspace_update"
  ON public.generated_content FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "generated_content_workspace_delete" ON public.generated_content;
CREATE POLICY "generated_content_workspace_delete"
  ON public.generated_content FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 3: WhatsApp Messages (P1 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_messages_service_role" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_service_role"
  ON public.whatsapp_messages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "whatsapp_messages_workspace_select" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_workspace_select"
  ON public.whatsapp_messages FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "whatsapp_messages_workspace_insert" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_workspace_insert"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "whatsapp_messages_workspace_update" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_workspace_update"
  ON public.whatsapp_messages FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "whatsapp_messages_workspace_delete" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_workspace_delete"
  ON public.whatsapp_messages FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 4: Drip Campaigns (P1 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.drip_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drip_campaigns_service_role" ON public.drip_campaigns;
CREATE POLICY "drip_campaigns_service_role"
  ON public.drip_campaigns FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "drip_campaigns_workspace_select" ON public.drip_campaigns;
CREATE POLICY "drip_campaigns_workspace_select"
  ON public.drip_campaigns FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "drip_campaigns_workspace_insert" ON public.drip_campaigns;
CREATE POLICY "drip_campaigns_workspace_insert"
  ON public.drip_campaigns FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "drip_campaigns_workspace_update" ON public.drip_campaigns;
CREATE POLICY "drip_campaigns_workspace_update"
  ON public.drip_campaigns FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "drip_campaigns_workspace_delete" ON public.drip_campaigns;
CREATE POLICY "drip_campaigns_workspace_delete"
  ON public.drip_campaigns FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 5: Calendar Posts (P1 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.calendar_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_posts_service_role" ON public.calendar_posts;
CREATE POLICY "calendar_posts_service_role"
  ON public.calendar_posts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "calendar_posts_workspace_select" ON public.calendar_posts;
CREATE POLICY "calendar_posts_workspace_select"
  ON public.calendar_posts FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "calendar_posts_workspace_insert" ON public.calendar_posts;
CREATE POLICY "calendar_posts_workspace_insert"
  ON public.calendar_posts FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "calendar_posts_workspace_update" ON public.calendar_posts;
CREATE POLICY "calendar_posts_workspace_update"
  ON public.calendar_posts FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "calendar_posts_workspace_delete" ON public.calendar_posts;
CREATE POLICY "calendar_posts_workspace_delete"
  ON public.calendar_posts FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 6: Email Intelligence (P2 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.email_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_intelligence_service_role" ON public.email_intelligence;
CREATE POLICY "email_intelligence_service_role"
  ON public.email_intelligence FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "email_intelligence_workspace_select" ON public.email_intelligence;
CREATE POLICY "email_intelligence_workspace_select"
  ON public.email_intelligence FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "email_intelligence_workspace_insert" ON public.email_intelligence;
CREATE POLICY "email_intelligence_workspace_insert"
  ON public.email_intelligence FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "email_intelligence_workspace_update" ON public.email_intelligence;
CREATE POLICY "email_intelligence_workspace_update"
  ON public.email_intelligence FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "email_intelligence_workspace_delete" ON public.email_intelligence;
CREATE POLICY "email_intelligence_workspace_delete"
  ON public.email_intelligence FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 7: Generated Images (P2 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.generated_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generated_images_service_role" ON public.generated_images;
CREATE POLICY "generated_images_service_role"
  ON public.generated_images FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "generated_images_workspace_select" ON public.generated_images;
CREATE POLICY "generated_images_workspace_select"
  ON public.generated_images FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "generated_images_workspace_insert" ON public.generated_images;
CREATE POLICY "generated_images_workspace_insert"
  ON public.generated_images FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "generated_images_workspace_update" ON public.generated_images;
CREATE POLICY "generated_images_workspace_update"
  ON public.generated_images FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "generated_images_workspace_delete" ON public.generated_images;
CREATE POLICY "generated_images_workspace_delete"
  ON public.generated_images FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 8: Marketing Strategies (P2 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.marketing_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_strategies_service_role" ON public.marketing_strategies;
CREATE POLICY "marketing_strategies_service_role"
  ON public.marketing_strategies FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "marketing_strategies_workspace_select" ON public.marketing_strategies;
CREATE POLICY "marketing_strategies_workspace_select"
  ON public.marketing_strategies FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "marketing_strategies_workspace_insert" ON public.marketing_strategies;
CREATE POLICY "marketing_strategies_workspace_insert"
  ON public.marketing_strategies FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "marketing_strategies_workspace_update" ON public.marketing_strategies;
CREATE POLICY "marketing_strategies_workspace_update"
  ON public.marketing_strategies FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "marketing_strategies_workspace_delete" ON public.marketing_strategies;
CREATE POLICY "marketing_strategies_workspace_delete"
  ON public.marketing_strategies FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- SECTION 9: Audit Logs (P3 Priority - Uses org_id NOT workspace_id)
-- ============================================================================

ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_service_role" ON public.audit_logs;
CREATE POLICY "audit_logs_service_role"
  ON public.audit_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- NOTE: audit_logs uses org_id, not workspace_id
DROP POLICY IF EXISTS "audit_logs_org_select" ON public.audit_logs;
CREATE POLICY "audit_logs_org_select"
  ON public.audit_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Only org admins can insert audit logs
DROP POLICY IF EXISTS "audit_logs_org_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_org_admin_insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND is_active = true
    )
  );

-- Only org admins can update audit logs (for corrections)
DROP POLICY IF EXISTS "audit_logs_org_admin_update" ON public.audit_logs;
CREATE POLICY "audit_logs_org_admin_update"
  ON public.audit_logs FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND is_active = true
    )
  );

-- Audit logs are immutable - no DELETE policy for regular users

-- ============================================================================
-- SECTION 10: Project Mindmaps (P3 Priority)
-- ============================================================================

ALTER TABLE IF EXISTS public.project_mindmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_mindmaps_service_role" ON public.project_mindmaps;
CREATE POLICY "project_mindmaps_service_role"
  ON public.project_mindmaps FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "project_mindmaps_workspace_select" ON public.project_mindmaps;
CREATE POLICY "project_mindmaps_workspace_select"
  ON public.project_mindmaps FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "project_mindmaps_workspace_insert" ON public.project_mindmaps;
CREATE POLICY "project_mindmaps_workspace_insert"
  ON public.project_mindmaps FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "project_mindmaps_workspace_update" ON public.project_mindmaps;
CREATE POLICY "project_mindmaps_workspace_update"
  ON public.project_mindmaps FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "project_mindmaps_workspace_delete" ON public.project_mindmaps;
CREATE POLICY "project_mindmaps_workspace_delete"
  ON public.project_mindmaps FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count tables with RLS enabled
DO $$
DECLARE
  rls_count INT;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;

  RAISE NOTICE 'Total tables with RLS enabled: %', rls_count;
END $$;

-- List policies created by this migration
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Policies created by migration 555:';
  FOR policy_record IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'projects', 'generated_content', 'whatsapp_messages',
        'drip_campaigns', 'calendar_posts', 'email_intelligence',
        'generated_images', 'marketing_strategies', 'audit_logs',
        'project_mindmaps'
      )
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '  - %.%', policy_record.tablename, policy_record.policyname;
  END LOOP;
END $$;
