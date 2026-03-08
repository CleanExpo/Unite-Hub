-- Migration: Storage Bucket RLS Policies (Phase 2B)
-- Created: 2025-01-17
-- Description: Creates RLS policies for media-uploads storage bucket
-- NOTE: This must be applied via Supabase CLI (npx supabase db push)

-- ============================================================================
-- STORAGE RLS POLICIES FOR media-uploads BUCKET
-- ============================================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. SELECT Policy: Users can view files in their workspace
-- ============================================================================

CREATE POLICY "Users can view files in their workspace"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT w.id
    FROM public.workspaces w
    JOIN public.user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ============================================================================
-- 2. INSERT Policy: Users can upload to their workspace
-- ============================================================================

CREATE POLICY "Users can upload to their workspace"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-uploads'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT w.id
    FROM public.workspaces w
    JOIN public.user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- ============================================================================
-- 3. UPDATE Policy: Users can update their own files
-- ============================================================================

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-uploads' AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'media-uploads' AND owner = auth.uid()
);

-- ============================================================================
-- 4. DELETE Policy: Users can delete their own files
-- ============================================================================

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-uploads' AND owner = auth.uid()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count storage policies for media-uploads bucket
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      policyname = 'Users can view files in their workspace'
      OR policyname = 'Users can upload to their workspace'
      OR policyname = 'Users can update their own files'
      OR policyname = 'Users can delete their own files'
    );

  IF policy_count = 4 THEN
    RAISE NOTICE '✅ All 4 storage RLS policies created successfully';
  ELSE
    RAISE NOTICE '⚠️  Only % storage policies found (expected 4)', policy_count;
  END IF;
END $$;
