-- ============================================================================
-- Migration 555 (CORRECTED v3): Multi-Tenant RLS Policies
-- ============================================================================
-- Date: December 9, 2025
-- Status: Fixes v2 which failed on audit_logs missing org_id column
--
-- Changes from v2:
--   - Fixed audit_logs to use tenant_id (not org_id)
--   - Schema investigation showed migration 437 changed org_id → tenant_id
--   - All other tables unchanged from v2
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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "projects_service_role" ON public.projects;
    CREATE POLICY "projects_service_role"
      ON public.projects FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');

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

    RAISE NOTICE 'RLS policies created for projects';
  ELSE
    RAISE NOTICE 'Skipping projects - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: Generated Content (P0 Priority)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'generated_content') THEN
    ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

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

    RAISE NOTICE 'RLS policies created for generated_content';
  ELSE
    RAISE NOTICE 'Skipping generated_content - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: Drip Campaigns (P1 Priority)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drip_campaigns') THEN
    ALTER TABLE public.drip_campaigns ENABLE ROW LEVEL SECURITY;

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

    RAISE NOTICE 'RLS policies created for drip_campaigns';
  ELSE
    RAISE NOTICE 'Skipping drip_campaigns - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: Calendar Posts (P1 Priority)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_posts') THEN
    ALTER TABLE public.calendar_posts ENABLE ROW LEVEL SECURITY;

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

    RAISE NOTICE 'RLS policies created for calendar_posts';
  ELSE
    RAISE NOTICE 'Skipping calendar_posts - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: Email Intelligence (P2 Priority)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_intelligence') THEN
    ALTER TABLE public.email_intelligence ENABLE ROW LEVEL SECURITY;

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

    RAISE NOTICE 'RLS policies created for email_intelligence';
  ELSE
    RAISE NOTICE 'Skipping email_intelligence - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: Generated Images (P2 Priority)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'generated_images') THEN
    ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

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

    RAISE NOTICE 'RLS policies created for generated_images';
  ELSE
    RAISE NOTICE 'Skipping generated_images - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 7: Marketing Strategies (P2 Priority)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketing_strategies') THEN
    ALTER TABLE public.marketing_strategies ENABLE ROW LEVEL SECURITY;

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

    RAISE NOTICE 'RLS policies created for marketing_strategies';
  ELSE
    RAISE NOTICE 'Skipping marketing_strategies - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 8: Audit Logs (P3 Priority - Uses tenant_id NOT org_id)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "audit_logs_service_role" ON public.audit_logs;
    CREATE POLICY "audit_logs_service_role"
      ON public.audit_logs FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');

    -- NOTE: Migration 437 changed audit_logs to use tenant_id (not org_id)
    -- Users can see their own audit logs
    DROP POLICY IF EXISTS "audit_logs_tenant_select" ON public.audit_logs;
    CREATE POLICY "audit_logs_tenant_select"
      ON public.audit_logs FOR SELECT
      USING (tenant_id = auth.uid());

    -- Only the tenant can insert their own audit logs
    DROP POLICY IF EXISTS "audit_logs_tenant_insert" ON public.audit_logs;
    CREATE POLICY "audit_logs_tenant_insert"
      ON public.audit_logs FOR INSERT
      WITH CHECK (tenant_id = auth.uid());

    RAISE NOTICE 'RLS policies created for audit_logs';
  ELSE
    RAISE NOTICE 'Skipping audit_logs - table does not exist';
  END IF;
END $$;

-- ============================================================================
-- SECTION 9: Project Mindmaps (P3 Priority)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_mindmaps') THEN
    ALTER TABLE public.project_mindmaps ENABLE ROW LEVEL SECURITY;

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

    RAISE NOTICE 'RLS policies created for project_mindmaps';
  ELSE
    RAISE NOTICE 'Skipping project_mindmaps - table does not exist';
  END IF;
END $$;

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
  RAISE NOTICE 'Policies for target tables:';
  FOR policy_record IN
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'projects', 'generated_content', 'drip_campaigns',
        'calendar_posts', 'email_intelligence', 'generated_images',
        'marketing_strategies', 'audit_logs', 'project_mindmaps'
      )
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  - %: % policies', policy_record.tablename, policy_record.policy_count;
  END LOOP;
END $$;
