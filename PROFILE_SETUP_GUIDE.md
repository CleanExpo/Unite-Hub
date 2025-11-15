# Profile Feature Setup Guide

Quick setup instructions for the enhanced profile page feature.

## Prerequisites

- Supabase project configured
- Environment variables set in `.env.local`
- Development server accessible

## Setup Steps

### Step 1: Run Database Migration

**Option A - Supabase Dashboard** (Recommended):
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase/migrations/004_user_profile_enhancements.sql`
6. Paste into the SQL editor
7. Click "Run" button

**Option B - Supabase CLI**:
```bash
cd D:\Unite-Hub
supabase db push
```

### Step 2: Setup Avatar Storage

**Option A - Supabase Dashboard** (Recommended):
1. In Supabase Dashboard, go to "Storage"
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `scripts/setup-avatar-storage.sql`
5. Paste into the SQL editor
6. Click "Run" button

**Option B - Manual Bucket Creation**:
1. Go to Supabase Dashboard > Storage
2. Click "Create a new bucket"
3. Enter bucket name: `avatars`
4. Set to Public: ✓
5. Click "Create bucket"
6. Click on the bucket > "Policies" tab
7. Add the RLS policies from `scripts/setup-avatar-storage.sql`

### Step 3: Verify Installation

1. Ensure dev server is running:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:3008`

3. Log in to your account

4. Navigate to `/dashboard/profile`

5. You should see:
   - Avatar with upload button
   - All profile fields (username, name, business, phone, bio, website, timezone)
   - Notification preferences section
   - Account activity stats
   - "Edit Profile" button

### Step 4: Test Functionality

#### Test Profile Editing
1. Click "Edit Profile" button
2. Edit any field (e.g., username, full name)
3. Click "Save Changes"
4. Verify toast notification appears
5. Verify changes persist after page reload

#### Test Avatar Upload
1. Click "Upload Avatar" button
2. Select an image file (JPEG, PNG, WebP, or GIF)
3. Wait for upload to complete
4. Verify new avatar appears
5. Try clicking "Remove Avatar"
6. Verify avatar is deleted

#### Test Validation
1. Click "Edit Profile"
2. Try entering invalid username (e.g., "ab" - too short)
3. Verify error message appears
4. Try entering invalid phone (e.g., "123")
5. Verify error message appears
6. Fix errors and save successfully

## Verification Checklist

- [ ] Database migration ran successfully
- [ ] Storage bucket created
- [ ] Profile page loads without errors
- [ ] All fields are visible
- [ ] Edit mode works
- [ ] Avatar upload works
- [ ] Validation works
- [ ] Toast notifications appear
- [ ] Changes persist

## Troubleshooting

### Migration Error: "column already exists"
**Solution**: Some columns may already exist. Run only the missing columns individually.

### Storage Error: "bucket not found"
**Solution**: Create the bucket manually in Supabase Dashboard > Storage.

### Upload Error: "Failed to upload avatar"
**Solutions**:
1. Check that storage bucket is public
2. Verify RLS policies are applied
3. Check browser console for detailed error
4. Ensure file is under 2MB

### Profile Not Updating
**Solutions**:
1. Check browser console for API errors
2. Verify Supabase connection in `.env.local`
3. Check that user is authenticated
4. Verify API route is accessible

## Environment Variables Required

Ensure these are set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=your-secret-key
```

## File Locations

- **Migration**: `supabase/migrations/004_user_profile_enhancements.sql`
- **Storage Setup**: `scripts/setup-avatar-storage.sql`
- **Profile Page**: `src/app/dashboard/profile/page.tsx`
- **API Routes**:
  - `src/app/api/profile/update/route.ts`
  - `src/app/api/profile/avatar/route.ts`

## Support

For detailed implementation details, see: `PROFILE_FEATURE_IMPLEMENTATION.md`

For issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database schema with `SELECT * FROM user_profiles LIMIT 1;`
4. Verify storage bucket exists in Supabase Dashboard

## Success Indicators

When properly set up, you should be able to:
1. ✅ Edit all profile fields
2. ✅ Upload and delete avatars
3. ✅ See validation errors for invalid input
4. ✅ See toast notifications for all actions
5. ✅ Have changes persist across page reloads
6. ✅ See your avatar in the dashboard header

---

**Setup Time**: ~5 minutes
**Difficulty**: Easy
**Last Updated**: 2025-11-15
