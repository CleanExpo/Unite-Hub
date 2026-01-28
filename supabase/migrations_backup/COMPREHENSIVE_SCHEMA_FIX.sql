-- ============================================================================
-- COMPREHENSIVE SCHEMA FIX
-- Run this ONCE to fix ALL schema issues across migrations 301 and 303
-- This handles tables created by migration 276 with old schemas
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Migration 276/301 Schema Mismatches
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== PART 1: Fixing Migration 301 Schema Issues ===';

    -- Fix content_optimization_results
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_optimization_results') THEN
        RAISE NOTICE 'Fixing content_optimization_results...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'search_intent') THEN
            ALTER TABLE content_optimization_results ADD COLUMN search_intent text;
            RAISE NOTICE '  + Added search_intent';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'readability_score') THEN
            ALTER TABLE content_optimization_results ADD COLUMN readability_score numeric(5,2);
            RAISE NOTICE '  + Added readability_score';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'keyword_density') THEN
            ALTER TABLE content_optimization_results ADD COLUMN keyword_density jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added keyword_density';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'recommendations') THEN
            ALTER TABLE content_optimization_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + Added recommendations';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'eeat_scores') THEN
            ALTER TABLE content_optimization_results ADD COLUMN eeat_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added eeat_scores';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'navboost_friendly_patterns') THEN
            ALTER TABLE content_optimization_results ADD COLUMN navboost_friendly_patterns jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added navboost_friendly_patterns';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'content_analysis_job_id') THEN
            ALTER TABLE content_optimization_results ADD COLUMN content_analysis_job_id uuid;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'analysis_job_id') THEN
                UPDATE content_optimization_results SET content_analysis_job_id = analysis_job_id WHERE content_analysis_job_id IS NULL;
            END IF;
            RAISE NOTICE '  + Added content_analysis_job_id';
        END IF;
    END IF;

    -- Fix schema_templates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_templates') THEN
        RAISE NOTICE 'Fixing schema_templates...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_name') THEN
            ALTER TABLE schema_templates ADD COLUMN template_name text;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'name') THEN
                UPDATE schema_templates SET template_name = name WHERE template_name IS NULL;
            END IF;
            RAISE NOTICE '  + Added template_name';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'schema_body') THEN
            ALTER TABLE schema_templates ADD COLUMN schema_body jsonb DEFAULT '{}'::jsonb;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'template_json') THEN
                UPDATE schema_templates SET schema_body = template_json WHERE schema_body IS NULL;
            END IF;
            RAISE NOTICE '  + Added schema_body';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schema_templates' AND column_name = 'founder_business_id') THEN
            ALTER TABLE schema_templates ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + Added founder_business_id';
        END IF;
    END IF;

    -- Fix seo_audit_jobs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_jobs') THEN
        RAISE NOTICE 'Fixing seo_audit_jobs...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_type text DEFAULT 'domain';
            RAISE NOTICE '  + Added target_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'target_identifier') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN target_identifier text DEFAULT '';
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'url') THEN
                UPDATE seo_audit_jobs SET target_identifier = url WHERE target_identifier = '' OR target_identifier IS NULL;
            END IF;
            RAISE NOTICE '  + Added target_identifier';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'audit_type') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN audit_type text DEFAULT 'full';
            RAISE NOTICE '  + Added audit_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE seo_audit_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + Added founder_business_id';
        END IF;
    END IF;

    -- Fix seo_audit_results
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_audit_results') THEN
        RAISE NOTICE 'Fixing seo_audit_results...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'seo_audit_job_id') THEN
            ALTER TABLE seo_audit_results ADD COLUMN seo_audit_job_id uuid;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'audit_job_id') THEN
                UPDATE seo_audit_results SET seo_audit_job_id = audit_job_id WHERE seo_audit_job_id IS NULL;
            END IF;
            RAISE NOTICE '  + Added seo_audit_job_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'core_web_vitals') THEN
            ALTER TABLE seo_audit_results ADD COLUMN core_web_vitals jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added core_web_vitals';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'overall_score') THEN
            ALTER TABLE seo_audit_results ADD COLUMN overall_score numeric(5,2);
            RAISE NOTICE '  + Added overall_score';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'technical_issues') THEN
            ALTER TABLE seo_audit_results ADD COLUMN technical_issues jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + Added technical_issues';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'mobile_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN mobile_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added mobile_metrics';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'security_metrics') THEN
            ALTER TABLE seo_audit_results ADD COLUMN security_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added security_metrics';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'crawlability') THEN
            ALTER TABLE seo_audit_results ADD COLUMN crawlability jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added crawlability';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'leak_aligned_scores') THEN
            ALTER TABLE seo_audit_results ADD COLUMN leak_aligned_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added leak_aligned_scores';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seo_audit_results' AND column_name = 'recommendations') THEN
            ALTER TABLE seo_audit_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + Added recommendations';
        END IF;
    END IF;

    -- Fix content_analysis_jobs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_analysis_jobs') THEN
        RAISE NOTICE 'Fixing content_analysis_jobs...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'founder_business_id') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + Added founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'secondary_keywords') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN secondary_keywords text[] DEFAULT '{}';
            RAISE NOTICE '  + Added secondary_keywords';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_analysis_jobs' AND column_name = 'target_keyword') THEN
            ALTER TABLE content_analysis_jobs ADD COLUMN target_keyword text;
            RAISE NOTICE '  + Added target_keyword';
        END IF;
    END IF;

    RAISE NOTICE '=== Part 1 Complete ===';
