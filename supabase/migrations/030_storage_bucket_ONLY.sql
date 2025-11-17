-- Migration: Create Supabase Storage Bucket (Phase 2B)
-- Created: 2025-01-17
-- Description: Creates storage bucket 'media-uploads' (RLS policies must be added via Dashboard)

-- ⚠️ NOTE: This creates the bucket only. RLS policies MUST be added via Supabase Dashboard UI.
-- See: STORAGE_SETUP_INSTRUCTIONS.md for policy setup

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Insert the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-uploads',
  'media-uploads',
  false, -- Not public by default (access via signed URLs)
  104857600, -- 100MB in bytes
  ARRAY[
    -- Video
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    -- Audio
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac',
    -- Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    -- Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ];

-- ============================================================================
-- 2. VERIFY BUCKET CREATION
-- ============================================================================

-- Verify bucket was created
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'media-uploads';

  IF bucket_count > 0 THEN
    RAISE NOTICE '✅ Storage bucket "media-uploads" created successfully';
    RAISE NOTICE '⚠️  Next step: Add RLS policies via Supabase Dashboard UI';
    RAISE NOTICE '📖 See: STORAGE_SETUP_INSTRUCTIONS.md for policy setup';
  ELSE
    RAISE EXCEPTION '❌ Failed to create storage bucket';
  END IF;
END $$;

-- ============================================================================
-- ⚠️ IMPORTANT: RLS POLICIES MUST BE ADDED VIA DASHBOARD
-- ============================================================================

-- The following policies CANNOT be created via SQL migration.
-- You MUST add them via Supabase Dashboard → Storage → Policies
--
-- Required Policies (copy/paste into Dashboard UI):
--
-- 1. SELECT Policy:
--    Name: Users can view files in their workspace
--    Expression:
--    bucket_id = 'media-uploads'
--    AND (storage.foldername(name))[1]::uuid IN (
--      SELECT w.id FROM public.workspaces w
--      JOIN public.user_organizations uo ON uo.org_id = w.org_id
--      WHERE uo.user_id = auth.uid()
--    )
--
-- 2. INSERT Policy:
--    Name: Users can upload to their workspace
--    Expression:
--    bucket_id = 'media-uploads'
--    AND (storage.foldername(name))[1]::uuid IN (
--      SELECT w.id FROM public.workspaces w
--      JOIN public.user_organizations uo ON uo.org_id = w.org_id
--      WHERE uo.user_id = auth.uid()
--    )
--
-- 3. UPDATE Policy:
--    Name: Users can update their own files
--    USING: bucket_id = 'media-uploads' AND owner = auth.uid()
--    WITH CHECK: bucket_id = 'media-uploads' AND owner = auth.uid()
--
-- 4. DELETE Policy:
--    Name: Users can delete their own files
--    Expression: bucket_id = 'media-uploads' AND owner = auth.uid()
