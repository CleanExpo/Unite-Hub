-- Migration: User Profile Enhancements
-- Description: Adds additional fields to user_profiles for comprehensive profile management
-- Date: 2025-11-15

-- =====================================================
-- 1. ADD NEW COLUMNS TO USER_PROFILES
-- =====================================================

-- Username (unique, for @mentions, URLs, etc.)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
-- Business/Company name
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
-- Phone number
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
-- Biography/About me
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
-- Website URL
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
-- Timezone preference (defaults to UTC)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
-- Notification preferences (JSON for flexibility)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_notifications": true,
  "marketing_emails": true,
  "product_updates": true,
  "weekly_digest": false
}'::jsonb;
-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for username lookups (unique already creates index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username) WHERE username IS NOT NULL;
-- Index for phone lookups (if needed for search)
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;
-- =====================================================
-- 3. ADD CONSTRAINTS
-- =====================================================

-- Username validation: alphanumeric, underscores, hyphens, 3-30 chars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'user_profiles'
      AND con.conname = 'username_format'
  ) THEN
    EXECUTE $c$
      ALTER TABLE user_profiles ADD CONSTRAINT username_format
        CHECK (username IS NULL OR (username ~ '^[a-zA-Z0-9_-]{3,30}$'));
    $c$;
  END IF;
END $$;
-- Phone validation: basic format (allowing international)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'user_profiles'
      AND con.conname = 'phone_format'
  ) THEN
    EXECUTE $c$
      ALTER TABLE user_profiles ADD CONSTRAINT phone_format
        CHECK (phone IS NULL OR (phone ~ '^\+?[1-9]\d{1,14}$'));
    $c$;
  END IF;
END $$;
-- Website validation: must be valid URL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'user_profiles'
      AND con.conname = 'website_format'
  ) THEN
    EXECUTE $c$
      ALTER TABLE user_profiles ADD CONSTRAINT website_format
        CHECK (website IS NULL OR (website ~ '^https?://'));
    $c$;
  END IF;
END $$;
-- Bio length limit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'user_profiles'
      AND con.conname = 'bio_length'
  ) THEN
    EXECUTE $c$
      ALTER TABLE user_profiles ADD CONSTRAINT bio_length
        CHECK (bio IS NULL OR (LENGTH(bio) <= 500));
    $c$;
  END IF;
END $$;
-- Timezone validation (sample common timezones)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'user_profiles'
      AND con.conname = 'timezone_valid'
  ) THEN
    EXECUTE $c$
      ALTER TABLE user_profiles ADD CONSTRAINT timezone_valid
        CHECK (timezone IN (
          'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
          'America/Toronto', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
          'Asia/Shanghai', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland'
        ));
    $c$;
  END IF;
END $$;
-- =====================================================
-- 4. CREATE STORAGE BUCKET FOR AVATARS
-- =====================================================

-- Note: This is executed via Supabase Dashboard or API
-- The bucket configuration is documented here for reference

-- Bucket name: avatars
-- Public: true (avatars are publicly accessible)
-- File size limit: 2MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- Path structure: {user_id}/avatar.{ext}

-- RLS Policy for avatars bucket (created via Supabase):
-- - INSERT: Users can only upload to their own folder
-- - SELECT: Public read access
-- - UPDATE: Users can only update their own avatar
-- - DELETE: Users can only delete their own avatar

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to generate unique username from email
CREATE OR REPLACE FUNCTION generate_username_from_email(email_address TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Extract username part from email (before @)
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(email_address, '@', 1), '[^a-z0-9]', '', 'g'));

  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || '123';
  END IF;

  -- Truncate if too long
  IF LENGTH(base_username) > 30 THEN
    base_username := SUBSTRING(base_username, 1, 30);
  END IF;

  -- Check if username exists, append number if needed
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  RETURN final_username;
END;
$$ LANGUAGE plpgsql;
-- Function to validate and sanitize phone number
CREATE OR REPLACE FUNCTION sanitize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove all non-digit characters except leading +
  RETURN REGEXP_REPLACE(phone_input, '[^\+\d]', '', 'g');
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 6. UPDATE RLS POLICIES
-- =====================================================

-- Users can update their own profile (already exists, but ensure it covers new fields)
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- Allow users to check if username is available (for validation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can check username availability'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can check username availability"
        ON user_profiles FOR SELECT
        USING (true);
    $policy$;
  END IF;
END $$;
-- =====================================================
-- 7. BACKFILL USERNAMES FOR EXISTING USERS
-- =====================================================

-- Generate usernames for users who don't have one
UPDATE user_profiles
SET username = generate_username_from_email(email)
WHERE username IS NULL;
-- =====================================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN user_profiles.username IS 'Unique username for public identification (3-30 alphanumeric chars)';
COMMENT ON COLUMN user_profiles.business_name IS 'Company or business name for business accounts';
COMMENT ON COLUMN user_profiles.phone IS 'Phone number in E.164 format (e.g., +14155552671)';
COMMENT ON COLUMN user_profiles.bio IS 'User biography or about me section (max 500 chars)';
COMMENT ON COLUMN user_profiles.website IS 'Personal or business website URL';
COMMENT ON COLUMN user_profiles.timezone IS 'User timezone for scheduling and notifications';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'JSON object containing notification preferences';
COMMENT ON FUNCTION generate_username_from_email IS 'Generates unique username from email address';
COMMENT ON FUNCTION sanitize_phone IS 'Removes non-digit characters from phone number';
-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================;
