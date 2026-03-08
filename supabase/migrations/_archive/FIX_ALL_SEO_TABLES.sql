-- ============================================================================
-- COMPREHENSIVE FIX: Add all missing columns to SEO tables
-- Run this AFTER migrations 299-300 and BEFORE 301
-- This fixes ALL schema mismatches between migration 276 and 301
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Starting comprehensive SEO tables schema fix...';
    RAISE NOTICE '================================================';

    -- ========================================================================
    -- FIX 1: content_optimization_results
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_optimization_results') THEN
        RAISE NOTICE '';
        RAISE NOTICE '1. Fixing content_optimization_results...';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'search_intent') THEN
            ALTER TABLE content_optimization_results ADD COLUMN search_intent text;
            RAISE NOTICE '  ✓ Added search_intent';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'readability_score') THEN
            ALTER TABLE content_optimization_results ADD COLUMN readability_score numeric(5,2);
            RAISE NOTICE '  ✓ Added readability_score';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'keyword_density') THEN
            ALTER TABLE content_optimization_results ADD COLUMN keyword_density jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added keyword_density';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'recommendations') THEN
            ALTER TABLE content_optimization_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  ✓ Added recommendations';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'eeat_scores') THEN
            ALTER TABLE content_optimization_results ADD COLUMN eeat_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added eeat_scores';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'navboost_friendly_patterns') THEN
            ALTER TABLE content_optimization_results ADD COLUMN navboost_friendly_patterns jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added navboost_friendly_patterns';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'content_analysis_job_id') THEN
            ALTER TABLE content_optimization_results ADD COLUMN content_analysis_job_id uuid;
            RAISE NOTICE '  ✓ Added content_analysis_job_id';
            
            -- Migrate from old column name
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'analysis_job_id') THEN
                UPDATE content_optimization_results SET content_analysis_job_id = analysis_job_id WHERE content_analysis_job_id IS NULL;
                RAISE NOTICE '  ✓ Migrated data from analysis_job_id';
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- FIX 2: schema_templates
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_templates') THEN
        RAISE NOTICE '';
        RAISE NOTICE '2. Fixing schema_templates...';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_name') THEN
            ALTER TABLE schema_templates ADD COLUMN template_name text;
            RAISE NOTICE '  ✓ Added template_name';
            
            -- Migrate from 'name' column
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'name') THEN
                UPDATE schema_templates SET template_name = name WHERE template_name IS NULL;
                RAISE NOTICE '  ✓ Migrated data from name';
            END IF;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_body') THEN
            ALTER TABLE schema_templates ADD COLUMN schema_body jsonb;
            RAISE NOTICE '  ✓ Added schema_body';
            
            -- Migrate from 'template_json' column
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_json') THEN
                UPDATE schema_templates SET schema_body = template_json WHERE schema_body IS NULL;
                RAISE NOTICE '  ✓ Migrated data from template_json';
            END IF;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'founder_business_id') THEN
            ALTER TABLE schema_templates ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  ✓ Added founder_business_id';
        END IF;
    END IF;

    -- ========================================================================
    -- FIX 3: seo_audit_jobs
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_jobs') THEN
        RAISE NOTICE '';
        RAISE NOTICE '3. Fixing seo_audit_jobs...';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_type text DEFAULT 'domain';
            RAISE NOTICE '  ✓ Added target_type';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_identifier') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_identifier text;
            RAISE NOTICE '  ✓ Added target_identifier';
            
            -- Migrate from 'url' or 'domain' column if exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'url') THEN
                UPDATE seo_audit_jobs SET target_identifier = url WHERE target_identifier IS NULL;
                RAISE NOTICE '  ✓ Migrated data from url';
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'domain') THEN
                UPDATE seo_audit_jobs SET target_identifier = domain WHERE target_identifier IS NULL;
                RAISE NOTICE '  ✓ Migrated data from domain';
            END IF;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  ✓ Added founder_business_id';
        END IF;
    END IF;

    -- ========================================================================
    -- FIX 4: seo_audit_results
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_results') THEN
        RAISE NOTICE '';
        RAISE NOTICE '4. Fixing seo_audit_results...';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'seo_audit_job_id') THEN
            ALTER TABLE seo_audit_results ADD COLUMN seo_audit_job_id uuid;
            RAISE NOTICE '  ✓ Added seo_audit_job_id';
            
            -- Migrate from 'audit_job_id'
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'audit_job_id') THEN
                UPDATE seo_audit_results SET seo_audit_job_id = audit_job_id WHERE seo_audit_job_id IS NULL;
                RAISE NOTICE '  ✓ Migrated data from audit_job_id';
            END IF;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'core_web_vitals') THEN
            ALTER TABLE seo_audit_results ADD COLUMN core_web_vitals jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added core_web_vitals';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'leak_aligned_scores') THEN
            ALTER TABLE seo_audit_results ADD COLUMN leak_aligned_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added leak_aligned_scores';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'mobile_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN mobile_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added mobile_metrics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'security_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN security_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added security_metrics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'crawlability') THEN
            ALTER TABLE seo_audit_results ADD COLUMN crawlability jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  ✓ Added crawlability';
        END IF;
    END IF;

    -- ========================================================================
    -- FIX 5: content_analysis_jobs
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_analysis_jobs') THEN
        RAISE NOTICE '';
        RAISE NOTICE '5. Fixing content_analysis_jobs...';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  ✓ Added founder_business_id';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'secondary_keywords') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN secondary_keywords text[] DEFAULT '{}';
            RAISE NOTICE '  ✓ Added secondary_keywords';
        END IF;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ ALL SCHEMA FIXES COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'You can now run migration 301 and subsequent migrations.';
    RAISE NOTICE '';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE;
END $$;

-- ========================================================================
-- FIX 6: Add founder_business_id to all remaining tables (separate block)
-- ========================================================================
DO $$
DECLARE
    table_names text[] := ARRAY[
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
    RAISE NOTICE '';
    RAISE NOTICE '6. Adding founder_business_id to remaining tables...';

    FOREACH t IN ARRAY table_names LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'founder_business_id') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN founder_business_id uuid', t);
                RAISE NOTICE '  ✓ Added founder_business_id to %', t;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ founder_business_id fix completed!';
END $$;
