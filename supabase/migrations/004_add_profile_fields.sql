-- Migration: Add missing profile fields to user_profiles table
-- Created: 2025-11-15
-- Purpose: Add username, business info, contact details, and preferences to user profiles

-- Add new columns to user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_notifications":true,"marketing_emails":true,"product_updates":true,"weekly_digest":false}'::jsonb;

-- Add constraints
ALTER TABLE user_profiles
  ADD CONSTRAINT IF NOT EXISTS user_profiles_username_length CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 30)),
  ADD CONSTRAINT IF NOT EXISTS user_profiles_username_format CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]+$'),
  ADD CONSTRAINT IF NOT EXISTS user_profiles_bio_length CHECK (bio IS NULL OR length(bio) <= 500),
  ADD CONSTRAINT IF NOT EXISTS user_profiles_website_format CHECK (website IS NULL OR website ~ '^https?://');

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username) WHERE username IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_profiles.username IS 'Unique username for the user (3-30 chars, alphanumeric, dash, underscore)';
COMMENT ON COLUMN user_profiles.business_name IS 'Business or company name';
COMMENT ON COLUMN user_profiles.phone IS 'Phone number in international format';
COMMENT ON COLUMN user_profiles.bio IS 'User biography (max 500 characters)';
COMMENT ON COLUMN user_profiles.website IS 'User or business website URL';
COMMENT ON COLUMN user_profiles.timezone IS 'User timezone (IANA timezone identifier)';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'User notification preferences (JSON)';
