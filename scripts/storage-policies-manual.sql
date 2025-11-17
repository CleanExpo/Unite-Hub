-- ============================================================================
-- STORAGE RLS POLICIES FOR media-uploads BUCKET
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Copy this ENTIRE file
-- 2. Go to Supabase Dashboard → SQL Editor → New Query
-- 3. Paste and click "Run"
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Users can view files in their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

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

-- ============================================================================
-- FINAL VERIFICATION QUERY
-- ============================================================================

SELECT
  '✅ Storage RLS Policies' as check_name,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) = 4 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 4 policies'
  END as status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND bucket_id = 'media-uploads';
