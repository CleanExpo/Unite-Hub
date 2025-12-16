-- Migration: Fix username UNIQUE constraint to handle empty strings
-- Created: 2025-11-16
-- Purpose: Allow empty usernames by converting them to NULL and making UNIQUE constraint partial

-- Drop existing username unique constraint if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_key;-- Create a partial unique index that only applies to non-null, non-empty usernames
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_unique_idx
ON user_profiles(username)
WHERE username IS NOT NULL AND username != '';-- Add a check to ensure empty strings are converted to NULL
-- This will be handled by application logic, but add constraint for safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'user_profiles_username_not_empty'
      AND n.nspname = 'public'
      AND t.relname = 'user_profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_username_not_empty CHECK (username IS NULL OR length(trim(username)) > 0)';
  END IF;
END $$;COMMENT ON INDEX user_profiles_username_unique_idx IS 'Unique constraint for usernames, allowing NULL and converting empty strings to NULL';