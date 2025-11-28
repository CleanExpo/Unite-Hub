-- ============================================================================
-- IMMEDIATE FIX: Add missing columns to content_optimization_results
-- Run this BEFORE migration 301_seo_leak_engine_core.sql
-- ============================================================================

-- This script adds all missing columns that migration 301 expects
-- It's safe to run even if some columns already exist

DO $$
BEGIN
    RAISE NOTICE 'Starting content_optimization_results schema fix...';

    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_optimization_results') THEN
        
        -- Add search_intent column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'search_intent') THEN
            ALTER TABLE content_optimization_results ADD COLUMN search_intent text;
            RAISE NOTICE '✓ Added search_intent column';
        ELSE
            RAISE NOTICE '→ search_intent column already exists';
        END IF;

        -- Add readability_score column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'readability_score') THEN
            ALTER TABLE content_optimization_results ADD COLUMN readability_score numeric(5,2);
            RAISE NOTICE '✓ Added readability_score column';
        ELSE
            RAISE NOTICE '→ readability_score column already exists';
        END IF;

        -- Add keyword_density column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'keyword_density') THEN
            ALTER TABLE content_optimization_results ADD COLUMN keyword_density jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '✓ Added keyword_density column';
        ELSE
            RAISE NOTICE '→ keyword_density column already exists';
        END IF;

        -- Add recommendations column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'recommendations') THEN
            ALTER TABLE content_optimization_results ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '✓ Added recommendations column';
        ELSE
            RAISE NOTICE '→ recommendations column already exists';
        END IF;

        -- Add eeat_scores column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'eeat_scores') THEN
            ALTER TABLE content_optimization_results ADD COLUMN eeat_scores jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '✓ Added eeat_scores column';
        ELSE
            RAISE NOTICE '→ eeat_scores column already exists';
        END IF;

        -- Add navboost_friendly_patterns column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'navboost_friendly_patterns') THEN
            ALTER TABLE content_optimization_results ADD COLUMN navboost_friendly_patterns jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '✓ Added navboost_friendly_patterns column';
        ELSE
            RAISE NOTICE '→ navboost_friendly_patterns column already exists';
        END IF;

        -- Add content_analysis_job_id if missing (for FK relationship)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'content_analysis_job_id') THEN
            ALTER TABLE content_optimization_results ADD COLUMN content_analysis_job_id uuid;
            RAISE NOTICE '✓ Added content_analysis_job_id column';
        ELSE
            RAISE NOTICE '→ content_analysis_job_id column already exists';
        END IF;

        -- Migrate data from old column name if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'content_optimization_results' 
                  AND column_name = 'analysis_job_id')
           AND EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'content_optimization_results' 
                      AND column_name = 'content_analysis_job_id') THEN
            
            -- Copy data from old column to new column if new column is empty
            UPDATE content_optimization_results 
            SET content_analysis_job_id = analysis_job_id 
            WHERE content_analysis_job_id IS NULL AND analysis_job_id IS NOT NULL;
            
            RAISE NOTICE '✓ Migrated data from analysis_job_id to content_analysis_job_id';
        END IF;

        -- Add constraint for search_intent if column exists and constraint doesn't
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'content_optimization_results' 
                  AND column_name = 'search_intent')
           AND NOT EXISTS (SELECT 1 FROM pg_constraint 
                          WHERE conname = 'content_optimization_results_intent_check') THEN
            
            ALTER TABLE content_optimization_results 
            ADD CONSTRAINT content_optimization_results_intent_check 
            CHECK (search_intent IS NULL OR search_intent IN (
                'informational', 'navigational', 'transactional', 'commercial', 'local'
            ));
            RAISE NOTICE '✓ Added search_intent constraint';
        ELSE
            RAISE NOTICE '→ search_intent constraint already exists or column missing';
        END IF;

        RAISE NOTICE '==================================================';
        RAISE NOTICE 'Schema fix completed successfully!';
        RAISE NOTICE 'You can now run migration 301 and subsequent migrations.';
        RAISE NOTICE '==================================================';

    ELSE
        RAISE NOTICE '! Table content_optimization_results does not exist yet';
        RAISE NOTICE '! This is expected if you haven''t run migration 276 or 301 yet';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE;
END $$;
