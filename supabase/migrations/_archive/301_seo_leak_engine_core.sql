-- ============================================================================
-- Migration: 301_seo_leak_engine_core.sql
-- Description: SEO Leak Engine Core Tables - Aligned with Google/DOJ/Yandex Leak Insights
-- Created: 2025-11-28
--
-- This migration creates tables for the SEO Leak Engine, a system designed to
-- leverage insights from the Google Content Warehouse API leak, DOJ antitrust
-- documents, and Yandex search algorithm leaks. The tables track ranking factors
-- like NavBoost (user engagement signals), site authority estimation, E-E-A-T
-- signals, sandbox risk, and other leak-revealed metrics.
--
-- Key Leak-Aligned Concepts:
-- - NavBoost: User engagement signals that boost rankings (clicks, dwell time)
-- - Q*/P*/T* Scores: Quality, Popularity, Trust signals from Yandex leak
-- - Site Authority: Domain-level trust signals (similar to PageRank descendants)
-- - Sandbox Risk: New site penalty estimation
-- - E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness signals
-- ============================================================================

-- ============================================================================
-- PRE-MIGRATION FIX: Handle schema mismatches from migration 276
-- This section adds missing columns to tables that may exist with old schema
-- ============================================================================

DO $$
DECLARE
    tables_to_fix text[] := ARRAY[
        'generated_schemas',
        'rich_results_monitoring',
        'title_meta_tests',
        'ctr_benchmarks',
        'competitor_profiles',
        'keyword_gap_analysis',
        'content_gap_analysis',
        'backlink_gap_analysis',
        'seo_leak_signal_profiles',
        'seo_leak_recommendations'
    ];
    t text;
BEGIN
    -- Add founder_business_id to all tables that might only have workspace_id
    FOREACH t IN ARRAY tables_to_fix LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'founder_business_id') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN founder_business_id uuid', t);
                RAISE NOTICE 'Added founder_business_id to %', t;
            END IF;
        END IF;
    END LOOP;

    -- Fix generated_schemas specific columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_schemas') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_body') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_json') THEN
                ALTER TABLE generated_schemas ADD COLUMN schema_body jsonb;
                UPDATE generated_schemas SET schema_body = schema_json WHERE schema_body IS NULL;
            ELSE
                ALTER TABLE generated_schemas ADD COLUMN schema_body jsonb DEFAULT '{}'::jsonb;
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_status') THEN
            ALTER TABLE generated_schemas ADD COLUMN validation_status text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_errors') THEN
            ALTER TABLE generated_schemas ADD COLUMN validation_errors jsonb DEFAULT '[]'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'status') THEN
            ALTER TABLE generated_schemas ADD COLUMN status text DEFAULT 'proposed';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'approved_at') THEN
            ALTER TABLE generated_schemas ADD COLUMN approved_at timestamptz;
        END IF;
    END IF;

    -- Fix rich_results_monitoring specific columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rich_results_monitoring') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'serp_feature') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN serp_feature text DEFAULT 'featured_snippet';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'competitor_domain') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN competitor_domain text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'last_seen_at') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN last_seen_at timestamptz;
        END IF;
    END IF;

    -- Fix title_meta_tests specific columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'title_meta_tests') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'variant_a') THEN
            ALTER TABLE title_meta_tests ADD COLUMN variant_a jsonb DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'variant_b') THEN
            ALTER TABLE title_meta_tests ADD COLUMN variant_b jsonb DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'winner') THEN
            ALTER TABLE title_meta_tests ADD COLUMN winner text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'statistical_significance') THEN
            ALTER TABLE title_meta_tests ADD COLUMN statistical_significance numeric(5,2);
        END IF;
    END IF;

    -- Fix ctr_benchmarks specific columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ctr_benchmarks') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'serp_position') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN serp_position int DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'actual_ctr') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN actual_ctr numeric(5,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'expected_ctr') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN expected_ctr numeric(5,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'opportunity_level') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN opportunity_level text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'navboost_inference') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN navboost_inference jsonb DEFAULT '{}'::jsonb;
        END IF;
    END IF;

    -- Fix keyword_gap_analysis specific columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'keyword_gap_analysis') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keyword_gap_analysis' AND column_name = 'gap_type') THEN
            ALTER TABLE keyword_gap_analysis ADD COLUMN gap_type text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keyword_gap_analysis' AND column_name = 'gaps') THEN
            ALTER TABLE keyword_gap_analysis ADD COLUMN gaps jsonb DEFAULT '[]'::jsonb;
        END IF;
    END IF;

    -- Fix content_gap_analysis specific columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_gap_analysis') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_gap_analysis' AND column_name = 'topic_cluster') THEN
            ALTER TABLE content_gap_analysis ADD COLUMN topic_cluster text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_gap_analysis' AND column_name = 'gaps') THEN
            ALTER TABLE content_gap_analysis ADD COLUMN gaps jsonb DEFAULT '[]'::jsonb;
        END IF;
    END IF;

    -- Fix backlink_gap_analysis specific columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backlink_gap_analysis') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_gap_analysis' AND column_name = 'gaps') THEN
            ALTER TABLE backlink_gap_analysis ADD COLUMN gaps jsonb DEFAULT '[]'::jsonb;
        END IF;
    END IF;

    RAISE NOTICE 'Pre-migration schema fixes completed successfully';
END $$;

-- ============================================================================
-- 1. SEO AUDIT JOBS
-- Technical SEO audit job tracking for domains and individual pages
-- ============================================================================

-- Ensure seo_audit_jobs table has all required columns (handles table from earlier migrations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_jobs') THEN
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_type text DEFAULT 'domain';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_identifier') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_identifier text DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'audit_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN audit_type text DEFAULT 'full';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN founder_business_id uuid;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'status') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN status text DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'started_at') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN started_at timestamptz;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'finished_at') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN finished_at timestamptz;
        END IF;
    ELSE
        CREATE TABLE seo_audit_jobs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
            target_type text NOT NULL DEFAULT 'domain',
            target_identifier text NOT NULL DEFAULT '',
            audit_type text NOT NULL DEFAULT 'full',
            status text NOT NULL DEFAULT 'pending',
            created_at timestamptz NOT NULL DEFAULT now(),
            started_at timestamptz,
            finished_at timestamptz
        );
    END IF;
END $$;

