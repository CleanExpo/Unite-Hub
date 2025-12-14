-- Migration: Supabase Storage Bucket for Media Uploads (Phase 2B)
-- Created: 2025-01-17
-- Description: Creates storage bucket 'media-uploads' with workspace-isolated RLS policies

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
-- 2. STORAGE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload to their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- SELECT: Users can view files in their workspace
-- Path format: {workspace_id}/{file_id}/{filename}
CREATE POLICY "Users can view files in their workspace"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'media-uploads'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT w.id
      FROM public.workspaces w
      JOIN public.user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- INSERT: Users can upload to their workspace
CREATE POLICY "Users can upload to their workspace"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media-uploads'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT w.id
      FROM public.workspaces w
      JOIN public.user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'media-uploads'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'media-uploads'
    AND owner = auth.uid()
  );

-- DELETE: Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media-uploads'
    AND owner = auth.uid()
  );

-- ============================================================================
-- 3. COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view files in their workspace" ON storage.objects IS
  'Users can download media files from workspaces they belong to';
COMMENT ON POLICY "Users can upload to their workspace" ON storage.objects IS
  'Users can upload media files to their workspace folder';
COMMENT ON POLICY "Users can update their own files" ON storage.objects IS
  'Users can update metadata of files they uploaded';
COMMENT ON POLICY "Users can delete their own files" ON storage.objects IS
  'Users can delete files they uploaded';