END $$;

-- ============================================================================
-- PART 2: Add founder_business_id to ALL remaining tables
-- ============================================================================

DO $$
DECLARE
    tables_needing_business_id text[] := ARRAY[
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
    RAISE NOTICE '=== PART 2: Adding founder_business_id to Remaining Tables ===';

    FOREACH t IN ARRAY tables_needing_business_id LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'founder_business_id') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN founder_business_id uuid', t);
                RAISE NOTICE '  + Added founder_business_id to %', t;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE '=== Part 2 Complete ===';
END $$;

-- ============================================================================
-- PART 3: Fix Migration 303 Schema Issues (Multi-Channel Tables)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== PART 3: Fixing Migration 303 Schema Issues ===';

    -- Fix social_inbox_accounts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_inbox_accounts') THEN
        RAISE NOTICE 'Fixing social_inbox_accounts...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'founder_business_id') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + Added founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'provider') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN provider text DEFAULT 'facebook';
            RAISE NOTICE '  + Added provider';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'account_handle') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN account_handle text DEFAULT '';
            RAISE NOTICE '  + Added account_handle';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'account_id_external') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN account_id_external text;
            RAISE NOTICE '  + Added account_id_external';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'access_token_encrypted') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN access_token_encrypted text;
            RAISE NOTICE '  + Added access_token_encrypted';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'status') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN status text DEFAULT 'active';
            RAISE NOTICE '  + Added status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_inbox_accounts' AND column_name = 'connected_at') THEN
            ALTER TABLE social_inbox_accounts ADD COLUMN connected_at timestamptz DEFAULT now();
            RAISE NOTICE '  + Added connected_at';
        END IF;
    END IF;

    -- Fix social_messages
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_messages') THEN
        RAISE NOTICE 'Fixing social_messages...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'social_inbox_account_id') THEN
            ALTER TABLE social_messages ADD COLUMN social_inbox_account_id uuid;
            RAISE NOTICE '  + Added social_inbox_account_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'direction') THEN
            ALTER TABLE social_messages ADD COLUMN direction text DEFAULT 'inbound';
            RAISE NOTICE '  + Added direction';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'message_type') THEN
            ALTER TABLE social_messages ADD COLUMN message_type text DEFAULT 'text';
            RAISE NOTICE '  + Added message_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'message') THEN
            ALTER TABLE social_messages ADD COLUMN message text DEFAULT '';
            RAISE NOTICE '  + Added message';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'sender_handle') THEN
            ALTER TABLE social_messages ADD COLUMN sender_handle text;
            RAISE NOTICE '  + Added sender_handle';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'metadata') THEN
            ALTER TABLE social_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added metadata';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_messages' AND column_name = 'sentiment_score') THEN
            ALTER TABLE social_messages ADD COLUMN sentiment_score numeric;
            RAISE NOTICE '  + Added sentiment_score';
        END IF;
    END IF;

    -- Fix ads_accounts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ads_accounts') THEN
        RAISE NOTICE 'Fixing ads_accounts...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'founder_business_id') THEN
            ALTER TABLE ads_accounts ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + Added founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'provider') THEN
            ALTER TABLE ads_accounts ADD COLUMN provider text DEFAULT 'google_ads';
            RAISE NOTICE '  + Added provider';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'account_id_external') THEN
            ALTER TABLE ads_accounts ADD COLUMN account_id_external text;
            RAISE NOTICE '  + Added account_id_external';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'account_meta') THEN
            ALTER TABLE ads_accounts ADD COLUMN account_meta jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added account_meta';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_accounts' AND column_name = 'status') THEN
            ALTER TABLE ads_accounts ADD COLUMN status text DEFAULT 'active';
            RAISE NOTICE '  + Added status';
        END IF;
    END IF;

    -- Fix ads_opportunities
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ads_opportunities') THEN
        RAISE NOTICE 'Fixing ads_opportunities...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'ads_account_id') THEN
            ALTER TABLE ads_opportunities ADD COLUMN ads_account_id uuid;
            RAISE NOTICE '  + Added ads_account_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'opportunity_type') THEN
            ALTER TABLE ads_opportunities ADD COLUMN opportunity_type text DEFAULT 'budget_optimization';
            RAISE NOTICE '  + Added opportunity_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'summary') THEN
            ALTER TABLE ads_opportunities ADD COLUMN summary text DEFAULT '';
            RAISE NOTICE '  + Added summary';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'impact_estimate') THEN
            ALTER TABLE ads_opportunities ADD COLUMN impact_estimate numeric;
            RAISE NOTICE '  + Added impact_estimate';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'confidence') THEN
            ALTER TABLE ads_opportunities ADD COLUMN confidence numeric;
            RAISE NOTICE '  + Added confidence';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'recommended_action') THEN
            ALTER TABLE ads_opportunities ADD COLUMN recommended_action text;
            RAISE NOTICE '  + Added recommended_action';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_opportunities' AND column_name = 'status') THEN
            ALTER TABLE ads_opportunities ADD COLUMN status text DEFAULT 'pending';
            RAISE NOTICE '  + Added status';
        END IF;
    END IF;

    -- Fix search_keywords
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_keywords') THEN
        RAISE NOTICE 'Fixing search_keywords...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'founder_business_id') THEN
            ALTER TABLE search_keywords ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + Added founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'keyword') THEN
            ALTER TABLE search_keywords ADD COLUMN keyword text DEFAULT '';
            RAISE NOTICE '  + Added keyword';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'search_engine') THEN
            ALTER TABLE search_keywords ADD COLUMN search_engine text DEFAULT 'google';
            RAISE NOTICE '  + Added search_engine';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'serp_position') THEN
            ALTER TABLE search_keywords ADD COLUMN serp_position int;
            RAISE NOTICE '  + Added serp_position';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'impressions') THEN
            ALTER TABLE search_keywords ADD COLUMN impressions int;
            RAISE NOTICE '  + Added impressions';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'clicks') THEN
            ALTER TABLE search_keywords ADD COLUMN clicks int;
            RAISE NOTICE '  + Added clicks';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'ctr') THEN
            ALTER TABLE search_keywords ADD COLUMN ctr numeric;
            RAISE NOTICE '  + Added ctr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'volatility') THEN
            ALTER TABLE search_keywords ADD COLUMN volatility numeric;
            RAISE NOTICE '  + Added volatility';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'trend') THEN
            ALTER TABLE search_keywords ADD COLUMN trend text;
            RAISE NOTICE '  + Added trend';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_keywords' AND column_name = 'observed_at') THEN
            ALTER TABLE search_keywords ADD COLUMN observed_at timestamptz DEFAULT now();
            RAISE NOTICE '  + Added observed_at';
        END IF;
    END IF;

    -- Fix browser_patterns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'browser_patterns') THEN
        RAISE NOTICE 'Fixing browser_patterns...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'founder_business_id') THEN
            ALTER TABLE browser_patterns ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + Added founder_business_id';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'pattern_name') THEN
            ALTER TABLE browser_patterns ADD COLUMN pattern_name text DEFAULT 'Unnamed';
            RAISE NOTICE '  + Added pattern_name';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'pattern_type') THEN
            ALTER TABLE browser_patterns ADD COLUMN pattern_type text DEFAULT 'custom';
            RAISE NOTICE '  + Added pattern_type';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'pattern_steps') THEN
            ALTER TABLE browser_patterns ADD COLUMN pattern_steps jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + Added pattern_steps';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'success_rate') THEN
            ALTER TABLE browser_patterns ADD COLUMN success_rate numeric;
            RAISE NOTICE '  + Added success_rate';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'browser_patterns' AND column_name = 'last_executed_at') THEN
            ALTER TABLE browser_patterns ADD COLUMN last_executed_at timestamptz;
            RAISE NOTICE '  + Added last_executed_at';
        END IF;
    END IF;

    RAISE NOTICE '=== Part 3 Complete ===';
