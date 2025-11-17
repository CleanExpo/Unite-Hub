# CRITICAL RLS FIX - User Profile Creation Blocked

**Date**: November 17, 2025
**Priority**: 🔴 **CRITICAL** - Blocking user login
**Status**: ⚠️ **REQUIRES IMMEDIATE ACTION**

---

## 🚨 Problem Summary

Users cannot log in because the Row Level Security (RLS) policy on the `user_profiles` table is preventing profile creation during user initialization.

### Error Messages:
```
Failed to initialize user: {
  "error": "Failed to create profile",
  "details": {
    "code": "42501",
    "message": "new row violates row-level security policy for table \"user_profiles\""
  }
}
```

### Impact:
- ❌ **Users cannot complete login** - Profile creation fails
- ❌ **Dashboard shows 500 errors** - No profile data available
- ❌ **Contact Intelligence returns 403** - User not properly initialized
- ❌ **Calendar Events return 403** - User not properly initialized

---

## ✅ Solution

Apply migration `032_fix_user_profiles_rls.sql` to fix the RLS policies.

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your project: **Unite-Hub** (project ID: `lksfwktwtmyznckodsau`)
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Apply the Migration

Copy and paste the following SQL into the SQL Editor:

```sql
-- Migration 032: Fix user_profiles RLS policies for user initialization

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Users can create their own profile (CRITICAL for initialization)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### Step 3: Execute the SQL

1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the success message: **"Success. No rows returned"**

### Step 4: Verify the Fix

Run this verification query:

```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

**Expected Output**: 4 policies
1. `Users can delete their own profile` (DELETE)
2. `Users can insert their own profile` (INSERT) ← **CRITICAL**
3. `Users can update their own profile` (UPDATE)
4. `Users can view their own profile` (SELECT)

---

## 🧪 Testing the Fix

### Test 1: User Login
1. Go to https://unite-hub.vercel.app/login
2. Click **"Continue with Google"**
3. Complete OAuth flow
4. **Expected**: Successfully redirected to `/dashboard/overview`
5. **Expected**: No 500 errors in console
6. **Expected**: Profile data loads correctly

### Test 2: Profile API
Open browser console and run:
```javascript
fetch('/api/profile?userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Profile data returned (not 500 error)

### Test 3: Dashboard Functionality
1. Navigate to `/dashboard/overview`
2. Check that Hot Leads panel loads (no 403 error)
3. Check that Calendar Events load (no 403 error)

---

## 🔍 Root Cause Analysis

### Why Did This Happen?

Previous RLS migrations (020, 021, 022, 025) created overly restrictive policies that:
1. Required workspace membership checks for profile access
2. Didn't account for initial profile creation (chicken-and-egg problem)
3. Used complex helper functions that failed during INSERT

### What Changed?

**Before** (Broken):
- Policy required user to be in a workspace BEFORE creating profile
- Profile creation needed to check workspace membership
- Workspace membership required existing profile → **DEADLOCK**

**After** (Fixed):
- Policy simply checks: `auth.uid() = id`
- User can create their own profile immediately after OAuth
- No circular dependency
- Simple and performant

---

## 📝 Additional Fixes Needed

After applying the RLS fix, you'll still need to address these issues:

### 1. Profile API 500 Errors

**File**: `src/app/api/profile/route.ts`

The profile API is likely failing due to similar RLS issues or missing error handling. Check the API logs for specific errors.

### 2. Contact Intelligence 403 Errors

**File**: `src/app/api/agents/contact-intelligence/route.ts`

The 403 error suggests workspace validation is failing. This might be because:
- User profile doesn't have workspace membership
- Workspace ID is invalid
- RLS policies on related tables are too restrictive

### 3. Calendar Events 403 Errors

**File**: `src/app/api/calendar/events/route.ts`

Similar to contact intelligence, workspace validation is failing.

---

## 🎯 Success Criteria

After applying the fix, you should see:

✅ Users can successfully log in
✅ Profile creation succeeds (no 500 error)
✅ Profile API returns data (no 500 error)
✅ Dashboard loads without errors
✅ Hot Leads panel loads (no 403 error)
✅ Calendar Events load (no 403 error)

---

## 🚀 Deployment Checklist

- [x] Migration file created: `032_fix_user_profiles_rls.sql`
- [ ] Migration applied in Supabase Dashboard
- [ ] Verification query confirms 4 policies exist
- [ ] Test login flow works
- [ ] Test profile API returns 200
- [ ] Test dashboard loads without errors
- [ ] Commit migration file to repo

---

## 📞 If Issues Persist

If the fix doesn't resolve all issues:

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs → Database
   - Look for RLS policy violations
   - Check exact error messages

2. **Check API Route Logs**:
   - Look at Vercel deployment logs
   - Check browser console for specific errors
   - Note which endpoints return 403/500

3. **Verify Helper Functions**:
   Run this in Supabase SQL Editor:
   ```sql
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_name LIKE '%workspace%'
   ORDER BY routine_name;
   ```

4. **Check Other RLS Policies**:
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

---

## 🔗 Related Documentation

- **RLS Workflow**: `.claude/RLS_WORKFLOW.md`
- **RLS Diagnostics**: `scripts/rls-diagnostics.sql`
- **Database Schema**: `COMPLETE_DATABASE_SCHEMA.sql`
- **Audit Report**: `AUDIT-INDEX.md`

---

**Generated**: 2025-11-17
**Version**: 1.0
**Status**: ⚠️ **REQUIRES IMMEDIATE ACTION**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
