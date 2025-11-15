-- ============================================================================
-- Quick Apply Script: user_onboarding Table Migration
-- ============================================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This is a safe, idempotent script that can be run multiple times
-- ============================================================================

DO $$
BEGIN
    -- Check if table already exists
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'user_onboarding'
    ) THEN
        RAISE NOTICE 'Creating user_onboarding table...';

        -- Create the table
        CREATE TABLE user_onboarding (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

            -- Step completion status
            step_1_complete BOOLEAN DEFAULT FALSE, -- Welcome & Profile Setup
            step_2_complete BOOLEAN DEFAULT FALSE, -- Connect First Integration
            step_3_complete BOOLEAN DEFAULT FALSE, -- Import Contacts
            step_4_complete BOOLEAN DEFAULT FALSE, -- Create First Campaign (optional)
            step_5_complete BOOLEAN DEFAULT FALSE, -- Dashboard Tour

            -- Metadata
            completed_at TIMESTAMP WITH TIME ZONE,
            skipped BOOLEAN DEFAULT FALSE,
            current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),

            -- Additional data collected during onboarding
            onboarding_data JSONB DEFAULT '{}'::jsonb,

            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

            -- Ensure one onboarding record per user
            UNIQUE(user_id)
        );

        -- Create indexes
        CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);
        CREATE INDEX idx_user_onboarding_completed ON user_onboarding(completed_at)
            WHERE completed_at IS NOT NULL;

        -- Enable Row Level Security
        ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
        CREATE POLICY "Users can view own onboarding"
            ON user_onboarding
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own onboarding"
            ON user_onboarding
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own onboarding"
            ON user_onboarding
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        -- Create trigger function
        CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();

            -- Auto-set completed_at when all steps are complete
            IF NEW.step_1_complete AND
               NEW.step_2_complete AND
               NEW.step_3_complete AND
               NEW.step_5_complete AND -- Step 4 is optional
               NEW.completed_at IS NULL
            THEN
                NEW.completed_at = NOW();
            END IF;

            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Create trigger
        CREATE TRIGGER trigger_update_user_onboarding_updated_at
            BEFORE UPDATE ON user_onboarding
            FOR EACH ROW
            EXECUTE FUNCTION update_user_onboarding_updated_at();

        -- Add comments
        COMMENT ON TABLE user_onboarding IS 'Tracks user onboarding progress and completion status';
        COMMENT ON COLUMN user_onboarding.step_1_complete IS 'Welcome & Profile Setup completed';
        COMMENT ON COLUMN user_onboarding.step_2_complete IS 'Connect First Integration completed';
        COMMENT ON COLUMN user_onboarding.step_3_complete IS 'Import Contacts completed';
        COMMENT ON COLUMN user_onboarding.step_4_complete IS 'Create First Campaign completed (optional)';
        COMMENT ON COLUMN user_onboarding.step_5_complete IS 'Dashboard Tour completed';
        COMMENT ON COLUMN user_onboarding.onboarding_data IS 'Additional data collected during onboarding (preferences, choices, etc.)';

        RAISE NOTICE '✅ user_onboarding table created successfully';
    ELSE
        RAISE NOTICE '⚠️  user_onboarding table already exists - skipping creation';
    END IF;
END $$;

-- Verify the table was created
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'user_onboarding'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE '✅ VERIFICATION PASSED: user_onboarding table exists';
        RAISE NOTICE 'Run this query to see the table structure:';
        RAISE NOTICE 'SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = ''user_onboarding'';';
    ELSE
        RAISE EXCEPTION '❌ VERIFICATION FAILED: user_onboarding table does not exist';
    END IF;
END $$;