-- Add constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_target_type_check') THEN
        ALTER TABLE seo_audit_jobs ADD CONSTRAINT seo_audit_jobs_target_type_check
        CHECK (target_type IS NULL OR target_type IN ('domain', 'page', 'subdomain', 'section'));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_audit_type_check') THEN
        ALTER TABLE seo_audit_jobs ADD CONSTRAINT seo_audit_jobs_audit_type_check
        CHECK (audit_type IS NULL OR audit_type IN ('full', 'technical', 'content', 'performance', 'mobile', 'security', 'crawlability'));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_status_check') THEN
        ALTER TABLE seo_audit_jobs ADD CONSTRAINT seo_audit_jobs_status_check
        CHECK (status IS NULL OR status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled'));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add comments safely
COMMENT ON TABLE seo_audit_jobs IS 'Technical SEO audit job tracking. Audits can target entire domains, specific pages, subdomains, or site sections.';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_type') THEN
        COMMENT ON COLUMN seo_audit_jobs.target_type IS 'What is being audited: domain, page, subdomain, or section';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_identifier') THEN
        COMMENT ON COLUMN seo_audit_jobs.target_identifier IS 'The target URL, domain, or identifier being audited';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'audit_type') THEN
        COMMENT ON COLUMN seo_audit_jobs.audit_type IS 'Type of audit: full (all checks), technical, content, performance, mobile, security, or crawlability';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'status') THEN
        COMMENT ON COLUMN seo_audit_jobs.status IS 'Job status: pending, queued, running, completed, failed, or cancelled';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seo_audit_jobs_business ON seo_audit_jobs(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audit_jobs_status ON seo_audit_jobs(status, created_at DESC);

-- ============================================================================
-- 2. SEO AUDIT RESULTS
-- Audit findings with leak-aligned scoring metrics
-- ============================================================================

-- Ensure seo_audit_results table has all required columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_results') THEN
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'seo_audit_job_id') THEN
            ALTER TABLE seo_audit_results ADD COLUMN seo_audit_job_id uuid;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'overall_score') THEN
            ALTER TABLE seo_audit_results ADD COLUMN overall_score numeric(5,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'core_web_vitals') THEN
            ALTER TABLE seo_audit_results ADD COLUMN core_web_vitals jsonb DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'technical_issues') THEN
            ALTER TABLE seo_audit_results ADD COLUMN technical_issues jsonb DEFAULT '[]'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'mobile_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN mobile_metrics jsonb DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'security_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN security_metrics jsonb DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'crawlability') THEN
            ALTER TABLE seo_audit_results ADD COLUMN crawlability jsonb DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'leak_aligned_scores') THEN
            ALTER TABLE seo_audit_results ADD COLUMN leak_aligned_scores jsonb DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'recommendations') THEN
            ALTER TABLE seo_audit_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
        END IF;
    ELSE
        CREATE TABLE seo_audit_results (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            seo_audit_job_id uuid REFERENCES seo_audit_jobs(id) ON DELETE CASCADE,
            overall_score numeric(5,2),
            core_web_vitals jsonb NOT NULL DEFAULT '{}'::jsonb,
            technical_issues jsonb NOT NULL DEFAULT '[]'::jsonb,
            mobile_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
            security_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
            crawlability jsonb NOT NULL DEFAULT '{}'::jsonb,
            leak_aligned_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
            recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Add comments safely
COMMENT ON TABLE seo_audit_results IS 'Audit findings with leak-aligned scores. Includes Core Web Vitals, technical issues, and scores derived from Google/Yandex leak insights.';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'overall_score') THEN
        COMMENT ON COLUMN seo_audit_results.overall_score IS 'Composite score 0-100 based on all audit dimensions';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'core_web_vitals') THEN
        COMMENT ON COLUMN seo_audit_results.core_web_vitals IS 'LCP, FID, CLS, TTFB, FCP measurements - critical for Google ranking per leak documents';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'technical_issues') THEN
        COMMENT ON COLUMN seo_audit_results.technical_issues IS 'Array of detected technical SEO issues with severity and fix recommendations';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'mobile_metrics') THEN
        COMMENT ON COLUMN seo_audit_results.mobile_metrics IS 'Mobile-first indexing metrics: viewport, tap targets, font sizes, mobile-friendliness';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'security_metrics') THEN
        COMMENT ON COLUMN seo_audit_results.security_metrics IS 'HTTPS, mixed content, security headers (HSTS, CSP, X-Frame-Options)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'crawlability') THEN
        COMMENT ON COLUMN seo_audit_results.crawlability IS 'Robots.txt, sitemap, crawl depth, internal linking, orphan pages';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'leak_aligned_scores') THEN
        COMMENT ON COLUMN seo_audit_results.leak_aligned_scores IS 'Scores derived from leak insights: navboost_potential, site_authority_estimate, sandbox_risk, eeat_signals';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'recommendations') THEN
        COMMENT ON COLUMN seo_audit_results.recommendations IS 'Prioritized array of recommendations based on audit findings';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seo_audit_results_job ON seo_audit_results(seo_audit_job_id);

-- ============================================================================
-- 3. CONTENT ANALYSIS JOBS
-- Content optimization job tracking
-- ============================================================================

