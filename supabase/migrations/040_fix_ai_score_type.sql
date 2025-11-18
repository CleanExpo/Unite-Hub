-- Migration 040: Fix ai_score column type from DECIMAL(3,2) to INTEGER
-- Purpose: Change ai_score from 0.0-1.0 decimal to 0-100 integer scale
-- Impact: Updates existing contacts table, preserves existing data by scaling

-- Step 1: Add new temporary column with INTEGER type
ALTER TABLE contacts ADD COLUMN ai_score_new INTEGER DEFAULT 0;

-- Step 2: Migrate existing data (scale 0.0-1.0 to 0-100)
UPDATE contacts SET ai_score_new = ROUND(ai_score * 100)::INTEGER;

-- Step 3: Drop old column
ALTER TABLE contacts DROP COLUMN ai_score;

-- Step 4: Rename new column to ai_score
ALTER TABLE contacts RENAME COLUMN ai_score_new TO ai_score;

-- Step 5: Add check constraint for 0-100 range
ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100);

-- Step 6: Set default value
ALTER TABLE contacts ALTER COLUMN ai_score SET DEFAULT 0;

-- Verification query (run this after migration)
-- SELECT id, name, ai_score FROM contacts LIMIT 10;
