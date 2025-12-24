-- ============================================================================
-- Migration: 299_fix_existing_tables.sql
-- Description: Fix existing tables by adding missing columns before main migrations
-- This migration handles tables that may have been created by earlier migrations
-- ============================================================================

-- ============================================================================
-- FIX: seo_audit_jobs - Add missing columns if table exists
-- ============================================================================

DO $$
BEGIN
    -- Check if table exists and add missing columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_jobs') THEN
        -- Add target_type if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_type text DEFAULT 'domain';
            RAISE NOTICE 'Added target_type column to seo_audit_jobs';
        END IF;

        -- Add target_identifier if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_identifier') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_identifier text DEFAULT '';
            RAISE NOTICE 'Added target_identifier column to seo_audit_jobs';
        END IF;

        -- Add audit_type if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'audit_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN audit_type text DEFAULT 'full';
            RAISE NOTICE 'Added audit_type column to seo_audit_jobs';
        END IF;

        -- Add founder_business_id if missing (may be workspace_id in old schema)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE 'Added founder_business_id column to seo_audit_jobs';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FIX: social_messages - Add social_inbox_account_id if missing
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_messages') THEN
        -- Add social_inbox_account_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'social_inbox_account_id') THEN
            ALTER TABLE social_messages ADD COLUMN social_inbox_account_id uuid;
            RAISE NOTICE 'Added social_inbox_account_id column to social_messages';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FIX: seo_audit_results - Add ALL missing columns
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_results') THEN
        -- Add core_web_vitals if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'core_web_vitals') THEN
            ALTER TABLE seo_audit_results ADD COLUMN core_web_vitals jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added core_web_vitals column to seo_audit_results';
        END IF;

        -- Add overall_score if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'overall_score') THEN
            ALTER TABLE seo_audit_results ADD COLUMN overall_score numeric(5,2);
            RAISE NOTICE 'Added overall_score column to seo_audit_results';
        END IF;

        -- Add technical_issues if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'technical_issues') THEN
            ALTER TABLE seo_audit_results ADD COLUMN technical_issues jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE 'Added technical_issues column to seo_audit_results';
        END IF;

        -- Add recommendations if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'recommendations') THEN
            ALTER TABLE seo_audit_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE 'Added recommendations column to seo_audit_results';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'leak_aligned_scores') THEN
            ALTER TABLE seo_audit_results ADD COLUMN leak_aligned_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added leak_aligned_scores column to seo_audit_results';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'mobile_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN mobile_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added mobile_metrics column to seo_audit_results';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'security_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN security_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added security_metrics column to seo_audit_results';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'crawlability') THEN
            ALTER TABLE seo_audit_results ADD COLUMN crawlability jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added crawlability column to seo_audit_results';
        END IF;

        -- Add seo_audit_job_id FK if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'seo_audit_job_id') THEN
            ALTER TABLE seo_audit_results ADD COLUMN seo_audit_job_id uuid;
            RAISE NOTICE 'Added seo_audit_job_id column to seo_audit_results';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FIX: content_analysis_jobs - Add missing columns
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_analysis_jobs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE 'Added founder_business_id column to content_analysis_jobs';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FIX: content_optimization_results - Add ALL missing columns
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_optimization_results') THEN
        -- Add search_intent if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'search_intent') THEN
            ALTER TABLE content_optimization_results ADD COLUMN search_intent text;
            RAISE NOTICE 'Added search_intent column to content_optimization_results';
        END IF;

        -- Add readability_score if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'readability_score') THEN
            ALTER TABLE content_optimization_results ADD COLUMN readability_score numeric(5,2);
            RAISE NOTICE 'Added readability_score column to content_optimization_results';
        END IF;

        -- Add keyword_density if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'keyword_density') THEN
            ALTER TABLE content_optimization_results ADD COLUMN keyword_density jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added keyword_density column to content_optimization_results';
        END IF;

        -- Add recommendations if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'recommendations') THEN
            ALTER TABLE content_optimization_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE 'Added recommendations column to content_optimization_results';
        END IF;

        -- Add content_analysis_job_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'content_analysis_job_id') THEN
            ALTER TABLE content_optimization_results ADD COLUMN content_analysis_job_id uuid;
            RAISE NOTICE 'Added content_analysis_job_id column to content_optimization_results';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'eeat_scores') THEN
            ALTER TABLE content_optimization_results ADD COLUMN eeat_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added eeat_scores column to content_optimization_results';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'navboost_friendly_patterns') THEN
            ALTER TABLE content_optimization_results ADD COLUMN navboost_friendly_patterns jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added navboost_friendly_patterns column to content_optimization_results';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FIX: All SEO tables - Add founder_business_id if missing
-- ============================================================================

DO $$
DECLARE
    table_names text[] := ARRAY[
        'schema_templates',
        'generated_schemas',
        'rich_results_monitoring',
        'title_meta_tests',
        'ctr_benchmarks',
        'competitor_profiles',
        'keyword_gap_analysis',
        'content_gap_analysis',
        'backlink_gap_analysis'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY table_names LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'founder_business_id') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN founder_business_id uuid', t);
                RAISE NOTICE 'Added founder_business_id column to %', t;
            END IF;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- DROP conflicting constraints before re-adding
-- ============================================================================

DO $$
BEGIN
    -- Drop constraints that might conflict
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_target_type_check') THEN
        ALTER TABLE seo_audit_jobs DROP CONSTRAINT seo_audit_jobs_target_type_check;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_audit_type_check') THEN
        ALTER TABLE seo_audit_jobs DROP CONSTRAINT seo_audit_jobs_audit_type_check;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_status_check') THEN
        ALTER TABLE seo_audit_jobs DROP CONSTRAINT seo_audit_jobs_status_check;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from constraints that don't exist
    NULL;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 299_fix_existing_tables.sql completed';
    RAISE NOTICE 'Run this BEFORE migrations 300-305';
END $$;