-- Ensure content_analysis_jobs table has all required columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_analysis_jobs') THEN
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN founder_business_id uuid;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'url') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN url text DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'target_keyword') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN target_keyword text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'secondary_keywords') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN secondary_keywords text[] DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'status') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN status text DEFAULT 'pending';
        END IF;
    ELSE
        CREATE TABLE content_analysis_jobs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
            url text NOT NULL DEFAULT '',
            target_keyword text,
            secondary_keywords text[] NOT NULL DEFAULT '{}',
            status text NOT NULL DEFAULT 'pending',
            created_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Add constraint safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_analysis_jobs_status_check') THEN
        ALTER TABLE content_analysis_jobs ADD CONSTRAINT content_analysis_jobs_status_check
        CHECK (status IS NULL OR status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled'));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add comments safely
COMMENT ON TABLE content_analysis_jobs IS 'Content optimization analysis jobs. Analyzes pages for keyword optimization, readability, and search intent alignment.';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'url') THEN
        COMMENT ON COLUMN content_analysis_jobs.url IS 'URL of the page to analyze';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'target_keyword') THEN
        COMMENT ON COLUMN content_analysis_jobs.target_keyword IS 'Primary keyword to optimize for';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'secondary_keywords') THEN
        COMMENT ON COLUMN content_analysis_jobs.secondary_keywords IS 'Supporting keywords and semantic variations';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'status') THEN
        COMMENT ON COLUMN content_analysis_jobs.status IS 'Job status: pending, queued, running, completed, failed, or cancelled';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_analysis_jobs_business ON content_analysis_jobs(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_analysis_jobs_status ON content_analysis_jobs(status, created_at DESC);

-- ============================================================================
-- 4. CONTENT OPTIMIZATION RESULTS
-- Content analysis results with leak-aligned E-E-A-T and NavBoost patterns
-- ============================================================================

-- First, ensure all columns exist on content_optimization_results (handles table created by earlier migrations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_optimization_results') THEN
        -- Add search_intent if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'search_intent') THEN
            ALTER TABLE content_optimization_results ADD COLUMN search_intent text;
        END IF;
        -- Add eeat_scores if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'eeat_scores') THEN
            ALTER TABLE content_optimization_results ADD COLUMN eeat_scores jsonb DEFAULT '{}'::jsonb;
        END IF;
        -- Add navboost_friendly_patterns if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'navboost_friendly_patterns') THEN
            ALTER TABLE content_optimization_results ADD COLUMN navboost_friendly_patterns jsonb DEFAULT '{}'::jsonb;
        END IF;
        -- Add readability_score if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'readability_score') THEN
            ALTER TABLE content_optimization_results ADD COLUMN readability_score numeric(5,2);
        END IF;
        -- Add keyword_density if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'keyword_density') THEN
            ALTER TABLE content_optimization_results ADD COLUMN keyword_density jsonb DEFAULT '{}'::jsonb;
        END IF;
        -- Add recommendations if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'recommendations') THEN
            ALTER TABLE content_optimization_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
        END IF;
        -- Add content_analysis_job_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'content_analysis_job_id') THEN
            ALTER TABLE content_optimization_results ADD COLUMN content_analysis_job_id uuid;
        END IF;
    ELSE
        -- Create table if it doesn't exist at all
        CREATE TABLE content_optimization_results (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            content_analysis_job_id uuid REFERENCES content_analysis_jobs(id) ON DELETE CASCADE,
            readability_score numeric(5,2),
            keyword_density jsonb NOT NULL DEFAULT '{}'::jsonb,
            search_intent text,
            recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
            eeat_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
            navboost_friendly_patterns jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Add constraint if not exists (safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_optimization_results_intent_check') THEN
        ALTER TABLE content_optimization_results
        ADD CONSTRAINT content_optimization_results_intent_check
        CHECK (search_intent IS NULL OR search_intent IN (
            'informational', 'navigational', 'transactional', 'commercial', 'local'
        ));
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if constraint already exists or can't be added
END $$;

-- Add comments (safe - columns now guaranteed to exist)
COMMENT ON TABLE content_optimization_results IS 'Content analysis results with E-E-A-T signals and NavBoost-friendly patterns derived from Google leak insights.';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'readability_score') THEN
        COMMENT ON COLUMN content_optimization_results.readability_score IS 'Flesch-Kincaid or similar readability score 0-100';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'keyword_density') THEN
        COMMENT ON COLUMN content_optimization_results.keyword_density IS 'Primary and secondary keyword density metrics: {primary: {count, density}, secondary: [...]}';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'search_intent') THEN
        COMMENT ON COLUMN content_optimization_results.search_intent IS 'Detected search intent: informational, navigational, transactional, commercial, or local';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'recommendations') THEN
        COMMENT ON COLUMN content_optimization_results.recommendations IS 'Prioritized content improvement recommendations';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'eeat_scores') THEN
        COMMENT ON COLUMN content_optimization_results.eeat_scores IS 'E-E-A-T signal estimates: {experience: 0-100, expertise: 0-100, authoritativeness: 0-100, trustworthiness: 0-100}';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'navboost_friendly_patterns') THEN
        COMMENT ON COLUMN content_optimization_results.navboost_friendly_patterns IS 'Patterns that encourage user engagement (dwell time, scroll depth, clicks): {cta_clarity, content_depth, media_richness, internal_linking}';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_optimization_results_job ON content_optimization_results(content_analysis_job_id);

-- ============================================================================
-- 5. SCHEMA TEMPLATES
-- Reusable schema.org markup templates
-- ============================================================================

-- Ensure schema_templates table has all required columns (handles table from earlier migrations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_templates') THEN
        -- Add template_name if missing (old schema might use "name")
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_name') THEN
            -- Check if "name" column exists and copy data
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'name') THEN
                ALTER TABLE schema_templates ADD COLUMN template_name text;
                UPDATE schema_templates SET template_name = name WHERE template_name IS NULL;
            ELSE
                ALTER TABLE schema_templates ADD COLUMN template_name text DEFAULT 'Unnamed Template';
            END IF;
        END IF;
        -- Add schema_body if missing (old schema might use "template_json")
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_body') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_json') THEN
                ALTER TABLE schema_templates ADD COLUMN schema_body jsonb;
                UPDATE schema_templates SET schema_body = template_json WHERE schema_body IS NULL;
            ELSE
                ALTER TABLE schema_templates ADD COLUMN schema_body jsonb DEFAULT '{}'::jsonb;
            END IF;
        END IF;
        -- Add founder_business_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'founder_business_id') THEN
            ALTER TABLE schema_templates ADD COLUMN founder_business_id uuid;
        END IF;
        -- Add schema_type if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_type') THEN
            ALTER TABLE schema_templates ADD COLUMN schema_type text DEFAULT 'Article';
        END IF;
    ELSE
        CREATE TABLE schema_templates (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
            template_name text NOT NULL DEFAULT 'Unnamed Template',
            schema_type text NOT NULL DEFAULT 'Article',
            schema_body jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Add constraint safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schema_templates_type_check') THEN
        ALTER TABLE schema_templates ADD CONSTRAINT schema_templates_type_check
        CHECK (schema_type IS NULL OR schema_type IN (
            'Article', 'BlogPosting', 'Product', 'LocalBusiness', 'Organization',
            'Person', 'FAQ', 'HowTo', 'Review', 'Event', 'Recipe', 'Service',
            'WebPage', 'BreadcrumbList', 'VideoObject', 'ImageObject', 'Course'
        ));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add comments safely
COMMENT ON TABLE schema_templates IS 'Reusable schema.org markup templates. Rich results are critical ranking factors per Google leak documents.';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_name') THEN
        COMMENT ON COLUMN schema_templates.template_name IS 'Human-readable template name for identification';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_type') THEN
        COMMENT ON COLUMN schema_templates.schema_type IS 'Schema.org type: Article, Product, LocalBusiness, FAQ, HowTo, Review, Event, Recipe, etc.';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_body') THEN
        COMMENT ON COLUMN schema_templates.schema_body IS 'JSON-LD schema template with placeholders for dynamic values';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schema_templates_business ON schema_templates(founder_business_id);
CREATE INDEX IF NOT EXISTS idx_schema_templates_type ON schema_templates(schema_type);

-- ============================================================================
-- 6. GENERATED SCHEMAS
-- Generated schema markup for specific pages
-- ============================================================================

-- The pre-migration fix block adds missing columns, so CREATE TABLE IF NOT EXISTS is safe
CREATE TABLE IF NOT EXISTS generated_schemas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
    url text NOT NULL DEFAULT '',
    schema_type text NOT NULL DEFAULT 'Article',
    schema_body jsonb NOT NULL DEFAULT '{}'::jsonb,
    validation_status text,
    validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'proposed',
    created_at timestamptz NOT NULL DEFAULT now(),
    approved_at timestamptz
);

