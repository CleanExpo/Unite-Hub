-- ============================================================================
-- DEFINITIVE PRE-MIGRATION FIX FOR 301 AND 303
-- ============================================================================
-- RUN THIS BEFORE migrations 301 and 303
-- This script handles ALL schema mismatches from migration 276
--
-- EXECUTION ORDER:
--   1. Run this file (300A_PRE_MIGRATION_FIX_ALL.sql)
--   2. Run 301_seo_leak_engine_core.sql
--   3. Run 302 (if you have it)
--   4. Run 303_multi_channel_autonomy.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX ALL TABLES FOR MIGRATION 301
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECTION 1: Preparing tables for Migration 301';
    RAISE NOTICE '========================================';
END $$;

-- -----------------------------------------------------------------------------
-- 1A. content_optimization_results
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_optimization_results') THEN
        RAISE NOTICE 'Fixing content_optimization_results...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'content_analysis_job_id') THEN
            ALTER TABLE content_optimization_results ADD COLUMN content_analysis_job_id uuid;
            RAISE NOTICE '  + content_analysis_job_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'search_intent') THEN
            ALTER TABLE content_optimization_results ADD COLUMN search_intent text;
            RAISE NOTICE '  + search_intent';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'readability_score') THEN
            ALTER TABLE content_optimization_results ADD COLUMN readability_score numeric(5,2);
            RAISE NOTICE '  + readability_score';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'keyword_density') THEN
            ALTER TABLE content_optimization_results ADD COLUMN keyword_density jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + keyword_density';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'recommendations') THEN
            ALTER TABLE content_optimization_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + recommendations';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'eeat_scores') THEN
            ALTER TABLE content_optimization_results ADD COLUMN eeat_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + eeat_scores';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'navboost_friendly_patterns') THEN
            ALTER TABLE content_optimization_results ADD COLUMN navboost_friendly_patterns jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + navboost_friendly_patterns';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'created_at') THEN
            ALTER TABLE content_optimization_results ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1B. schema_templates
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_templates') THEN
        RAISE NOTICE 'Fixing schema_templates...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_name') THEN
            ALTER TABLE schema_templates ADD COLUMN template_name text DEFAULT 'Unnamed';
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'name') THEN
                UPDATE schema_templates SET template_name = name WHERE template_name IS NULL OR template_name = 'Unnamed';
                RAISE NOTICE '  + template_name (migrated from name)';
            ELSE
                RAISE NOTICE '  + template_name';
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_body') THEN
            ALTER TABLE schema_templates ADD COLUMN schema_body jsonb DEFAULT '{}'::jsonb;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_json') THEN
                UPDATE schema_templates SET schema_body = template_json WHERE schema_body IS NULL OR schema_body = '{}'::jsonb;
                RAISE NOTICE '  + schema_body (migrated from template_json)';
            ELSE
                RAISE NOTICE '  + schema_body';
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'founder_business_id') THEN
            ALTER TABLE schema_templates ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_type') THEN
            ALTER TABLE schema_templates ADD COLUMN schema_type text DEFAULT 'Article';
            RAISE NOTICE '  + schema_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'created_at') THEN
            ALTER TABLE schema_templates ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1C. seo_audit_jobs
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_jobs') THEN
        RAISE NOTICE 'Fixing seo_audit_jobs...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_type text DEFAULT 'domain';
            RAISE NOTICE '  + target_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_identifier') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_identifier text DEFAULT '';
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'url') THEN
                UPDATE seo_audit_jobs SET target_identifier = url WHERE (target_identifier IS NULL OR target_identifier = '') AND url IS NOT NULL;
                RAISE NOTICE '  + target_identifier (migrated from url)';
            ELSE
                RAISE NOTICE '  + target_identifier';
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'audit_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN audit_type text DEFAULT 'full';
            RAISE NOTICE '  + audit_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'status') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN status text DEFAULT 'pending';
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'created_at') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'started_at') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN started_at timestamptz;
            RAISE NOTICE '  + started_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'finished_at') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN finished_at timestamptz;
            RAISE NOTICE '  + finished_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1D. seo_audit_results
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_results') THEN
        RAISE NOTICE 'Fixing seo_audit_results...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'seo_audit_job_id') THEN
            ALTER TABLE seo_audit_results ADD COLUMN seo_audit_job_id uuid;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'audit_job_id') THEN
                UPDATE seo_audit_results SET seo_audit_job_id = audit_job_id WHERE seo_audit_job_id IS NULL;
                RAISE NOTICE '  + seo_audit_job_id (migrated from audit_job_id)';
            ELSE
                RAISE NOTICE '  + seo_audit_job_id';
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'overall_score') THEN
            ALTER TABLE seo_audit_results ADD COLUMN overall_score numeric(5,2);
            RAISE NOTICE '  + overall_score';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'core_web_vitals') THEN
            ALTER TABLE seo_audit_results ADD COLUMN core_web_vitals jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + core_web_vitals';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'technical_issues') THEN
            ALTER TABLE seo_audit_results ADD COLUMN technical_issues jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + technical_issues';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'mobile_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN mobile_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + mobile_metrics';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'security_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN security_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + security_metrics';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'crawlability') THEN
            ALTER TABLE seo_audit_results ADD COLUMN crawlability jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + crawlability';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'leak_aligned_scores') THEN
            ALTER TABLE seo_audit_results ADD COLUMN leak_aligned_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + leak_aligned_scores';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'recommendations') THEN
            ALTER TABLE seo_audit_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + recommendations';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'created_at') THEN
            ALTER TABLE seo_audit_results ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1E. content_analysis_jobs
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_analysis_jobs') THEN
        RAISE NOTICE 'Fixing content_analysis_jobs...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'url') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN url text DEFAULT '';
            RAISE NOTICE '  + url';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'target_keyword') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN target_keyword text;
            RAISE NOTICE '  + target_keyword';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'secondary_keywords') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN secondary_keywords text[] DEFAULT '{}';
            RAISE NOTICE '  + secondary_keywords';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'status') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN status text DEFAULT 'pending';
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'created_at') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1F. generated_schemas
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_schemas') THEN
        RAISE NOTICE 'Fixing generated_schemas...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'founder_business_id') THEN
            ALTER TABLE generated_schemas ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'url') THEN
            ALTER TABLE generated_schemas ADD COLUMN url text DEFAULT '';
            RAISE NOTICE '  + url';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_type') THEN
            ALTER TABLE generated_schemas ADD COLUMN schema_type text DEFAULT 'Article';
            RAISE NOTICE '  + schema_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_body') THEN
            ALTER TABLE generated_schemas ADD COLUMN schema_body jsonb DEFAULT '{}'::jsonb;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_json') THEN
                UPDATE generated_schemas SET schema_body = schema_json WHERE schema_body IS NULL OR schema_body = '{}'::jsonb;
                RAISE NOTICE '  + schema_body (migrated from schema_json)';
            ELSE
                RAISE NOTICE '  + schema_body';
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_status') THEN
            ALTER TABLE generated_schemas ADD COLUMN validation_status text;
            RAISE NOTICE '  + validation_status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_errors') THEN
            ALTER TABLE generated_schemas ADD COLUMN validation_errors jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + validation_errors';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'status') THEN
            ALTER TABLE generated_schemas ADD COLUMN status text DEFAULT 'proposed';
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'created_at') THEN
            ALTER TABLE generated_schemas ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'approved_at') THEN
            ALTER TABLE generated_schemas ADD COLUMN approved_at timestamptz;
            RAISE NOTICE '  + approved_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1G. rich_results_monitoring
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rich_results_monitoring') THEN
        RAISE NOTICE 'Fixing rich_results_monitoring...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'founder_business_id') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'url') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN url text DEFAULT '';
            RAISE NOTICE '  + url';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'competitor_domain') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN competitor_domain text;
            RAISE NOTICE '  + competitor_domain';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'serp_feature') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN serp_feature text DEFAULT 'featured_snippet';
            RAISE NOTICE '  + serp_feature';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'status') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN status text;
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'last_seen_at') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN last_seen_at timestamptz;
            RAISE NOTICE '  + last_seen_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'created_at') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1H. title_meta_tests
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'title_meta_tests') THEN
        RAISE NOTICE 'Fixing title_meta_tests...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'founder_business_id') THEN
            ALTER TABLE title_meta_tests ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'url') THEN
            ALTER TABLE title_meta_tests ADD COLUMN url text DEFAULT '';
            RAISE NOTICE '  + url';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'keyword') THEN
            ALTER TABLE title_meta_tests ADD COLUMN keyword text;
            RAISE NOTICE '  + keyword';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'variant_a') THEN
            ALTER TABLE title_meta_tests ADD COLUMN variant_a jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + variant_a';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'variant_b') THEN
            ALTER TABLE title_meta_tests ADD COLUMN variant_b jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + variant_b';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'winner') THEN
            ALTER TABLE title_meta_tests ADD COLUMN winner text;
            RAISE NOTICE '  + winner';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'statistical_significance') THEN
            ALTER TABLE title_meta_tests ADD COLUMN statistical_significance numeric(5,2);
            RAISE NOTICE '  + statistical_significance';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'status') THEN
            ALTER TABLE title_meta_tests ADD COLUMN status text DEFAULT 'draft';
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'created_at') THEN
            ALTER TABLE title_meta_tests ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'started_at') THEN
            ALTER TABLE title_meta_tests ADD COLUMN started_at timestamptz;
            RAISE NOTICE '  + started_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'completed_at') THEN
            ALTER TABLE title_meta_tests ADD COLUMN completed_at timestamptz;
            RAISE NOTICE '  + completed_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1I. ctr_benchmarks
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ctr_benchmarks') THEN
        RAISE NOTICE 'Fixing ctr_benchmarks...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'founder_business_id') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'url') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN url text;
            RAISE NOTICE '  + url';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'keyword') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN keyword text DEFAULT '';
            RAISE NOTICE '  + keyword';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'serp_position') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN serp_position int DEFAULT 1;
            RAISE NOTICE '  + serp_position';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'actual_ctr') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN actual_ctr numeric(5,2);
            RAISE NOTICE '  + actual_ctr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'expected_ctr') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN expected_ctr numeric(5,2);
            RAISE NOTICE '  + expected_ctr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'opportunity_level') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN opportunity_level text;
            RAISE NOTICE '  + opportunity_level';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'navboost_inference') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN navboost_inference jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + navboost_inference';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'created_at') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1J. competitor_profiles
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitor_profiles') THEN
        RAISE NOTICE 'Fixing competitor_profiles...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'founder_business_id') THEN
            ALTER TABLE competitor_profiles ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'domain') THEN
            ALTER TABLE competitor_profiles ADD COLUMN domain text DEFAULT '';
            RAISE NOTICE '  + domain';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'name') THEN
            ALTER TABLE competitor_profiles ADD COLUMN name text;
            RAISE NOTICE '  + name';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'metrics') THEN
            ALTER TABLE competitor_profiles ADD COLUMN metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + metrics';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'created_at') THEN
            ALTER TABLE competitor_profiles ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'updated_at') THEN
            ALTER TABLE competitor_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
            RAISE NOTICE '  + updated_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1K. keyword_gap_analysis
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'keyword_gap_analysis') THEN
        RAISE NOTICE 'Fixing keyword_gap_analysis...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keyword_gap_analysis' AND column_name = 'founder_business_id') THEN
            ALTER TABLE keyword_gap_analysis ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keyword_gap_analysis' AND column_name = 'competitor_domain') THEN
            ALTER TABLE keyword_gap_analysis ADD COLUMN competitor_domain text;
            RAISE NOTICE '  + competitor_domain';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keyword_gap_analysis' AND column_name = 'gap_type') THEN
            ALTER TABLE keyword_gap_analysis ADD COLUMN gap_type text;
            RAISE NOTICE '  + gap_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keyword_gap_analysis' AND column_name = 'gaps') THEN
            ALTER TABLE keyword_gap_analysis ADD COLUMN gaps jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + gaps';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keyword_gap_analysis' AND column_name = 'created_at') THEN
            ALTER TABLE keyword_gap_analysis ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1L. content_gap_analysis
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_gap_analysis') THEN
        RAISE NOTICE 'Fixing content_gap_analysis...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_gap_analysis' AND column_name = 'founder_business_id') THEN
            ALTER TABLE content_gap_analysis ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_gap_analysis' AND column_name = 'topic_cluster') THEN
            ALTER TABLE content_gap_analysis ADD COLUMN topic_cluster text;
            RAISE NOTICE '  + topic_cluster';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_gap_analysis' AND column_name = 'gaps') THEN
            ALTER TABLE content_gap_analysis ADD COLUMN gaps jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + gaps';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_gap_analysis' AND column_name = 'created_at') THEN
            ALTER TABLE content_gap_analysis ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1M. backlink_gap_analysis
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backlink_gap_analysis') THEN
        RAISE NOTICE 'Fixing backlink_gap_analysis...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_gap_analysis' AND column_name = 'founder_business_id') THEN
            ALTER TABLE backlink_gap_analysis ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_gap_analysis' AND column_name = 'competitor_domain') THEN
            ALTER TABLE backlink_gap_analysis ADD COLUMN competitor_domain text;
            RAISE NOTICE '  + competitor_domain';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_gap_analysis' AND column_name = 'gaps') THEN
            ALTER TABLE backlink_gap_analysis ADD COLUMN gaps jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + gaps';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_gap_analysis' AND column_name = 'created_at') THEN
            ALTER TABLE backlink_gap_analysis ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1N. seo_leak_signal_profiles
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_leak_signal_profiles') THEN
        RAISE NOTICE 'Fixing seo_leak_signal_profiles...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_leak_signal_profiles' AND column_name = 'founder_business_id') THEN
            ALTER TABLE seo_leak_signal_profiles ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_leak_signal_profiles' AND column_name = 'domain') THEN
            ALTER TABLE seo_leak_signal_profiles ADD COLUMN domain text DEFAULT '';
            RAISE NOTICE '  + domain';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_leak_signal_profiles' AND column_name = 'last_refreshed_at') THEN
            ALTER TABLE seo_leak_signal_profiles ADD COLUMN last_refreshed_at timestamptz DEFAULT now();
            RAISE NOTICE '  + last_refreshed_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1O. seo_leak_recommendations
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_leak_recommendations') THEN
        RAISE NOTICE 'Fixing seo_leak_recommendations...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_leak_recommendations' AND column_name = 'founder_business_id') THEN
            ALTER TABLE seo_leak_recommendations ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_leak_recommendations' AND column_name = 'created_at') THEN
            ALTER TABLE seo_leak_recommendations ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: FIX ALL TABLES FOR MIGRATION 303
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECTION 2: Preparing tables for Migration 303';
    RAISE NOTICE '========================================';
