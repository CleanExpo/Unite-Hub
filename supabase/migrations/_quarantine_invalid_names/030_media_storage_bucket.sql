-- Migration: Create media-uploads storage bucket with RLS policies
-- Created: 2025-01-17
-- Description: Sets up Supabase Storage bucket for multimedia files with workspace-scoped access

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Insert bucket configuration (Supabase automatically creates the bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-uploads',
  'media-uploads',
  false, -- Private bucket
  104857600, -- 100MB limit (100 * 1024 * 1024 bytes)
  ARRAY[
    -- Video
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    -- Audio
    'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac', 'audio/webm',
    -- Documents
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    -- Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. DROP EXISTING POLICIES (idempotent)
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload to workspace folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can read workspace files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- ============================================================================
-- 3. CREATE RLS POLICIES FOR STORAGE
-- ============================================================================

-- Policy: Allow users to upload files to their workspace folders
-- Path format: {workspaceId}/{filename}
CREATE POLICY "Users can upload to workspace folders"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM public.workspaces w
      JOIN public.user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Policy: Allow users to read files from their workspace folders
CREATE POLICY "Users can read workspace files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'media-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM public.workspaces w
      JOIN public.user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Policy: Allow users to update files they uploaded
CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media-uploads'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'media-uploads'
    AND owner = auth.uid()
  );

-- Policy: Allow users to delete files they uploaded
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media-uploads'
    AND owner = auth.uid()
  );

-- Policy: Service role has full access (for background workers)
CREATE POLICY "Service role full access"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'media-uploads')
  WITH CHECK (bucket_id = 'media-uploads');

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

DO $$
BEGIN
  BEGIN
    EXECUTE $ddl$
      COMMENT ON POLICY "Users can upload to workspace folders" ON storage.objects IS
        'Allows authenticated users to upload files to folders matching their workspace IDs'
    $ddl$;
  EXCEPTION
    WHEN undefined_object OR insufficient_privilege THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    EXECUTE $ddl$
      COMMENT ON POLICY "Users can read workspace files" ON storage.objects IS
        'Allows authenticated users to read files from folders matching their workspace IDs'
    $ddl$;
  EXCEPTION
    WHEN undefined_object OR insufficient_privilege THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    EXECUTE $ddl$
      COMMENT ON POLICY "Service role full access" ON storage.objects IS
        'Allows service role (background workers) full access to all files in media-uploads bucket'
    $ddl$;
  EXCEPTION
    WHEN undefined_object OR insufficient_privilege THEN
      NULL;
  END;
END $$;

-- ============================================================================
-- 5. VERIFICATION QUERY
-- ============================================================================

-- Run this to verify policies were created successfully:
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND policyname LIKE '%workspace%';
