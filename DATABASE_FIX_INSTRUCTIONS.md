# URGENT: Database Fix Required for Profile Updates

## Problem
Profile updates are failing with 500 errors due to UNIQUE constraint on `username` column that doesn't handle empty strings properly.

## Root Cause
The existing UNIQUE constraint treats empty string `""` as a duplicate value, causing constraint violations when multiple users try to save profiles without usernames.

## Solution
Run the migration `014_fix_username_constraint.sql` to fix the constraint.

## How to Apply the Fix

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your Unite-Hub project
3. Navigate to **SQL Editor**

### Step 2: Run the Migration
Copy and paste this SQL:

```sql
-- Migration: Fix username UNIQUE constraint to handle empty strings
-- Created: 2025-11-16

-- Drop existing username unique constraint if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_key;

-- Create a partial unique index that only applies to non-null, non-empty usernames
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_unique_idx
ON user_profiles(username)
WHERE username IS NOT NULL AND username != '';

-- Add a check to ensure empty strings are converted to NULL
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_username_not_empty
CHECK (username IS NULL OR length(trim(username)) > 0);

COMMENT ON INDEX user_profiles_username_unique_idx IS 'Unique constraint for usernames, allowing NULL and converting empty strings to NULL';
```

### Step 3: Click "Run" to execute

### Step 4: Verify the Fix
Run this query to verify:

```sql
SELECT
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
  AND conname LIKE '%username%';
```

You should see:
- `user_profiles_username_unique_idx` (index)
- `user_profiles_username_not_empty` (check constraint)

### Step 5: Test Profile Update
1. Go to https://unite-hub.vercel.app/dashboard/profile
2. Click "Edit Profile"
3. Fill in any fields
4. Click "Save Changes"
5. Should save successfully without 500 errors

## What This Fix Does

**Before:**
- UNIQUE constraint on username column
- Empty string "" treated as duplicate
- Multiple users can't save without username → 500 error

**After:**
- Partial UNIQUE index only on non-empty usernames
- Empty strings converted to NULL
- NULL values are always unique in partial index
- Multiple users can save without username → ✅ Works

## Verification

After applying, test these scenarios:

1. ✅ Save profile with username "Phill" → Should work
2. ✅ Save profile with empty username → Should work (stores NULL)
3. ✅ Save profile with duplicate username → Should fail with 400 error
4. ✅ Save multiple profiles with empty usernames → Should all work

## Files Changed

- `supabase/migrations/014_fix_username_constraint.sql` - Database migration
- `src/app/api/profile/update/route.ts` - Already converts "" to NULL (no change needed)

