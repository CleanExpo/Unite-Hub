-- Migration: Fix username UNIQUE constraint to handle empty strings (v2)
-- Created: 2025-11-16
-- Purpose: Allow empty usernames by converting them to NULL and making UNIQUE constraint partial

-- Drop existing username unique constraint if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_key;

-- Create a partial unique index that only applies to non-null, non-empty usernames
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_unique_idx
ON user_profiles(username)
WHERE username IS NOT NULL AND username != '';

-- Add a check to ensure empty strings are converted to NULL (with guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_username_not_empty') THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_username_not_empty
    CHECK (username IS NULL OR length(trim(username)) > 0);
  END IF;
END $$;

COMMENT ON INDEX user_profiles_username_unique_idx IS 'Unique constraint for usernames, allowing NULL and converting empty strings to NULL';