END $$;

-- ============================================================================
-- PART 4: Fix generated_schemas and other 301 tables
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== PART 4: Fixing Additional Migration 301 Tables ===';

    -- Fix generated_schemas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_schemas') THEN
        RAISE NOTICE 'Fixing generated_schemas...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_body') THEN
            ALTER TABLE generated_schemas ADD COLUMN schema_body jsonb DEFAULT '{}'::jsonb;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'schema_json') THEN
                UPDATE generated_schemas SET schema_body = schema_json WHERE schema_body IS NULL;
            END IF;
            RAISE NOTICE '  + Added schema_body';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_status') THEN
            ALTER TABLE generated_schemas ADD COLUMN validation_status text;
            RAISE NOTICE '  + Added validation_status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'validation_errors') THEN
            ALTER TABLE generated_schemas ADD COLUMN validation_errors jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + Added validation_errors';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'status') THEN
            ALTER TABLE generated_schemas ADD COLUMN status text DEFAULT 'proposed';
            RAISE NOTICE '  + Added status';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_schemas' AND column_name = 'approved_at') THEN
            ALTER TABLE generated_schemas ADD COLUMN approved_at timestamptz;
            RAISE NOTICE '  + Added approved_at';
        END IF;
    END IF;

    -- Fix rich_results_monitoring
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rich_results_monitoring') THEN
        RAISE NOTICE 'Fixing rich_results_monitoring...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'serp_feature') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN serp_feature text DEFAULT 'featured_snippet';
            RAISE NOTICE '  + Added serp_feature';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'competitor_domain') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN competitor_domain text;
            RAISE NOTICE '  + Added competitor_domain';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rich_results_monitoring' AND column_name = 'last_seen_at') THEN
            ALTER TABLE rich_results_monitoring ADD COLUMN last_seen_at timestamptz;
            RAISE NOTICE '  + Added last_seen_at';
        END IF;
    END IF;

    -- Fix title_meta_tests
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'title_meta_tests') THEN
        RAISE NOTICE 'Fixing title_meta_tests...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'variant_a') THEN
            ALTER TABLE title_meta_tests ADD COLUMN variant_a jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added variant_a';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'variant_b') THEN
            ALTER TABLE title_meta_tests ADD COLUMN variant_b jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added variant_b';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'winner') THEN
            ALTER TABLE title_meta_tests ADD COLUMN winner text;
            RAISE NOTICE '  + Added winner';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'title_meta_tests' AND column_name = 'statistical_significance') THEN
            ALTER TABLE title_meta_tests ADD COLUMN statistical_significance numeric(5,2);
            RAISE NOTICE '  + Added statistical_significance';
        END IF;
    END IF;

    -- Fix ctr_benchmarks
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ctr_benchmarks') THEN
        RAISE NOTICE 'Fixing ctr_benchmarks...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'serp_position') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN serp_position int DEFAULT 1;
            RAISE NOTICE '  + Added serp_position';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'actual_ctr') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN actual_ctr numeric(5,2);
            RAISE NOTICE '  + Added actual_ctr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'expected_ctr') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN expected_ctr numeric(5,2);
            RAISE NOTICE '  + Added expected_ctr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'opportunity_level') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN opportunity_level text;
            RAISE NOTICE '  + Added opportunity_level';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ctr_benchmarks' AND column_name = 'navboost_inference') THEN
            ALTER TABLE ctr_benchmarks ADD COLUMN navboost_inference jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + Added navboost_inference';
        END IF;
    END IF;

    RAISE NOTICE '=== Part 4 Complete ===';
END $$;

-- ============================================================================
-- FINAL: Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ COMPREHENSIVE SCHEMA FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed tables from Migration 301:';
    RAISE NOTICE '  - content_optimization_results';
    RAISE NOTICE '  - schema_templates';
    RAISE NOTICE '  - seo_audit_jobs';
    RAISE NOTICE '  - seo_audit_results';
    RAISE NOTICE '  - content_analysis_jobs';
    RAISE NOTICE '  - generated_schemas';
    RAISE NOTICE '  - rich_results_monitoring';
    RAISE NOTICE '  - title_meta_tests';
    RAISE NOTICE '  - ctr_benchmarks';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed tables from Migration 303:';
    RAISE NOTICE '  - social_inbox_accounts';
    RAISE NOTICE '  - social_messages';
    RAISE NOTICE '  - ads_accounts';
    RAISE NOTICE '  - ads_opportunities';
    RAISE NOTICE '  - search_keywords';
    RAISE NOTICE '  - browser_patterns';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now run migrations 301 and 303 successfully!';
    RAISE NOTICE '';
END $$;
