# Fix Missing User Profile

## Problem

Some users who signed up before 2025-01-18 may have missing profiles due to RLS policies blocking the profile creation.

**Symptoms**:
- `[AuthContext] No profile found for user: <user-id>` warnings in console
- 403 errors on API endpoints
- Dashboard loading but not showing data

## Solution

### Option 1: Automatic Fix (Recommended)

**For the current user (Phill McGurk):**

1. **Open browser console** on the dashboard page
2. **Run this script**:

```javascript
(async function fixProfile() {
  const { data: { session } } = await window.supabase.auth.getSession();

  if (!session) {
    console.error('❌ No session found. Please sign in first.');
    return;
  }

  console.log('🔄 Attempting to fix profile...');

  const response = await fetch('/api/auth/fix-profile', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  const result = await response.json();

  if (result.success) {
    console.log('✅ Profile fixed successfully!');
    console.log('📋 Profile:', result.profile || result.message);
    console.log('🔄 Refreshing page...');
    window.location.reload();
  } else {
    console.error('❌ Failed to fix profile:', result.error);
  }
})();
```

3. **Refresh the page** after seeing "✅ Profile fixed successfully!"

### Option 2: Database Direct Fix

**Run this SQL in Supabase Dashboard → SQL Editor:**

```sql
-- Replace with your actual user ID and email
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  avatar_url,
  created_at,
  updated_at
)
VALUES (
  '0082768b-c40a-4c4e-8150-84a3dd406cbc', -- ← Your user ID
  'phill.mcgurk@gmail.com',                -- ← Your email
  'Phill McGurk',                          -- ← Your name
  NULL,                                     -- ← Avatar URL (optional)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify profile was created
SELECT * FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';
```

### Option 3: Re-authenticate

1. **Sign out** completely
2. **Clear browser data**:
   - Chrome: DevTools → Application → Storage → Clear site data
   - Firefox: DevTools → Storage → Clear All
3. **Sign in again** with Google

The updated `/api/auth/initialize-user` endpoint now uses the service role, so it will successfully create the profile.

## Verification

After applying any fix, verify in the console:

```
✅ [AuthContext] Profile fetched: your@email.com
✅ [workspace-validation] User authenticated successfully: { userId: '...', orgId: '...' }
✅ No more 403 errors
```

## Root Cause

**Before Fix:**
- `/api/auth/initialize-user` used user-authenticated Supabase client
- RLS policies blocked INSERT into `user_profiles` table
- Profile creation silently failed (no error thrown)

**After Fix (Applied 2025-01-18):**
- `/api/auth/initialize-user` now uses `supabaseAdmin` (service role)
- Bypasses RLS policies for initialization
- Profile creation succeeds

## Affected Users

Only users who signed up **before 2025-01-18 16:00 UTC** are affected.

All new users will have profiles created automatically.

---

**Created**: 2025-01-18
**Fixed in commit**: [pending]