-- Add constraints safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_schemas_type_check') THEN
        ALTER TABLE generated_schemas ADD CONSTRAINT generated_schemas_type_check
        CHECK (schema_type IS NULL OR schema_type IN (
            'Article', 'BlogPosting', 'Product', 'LocalBusiness', 'Organization',
            'Person', 'FAQ', 'HowTo', 'Review', 'Event', 'Recipe', 'Service',
            'WebPage', 'BreadcrumbList', 'VideoObject', 'ImageObject', 'Course'
        ));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_schemas_validation_check') THEN
        ALTER TABLE generated_schemas ADD CONSTRAINT generated_schemas_validation_check
        CHECK (validation_status IS NULL OR validation_status IN ('pending', 'valid', 'warnings', 'errors'));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_schemas_status_check') THEN
        ALTER TABLE generated_schemas ADD CONSTRAINT generated_schemas_status_check
        CHECK (status IS NULL OR status IN ('proposed', 'approved', 'deployed', 'rejected', 'archived'));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

COMMENT ON TABLE generated_schemas IS 'Generated schema markup for specific pages. Requires human approval before deployment.';

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'url') THEN
        COMMENT ON COLUMN generated_schemas.url IS 'Target URL where schema will be deployed';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_type') THEN
        COMMENT ON COLUMN generated_schemas.schema_type IS 'Schema.org type being generated';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_body') THEN
        COMMENT ON COLUMN generated_schemas.schema_body IS 'Complete JSON-LD schema markup';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_status') THEN
        COMMENT ON COLUMN generated_schemas.validation_status IS 'Validation result: pending, valid, warnings, or errors';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_errors') THEN
        COMMENT ON COLUMN generated_schemas.validation_errors IS 'Array of validation errors or warnings from schema validator';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'status') THEN
        COMMENT ON COLUMN generated_schemas.status IS 'Approval workflow: proposed, approved, deployed, rejected, or archived';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_generated_schemas_business ON generated_schemas(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_schemas_status ON generated_schemas(status);

-- ============================================================================
-- 7. RICH RESULTS MONITORING
-- Track rich result opportunities and competitor presence
-- ============================================================================

CREATE TABLE IF NOT EXISTS rich_results_monitoring (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
    url text NOT NULL DEFAULT '',
    competitor_domain text,
    serp_feature text NOT NULL DEFAULT 'featured_snippet',
    status text,
    last_seen_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rich_results_serp_feature_check') THEN
        ALTER TABLE rich_results_monitoring ADD CONSTRAINT rich_results_serp_feature_check
        CHECK (serp_feature IS NULL OR serp_feature IN (
            'featured_snippet', 'people_also_ask', 'local_pack', 'knowledge_panel',
            'image_pack', 'video_carousel', 'top_stories', 'faq_rich_result',
            'howto_rich_result', 'product_rich_result', 'review_stars', 'recipe_rich_result',
            'event_rich_result', 'job_posting', 'course_listing', 'sitelinks'
        ));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rich_results_status_check') THEN
        ALTER TABLE rich_results_monitoring ADD CONSTRAINT rich_results_status_check
        CHECK (status IS NULL OR status IN ('available', 'captured', 'lost', 'competitor_owned', 'not_applicable'));
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

COMMENT ON TABLE rich_results_monitoring IS 'Track rich result opportunities and competitor presence. Rich results significantly impact CTR per Google leak NavBoost data.';

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'url') THEN
        COMMENT ON COLUMN rich_results_monitoring.url IS 'Your page URL targeting this rich result';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'competitor_domain') THEN
        COMMENT ON COLUMN rich_results_monitoring.competitor_domain IS 'Competitor domain currently owning this rich result (if any)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'serp_feature') THEN
        COMMENT ON COLUMN rich_results_monitoring.serp_feature IS 'SERP feature type: featured_snippet, people_also_ask, local_pack, etc.';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'status') THEN
        COMMENT ON COLUMN rich_results_monitoring.status IS 'Current status: available, captured, lost, competitor_owned, or not_applicable';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'last_seen_at') THEN
        COMMENT ON COLUMN rich_results_monitoring.last_seen_at IS 'When this rich result state was last verified';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rich_results_business ON rich_results_monitoring(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rich_results_feature ON rich_results_monitoring(serp_feature);

-- ============================================================================
-- 8. TITLE META TESTS
-- A/B testing for title tags and meta descriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS title_meta_tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    url text NOT NULL,
    keyword text,
    variant_a jsonb NOT NULL,
    variant_b jsonb NOT NULL,
    winner text,
    statistical_significance numeric(5,2),
    status text NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,

    CONSTRAINT title_meta_tests_winner_check CHECK (winner IS NULL OR winner IN ('a', 'b', 'no_winner', 'inconclusive')),
    CONSTRAINT title_meta_tests_status_check CHECK (status IN (
        'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'
    ))
);

COMMENT ON TABLE title_meta_tests IS 'A/B testing for titles and meta descriptions. Optimizing CTR is a key NavBoost signal per Google leak.';
COMMENT ON COLUMN title_meta_tests.url IS 'Page URL being tested';
COMMENT ON COLUMN title_meta_tests.keyword IS 'Target keyword for this test';
COMMENT ON COLUMN title_meta_tests.variant_a IS 'First variant: {title: string, meta_description: string, ctr: number, impressions: number, clicks: number}';
COMMENT ON COLUMN title_meta_tests.variant_b IS 'Second variant: {title: string, meta_description: string, ctr: number, impressions: number, clicks: number}';
COMMENT ON COLUMN title_meta_tests.winner IS 'Winning variant: a, b, no_winner, or inconclusive';
COMMENT ON COLUMN title_meta_tests.statistical_significance IS 'Statistical confidence level 0-100%';
COMMENT ON COLUMN title_meta_tests.status IS 'Test status: draft, scheduled, running, paused, completed, or cancelled';

