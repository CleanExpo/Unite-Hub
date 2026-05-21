-- Migration 311: Verify and Fix ai_score Column Type
-- Issue: ai_score defined as DECIMAL(3,2) but code expects INTEGER 0-100
-- This migration verifies the column type and converts if needed

-- Step 1: Check current column type and log it
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'contacts'
    AND column_name = 'ai_score';

  IF current_type IS NULL THEN
    RAISE NOTICE 'ai_score column does not exist in contacts table';
  ELSE
    RAISE NOTICE 'ai_score current type: %', current_type;
  END IF;
END $$;

-- Step 2: If column exists and is numeric/decimal, convert to integer
-- This handles the case where it's DECIMAL(3,2) storing 0.0-1.0
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'contacts'
    AND column_name = 'ai_score';

  -- If it's numeric/decimal, we need to convert
  IF current_type IN ('numeric', 'decimal') THEN
    -- First, create a backup column
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_score_backup NUMERIC;
    UPDATE contacts SET ai_score_backup = ai_score WHERE ai_score IS NOT NULL;

    -- Drop the old column
    ALTER TABLE contacts DROP COLUMN ai_score;

    -- Recreate as integer with proper range (0-100)
    ALTER TABLE contacts ADD COLUMN ai_score INTEGER DEFAULT 0;

    -- Migrate data: if old values were 0.0-1.0, multiply by 100
    -- If old values were already 0-100, just cast
    UPDATE contacts
    SET ai_score = CASE
      WHEN ai_score_backup IS NULL THEN 0
      WHEN ai_score_backup <= 1.0 THEN ROUND(ai_score_backup * 100)::INTEGER
      ELSE LEAST(ROUND(ai_score_backup)::INTEGER, 100)
    END
    WHERE ai_score_backup IS NOT NULL;

    -- Add constraint to ensure valid range
    ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100);

    -- Drop backup column
    ALTER TABLE contacts DROP COLUMN ai_score_backup;

    RAISE NOTICE 'ai_score column converted from % to INTEGER', current_type;
  ELSIF current_type = 'integer' THEN
    -- Already integer, just ensure constraint exists
    ALTER TABLE contacts DROP CONSTRAINT IF EXISTS ai_score_range;
    ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100);
    RAISE NOTICE 'ai_score already INTEGER, constraint verified';
  ELSE
    RAISE NOTICE 'ai_score has unexpected type: %. Manual review needed.', current_type;
  END IF;
END $$;

-- Step 3: Verify final state
DO $$
DECLARE
  final_type TEXT;
  min_score INTEGER;
  max_score INTEGER;
BEGIN
  SELECT data_type INTO final_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'contacts'
    AND column_name = 'ai_score';

  SELECT MIN(ai_score), MAX(ai_score) INTO min_score, max_score FROM contacts;

  RAISE NOTICE 'Migration 311 complete. ai_score type: %, range: % to %', final_type, min_score, max_score;
END $$;
