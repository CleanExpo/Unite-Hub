# Database Cleanup Instructions

**Date:** 2025-11-15
**Issue:** Invalid organization IDs causing UUID errors

---

## Problem

The database contains organization records with invalid UUID values (e.g., `"default-org"`). This causes errors:

```
Error: invalid input syntax for type uuid: "default-org"
```

These errors appear in:
- Calendar API (`/api/calendar/events`)
- Profile update API (`/api/profile/update`)
- Contact Intelligence API (`/api/agents/contact-intelligence`)

---

## Solution Steps

### 1. Check for Invalid Organizations

Run this query in your Supabase SQL Editor:

```sql
-- Find organizations with non-UUID IDs
SELECT id, name, email, created_at
FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
```

**Expected Result:** Should return any orgs with invalid UUIDs like "default-org"

### 2. Check User Organizations Table

```sql
-- Find user_organizations linked to invalid org_ids
SELECT uo.id, uo.user_id, uo.org_id, uo.role, u.email as user_email
FROM user_organizations uo
LEFT JOIN user_profiles u ON u.id = uo.user_id
WHERE uo.org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
```

**Expected Result:** Should return user links to bad organizations

### 3. Option A: Delete Invalid Organizations (Recommended for Test Data)

⚠️ **WARNING:** This will delete all data associated with these organizations!

```sql
BEGIN;

-- Step 1: Delete user_organizations entries
DELETE FROM user_organizations
WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2: Delete workspaces
DELETE FROM workspaces
WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Delete organizations
DELETE FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 4: Verify deletion
SELECT id, name FROM organizations;

COMMIT;
```

### 4. Option B: Fix Existing Organizations (If You Have Production Data)

⚠️ **COMPLEX:** Only use if you have real user data you want to preserve

```sql
BEGIN;

-- Create a mapping table for old_id -> new_id
CREATE TEMP TABLE org_id_mapping AS
SELECT
    id as old_id,
    gen_random_uuid() as new_id,
    name
FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Show the mapping
SELECT * FROM org_id_mapping;

-- Update user_organizations
UPDATE user_organizations uo
SET org_id = m.new_id
FROM org_id_mapping m
WHERE uo.org_id = m.old_id;

-- Update workspaces
UPDATE workspaces w
SET org_id = m.new_id
FROM org_id_mapping m
WHERE w.org_id = m.old_id;

-- Update organizations (requires dropping and recreating FK constraints)
-- This is complex and should be done carefully

-- For now, just verify the updates
SELECT 'user_organizations' as table_name, COUNT(*) as updated_count
FROM user_organizations
WHERE org_id IN (SELECT new_id FROM org_id_mapping)
UNION ALL
SELECT 'workspaces', COUNT(*)
FROM workspaces
WHERE org_id IN (SELECT new_id FROM org_id_mapping);

-- If all looks good, delete old organizations
DELETE FROM organizations
WHERE id IN (SELECT old_id FROM org_id_mapping);

COMMIT;
```

---

## After Cleanup

### 1. Clear Browser Storage

Users need to clear their localStorage to remove cached organization data:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to Application tab
3. Expand "Local Storage"
4. Click on your domain
5. Find and delete `currentOrganizationId`
6. Reload the page

**Alternative:** Clear all site data:
1. DevTools → Application → Storage
2. Click "Clear site data"

### 2. Verify Fix

After cleanup, check the logs:

```bash
# Should see NO more "invalid input syntax for type uuid" errors
npm run dev
```

Navigate to `/dashboard/overview` and verify:
- ✅ No UUID errors in console
- ✅ Calendar widget loads
- ✅ Hot Leads panel loads
- ✅ Profile page works

---

## Prevention

The following code changes prevent this issue in the future:

1. **Dashboard Layout** (`src/app/dashboard/layout.tsx`) - Now uses real organizations from AuthContext instead of demo mode
2. **User Initialization** (`src/app/api/auth/initialize-user/route.ts`) - Creates organizations with auto-generated UUIDs

---

## Quick Check Commands

```sql
-- Count total organizations
SELECT COUNT(*) FROM organizations;

-- Count valid organizations
SELECT COUNT(*) FROM organizations
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Count invalid organizations
SELECT COUNT(*) FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
```

---

## If You Need Help

If you encounter issues during cleanup:

1. **Take a database backup** before running any DELETE or UPDATE queries
2. **Run queries in a transaction** (BEGIN...COMMIT) so you can ROLLBACK if needed
3. **Test on a staging database first** if possible
4. **Check Supabase logs** for any constraint violation errors

---

**Status:** 🔴 **ACTION REQUIRED** - Database cleanup needed to fully resolve UUID errors