CREATE INDEX IF NOT EXISTS idx_title_meta_tests_business ON title_meta_tests(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_title_meta_tests_status ON title_meta_tests(status);

-- ============================================================================
-- 9. CTR BENCHMARKS
-- CTR performance tracking with NavBoost inference
-- ============================================================================

CREATE TABLE IF NOT EXISTS ctr_benchmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    url text,
    keyword text NOT NULL,
    serp_position int NOT NULL,
    actual_ctr numeric(5,2),
    expected_ctr numeric(5,2),
    opportunity_level text,
    navboost_inference jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ctr_benchmarks_position_check CHECK (serp_position >= 1 AND serp_position <= 100),
    CONSTRAINT ctr_benchmarks_opportunity_check CHECK (opportunity_level IS NULL OR opportunity_level IN (
        'critical', 'high', 'medium', 'low', 'none'
    ))
);

COMMENT ON TABLE ctr_benchmarks IS 'CTR performance tracking with NavBoost inference. Compares actual vs expected CTR to identify optimization opportunities.';
COMMENT ON COLUMN ctr_benchmarks.url IS 'Page URL being tracked (optional for aggregate keyword tracking)';
COMMENT ON COLUMN ctr_benchmarks.keyword IS 'Keyword being tracked';
COMMENT ON COLUMN ctr_benchmarks.serp_position IS 'Current SERP position 1-100';
COMMENT ON COLUMN ctr_benchmarks.actual_ctr IS 'Actual CTR percentage from GSC/analytics';
COMMENT ON COLUMN ctr_benchmarks.expected_ctr IS 'Expected CTR based on position benchmarks';
COMMENT ON COLUMN ctr_benchmarks.opportunity_level IS 'CTR improvement opportunity: critical, high, medium, low, or none';
COMMENT ON COLUMN ctr_benchmarks.navboost_inference IS 'NavBoost signal inference: {click_satisfaction_estimate, dwell_time_signal, pogo_sticking_risk, competitor_ctr_comparison}';

CREATE INDEX IF NOT EXISTS idx_ctr_benchmarks_business ON ctr_benchmarks(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ctr_benchmarks_keyword ON ctr_benchmarks(keyword);
CREATE INDEX IF NOT EXISTS idx_ctr_benchmarks_opportunity ON ctr_benchmarks(opportunity_level);

-- ============================================================================
-- 10. COMPETITOR PROFILES
-- Tracked competitor domains
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    domain text NOT NULL,
    name text,
    metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT competitor_profiles_unique UNIQUE (founder_business_id, domain)
);

COMMENT ON TABLE competitor_profiles IS 'Tracked competitor domains for gap analysis and benchmarking.';
COMMENT ON COLUMN competitor_profiles.domain IS 'Competitor domain (e.g., competitor.com)';
COMMENT ON COLUMN competitor_profiles.name IS 'Human-readable competitor name';
COMMENT ON COLUMN competitor_profiles.metrics IS 'Aggregated metrics: {domain_authority, organic_keywords, backlinks, traffic_estimate, top_pages, content_themes}';

CREATE INDEX IF NOT EXISTS idx_competitor_profiles_business ON competitor_profiles(founder_business_id);
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_domain ON competitor_profiles(domain);

-- ============================================================================
-- 11. KEYWORD GAP ANALYSIS
-- Keyword opportunities where competitors rank but you don't
-- ============================================================================

CREATE TABLE IF NOT EXISTS keyword_gap_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    competitor_domain text,
    gap_type text,
    gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT keyword_gap_type_check CHECK (gap_type IS NULL OR gap_type IN (
        'competitor_only', 'you_outrank', 'they_outrank', 'shared_opportunity', 'untapped'
    ))
);

COMMENT ON TABLE keyword_gap_analysis IS 'Keyword gap analysis identifying opportunities where competitors rank but you do not.';
COMMENT ON COLUMN keyword_gap_analysis.competitor_domain IS 'Competitor domain analyzed (null for aggregate analysis)';
COMMENT ON COLUMN keyword_gap_analysis.gap_type IS 'Gap type: competitor_only, you_outrank, they_outrank, shared_opportunity, untapped';
COMMENT ON COLUMN keyword_gap_analysis.gaps IS 'Array of keyword gaps: [{keyword, your_position, competitor_position, search_volume, difficulty, opportunity_score}]';

