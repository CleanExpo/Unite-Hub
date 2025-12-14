-- User Onboarding Table
-- Tracks the completion status of onboarding steps for each user

CREATE TABLE IF NOT EXISTS user_onboarding (
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
-- Ensure expected columns exist when table already exists (safe re-apply on legacy schemas).
ALTER TABLE IF EXISTS user_onboarding
  ADD COLUMN IF NOT EXISTS step_1_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS step_2_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS step_3_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS step_4_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS step_5_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS user_onboarding
  ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS user_onboarding
  ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS user_onboarding
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS user_onboarding
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS user_onboarding
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(completed_at) WHERE completed_at IS NOT NULL;
-- Enable Row Level Security
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Users can only view/update their own onboarding record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_onboarding'
      AND policyname = 'Users can view own onboarding'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view own onboarding"
        ON user_onboarding
        FOR SELECT
        USING (auth.uid() = user_id);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_onboarding'
      AND policyname = 'Users can insert own onboarding'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can insert own onboarding"
        ON user_onboarding
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_onboarding'
      AND policyname = 'Users can update own onboarding'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own onboarding"
        ON user_onboarding
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END $$;
-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_update_user_onboarding_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'user_onboarding'
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE $trg$
      CREATE TRIGGER trigger_update_user_onboarding_updated_at
        BEFORE UPDATE ON user_onboarding
        FOR EACH ROW
        EXECUTE FUNCTION update_user_onboarding_updated_at();
    $trg$;
  END IF;
END $$;
-- Comments
COMMENT ON TABLE user_onboarding IS 'Tracks user onboarding progress and completion status';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_onboarding'
      AND column_name = 'step_1_complete'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN user_onboarding.step_1_complete IS 'Welcome & Profile Setup completed'$c$;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_onboarding'
      AND column_name = 'step_2_complete'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN user_onboarding.step_2_complete IS 'Connect First Integration completed'$c$;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_onboarding'
      AND column_name = 'step_3_complete'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN user_onboarding.step_3_complete IS 'Import Contacts completed'$c$;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_onboarding'
      AND column_name = 'step_4_complete'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN user_onboarding.step_4_complete IS 'Create First Campaign completed (optional)'$c$;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_onboarding'
      AND column_name = 'step_5_complete'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN user_onboarding.step_5_complete IS 'Dashboard Tour completed'$c$;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_onboarding'
      AND column_name = 'onboarding_data'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN user_onboarding.onboarding_data IS 'Additional data collected during onboarding (preferences, choices, etc.)'$c$;
  END IF;
END $$;
