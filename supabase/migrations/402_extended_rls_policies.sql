-- Migration 402: Extended RLS Policies
-- Phase 4 of Unite-Hub Rebuild
-- Purpose: Ensure RLS on all tables with proper scoping (ADR-002)
-- Date: 2025-11-29
--
-- IMPORTANT: This migration handles two scoping patterns:
--   1. Workspace-scoped tables: Use workspace_id → workspaces(id)
-- Use auth.uid() in RLS policies instead of direct auth.users reference
  2. Founder OS tables: Use owner_user_id → auth.users(id) OR founder_business_id
--
-- Reference: Check 300-305 migrations for Founder OS schema

-- ============================================================================
-- SECTION 1: Enable RLS on Extended Tables
-- ============================================================================

-- Enable RLS on all tables that need it (safe - just enables, doesn't break)
DO $$
DECLARE
  tables_to_protect TEXT[] := ARRAY[
    -- Founder Intelligence OS tables (owner_user_id or founder_business_id scoped)
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
    -- Workspace-scoped tables
    'generated_content',
    'ai_memory'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_protect
  LOOP
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
-- SECTION 2: Founder Business Tables (owner_user_id scoped)
-- These are personal to the founder, not workspace-shared
-- ============================================================================

-- founder_businesses: Owner can see their own businesses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'founder_businesses') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "founder_businesses_select" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_insert" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_update" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_delete" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_owner_select" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_owner_insert" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_owner_update" ON founder_businesses;
    DROP POLICY IF EXISTS "founder_businesses_owner_delete" ON founder_businesses;

    -- Owner can SELECT their own businesses
    CREATE POLICY "founder_businesses_owner_select" ON founder_businesses
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    -- Owner can INSERT their own businesses
    CREATE POLICY "founder_businesses_owner_insert" ON founder_businesses
      FOR INSERT TO authenticated
      WITH CHECK (owner_user_id = auth.uid());

    -- Owner can UPDATE their own businesses
    CREATE POLICY "founder_businesses_owner_update" ON founder_businesses
      FOR UPDATE TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    -- Owner can DELETE their own businesses
    CREATE POLICY "founder_businesses_owner_delete" ON founder_businesses
      FOR DELETE TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    RAISE NOTICE 'Created RLS policies for founder_businesses (owner_user_id scoped)';
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: AI Phill Tables (owner_user_id scoped)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_phill_insights') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "ai_phill_insights_select" ON ai_phill_insights;
    DROP POLICY IF EXISTS "ai_phill_insights_insert" ON ai_phill_insights;
    DROP POLICY IF EXISTS "ai_phill_insights_owner_select" ON ai_phill_insights;
    DROP POLICY IF EXISTS "ai_phill_insights_owner_insert" ON ai_phill_insights;

    -- Owner can SELECT their own insights
    CREATE POLICY "ai_phill_insights_owner_select" ON ai_phill_insights
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    -- Owner can INSERT their own insights
    CREATE POLICY "ai_phill_insights_owner_insert" ON ai_phill_insights
      FOR INSERT TO authenticated
      WITH CHECK (owner_user_id = auth.uid());

    RAISE NOTICE 'Created RLS policies for ai_phill_insights (owner_user_id scoped)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_phill_journal_entries') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "ai_phill_journal_select" ON ai_phill_journal_entries;
    DROP POLICY IF EXISTS "ai_phill_journal_insert" ON ai_phill_journal_entries;
    DROP POLICY IF EXISTS "ai_phill_journal_owner_select" ON ai_phill_journal_entries;
    DROP POLICY IF EXISTS "ai_phill_journal_owner_insert" ON ai_phill_journal_entries;

    CREATE POLICY "ai_phill_journal_owner_select" ON ai_phill_journal_entries
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    CREATE POLICY "ai_phill_journal_owner_insert" ON ai_phill_journal_entries
      FOR INSERT TO authenticated
      WITH CHECK (owner_user_id = auth.uid());

    RAISE NOTICE 'Created RLS policies for ai_phill_journal_entries';
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: Cognitive Twin Tables (owner_user_id scoped)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cognitive_twin_scores') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "cognitive_twin_scores_select" ON cognitive_twin_scores;
    DROP POLICY IF EXISTS "cognitive_twin_scores_insert" ON cognitive_twin_scores;
    DROP POLICY IF EXISTS "cognitive_twin_scores_owner_select" ON cognitive_twin_scores;
    DROP POLICY IF EXISTS "cognitive_twin_scores_owner_insert" ON cognitive_twin_scores;

    CREATE POLICY "cognitive_twin_scores_owner_select" ON cognitive_twin_scores
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    CREATE POLICY "cognitive_twin_scores_owner_insert" ON cognitive_twin_scores
      FOR INSERT TO authenticated
      WITH CHECK (owner_user_id = auth.uid());

    RAISE NOTICE 'Created RLS policies for cognitive_twin_scores';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cognitive_twin_digests') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "cognitive_twin_digests_select" ON cognitive_twin_digests;
    DROP POLICY IF EXISTS "cognitive_twin_digests_insert" ON cognitive_twin_digests;
    DROP POLICY IF EXISTS "cognitive_twin_digests_owner_select" ON cognitive_twin_digests;
    DROP POLICY IF EXISTS "cognitive_twin_digests_owner_insert" ON cognitive_twin_digests;

    CREATE POLICY "cognitive_twin_digests_owner_select" ON cognitive_twin_digests
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    RAISE NOTICE 'Created RLS policies for cognitive_twin_digests';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cognitive_twin_decisions') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "cognitive_twin_decisions_select" ON cognitive_twin_decisions;
    DROP POLICY IF EXISTS "cognitive_twin_decisions_insert" ON cognitive_twin_decisions;
    DROP POLICY IF EXISTS "cognitive_twin_decisions_owner_select" ON cognitive_twin_decisions;
    DROP POLICY IF EXISTS "cognitive_twin_decisions_owner_insert" ON cognitive_twin_decisions;

    CREATE POLICY "cognitive_twin_decisions_owner_select" ON cognitive_twin_decisions
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    RAISE NOTICE 'Created RLS policies for cognitive_twin_decisions';
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: SEO & Social Tables (founder_business_id scoped)
-- Access via founder_businesses ownership chain
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_leak_signal_profiles') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "seo_leak_profiles_select" ON seo_leak_signal_profiles;
    DROP POLICY IF EXISTS "seo_leak_profiles_insert" ON seo_leak_signal_profiles;
    DROP POLICY IF EXISTS "seo_leak_profiles_update" ON seo_leak_signal_profiles;
    DROP POLICY IF EXISTS "seo_leak_profiles_business_select" ON seo_leak_signal_profiles;
    DROP POLICY IF EXISTS "seo_leak_profiles_business_insert" ON seo_leak_signal_profiles;
    DROP POLICY IF EXISTS "seo_leak_profiles_business_update" ON seo_leak_signal_profiles;

    -- User can SELECT profiles for businesses they own
    CREATE POLICY "seo_leak_profiles_business_select" ON seo_leak_signal_profiles
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        founder_business_id IN (
          SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
        )
      );

    CREATE POLICY "seo_leak_profiles_business_insert" ON seo_leak_signal_profiles
      FOR INSERT TO authenticated
      WITH CHECK (
        founder_business_id IN (
          SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
        )
      );

    RAISE NOTICE 'Created RLS policies for seo_leak_signal_profiles (founder_business_id scoped)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_inbox_accounts') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "social_inbox_select" ON social_inbox_accounts;
    DROP POLICY IF EXISTS "social_inbox_insert" ON social_inbox_accounts;
    DROP POLICY IF EXISTS "social_inbox_update" ON social_inbox_accounts;
    DROP POLICY IF EXISTS "social_inbox_business_select" ON social_inbox_accounts;
    DROP POLICY IF EXISTS "social_inbox_business_insert" ON social_inbox_accounts;
    DROP POLICY IF EXISTS "social_inbox_business_update" ON social_inbox_accounts;

    CREATE POLICY "social_inbox_business_select" ON social_inbox_accounts
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        founder_business_id IN (
          SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
        )
      );

    CREATE POLICY "social_inbox_business_insert" ON social_inbox_accounts
      FOR INSERT TO authenticated
      WITH CHECK (
        founder_business_id IN (
          SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
        )
      );

    RAISE NOTICE 'Created RLS policies for social_inbox_accounts';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_messages') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "social_messages_select" ON social_messages;
    DROP POLICY IF EXISTS "social_messages_insert" ON social_messages;
    DROP POLICY IF EXISTS "social_messages_business_select" ON social_messages;
    DROP POLICY IF EXISTS "social_messages_business_insert" ON social_messages;

    CREATE POLICY "social_messages_business_select" ON social_messages
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        social_account_id IN (
          SELECT sia.id FROM social_inbox_accounts sia
          JOIN founder_businesses fb ON sia.founder_business_id = fb.id
          WHERE fb.owner_user_id = auth.uid()
        )
      );

    RAISE NOTICE 'Created RLS policies for social_messages';
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: Workspace-Scoped Tables (workspace_id)
-- Standard Unite-Hub workspace isolation
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_content') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'generated_content' AND column_name = 'workspace_id'
    ) THEN
      -- Drop ALL possible policy names (old and new naming conventions)
      DROP POLICY IF EXISTS "generated_content_select" ON generated_content;
      DROP POLICY IF EXISTS "generated_content_insert" ON generated_content;
      DROP POLICY IF EXISTS "generated_content_update" ON generated_content;
      DROP POLICY IF EXISTS "generated_content_workspace_select" ON generated_content;
      DROP POLICY IF EXISTS "generated_content_workspace_insert" ON generated_content;
      DROP POLICY IF EXISTS "generated_content_workspace_update" ON generated_content;

      CREATE POLICY "generated_content_workspace_select" ON generated_content
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id));

      CREATE POLICY "generated_content_workspace_insert" ON generated_content
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id));

      CREATE POLICY "generated_content_workspace_update" ON generated_content
        FOR UPDATE TO authenticated
        USING (public.is_workspace_member(workspace_id));

      RAISE NOTICE 'Created RLS policies for generated_content (workspace_id scoped)';
    ELSE
      RAISE NOTICE 'generated_content does not have workspace_id column';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_memory') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ai_memory' AND column_name = 'workspace_id'
    ) THEN
      -- Drop ALL possible policy names (old and new naming conventions)
      DROP POLICY IF EXISTS "ai_memory_select" ON ai_memory;
      DROP POLICY IF EXISTS "ai_memory_insert" ON ai_memory;
      DROP POLICY IF EXISTS "ai_memory_update" ON ai_memory;
      DROP POLICY IF EXISTS "ai_memory_workspace_select" ON ai_memory;
      DROP POLICY IF EXISTS "ai_memory_workspace_insert" ON ai_memory;
      DROP POLICY IF EXISTS "ai_memory_workspace_update" ON ai_memory;

      CREATE POLICY "ai_memory_workspace_select" ON ai_memory
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id));

      CREATE POLICY "ai_memory_workspace_insert" ON ai_memory
        FOR INSERT TO authenticated
        WITH CHECK (public.is_workspace_member(workspace_id));

      CREATE POLICY "ai_memory_workspace_update" ON ai_memory
        FOR UPDATE TO authenticated
        USING (public.is_workspace_member(workspace_id));

      RAISE NOTICE 'Created RLS policies for ai_memory (workspace_id scoped)';
    ELSE
      RAISE NOTICE 'ai_memory does not have workspace_id column';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SECTION 7: Founder OS Snapshots (owner_user_id scoped)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'founder_os_snapshots') THEN
    -- Drop ALL possible policy names (old and new naming conventions)
    DROP POLICY IF EXISTS "founder_os_snapshots_select" ON founder_os_snapshots;
    DROP POLICY IF EXISTS "founder_os_snapshots_insert" ON founder_os_snapshots;
    DROP POLICY IF EXISTS "founder_os_snapshots_owner_select" ON founder_os_snapshots;
    DROP POLICY IF EXISTS "founder_os_snapshots_owner_insert" ON founder_os_snapshots;

    CREATE POLICY "founder_os_snapshots_owner_select" ON founder_os_snapshots
      FOR SELECT TO authenticated
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND owner_user_id = auth.uid());

    RAISE NOTICE 'Created RLS policies for founder_os_snapshots';
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
  'ai_memory'
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
-- ============================================================================;
