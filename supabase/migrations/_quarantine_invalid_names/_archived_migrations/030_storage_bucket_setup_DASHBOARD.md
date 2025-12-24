# Storage Bucket Setup for Phase 2B Multimedia System

**⚠️ IMPORTANT**: Storage bucket creation must be done via the Supabase Dashboard, not SQL migrations.

---

## Step 1: Create Storage Bucket (Supabase Dashboard)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `media-uploads`
   - **Public**: ❌ **Unchecked** (private bucket)
   - **File size limit**: `100 MB`
   - **Allowed MIME types**: (leave empty to allow all, or specify):
     ```
     video/mp4, video/quicktime, video/x-msvideo, video/webm,
     audio/mpeg, audio/wav, audio/mp4, audio/aac,
     application/pdf, application/msword,
     application/vnd.openxmlformats-officedocument.wordprocessingml.document,
     text/plain, text/markdown,
     image/jpeg, image/png, image/gif, image/webp, image/svg+xml
     ```
4. Click **"Create bucket"**

---

## Step 2: Configure RLS Policies (Supabase Dashboard)

1. In **Storage** → **Policies** tab for `media-uploads` bucket
2. Click **"New Policy"** for each policy below:

### Policy 1: SELECT (View Files)
```sql
-- Name: Users can view files in their workspace
-- Operation: SELECT
-- Policy:

bucket_id = 'media-uploads'
AND (storage.foldername(name))[1]::uuid IN (
  SELECT w.id
  FROM public.workspaces w
  JOIN public.user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
)
```

### Policy 2: INSERT (Upload Files)
```sql
-- Name: Users can upload to their workspace
-- Operation: INSERT
-- Policy:

bucket_id = 'media-uploads'
AND (storage.foldername(name))[1]::uuid IN (
  SELECT w.id
  FROM public.workspaces w
  JOIN public.user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
)
```

### Policy 3: UPDATE (Update Files)
```sql
-- Name: Users can update their own files
-- Operation: UPDATE
-- Policy (USING):

bucket_id = 'media-uploads'
AND owner = auth.uid()

-- WITH CHECK:
bucket_id = 'media-uploads'
AND owner = auth.uid()
```

### Policy 4: DELETE (Delete Files)
```sql
-- Name: Users can delete their own files
-- Operation: DELETE
-- Policy:

bucket_id = 'media-uploads'
AND owner = auth.uid()
```

---

## Step 3: Verify Setup

Run this query in **SQL Editor** to verify bucket creation:

```sql
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'media-uploads';
```

**Expected Result**:
```
id              | media-uploads
name            | media-uploads
public          | false
file_size_limit | 104857600 (100MB)
allowed_mime_types | [array of MIME types]
```

---

## Step 4: Test Upload

After setup, test the upload API:

```bash
# Run from project root
node scripts/test-media-upload.sh
```

Or test via the MediaUploader component in the UI.

---

## Path Format

Files are stored with workspace isolation:
```
{workspace_id}/{file_id}/{filename}
```

**Example**:
```
5a92c7af-5aca-49a7-8866-3bfaa1d04532/
  └── 8f3e9b2a-4c1d-4e5f-9a8b-7c6d5e4f3a2b/
      └── video.mp4
```

This ensures:
- ✅ Workspace isolation (users can't access other workspaces' files)
- ✅ Unique file IDs prevent name collisions
- ✅ Original filename preserved in path

---

## Troubleshooting

### Error: "Bucket already exists"
- Bucket was already created. Skip Step 1.

### Error: "Policy already exists"
- Delete existing policies first:
  1. Go to Storage → Policies
  2. Delete policies named "Users can..."
  3. Re-create with correct SQL

### Error: "permission denied for table storage.objects"
- You're trying to run SQL migration instead of using Dashboard
- **Solution**: Use Dashboard UI (steps above)

### Files not uploading
1. Check bucket exists: `SELECT * FROM storage.buckets WHERE id = 'media-uploads';`
2. Check policies exist: Go to Storage → Policies tab
3. Check workspace_id is valid UUID in upload request
4. Check user belongs to workspace

---

## Alternative: SQL Script for Service Role Only

If you have **service role access** (not recommended for security), you can run:

```sql
-- Only run this if you have service role access
-- This bypasses normal permission checks

-- Enable storage
CREATE EXTENSION IF NOT EXISTS "storage";

-- Insert bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media-uploads', 'media-uploads', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies (must be run as superuser)
-- See policies in Step 2 above
```

**⚠️ WARNING**: This requires superuser/service role privileges. Use Dashboard instead.

---

## Summary

✅ **Use Supabase Dashboard** for bucket + policy creation
✅ File size limit: 100MB
✅ Path format: `{workspace_id}/{file_id}/{filename}`
✅ Workspace-isolated RLS policies
✅ Private bucket (access via signed URLs)

After completing these steps, the Phase 2B multimedia system will be fully functional! 🚀
