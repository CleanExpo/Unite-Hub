-- ============================================================================
-- PRE-MIGRATION FIX FOR 304 AND 305
-- ============================================================================
-- RUN THIS BEFORE migrations 304 and 305
-- This script handles schema mismatches for pre_clients and cognitive_twin tables
--
-- EXECUTION ORDER:
--   1. Run this file (303A_PRE_MIGRATION_FIX_304_305.sql)
--   2. Run 304_email_identity_engine.sql
--   3. Run 305_cognitive_twin_engine.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX TABLES FOR MIGRATION 304 (Email Identity Engine)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECTION 1: Preparing tables for Migration 304';
    RAISE NOTICE '========================================';
END $$;

-- -----------------------------------------------------------------------------
-- 1A. pre_clients - Main pre-client contacts table
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pre_clients') THEN
        RAISE NOTICE 'Fixing pre_clients...';

        -- owner_user_id is CRITICAL - required for RLS policies
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'owner_user_id') THEN
            ALTER TABLE pre_clients ADD COLUMN owner_user_id uuid;
            -- Try to populate from user_id if it exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'user_id') THEN
                UPDATE pre_clients SET owner_user_id = user_id WHERE owner_user_id IS NULL;
                RAISE NOTICE '  + owner_user_id (migrated from user_id)';
            ELSE
                RAISE NOTICE '  + owner_user_id';
            END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'founder_business_id') THEN
            ALTER TABLE pre_clients ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'name') THEN
            ALTER TABLE pre_clients ADD COLUMN name text;
            RAISE NOTICE '  + name';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'email') THEN
            ALTER TABLE pre_clients ADD COLUMN email text DEFAULT '';
            RAISE NOTICE '  + email';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'phone') THEN
            ALTER TABLE pre_clients ADD COLUMN phone text;
            RAISE NOTICE '  + phone';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'company') THEN
            ALTER TABLE pre_clients ADD COLUMN company text;
            RAISE NOTICE '  + company';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'job_title') THEN
            ALTER TABLE pre_clients ADD COLUMN job_title text;
            RAISE NOTICE '  + job_title';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'source') THEN
            ALTER TABLE pre_clients ADD COLUMN source text;
            RAISE NOTICE '  + source';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'status') THEN
            ALTER TABLE pre_clients ADD COLUMN status text DEFAULT 'new';
            RAISE NOTICE '  + status';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'relationship_score') THEN
            ALTER TABLE pre_clients ADD COLUMN relationship_score numeric;
            RAISE NOTICE '  + relationship_score';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'created_at') THEN
            ALTER TABLE pre_clients ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_clients' AND column_name = 'updated_at') THEN
            ALTER TABLE pre_clients ADD COLUMN updated_at timestamptz DEFAULT now();
            RAISE NOTICE '  + updated_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1B. pre_client_threads
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pre_client_threads') THEN
        RAISE NOTICE 'Fixing pre_client_threads...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'pre_client_id') THEN
            ALTER TABLE pre_client_threads ADD COLUMN pre_client_id uuid;
            RAISE NOTICE '  + pre_client_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'thread_id') THEN
            ALTER TABLE pre_client_threads ADD COLUMN thread_id text DEFAULT '';
            RAISE NOTICE '  + thread_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'subject') THEN
            ALTER TABLE pre_client_threads ADD COLUMN subject text;
            RAISE NOTICE '  + subject';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'summary') THEN
            ALTER TABLE pre_client_threads ADD COLUMN summary text;
            RAISE NOTICE '  + summary';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'message_count') THEN
            ALTER TABLE pre_client_threads ADD COLUMN message_count int DEFAULT 0;
            RAISE NOTICE '  + message_count';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'last_message_at') THEN
            ALTER TABLE pre_client_threads ADD COLUMN last_message_at timestamptz;
            RAISE NOTICE '  + last_message_at';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'sentiment_trend') THEN
            ALTER TABLE pre_client_threads ADD COLUMN sentiment_trend text;
            RAISE NOTICE '  + sentiment_trend';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'tags') THEN
            ALTER TABLE pre_client_threads ADD COLUMN tags text[] DEFAULT '{}';
            RAISE NOTICE '  + tags';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_threads' AND column_name = 'created_at') THEN
            ALTER TABLE pre_client_threads ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1C. pre_client_timeline
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pre_client_timeline') THEN
        RAISE NOTICE 'Fixing pre_client_timeline...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_timeline' AND column_name = 'pre_client_id') THEN
            ALTER TABLE pre_client_timeline ADD COLUMN pre_client_id uuid;
            RAISE NOTICE '  + pre_client_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_timeline' AND column_name = 'event_type') THEN
            ALTER TABLE pre_client_timeline ADD COLUMN event_type text DEFAULT 'custom';
            RAISE NOTICE '  + event_type';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_timeline' AND column_name = 'summary') THEN
            ALTER TABLE pre_client_timeline ADD COLUMN summary text DEFAULT '';
            RAISE NOTICE '  + summary';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_timeline' AND column_name = 'payload') THEN
            ALTER TABLE pre_client_timeline ADD COLUMN payload jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + payload';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_timeline' AND column_name = 'importance') THEN
            ALTER TABLE pre_client_timeline ADD COLUMN importance text DEFAULT 'normal';
            RAISE NOTICE '  + importance';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_timeline' AND column_name = 'occurred_at') THEN
            ALTER TABLE pre_client_timeline ADD COLUMN occurred_at timestamptz DEFAULT now();
            RAISE NOTICE '  + occurred_at';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_timeline' AND column_name = 'created_at') THEN
            ALTER TABLE pre_client_timeline ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1D. pre_client_insights
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pre_client_insights') THEN
        RAISE NOTICE 'Fixing pre_client_insights...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_insights' AND column_name = 'pre_client_id') THEN
            ALTER TABLE pre_client_insights ADD COLUMN pre_client_id uuid;
            RAISE NOTICE '  + pre_client_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_insights' AND column_name = 'insight_type') THEN
            ALTER TABLE pre_client_insights ADD COLUMN insight_type text DEFAULT 'custom';
            RAISE NOTICE '  + insight_type';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_insights' AND column_name = 'insight') THEN
            ALTER TABLE pre_client_insights ADD COLUMN insight text DEFAULT '';
            RAISE NOTICE '  + insight';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_insights' AND column_name = 'confidence') THEN
            ALTER TABLE pre_client_insights ADD COLUMN confidence numeric;
            RAISE NOTICE '  + confidence';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_insights' AND column_name = 'recommended_action') THEN
            ALTER TABLE pre_client_insights ADD COLUMN recommended_action text;
            RAISE NOTICE '  + recommended_action';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_insights' AND column_name = 'status') THEN
            ALTER TABLE pre_client_insights ADD COLUMN status text DEFAULT 'pending';
            RAISE NOTICE '  + status';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_client_insights' AND column_name = 'created_at') THEN
            ALTER TABLE pre_client_insights ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: FIX TABLES FOR MIGRATION 305 (Cognitive Twin Engine)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECTION 2: Preparing tables for Migration 305';
    RAISE NOTICE '========================================';
