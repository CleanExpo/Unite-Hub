-- Phase 2 Verification Script
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- ============================================================================
-- 1. VERIFY media_files TABLE
-- ============================================================================

SELECT
  '✅ media_files table' as check_name,
  COUNT(*) as column_count,
  CASE
    WHEN COUNT(*) = 23 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 23 columns'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'media_files';

-- ============================================================================
-- 2. VERIFY STORAGE BUCKET
-- ============================================================================

SELECT
  '✅ media-uploads bucket' as check_name,
  id,
  public,
  file_size_limit,
  CASE
    WHEN id = 'media-uploads' AND public = false AND file_size_limit = 104857600
    THEN '✅ PASS'
    ELSE '❌ FAIL - Check bucket configuration'
  END as status
FROM storage.buckets
WHERE id = 'media-uploads';

-- ============================================================================
-- 3. VERIFY RLS POLICIES ON media_files
-- ============================================================================

SELECT
  '✅ media_files RLS policies' as check_name,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 4 policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'media_files';

-- List all policies
SELECT
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'media_files'
ORDER BY cmd;

-- ============================================================================
-- 4. VERIFY STORAGE RLS POLICIES
-- ============================================================================

SELECT
  '✅ Storage bucket RLS policies' as check_name,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 4 policies'
  END as status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%workspace%';

-- List storage policies
SELECT
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname LIKE '%workspace%' OR policyname LIKE '%own%')
ORDER BY cmd;

-- ============================================================================
-- 5. VERIFY INDEXES
-- ============================================================================

SELECT
  '✅ media_files indexes' as check_name,
  COUNT(*) as index_count,
  CASE
    WHEN COUNT(*) >= 10 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 10 indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'media_files';

-- List all indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'media_files'
ORDER BY indexname;

-- ============================================================================
-- 6. VERIFY FULL-TEXT SEARCH COLUMN
-- ============================================================================

SELECT
  '✅ Full-text search column' as check_name,
  column_name,
  data_type,
  CASE
    WHEN data_type = 'tsvector' THEN '✅ PASS'
    ELSE '❌ FAIL - Should be tsvector'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'media_files'
  AND column_name = 'full_text_search';

-- ============================================================================
-- 7. GET YOUR WORKSPACE ID (for testing)
-- ============================================================================

SELECT
  'ℹ️ Your workspace info' as info,
  uo.user_id,
  uo.org_id,
  w.id as workspace_id,
  o.name as org_name,
  w.name as workspace_name
FROM user_organizations uo
JOIN organizations o ON o.id = uo.org_id
JOIN workspaces w ON w.org_id = o.id
WHERE uo.user_id = auth.uid()
LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT
  '📊 SUMMARY' as title,
  (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'media_files'
  ) as media_files_columns,
  (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_files'
  ) as table_policies,
  (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  ) as storage_policies,
  (
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'media_files'
  ) as indexes,
  (
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM storage.buckets WHERE id = 'media-uploads'
    ) THEN 'YES' ELSE 'NO' END
  ) as bucket_exists;
