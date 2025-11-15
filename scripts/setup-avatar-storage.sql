-- Setup Script: Avatar Storage Bucket
-- Description: Creates and configures Supabase Storage bucket for user avatars
-- Date: 2025-11-15
--
-- INSTRUCTIONS:
-- 1. Run this via Supabase Dashboard > SQL Editor
-- 2. Or use Supabase CLI: supabase db execute -f scripts/setup-avatar-storage.sql

-- =====================================================
-- 1. CREATE STORAGE BUCKET
-- =====================================================

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket so avatars are accessible
  2097152, -- 2MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE RLS POLICIES FOR AVATARS BUCKET
-- =====================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read access (anyone can view avatars)
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy 2: Users can upload to their own folder only
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own avatar only
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own avatar only
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 3. HELPER FUNCTION: GET AVATAR PUBLIC URL
-- =====================================================

CREATE OR REPLACE FUNCTION get_avatar_public_url(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  avatar_path TEXT;
  public_url TEXT;
BEGIN
  -- Get the avatar_url from user_profiles
  SELECT avatar_url INTO avatar_path
  FROM user_profiles
  WHERE id = user_id;

  -- If no avatar, return null
  IF avatar_path IS NULL THEN
    RETURN NULL;
  END IF;

  -- Construct public URL
  -- Format: {SUPABASE_URL}/storage/v1/object/public/avatars/{user_id}/avatar.{ext}
  public_url := avatar_path;

  RETURN public_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. ADD COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_avatar_public_url IS 'Returns the public URL for user avatar from storage';

-- =====================================================
-- STORAGE SETUP COMPLETE
-- =====================================================

-- Verify bucket creation
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';
