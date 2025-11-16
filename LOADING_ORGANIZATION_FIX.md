# "Loading organization..." Fix

**Issue**: After successful sign-in, dashboard stuck on "Loading organization..."

**Root Cause**: User has no organizations in the database because:
1. Database schema cache was out of sync (fixed earlier)
2. Organizations table `id` column doesn't have UUID default generator
3. User signed in before these fixes were applied

---

## Fix Steps

### Step 1: Fix UUID Generation in Supabase

Run this in Supabase SQL Editor:

```sql
-- Ensure id column has UUID default
ALTER TABLE organizations ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the default is set
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'organizations' AND column_name = 'id';
```

**Expected Output**:
```
column_name | column_default
------------|----------------
id          | gen_random_uuid()
```

### Step 2: Create Missing Organization

Run this script locally:

```bash
node create-missing-org.mjs
```

**Expected Output**:
```
🏢 Creating Missing Organization

👤 Checking user: phill.mcgurk@gmail.com
   ⚠️  No organizations found. Creating...
   ✅ Organization created: [UUID]
   ✅ User linked to organization as owner
   ✅ Default workspace created

   🎉 Organization setup complete!

✅ All done!
```

### Step 3: Verify in Database

Run this script to check:

```bash
node check-user-org.mjs
```

**Expected Output**:
```
👤 User: phill.mcgurk@gmail.com (...)
   ✅ Profile: Phill McGurk
   ✅ Found 1 organization(s):
      ✅ Org: Phill McGurk's Organization (...)
         Email: phill.mcgurk@gmail.com
         Plan: starter, Status: trial
         Role: owner, Active: true
      ✅ Workspaces: Default Workspace
```

### Step 4: Test Dashboard

1. Open browser
2. Navigate to: `http://localhost:3008/dashboard/overview`
3. You should see:
   - Dashboard loads successfully
   - Stats show (0 contacts, 0 campaigns, etc.)
   - No "Loading organization..." message

---

## Code Changes Made

### `src/app/dashboard/layout.tsx`

**Changed** (line 43-44):
```typescript
// WRONG: AuthContext provides org_id, not organizationId
if (currentOrganization?.organizationId) {
  setOrgId(currentOrganization.organizationId as Id<"organizations">);
}

// CORRECT: Use org_id from AuthContext
if (currentOrganization?.org_id) {
  setOrgId(currentOrganization.org_id as Id<"organizations">);
}
```

**Added debug logging**:
```typescript
console.log('[DashboardLayout] currentOrganization changed:', currentOrganization);
if (currentOrganization?.org_id) {
  console.log('[DashboardLayout] Setting orgId to:', currentOrganization.org_id);
  setOrgId(currentOrganization.org_id as Id<"organizations">);
} else {
  console.log('[DashboardLayout] No org_id found in currentOrganization');
}
```

---

## Why This Happened

1. **Initial Sign-In** (Before Fixes):
   - User signed in with Google
   - `/api/auth/initialize-user` tried to create organization
   - Database schema cache was out of sync → PGRST204 error
   - Organization creation failed silently
   - User profile created but no organization

2. **Schema Cache Fixed** (Earlier Today):
   - Ran `fix-organizations-schema.sql`
   - Added `email` column to organizations table
   - Refreshed Supabase schema cache
   - But user's organization still missing (already signed up)

3. **UUID Default Missing** (Just Discovered):
   - Organizations table `id` column had no default value
   - PostgreSQL couldn't auto-generate UUIDs
   - Insert failed with "null value in column id"

4. **Field Name Mismatch** (Dashboard Layout Bug):
   - Dashboard layout looked for `currentOrganization.organizationId`
   - AuthContext provides `currentOrganization.org_id`
   - Even if org existed, dashboard wouldn't find it

---

## Prevention for Future Users

The fixes ensure new users won't hit this:

✅ Database schema cache refreshed
✅ Organizations table has UUID default generator
✅ Dashboard layout uses correct field name (`org_id`)
✅ Bearer token properly passed to API routes

New users will have organizations created automatically on first sign-in.

---

## Scripts Created

- `check-user-org.mjs` - Check if user has organizations
- `create-missing-org.mjs` - Create missing organizations for existing users
- `fix-organizations-uuid.sql` - Add UUID default to organizations table

---

## Next Steps After Fix

1. Test complete sign-in flow with fresh user
2. Remove debug console.logs from production code
3. Consider adding better error handling/reporting when org creation fails
4. Add admin panel to manually create orgs if needed
