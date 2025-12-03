# 📦 Storage Setup Instructions for Phase 2B

**Error Encountered**: `ERROR: 42501: must be owner of relation objects`

**Reason**: Storage bucket RLS policies require superuser permissions and must be created via Supabase Dashboard, not SQL migrations.

---

## ✅ Step 1: Run Database Migration (SQL Editor)

**File**: `supabase/migrations/029_media_files.sql`

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `029_media_files.sql`
4. Click **"Run"**

**What it creates**:
- ✅ `media_files` table with all columns
- ✅ Indexes for performance
- ✅ RLS policies for workspace isolation
- ✅ Full-text search vector
- ✅ Updated_at trigger

---

## ✅ Step 2: Create Storage Bucket (Dashboard UI)

**⚠️ MUST use Dashboard UI - SQL migration won't work**

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `media-uploads`
   - **Public**: ❌ **UNCHECKED** (private)
   - **File size limit**: `100 MB`
4. Click **"Create bucket"**

---

## ✅ Step 3: Add Storage Policies (Dashboard UI)

1. In **Storage** → Click on `media-uploads` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"** button (repeat for each policy below)

### Policy 1: Allow SELECT (View Files)
```
Name: Users can view files in their workspace
Operation: SELECT
Target roles: authenticated

USING expression:
bucket_id = 'media-uploads'
AND (storage.foldername(name))[1]::uuid IN (
  SELECT w.id
  FROM public.workspaces w
  JOIN public.user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
)
```

### Policy 2: Allow INSERT (Upload Files)
```
Name: Users can upload to their workspace
Operation: INSERT
Target roles: authenticated

WITH CHECK expression:
bucket_id = 'media-uploads'
AND (storage.foldername(name))[1]::uuid IN (
  SELECT w.id
  FROM public.workspaces w
  JOIN public.user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
)
```

### Policy 3: Allow UPDATE (Update Files)
```
Name: Users can update their own files
Operation: UPDATE
Target roles: authenticated

USING expression:
bucket_id = 'media-uploads' AND owner = auth.uid()

WITH CHECK expression:
bucket_id = 'media-uploads' AND owner = auth.uid()
```

### Policy 4: Allow DELETE (Delete Files)
```
Name: Users can delete their own files
Operation: DELETE
Target roles: authenticated

USING expression:
bucket_id = 'media-uploads' AND owner = auth.uid()
```

---

## ✅ Step 4: Verify Setup

Run this in **SQL Editor**:

```sql
-- Check media_files table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'media_files';

-- Check storage bucket exists
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'media-uploads';

-- Check policies exist (should return 4 rows)
SELECT policyname
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';
```

**Expected**:
- ✅ `media_files` table found
- ✅ `media-uploads` bucket with 100MB limit
- ✅ 4 storage policies

---

## 🚀 Step 5: Test Upload

After completing the setup, test the upload functionality:

### Option A: Via UI Component
1. Navigate to a page with `MediaUploader` component
2. Drag-drop a video/audio/document
3. Check upload progress
4. Verify file appears in MediaGallery

### Option B: Via API Test
```bash
curl -X POST http://localhost:3008/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/video.mp4" \
  -F "workspace_id=YOUR_WORKSPACE_ID" \
  -F "org_id=YOUR_ORG_ID" \
  -F "file_type=video"
```

---

## 📂 File Storage Structure

Files are stored with this path format:
```
{workspace_id}/
  └── {file_id}/
      └── {filename}
```

**Example**:
```
YOUR_WORKSPACE_ID/
  └── 8f3e9b2a-4c1d-4e5f-9a8b-7c6d5e4f3a2b/
      └── video.mp4
```

**Benefits**:
- ✅ Workspace isolation (RLS enforced on first path segment)
- ✅ Unique file IDs prevent collisions
- ✅ Original filename preserved

---

## ❌ Common Errors

### "Bucket already exists"
**Solution**: Skip Step 2, bucket was already created.

### "Policy already exists"
**Solution**:
1. Go to Storage → Policies
2. Delete existing policies
3. Re-create with correct SQL

### "permission denied for table storage.objects"
**Solution**: You're trying to run SQL instead of using Dashboard. Use Dashboard UI for storage policies.

### Upload fails with 401 Unauthorized
**Solution**:
1. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in `.env.local`
2. Verify user is authenticated
3. Check workspace_id belongs to user

### Upload fails with 403 Forbidden
**Solution**:
1. Verify storage policies exist (Step 3)
2. Check user belongs to workspace
3. Verify workspace_id is valid UUID

---

## ✅ Success Checklist

- [ ] Migration `029_media_files.sql` executed successfully
- [ ] Storage bucket `media-uploads` created (100MB limit, private)
- [ ] 4 RLS policies created for bucket
- [ ] Test upload succeeds
- [ ] File appears in Supabase Storage
- [ ] Database record created in `media_files` table
- [ ] Transcription triggered (for video/audio)
- [ ] AI analysis triggered

---

## 📚 Reference Files

- **Database Migration**: `supabase/migrations/029_media_files.sql`
- **Storage Policies Guide**: `supabase/migrations/030_storage_bucket_setup_DASHBOARD.md`
- **Implementation Docs**: `PHASE_2B_MULTIMEDIA_IMPLEMENTATION.md`
- **Upload API**: `src/app/api/media/upload/route.ts`
- **Components**: `src/components/media/`

---

## 🆘 Still Having Issues?

1. Check Supabase Dashboard → **Database** → **Tables** → Verify `media_files` exists
2. Check Supabase Dashboard → **Storage** → Verify `media-uploads` bucket exists
3. Check Supabase Dashboard → **Storage** → **Policies** → Verify 4 policies exist
4. Check browser console for errors
5. Check Supabase Dashboard → **Logs** for error messages

---

**After completing these steps, Phase 2B multimedia system will be fully functional!** 🎉