END $$;

-- -----------------------------------------------------------------------------
-- 2A. social_inbox_accounts
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_inbox_accounts') THEN
        RAISE NOTICE 'Fixing social_inbox_accounts...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'founder_business_id') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'provider') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN provider text DEFAULT 'facebook';
            RAISE NOTICE '  + provider';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'account_handle') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN account_handle text DEFAULT '';
            RAISE NOTICE '  + account_handle';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'account_id_external') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN account_id_external text;
            RAISE NOTICE '  + account_id_external';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'access_token_encrypted') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN access_token_encrypted text;
            RAISE NOTICE '  + access_token_encrypted';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'status') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN status text DEFAULT 'active';
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'connected_at') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN connected_at timestamptz DEFAULT now();
            RAISE NOTICE '  + connected_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2B. social_messages
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_messages') THEN
        RAISE NOTICE 'Fixing social_messages...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'social_inbox_account_id') THEN
            ALTER TABLE social_messages ADD COLUMN social_inbox_account_id uuid;
            RAISE NOTICE '  + social_inbox_account_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'direction') THEN
            ALTER TABLE social_messages ADD COLUMN direction text DEFAULT 'inbound';
            RAISE NOTICE '  + direction';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'message_type') THEN
            ALTER TABLE social_messages ADD COLUMN message_type text DEFAULT 'text';
            RAISE NOTICE '  + message_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'message') THEN
            ALTER TABLE social_messages ADD COLUMN message text DEFAULT '';
            RAISE NOTICE '  + message';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'sender_handle') THEN
            ALTER TABLE social_messages ADD COLUMN sender_handle text;
            RAISE NOTICE '  + sender_handle';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'metadata') THEN
            ALTER TABLE social_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + metadata';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'sentiment_score') THEN
            ALTER TABLE social_messages ADD COLUMN sentiment_score numeric;
            RAISE NOTICE '  + sentiment_score';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'created_at') THEN
            ALTER TABLE social_messages ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2C. ads_accounts
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ads_accounts') THEN
        RAISE NOTICE 'Fixing ads_accounts...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'founder_business_id') THEN
            ALTER TABLE ads_accounts ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'provider') THEN
            ALTER TABLE ads_accounts ADD COLUMN provider text DEFAULT 'google_ads';
            RAISE NOTICE '  + provider';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'account_id_external') THEN
            ALTER TABLE ads_accounts ADD COLUMN account_id_external text;
            RAISE NOTICE '  + account_id_external';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'account_meta') THEN
            ALTER TABLE ads_accounts ADD COLUMN account_meta jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + account_meta';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'status') THEN
            ALTER TABLE ads_accounts ADD COLUMN status text DEFAULT 'active';
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'created_at') THEN
            ALTER TABLE ads_accounts ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2D. ads_opportunities
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ads_opportunities') THEN
        RAISE NOTICE 'Fixing ads_opportunities...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'ads_account_id') THEN
            ALTER TABLE ads_opportunities ADD COLUMN ads_account_id uuid;
            RAISE NOTICE '  + ads_account_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'opportunity_type') THEN
            ALTER TABLE ads_opportunities ADD COLUMN opportunity_type text DEFAULT 'budget_optimization';
            RAISE NOTICE '  + opportunity_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'summary') THEN
            ALTER TABLE ads_opportunities ADD COLUMN summary text DEFAULT '';
            RAISE NOTICE '  + summary';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'impact_estimate') THEN
            ALTER TABLE ads_opportunities ADD COLUMN impact_estimate numeric;
            RAISE NOTICE '  + impact_estimate';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'confidence') THEN
            ALTER TABLE ads_opportunities ADD COLUMN confidence numeric;
            RAISE NOTICE '  + confidence';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'recommended_action') THEN
            ALTER TABLE ads_opportunities ADD COLUMN recommended_action text;
            RAISE NOTICE '  + recommended_action';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'status') THEN
            ALTER TABLE ads_opportunities ADD COLUMN status text DEFAULT 'pending';
            RAISE NOTICE '  + status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'created_at') THEN
            ALTER TABLE ads_opportunities ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2E. search_keywords
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_keywords') THEN
        RAISE NOTICE 'Fixing search_keywords...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'founder_business_id') THEN
            ALTER TABLE search_keywords ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'keyword') THEN
            ALTER TABLE search_keywords ADD COLUMN keyword text DEFAULT '';
            RAISE NOTICE '  + keyword';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'search_engine') THEN
            ALTER TABLE search_keywords ADD COLUMN search_engine text DEFAULT 'google';
            RAISE NOTICE '  + search_engine';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'serp_position') THEN
            ALTER TABLE search_keywords ADD COLUMN serp_position int;
            RAISE NOTICE '  + serp_position';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'impressions') THEN
            ALTER TABLE search_keywords ADD COLUMN impressions int;
            RAISE NOTICE '  + impressions';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'clicks') THEN
            ALTER TABLE search_keywords ADD COLUMN clicks int;
            RAISE NOTICE '  + clicks';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'ctr') THEN
            ALTER TABLE search_keywords ADD COLUMN ctr numeric;
            RAISE NOTICE '  + ctr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'volatility') THEN
            ALTER TABLE search_keywords ADD COLUMN volatility numeric;
            RAISE NOTICE '  + volatility';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'trend') THEN
            ALTER TABLE search_keywords ADD COLUMN trend text;
            RAISE NOTICE '  + trend';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'observed_at') THEN
            ALTER TABLE search_keywords ADD COLUMN observed_at timestamptz DEFAULT now();
            RAISE NOTICE '  + observed_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'created_at') THEN
            ALTER TABLE search_keywords ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2F. browser_patterns
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'browser_patterns') THEN
        RAISE NOTICE 'Fixing browser_patterns...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'founder_business_id') THEN
            ALTER TABLE browser_patterns ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'pattern_name') THEN
            ALTER TABLE browser_patterns ADD COLUMN pattern_name text DEFAULT 'Unnamed';
            RAISE NOTICE '  + pattern_name';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'pattern_type') THEN
            ALTER TABLE browser_patterns ADD COLUMN pattern_type text DEFAULT 'custom';
            RAISE NOTICE '  + pattern_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'pattern_steps') THEN
            ALTER TABLE browser_patterns ADD COLUMN pattern_steps jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + pattern_steps';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'success_rate') THEN
            ALTER TABLE browser_patterns ADD COLUMN success_rate numeric;
            RAISE NOTICE '  + success_rate';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'last_executed_at') THEN
            ALTER TABLE browser_patterns ADD COLUMN last_executed_at timestamptz;
            RAISE NOTICE '  + last_executed_at';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'created_at') THEN
            ALTER TABLE browser_patterns ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: DROP CONFLICTING CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECTION 3: Dropping conflicting constraints';
    RAISE NOTICE '========================================';

    -- Drop constraints that might conflict with new migrations
    -- These will be recreated by the migrations with proper definitions

    -- seo_audit_jobs constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_target_type_check') THEN
        ALTER TABLE seo_audit_jobs DROP CONSTRAINT seo_audit_jobs_target_type_check;
        RAISE NOTICE '  - Dropped seo_audit_jobs_target_type_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_audit_type_check') THEN
        ALTER TABLE seo_audit_jobs DROP CONSTRAINT seo_audit_jobs_audit_type_check;
        RAISE NOTICE '  - Dropped seo_audit_jobs_audit_type_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_audit_jobs_status_check') THEN
        ALTER TABLE seo_audit_jobs DROP CONSTRAINT seo_audit_jobs_status_check;
        RAISE NOTICE '  - Dropped seo_audit_jobs_status_check';
    END IF;

    -- content_optimization_results constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_optimization_results_intent_check') THEN
        ALTER TABLE content_optimization_results DROP CONSTRAINT content_optimization_results_intent_check;
        RAISE NOTICE '  - Dropped content_optimization_results_intent_check';
    END IF;

    -- schema_templates constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schema_templates_type_check') THEN
        ALTER TABLE schema_templates DROP CONSTRAINT schema_templates_type_check;
        RAISE NOTICE '  - Dropped schema_templates_type_check';
    END IF;

    -- content_analysis_jobs constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_analysis_jobs_status_check') THEN
        ALTER TABLE content_analysis_jobs DROP CONSTRAINT content_analysis_jobs_status_check;
        RAISE NOTICE '  - Dropped content_analysis_jobs_status_check';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '  (Some constraints may not exist - this is OK)';
END $$;

-- ============================================================================
-- FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PRE-MIGRATION FIX COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All tables prepared for migrations 301 and 303.';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run 301_seo_leak_engine_core.sql';
    RAISE NOTICE '  2. Run 302 (if applicable)';
    RAISE NOTICE '  3. Run 303_multi_channel_autonomy.sql';
    RAISE NOTICE '';
END $$;
