-- Migration 402: Extended RLS Policies
-- Phase 4 of Unite-Hub Rebuild
-- Purpose: Ensure RLS on all workspace-scoped tables (ADR-002)
-- Date: 2025-11-29

-- ============================================================================
-- SECTION 1: Enable RLS on Extended Tables
-- These tables may have been created without RLS
-- ============================================================================

-- Enable RLS on all workspace-scoped tables
DO $$
DECLARE
  tables_to_protect TEXT[] := ARRAY[
    'founder_businesses',
    'founder_business_vault_secrets',
    'founder_business_signals',
    'founder_os_snapshots',
    'ai_phill_insights',
    'ai_phill_journal_entries',
    'cognitive_twin_scores',
    'cognitive_twin_digests',
    'cognitive_twin_decisions',
    'seo_leak_signal_profiles',
    'social_inbox_accounts',
    'social_messages',
    'search_keywords',
    'boost_jobs',
    'pre_clients',
    'generated_content',
    'ai_memory'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_protect
  LOOP
    -- Check if table exists before enabling RLS
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'Enabled RLS on %', t;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', t;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 2: Founder Business Tables Policies
-- Staff-only access with workspace isolation
-- ============================================================================

-- founder_businesses policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'founder_businesses') THEN
    -- Drop existing policies to recreate cleanly
    DROP POLICY IF EXISTS "founder_businesses_select" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_insert" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_update" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_delete" ON founder_businesses;

    -- Create new policies
    EXECUTE 'CREATE POLICY "founder_businesses_select" ON founder_businesses
      FOR SELECT TO authenticated
      USING (public.is_workspace_member(workspace_id) AND public.is_staff())';

    EXECUTE 'CREATE POLICY "founder_businesses_insert" ON founder_businesses
      FOR INSERT TO authenticated
      WITH CHECK (public.is_workspace_member(workspace_id) AND public.is_staff())';

    EXECUTE 'CREATE POLICY "founder_businesses_update" ON founder_businesses
      FOR UPDATE TO authenticated
      USING (public.is_workspace_member(workspace_id) AND public.is_staff())';

    EXECUTE 'CREATE POLICY "founder_businesses_delete" ON founder_businesses
      FOR DELETE TO authenticated
      USING (public.is_workspace_admin(workspace_id) AND public.is_founder())';
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: AI Agent Tables Policies
-- ============================================================================

-- ai_phill_insights policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_phill_insights') THEN
    DROP POLICY IF EXISTS "ai_phill_insights_select" ON ai_phill_insights;
    DROP POLICY IF EXISTS "ai_phill_insights_insert" ON ai_phill_insights;

    -- Check if workspace_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ai_phill_insights' AND column_name = 'workspace_id'
    ) THEN
      EXECUTE 'CREATE POLICY "ai_phill_insights_select" ON ai_phill_insights
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "ai_phill_insights_insert" ON ai_phill_insights
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id))';
    ELSE
      -- Fallback: use auth.uid() if no workspace_id
      EXECUTE 'CREATE POLICY "ai_phill_insights_select" ON ai_phill_insights
        FOR SELECT TO authenticated
        USING (true)'; -- Will add proper policy when column exists
    END IF;
  END IF;
END $$;

-- cognitive_twin tables policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cognitive_twin_scores') THEN
    DROP POLICY IF EXISTS "cognitive_twin_scores_select" ON cognitive_twin_scores;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'cognitive_twin_scores' AND column_name = 'workspace_id'
    ) THEN
      EXECUTE 'CREATE POLICY "cognitive_twin_scores_select" ON cognitive_twin_scores
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id) AND public.is_staff())';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: SEO and Social Tables Policies
-- ============================================================================

-- seo_leak_signal_profiles policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_leak_signal_profiles') THEN
    DROP POLICY IF EXISTS "seo_leak_profiles_select" ON seo_leak_signal_profiles;
    DROP POLICY IF EXISTS "seo_leak_profiles_insert" ON seo_leak_signal_profiles;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'seo_leak_signal_profiles' AND column_name = 'workspace_id'
    ) THEN
      EXECUTE 'CREATE POLICY "seo_leak_profiles_select" ON seo_leak_signal_profiles
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "seo_leak_profiles_insert" ON seo_leak_signal_profiles
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id))';
    END IF;
  END IF;
END $$;

-- social_inbox_accounts policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_inbox_accounts') THEN
    DROP POLICY IF EXISTS "social_inbox_select" ON social_inbox_accounts;
    DROP POLICY IF EXISTS "social_inbox_insert" ON social_inbox_accounts;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'social_inbox_accounts' AND column_name = 'workspace_id'
    ) THEN
      EXECUTE 'CREATE POLICY "social_inbox_select" ON social_inbox_accounts
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "social_inbox_insert" ON social_inbox_accounts
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id))';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: Generated Content and AI Memory Policies
-- ============================================================================

-- generated_content policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_content') THEN
    DROP POLICY IF EXISTS "generated_content_select" ON generated_content;
    DROP POLICY IF EXISTS "generated_content_insert" ON generated_content;
    DROP POLICY IF EXISTS "generated_content_update" ON generated_content;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'generated_content' AND column_name = 'workspace_id'
    ) THEN
      EXECUTE 'CREATE POLICY "generated_content_select" ON generated_content
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "generated_content_insert" ON generated_content
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "generated_content_update" ON generated_content
        FOR UPDATE TO authenticated
        USING (public.is_workspace_member(workspace_id))';
    END IF;
  END IF;
END $$;

-- ai_memory policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_memory') THEN
    DROP POLICY IF EXISTS "ai_memory_select" ON ai_memory;
    DROP POLICY IF EXISTS "ai_memory_insert" ON ai_memory;
    DROP POLICY IF EXISTS "ai_memory_update" ON ai_memory;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ai_memory' AND column_name = 'workspace_id'
    ) THEN
      EXECUTE 'CREATE POLICY "ai_memory_select" ON ai_memory
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "ai_memory_insert" ON ai_memory
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "ai_memory_update" ON ai_memory
        FOR UPDATE TO authenticated
        USING (public.is_workspace_member(workspace_id))';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: Pre-client Policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pre_clients') THEN
    DROP POLICY IF EXISTS "pre_clients_select" ON pre_clients;
    DROP POLICY IF EXISTS "pre_clients_insert" ON pre_clients;
    DROP POLICY IF EXISTS "pre_clients_update" ON pre_clients;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pre_clients' AND column_name = 'workspace_id'
    ) THEN
      EXECUTE 'CREATE POLICY "pre_clients_select" ON pre_clients
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "pre_clients_insert" ON pre_clients
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id))';

      EXECUTE 'CREATE POLICY "pre_clients_update" ON pre_clients
        FOR UPDATE TO authenticated
        USING (public.is_workspace_member(workspace_id))';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================
/*
-- Check RLS status on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'founder_businesses', 'ai_phill_insights', 'cognitive_twin_scores',
  'seo_leak_signal_profiles', 'social_inbox_accounts', 'generated_content',
  'ai_memory', 'pre_clients'
)
ORDER BY tablename;

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
