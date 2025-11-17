# 🚀 Storage Policies Quick Setup (2 Minutes)

## Why Manual Setup?

Storage bucket RLS policies require **superuser privileges** that even the Supabase CLI and service role keys don't have. The Supabase Dashboard is the official and recommended way to create these policies.

---

## ✅ Quick Steps

### 1. Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql/new

### 2. Copy the SQL

Open this file in your editor:
```
scripts/storage-policies-manual.sql
```

**Or copy from here:**

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view files in their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- 1. SELECT Policy
CREATE POLICY "Users can view files in their workspace"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- 2. INSERT Policy
CREATE POLICY "Users can upload to their workspace"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media-uploads'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- 3. UPDATE Policy
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media-uploads' AND owner = auth.uid())
WITH CHECK (bucket_id = 'media-uploads' AND owner = auth.uid());

-- 4. DELETE Policy
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media-uploads' AND owner = auth.uid());

-- Verification
SELECT
  '✅ Storage RLS Policies' as check_name,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname IN (
    'Users can view files in their workspace',
    'Users can upload to their workspace',
    'Users can update their own files',
    'Users can delete their own files'
  );
```

### 3. Paste & Run

1. Paste the SQL into the editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait 2-3 seconds

### 4. Verify Success

You should see:

```
check_name              | policy_count | status
------------------------|--------------|--------
✅ Storage RLS Policies | 4            | ✅ PASS
```

---

## ✅ That's It!

Your storage bucket is now fully secured with workspace-isolated RLS policies.

## 🧪 Test Upload

After setup, you can test the multimedia upload:

1. Go to your app: http://localhost:3008
2. Navigate to a page with the MediaUploader component
3. Drag & drop a video/audio/document file
4. Watch it upload, transcribe, and analyze automatically!

---

## 🆘 Troubleshooting

### Error: "policy already exists"
- ✅ **Good!** The policies are already there. Just verify with the query at the end.

### Error: "permission denied"
- ❌ You might not be logged in as the project owner
- Solution: Log in to Supabase Dashboard with the project owner account

### Error: "relation storage.objects does not exist"
- ❌ Storage extension might not be enabled
- Solution: Go to Dashboard → Database → Extensions → Enable "storage-api"

---

**Need help?** Check `STORAGE_SETUP_INSTRUCTIONS.md` for detailed troubleshooting.