END $$;

-- -----------------------------------------------------------------------------
-- 2A. cognitive_twin_scores
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cognitive_twin_scores') THEN
        RAISE NOTICE 'Fixing cognitive_twin_scores...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'owner_user_id') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN owner_user_id uuid;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'user_id') THEN
                UPDATE cognitive_twin_scores SET owner_user_id = user_id WHERE owner_user_id IS NULL;
                RAISE NOTICE '  + owner_user_id (migrated from user_id)';
            ELSE
                RAISE NOTICE '  + owner_user_id';
            END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'founder_business_id') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'domain') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN domain text DEFAULT 'custom';
            RAISE NOTICE '  + domain';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'momentum') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN momentum jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + momentum';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'risks') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN risks jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + risks';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'opportunities') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN opportunities jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + opportunities';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'overall_health') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN overall_health numeric;
            RAISE NOTICE '  + overall_health';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_scores' AND column_name = 'created_at') THEN
            ALTER TABLE cognitive_twin_scores ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2B. cognitive_twin_digests
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cognitive_twin_digests') THEN
        RAISE NOTICE 'Fixing cognitive_twin_digests...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_digests' AND column_name = 'owner_user_id') THEN
            ALTER TABLE cognitive_twin_digests ADD COLUMN owner_user_id uuid;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_digests' AND column_name = 'user_id') THEN
                UPDATE cognitive_twin_digests SET owner_user_id = user_id WHERE owner_user_id IS NULL;
                RAISE NOTICE '  + owner_user_id (migrated from user_id)';
            ELSE
                RAISE NOTICE '  + owner_user_id';
            END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_digests' AND column_name = 'digest_type') THEN
            ALTER TABLE cognitive_twin_digests ADD COLUMN digest_type text DEFAULT 'daily';
            RAISE NOTICE '  + digest_type';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_digests' AND column_name = 'digest_md') THEN
            ALTER TABLE cognitive_twin_digests ADD COLUMN digest_md text DEFAULT '';
            RAISE NOTICE '  + digest_md';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_digests' AND column_name = 'key_metrics') THEN
            ALTER TABLE cognitive_twin_digests ADD COLUMN key_metrics jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + key_metrics';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_digests' AND column_name = 'action_items') THEN
            ALTER TABLE cognitive_twin_digests ADD COLUMN action_items jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + action_items';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_digests' AND column_name = 'created_at') THEN
            ALTER TABLE cognitive_twin_digests ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '  + created_at';
        END IF;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2C. cognitive_twin_decisions
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cognitive_twin_decisions') THEN
        RAISE NOTICE 'Fixing cognitive_twin_decisions...';

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'owner_user_id') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN owner_user_id uuid;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'user_id') THEN
                UPDATE cognitive_twin_decisions SET owner_user_id = user_id WHERE owner_user_id IS NULL;
                RAISE NOTICE '  + owner_user_id (migrated from user_id)';
            ELSE
                RAISE NOTICE '  + owner_user_id';
            END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'founder_business_id') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '  + founder_business_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'decision_type') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN decision_type text DEFAULT 'custom';
            RAISE NOTICE '  + decision_type';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'scenario') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN scenario jsonb DEFAULT '{}'::jsonb;
            RAISE NOTICE '  + scenario';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'options') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN options jsonb DEFAULT '[]'::jsonb;
            RAISE NOTICE '  + options';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'outcome') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN outcome jsonb;
            RAISE NOTICE '  + outcome';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'ai_recommendation') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN ai_recommendation text;
            RAISE NOTICE '  + ai_recommendation';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'human_decision') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN human_decision text;
            RAISE NOTICE '  + human_decision';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'decided_at') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN decided_at timestamptz;
            RAISE NOTICE '  + decided_at';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cognitive_twin_decisions' AND column_name = 'created_at') THEN
            ALTER TABLE cognitive_twin_decisions ADD COLUMN created_at timestamptz DEFAULT now();
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

    -- pre_clients constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_clients_status_check') THEN
        ALTER TABLE pre_clients DROP CONSTRAINT pre_clients_status_check;
        RAISE NOTICE '  - Dropped pre_clients_status_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_clients_score_check') THEN
        ALTER TABLE pre_clients DROP CONSTRAINT pre_clients_score_check;
        RAISE NOTICE '  - Dropped pre_clients_score_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_clients_email_format') THEN
        ALTER TABLE pre_clients DROP CONSTRAINT pre_clients_email_format;
        RAISE NOTICE '  - Dropped pre_clients_email_format';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_clients_unique_email_owner') THEN
        ALTER TABLE pre_clients DROP CONSTRAINT pre_clients_unique_email_owner;
        RAISE NOTICE '  - Dropped pre_clients_unique_email_owner';
    END IF;

    -- pre_client_threads constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_threads_count_check') THEN
        ALTER TABLE pre_client_threads DROP CONSTRAINT pre_client_threads_count_check;
        RAISE NOTICE '  - Dropped pre_client_threads_count_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_threads_sentiment_check') THEN
        ALTER TABLE pre_client_threads DROP CONSTRAINT pre_client_threads_sentiment_check;
        RAISE NOTICE '  - Dropped pre_client_threads_sentiment_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_threads_unique_thread') THEN
        ALTER TABLE pre_client_threads DROP CONSTRAINT pre_client_threads_unique_thread;
        RAISE NOTICE '  - Dropped pre_client_threads_unique_thread';
    END IF;

    -- pre_client_timeline constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_timeline_type_check') THEN
        ALTER TABLE pre_client_timeline DROP CONSTRAINT pre_client_timeline_type_check;
        RAISE NOTICE '  - Dropped pre_client_timeline_type_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_timeline_importance_check') THEN
        ALTER TABLE pre_client_timeline DROP CONSTRAINT pre_client_timeline_importance_check;
        RAISE NOTICE '  - Dropped pre_client_timeline_importance_check';
    END IF;

    -- pre_client_insights constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_insights_type_check') THEN
        ALTER TABLE pre_client_insights DROP CONSTRAINT pre_client_insights_type_check;
        RAISE NOTICE '  - Dropped pre_client_insights_type_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_insights_confidence_check') THEN
        ALTER TABLE pre_client_insights DROP CONSTRAINT pre_client_insights_confidence_check;
        RAISE NOTICE '  - Dropped pre_client_insights_confidence_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_client_insights_status_check') THEN
        ALTER TABLE pre_client_insights DROP CONSTRAINT pre_client_insights_status_check;
        RAISE NOTICE '  - Dropped pre_client_insights_status_check';
    END IF;

    -- cognitive_twin_scores constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cognitive_twin_domain_check') THEN
        ALTER TABLE cognitive_twin_scores DROP CONSTRAINT cognitive_twin_domain_check;
        RAISE NOTICE '  - Dropped cognitive_twin_domain_check';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cognitive_twin_health_check') THEN
        ALTER TABLE cognitive_twin_scores DROP CONSTRAINT cognitive_twin_health_check;
        RAISE NOTICE '  - Dropped cognitive_twin_health_check';
    END IF;

    -- cognitive_twin_digests constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cognitive_twin_digest_type_check') THEN
        ALTER TABLE cognitive_twin_digests DROP CONSTRAINT cognitive_twin_digest_type_check;
        RAISE NOTICE '  - Dropped cognitive_twin_digest_type_check';
    END IF;

    -- cognitive_twin_decisions constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cognitive_twin_decision_type_check') THEN
        ALTER TABLE cognitive_twin_decisions DROP CONSTRAINT cognitive_twin_decision_type_check;
        RAISE NOTICE '  - Dropped cognitive_twin_decision_type_check';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '  (Some constraints may not exist - this is OK)';
END $$;

-- ============================================================================
-- SECTION 4: CREATE MISSING update_updated_at_column FUNCTION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECTION 4: Creating helper functions';
    RAISE NOTICE '========================================';
END $$;

-- This function is required by the trigger in migration 304
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    RAISE NOTICE '  + Created update_updated_at_column function';
END $$;

-- ============================================================================
-- FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PRE-MIGRATION FIX 304/305 COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All tables prepared for migrations 304 and 305.';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run 304_email_identity_engine.sql';
    RAISE NOTICE '  2. Run 305_cognitive_twin_engine.sql';
    RAISE NOTICE '';
END $$;