CREATE INDEX IF NOT EXISTS idx_keyword_gap_business ON keyword_gap_analysis(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_gap_type ON keyword_gap_analysis(gap_type);

-- ============================================================================
-- 12. CONTENT GAP ANALYSIS
-- Topic clusters and content opportunities
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_gap_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    topic_cluster text,
    gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE content_gap_analysis IS 'Content topic gap analysis identifying underserved topic clusters and content opportunities.';
COMMENT ON COLUMN content_gap_analysis.topic_cluster IS 'Topic cluster or theme being analyzed';
COMMENT ON COLUMN content_gap_analysis.gaps IS 'Array of content gaps: [{topic, competitor_coverage, your_coverage, search_demand, content_type_recommendation, priority}]';

CREATE INDEX IF NOT EXISTS idx_content_gap_business ON content_gap_analysis(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_gap_topic ON content_gap_analysis(topic_cluster);

-- ============================================================================
-- 13. BACKLINK GAP ANALYSIS
-- Backlink opportunities from competitor analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS backlink_gap_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    competitor_domain text,
    gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE backlink_gap_analysis IS 'Backlink gap analysis identifying link opportunities from competitor backlink profiles.';
COMMENT ON COLUMN backlink_gap_analysis.competitor_domain IS 'Competitor domain whose backlinks were analyzed';
COMMENT ON COLUMN backlink_gap_analysis.gaps IS 'Array of backlink gaps: [{referring_domain, domain_authority, link_type, anchor_text, competitor_has, you_have, acquisition_difficulty}]';

CREATE INDEX IF NOT EXISTS idx_backlink_gap_business ON backlink_gap_analysis(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backlink_gap_competitor ON backlink_gap_analysis(competitor_domain);

-- ============================================================================
-- 14. SEO LEAK SIGNAL PROFILES
-- Leak-aligned ranking signal estimates (Q*/P*/T*, NavBoost, Site Authority)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_leak_signal_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    domain text NOT NULL,
    q_star_estimate numeric(5,2),
    p_star_estimate numeric(5,2),
    t_star_estimate numeric(5,2),
    site_authority_estimate numeric(5,2),
    navboost_strength_estimate numeric(5,2),
    sandbox_risk_estimate numeric(5,2),
    spam_risk_estimate numeric(5,2),
    eeat_strength_estimate numeric(5,2),
    topical_focus_score numeric(5,2),
    last_refreshed_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT seo_leak_signal_profiles_unique UNIQUE (founder_business_id, domain)
);

COMMENT ON TABLE seo_leak_signal_profiles IS 'Leak-aligned ranking signal profiles based on Google/DOJ/Yandex leak insights.';
COMMENT ON COLUMN seo_leak_signal_profiles.domain IS 'Domain being profiled';
COMMENT ON COLUMN seo_leak_signal_profiles.q_star_estimate IS 'Quality signal estimate (0-100) - derived from Yandex Q* factor';
COMMENT ON COLUMN seo_leak_signal_profiles.p_star_estimate IS 'Popularity signal estimate (0-100) - derived from Yandex P* factor';
COMMENT ON COLUMN seo_leak_signal_profiles.t_star_estimate IS 'Trust signal estimate (0-100) - derived from Yandex T* factor';
COMMENT ON COLUMN seo_leak_signal_profiles.site_authority_estimate IS 'Site-wide authority estimate (0-100) - similar to PageRank descendant signals';
COMMENT ON COLUMN seo_leak_signal_profiles.navboost_strength_estimate IS 'NavBoost signal strength (0-100) - user engagement signals from Google leak';
COMMENT ON COLUMN seo_leak_signal_profiles.sandbox_risk_estimate IS 'New site penalty risk (0-100) - likelihood of sandbox effect';
COMMENT ON COLUMN seo_leak_signal_profiles.spam_risk_estimate IS 'Spam/manipulation risk (0-100) - based on link profile and content patterns';
COMMENT ON COLUMN seo_leak_signal_profiles.eeat_strength_estimate IS 'E-E-A-T signal strength (0-100) - Experience, Expertise, Authority, Trust';
COMMENT ON COLUMN seo_leak_signal_profiles.topical_focus_score IS 'Topical authority focus (0-100) - how concentrated site is on core topics';
COMMENT ON COLUMN seo_leak_signal_profiles.last_refreshed_at IS 'When these estimates were last calculated';

CREATE INDEX IF NOT EXISTS idx_seo_leak_signal_business ON seo_leak_signal_profiles(founder_business_id);
CREATE INDEX IF NOT EXISTS idx_seo_leak_signal_domain ON seo_leak_signal_profiles(domain);

-- ============================================================================
-- 15. SEO LEAK RECOMMENDATIONS
-- Human-approved SEO recommendations based on leak insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_leak_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    target_type text NOT NULL,
    target_identifier text NOT NULL,
    factor_key text NOT NULL,
    factor_family text NOT NULL,
    severity text NOT NULL,
    summary text NOT NULL,
    details_md text NOT NULL,
    suggested_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
    requires_human_approval boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,

    CONSTRAINT seo_leak_rec_target_type_check CHECK (target_type IN (
        'domain', 'page', 'section', 'content', 'technical', 'backlink'
    )),
    CONSTRAINT seo_leak_rec_factor_family_check CHECK (factor_family IN (
        'navboost', 'quality', 'authority', 'trust', 'technical', 'content',
        'eeat', 'user_engagement', 'link_profile', 'spam_prevention'
    )),
    CONSTRAINT seo_leak_rec_severity_check CHECK (severity IN (
        'critical', 'high', 'medium', 'low', 'info'
    )),
    CONSTRAINT seo_leak_rec_status_check CHECK (status IN (
        'pending', 'approved', 'rejected', 'implemented', 'deferred', 'archived'
    ))
);

COMMENT ON TABLE seo_leak_recommendations IS 'Human-governed SEO recommendations based on leak insights. All significant changes require founder approval.';
COMMENT ON COLUMN seo_leak_recommendations.target_type IS 'What the recommendation targets: domain, page, section, content, technical, or backlink';
COMMENT ON COLUMN seo_leak_recommendations.target_identifier IS 'Specific URL, domain, or identifier being targeted';
COMMENT ON COLUMN seo_leak_recommendations.factor_key IS 'Specific ranking factor: navboost_ctr, site_authority, eeat_expertise, etc.';
COMMENT ON COLUMN seo_leak_recommendations.factor_family IS 'Factor category: navboost, quality, authority, trust, technical, content, eeat, user_engagement, link_profile, spam_prevention';
COMMENT ON COLUMN seo_leak_recommendations.severity IS 'Impact severity: critical, high, medium, low, or info';
COMMENT ON COLUMN seo_leak_recommendations.summary IS 'One-line summary of the recommendation';
COMMENT ON COLUMN seo_leak_recommendations.details_md IS 'Full recommendation details in Markdown format';
COMMENT ON COLUMN seo_leak_recommendations.suggested_changes IS 'Structured suggested changes: {before, after, implementation_steps, estimated_impact}';
COMMENT ON COLUMN seo_leak_recommendations.requires_human_approval IS 'Whether this change requires explicit founder approval (default true)';
COMMENT ON COLUMN seo_leak_recommendations.status IS 'Workflow status: pending, approved, rejected, implemented, deferred, or archived';

CREATE INDEX IF NOT EXISTS idx_seo_leak_rec_business ON seo_leak_recommendations(founder_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_leak_rec_status ON seo_leak_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_seo_leak_rec_severity ON seo_leak_recommendations(severity);
CREATE INDEX IF NOT EXISTS idx_seo_leak_rec_factor ON seo_leak_recommendations(factor_family);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE seo_audit_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rich_results_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_meta_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctr_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_leak_signal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_leak_recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: seo_audit_jobs
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "seo_audit_jobs_select_via_business" ON seo_audit_jobs;
CREATE POLICY "seo_audit_jobs_select_via_business" ON seo_audit_jobs
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_audit_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_audit_jobs_insert_via_business" ON seo_audit_jobs;
CREATE POLICY "seo_audit_jobs_insert_via_business" ON seo_audit_jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_audit_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_audit_jobs_update_via_business" ON seo_audit_jobs;
CREATE POLICY "seo_audit_jobs_update_via_business" ON seo_audit_jobs
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_audit_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_audit_jobs_delete_via_business" ON seo_audit_jobs;
CREATE POLICY "seo_audit_jobs_delete_via_business" ON seo_audit_jobs
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_audit_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: seo_audit_results
-- Access through seo_audit_jobs -> founder_businesses
-- ============================================================================

DROP POLICY IF EXISTS "seo_audit_results_select_via_job" ON seo_audit_results;
CREATE POLICY "seo_audit_results_select_via_job" ON seo_audit_results
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM seo_audit_jobs saj
            JOIN founder_businesses fb ON fb.id = saj.founder_business_id
            WHERE saj.id = seo_audit_results.seo_audit_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_audit_results_insert_via_job" ON seo_audit_results;
CREATE POLICY "seo_audit_results_insert_via_job" ON seo_audit_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM seo_audit_jobs saj
            JOIN founder_businesses fb ON fb.id = saj.founder_business_id
            WHERE saj.id = seo_audit_results.seo_audit_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_audit_results_update_via_job" ON seo_audit_results;
CREATE POLICY "seo_audit_results_update_via_job" ON seo_audit_results
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM seo_audit_jobs saj
            JOIN founder_businesses fb ON fb.id = saj.founder_business_id
            WHERE saj.id = seo_audit_results.seo_audit_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_audit_results_delete_via_job" ON seo_audit_results;
CREATE POLICY "seo_audit_results_delete_via_job" ON seo_audit_results
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM seo_audit_jobs saj
            JOIN founder_businesses fb ON fb.id = saj.founder_business_id
            WHERE saj.id = seo_audit_results.seo_audit_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: content_analysis_jobs
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "content_analysis_jobs_select_via_business" ON content_analysis_jobs;
CREATE POLICY "content_analysis_jobs_select_via_business" ON content_analysis_jobs
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_analysis_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_analysis_jobs_insert_via_business" ON content_analysis_jobs;
CREATE POLICY "content_analysis_jobs_insert_via_business" ON content_analysis_jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_analysis_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_analysis_jobs_update_via_business" ON content_analysis_jobs;
CREATE POLICY "content_analysis_jobs_update_via_business" ON content_analysis_jobs
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_analysis_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_analysis_jobs_delete_via_business" ON content_analysis_jobs;
CREATE POLICY "content_analysis_jobs_delete_via_business" ON content_analysis_jobs
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_analysis_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: content_optimization_results
-- Access through content_analysis_jobs -> founder_businesses
-- ============================================================================

DROP POLICY IF EXISTS "content_opt_results_select_via_job" ON content_optimization_results;
CREATE POLICY "content_opt_results_select_via_job" ON content_optimization_results
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM content_analysis_jobs caj
            JOIN founder_businesses fb ON fb.id = caj.founder_business_id
            WHERE caj.id = content_optimization_results.content_analysis_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_opt_results_insert_via_job" ON content_optimization_results;
CREATE POLICY "content_opt_results_insert_via_job" ON content_optimization_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_analysis_jobs caj
            JOIN founder_businesses fb ON fb.id = caj.founder_business_id
            WHERE caj.id = content_optimization_results.content_analysis_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_opt_results_update_via_job" ON content_optimization_results;
CREATE POLICY "content_opt_results_update_via_job" ON content_optimization_results
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM content_analysis_jobs caj
            JOIN founder_businesses fb ON fb.id = caj.founder_business_id
            WHERE caj.id = content_optimization_results.content_analysis_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_opt_results_delete_via_job" ON content_optimization_results;
CREATE POLICY "content_opt_results_delete_via_job" ON content_optimization_results
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM content_analysis_jobs caj
            JOIN founder_businesses fb ON fb.id = caj.founder_business_id
            WHERE caj.id = content_optimization_results.content_analysis_job_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: schema_templates
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "schema_templates_select_via_business" ON schema_templates;
CREATE POLICY "schema_templates_select_via_business" ON schema_templates
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = schema_templates.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "schema_templates_insert_via_business" ON schema_templates;
CREATE POLICY "schema_templates_insert_via_business" ON schema_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = schema_templates.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "schema_templates_update_via_business" ON schema_templates;
CREATE POLICY "schema_templates_update_via_business" ON schema_templates
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = schema_templates.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "schema_templates_delete_via_business" ON schema_templates;
CREATE POLICY "schema_templates_delete_via_business" ON schema_templates
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = schema_templates.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: generated_schemas
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "generated_schemas_select_via_business" ON generated_schemas;
CREATE POLICY "generated_schemas_select_via_business" ON generated_schemas
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = generated_schemas.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "generated_schemas_insert_via_business" ON generated_schemas;
CREATE POLICY "generated_schemas_insert_via_business" ON generated_schemas
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = generated_schemas.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "generated_schemas_update_via_business" ON generated_schemas;
CREATE POLICY "generated_schemas_update_via_business" ON generated_schemas
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = generated_schemas.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "generated_schemas_delete_via_business" ON generated_schemas;
CREATE POLICY "generated_schemas_delete_via_business" ON generated_schemas
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = generated_schemas.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: rich_results_monitoring
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "rich_results_select_via_business" ON rich_results_monitoring;
CREATE POLICY "rich_results_select_via_business" ON rich_results_monitoring
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = rich_results_monitoring.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "rich_results_insert_via_business" ON rich_results_monitoring;
CREATE POLICY "rich_results_insert_via_business" ON rich_results_monitoring
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = rich_results_monitoring.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "rich_results_update_via_business" ON rich_results_monitoring;
CREATE POLICY "rich_results_update_via_business" ON rich_results_monitoring
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = rich_results_monitoring.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "rich_results_delete_via_business" ON rich_results_monitoring;
CREATE POLICY "rich_results_delete_via_business" ON rich_results_monitoring
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = rich_results_monitoring.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: title_meta_tests
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "title_meta_tests_select_via_business" ON title_meta_tests;
CREATE POLICY "title_meta_tests_select_via_business" ON title_meta_tests
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = title_meta_tests.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "title_meta_tests_insert_via_business" ON title_meta_tests;
CREATE POLICY "title_meta_tests_insert_via_business" ON title_meta_tests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = title_meta_tests.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "title_meta_tests_update_via_business" ON title_meta_tests;
CREATE POLICY "title_meta_tests_update_via_business" ON title_meta_tests
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = title_meta_tests.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "title_meta_tests_delete_via_business" ON title_meta_tests;
CREATE POLICY "title_meta_tests_delete_via_business" ON title_meta_tests
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = title_meta_tests.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: ctr_benchmarks
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "ctr_benchmarks_select_via_business" ON ctr_benchmarks;
CREATE POLICY "ctr_benchmarks_select_via_business" ON ctr_benchmarks
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ctr_benchmarks.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ctr_benchmarks_insert_via_business" ON ctr_benchmarks;
CREATE POLICY "ctr_benchmarks_insert_via_business" ON ctr_benchmarks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ctr_benchmarks.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ctr_benchmarks_update_via_business" ON ctr_benchmarks;
CREATE POLICY "ctr_benchmarks_update_via_business" ON ctr_benchmarks
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ctr_benchmarks.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ctr_benchmarks_delete_via_business" ON ctr_benchmarks;
CREATE POLICY "ctr_benchmarks_delete_via_business" ON ctr_benchmarks
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ctr_benchmarks.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: competitor_profiles
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "competitor_profiles_select_via_business" ON competitor_profiles;
CREATE POLICY "competitor_profiles_select_via_business" ON competitor_profiles
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = competitor_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "competitor_profiles_insert_via_business" ON competitor_profiles;
CREATE POLICY "competitor_profiles_insert_via_business" ON competitor_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = competitor_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "competitor_profiles_update_via_business" ON competitor_profiles;
CREATE POLICY "competitor_profiles_update_via_business" ON competitor_profiles
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = competitor_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "competitor_profiles_delete_via_business" ON competitor_profiles;
CREATE POLICY "competitor_profiles_delete_via_business" ON competitor_profiles
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = competitor_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: keyword_gap_analysis
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "keyword_gap_select_via_business" ON keyword_gap_analysis;
CREATE POLICY "keyword_gap_select_via_business" ON keyword_gap_analysis
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = keyword_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "keyword_gap_insert_via_business" ON keyword_gap_analysis;
CREATE POLICY "keyword_gap_insert_via_business" ON keyword_gap_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = keyword_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "keyword_gap_update_via_business" ON keyword_gap_analysis;
CREATE POLICY "keyword_gap_update_via_business" ON keyword_gap_analysis
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = keyword_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "keyword_gap_delete_via_business" ON keyword_gap_analysis;
CREATE POLICY "keyword_gap_delete_via_business" ON keyword_gap_analysis
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = keyword_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: content_gap_analysis
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "content_gap_select_via_business" ON content_gap_analysis;
CREATE POLICY "content_gap_select_via_business" ON content_gap_analysis
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_gap_insert_via_business" ON content_gap_analysis;
CREATE POLICY "content_gap_insert_via_business" ON content_gap_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_gap_update_via_business" ON content_gap_analysis;
CREATE POLICY "content_gap_update_via_business" ON content_gap_analysis
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "content_gap_delete_via_business" ON content_gap_analysis;
CREATE POLICY "content_gap_delete_via_business" ON content_gap_analysis
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = content_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: backlink_gap_analysis
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "backlink_gap_select_via_business" ON backlink_gap_analysis;
CREATE POLICY "backlink_gap_select_via_business" ON backlink_gap_analysis
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = backlink_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "backlink_gap_insert_via_business" ON backlink_gap_analysis;
CREATE POLICY "backlink_gap_insert_via_business" ON backlink_gap_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = backlink_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "backlink_gap_update_via_business" ON backlink_gap_analysis;
CREATE POLICY "backlink_gap_update_via_business" ON backlink_gap_analysis
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = backlink_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "backlink_gap_delete_via_business" ON backlink_gap_analysis;
CREATE POLICY "backlink_gap_delete_via_business" ON backlink_gap_analysis
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = backlink_gap_analysis.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: seo_leak_signal_profiles
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "seo_leak_signals_select_via_business" ON seo_leak_signal_profiles;
CREATE POLICY "seo_leak_signals_select_via_business" ON seo_leak_signal_profiles
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_signal_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_leak_signals_insert_via_business" ON seo_leak_signal_profiles;
CREATE POLICY "seo_leak_signals_insert_via_business" ON seo_leak_signal_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_signal_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_leak_signals_update_via_business" ON seo_leak_signal_profiles;
CREATE POLICY "seo_leak_signals_update_via_business" ON seo_leak_signal_profiles
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_signal_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_leak_signals_delete_via_business" ON seo_leak_signal_profiles;
CREATE POLICY "seo_leak_signals_delete_via_business" ON seo_leak_signal_profiles
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_signal_profiles.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: seo_leak_recommendations
-- Access through founder_businesses ownership
-- ============================================================================

DROP POLICY IF EXISTS "seo_leak_rec_select_via_business" ON seo_leak_recommendations;
CREATE POLICY "seo_leak_rec_select_via_business" ON seo_leak_recommendations
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_recommendations.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_leak_rec_insert_via_business" ON seo_leak_recommendations;
CREATE POLICY "seo_leak_rec_insert_via_business" ON seo_leak_recommendations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_recommendations.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_leak_rec_update_via_business" ON seo_leak_recommendations;
CREATE POLICY "seo_leak_rec_update_via_business" ON seo_leak_recommendations
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_recommendations.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "seo_leak_rec_delete_via_business" ON seo_leak_recommendations;
CREATE POLICY "seo_leak_rec_delete_via_business" ON seo_leak_recommendations
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = seo_leak_recommendations.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Created 15 tables for the SEO Leak Engine:
--   1.  seo_audit_jobs              - Technical SEO audit job tracking
--   2.  seo_audit_results           - Audit findings with leak-aligned scores
--   3.  content_analysis_jobs       - Content optimization jobs
--   4.  content_optimization_results - Content analysis with E-E-A-T/NavBoost patterns
--   5.  schema_templates            - Reusable schema.org templates
--   6.  generated_schemas           - Generated schema markup with approval workflow
--   7.  rich_results_monitoring     - Track rich result opportunities
--   8.  title_meta_tests            - A/B testing for titles/meta descriptions
--   9.  ctr_benchmarks              - CTR performance with NavBoost inference
--   10. competitor_profiles         - Tracked competitor domains
--   11. keyword_gap_analysis        - Keyword gap opportunities
--   12. content_gap_analysis        - Content topic gaps
--   13. backlink_gap_analysis       - Backlink acquisition opportunities
--   14. seo_leak_signal_profiles    - Leak-aligned ranking signal estimates
--   15. seo_leak_recommendations    - Human-approved SEO recommendations
--
-- All tables:
--   - Reference founder_businesses(id) for multi-business support
--   - Have RLS enabled with ownership checks through founder_businesses
--   - Include comprehensive COMMENTS explaining Google/Yandex leak alignment
--   - Use CHECK constraints for enum-like fields
--   - Have appropriate indexes for common query patterns
-- ============================================================================;
