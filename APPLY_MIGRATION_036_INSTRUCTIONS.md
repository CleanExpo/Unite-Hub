# Apply Migration 036 - Fix Organizations & Workspaces RLS

**Date**: November 18, 2025
**Priority**: 🔴 **CRITICAL** - Blocking user login
**Status**: ⚠️ **READY TO APPLY**

---

## 🚨 What This Fixes

After applying Migration 032 (user_profiles RLS), user login is still blocked by RLS policies on:
1. **organizations table** - "new row violates row-level security policy"
2. **workspaces table** - Cannot create default workspace
3. **user_organizations table** - Cannot create membership records

**Root Cause**: Previous migrations (033, 034, 035) referenced a non-existent `created_by` column in the organizations table. The actual schema uses the `user_organizations` join table with `role='owner'` to determine ownership.

---

## ✅ Step 1: Apply Migration 036

### Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your project: **Unite-Hub**
3. Navigate to **SQL Editor** in the left sidebar

### Execute the Migration

1. Open the migration file: `supabase/migrations/036_fix_rls_correct_schema.sql`
2. Copy the ENTIRE contents (all 265 lines)
3. Paste into the SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
5. Wait for success message: **"Success. No rows returned"** or the verification query results

---

## ✅ Step 2: Verify Policies Were Created

Run this verification query in the SQL Editor:

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
GROUP BY tablename
ORDER BY tablename;
```

**Expected Output**:

| tablename           | policy_count |
|---------------------|--------------|
| organizations       | 4            |
| user_organizations  | 4            |
| workspaces          | 4            |

**Total**: 12 policies created

---

## ✅ Step 3: Test the Login Flow

### Clear Browser State
1. Open Developer Tools (F12)
2. Go to **Application** tab → **Storage** → **Clear site data**
3. Close all browser tabs with Unite-Hub

### Test Login
1. Go to https://unite-hub.vercel.app/login
2. Click **"Continue with Google"**
3. Complete OAuth flow
4. **Expected**: Successfully redirected to `/dashboard/overview`

### Verify Console (F12 → Console)
✅ **No RLS errors** like "new row violates row-level security policy"
✅ **No 500 errors** from Profile API
✅ **No 403 errors** from Contact Intelligence API
✅ **No 403 errors** from Calendar Events API

### Verify Dashboard
✅ Dashboard loads completely
✅ Profile data displays (top right)
✅ Hot Leads panel loads (no 403 error)
✅ Calendar Events load (no 403 error)

---

## 🔍 What Migration 036 Does

### Organizations Table (4 policies)

1. **SELECT**: Users can view organizations they're members of
   - Checks `user_organizations` table for membership

2. **INSERT**: Any authenticated user can create organizations
   - `TO authenticated WITH CHECK (true)` - Critical for first-time users

3. **UPDATE**: Organization owners can update
   - Checks `user_organizations.role = 'owner'`

4. **DELETE**: Organization owners can delete
   - Checks `user_organizations.role = 'owner'`

### User_Organizations Table (4 policies)

1. **SELECT**: Users can view their own memberships
   - `user_id = auth.uid()`

2. **INSERT**: Users can add themselves OR org owners can add members
   - **CRITICAL**: `user_id = auth.uid()` allows self-registration for initialization
   - OR org owners can invite new members

3. **UPDATE**: Users or org owners can update memberships
   - Self-management or owner management

4. **DELETE**: Users can leave OR org owners can remove members
   - Self-removal or owner removal

### Workspaces Table (4 policies)

1. **SELECT**: Users can view workspaces in their organizations
   - Checks `user_organizations` for membership

2. **INSERT**: Users can create workspaces in their organizations
   - **CRITICAL**: Checks membership, not ownership - allows first workspace creation

3. **UPDATE**: Organization owners can update workspaces
   - Checks `user_organizations.role = 'owner'`

4. **DELETE**: Organization owners can delete workspaces
   - Checks `user_organizations.role = 'owner'`

---

## 📝 Schema Clarification

**Why Previous Migrations Failed**:

Migration 033, 034, 035 tried to use:
```sql
-- ❌ WRONG - This column doesn't exist!
CREATE POLICY "..." USING (created_by = auth.uid());
```

**Actual Organizations Schema**:
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  team_size TEXT,
  industry TEXT,
  plan TEXT,
  status TEXT,
  trial_ends_at TIMESTAMP,
  stripe_customer_id TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
  -- ❌ NO created_by column!
);
```

**Correct Pattern** (Migration 036):
```sql
-- ✅ CORRECT - Check ownership via join table
CREATE POLICY "Organization owners can update"
  ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

---

## 🎯 Success Criteria

After applying Migration 036 and testing:

✅ Users can successfully log in via Google OAuth
✅ Profile creation succeeds (no 500 error)
✅ Organization creation succeeds (no RLS error)
✅ Workspace creation succeeds (no RLS error)
✅ User_organizations membership created (no RLS error)
✅ Profile API returns data (no 500 error)
✅ Dashboard loads without errors
✅ Hot Leads panel loads (no 403 error)
✅ Calendar Events load (no 403 error)

---

## 🚀 Deployment Checklist

- [x] Migration file created: `036_fix_rls_correct_schema.sql`
- [x] Migration committed to repository
- [x] Migration pushed to GitHub
- [ ] **Migration applied in Supabase Dashboard** ← YOU ARE HERE
- [ ] Verification query confirms 12 policies exist
- [ ] Test login flow works
- [ ] Test dashboard loads without errors
- [ ] All console errors resolved

---

## 📞 If Issues Persist

If you still see errors after applying Migration 036:

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs → Database
   - Look for RLS policy violations
   - Note the exact error messages

2. **Verify All Policies**:
   ```sql
   SELECT
     tablename,
     policyname,
     cmd
   FROM pg_policies
   WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
   ORDER BY tablename, policyname;
   ```

   **Expected**: 12 rows (4 policies per table)

3. **Check Auth User**:
   ```sql
   SELECT auth.uid();  -- Should return your user UUID
   ```

4. **Provide Console Logs**:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Copy any error messages (especially RLS or 403/500 errors)

---

## 🔗 Related Files

- **Migration File**: `supabase/migrations/036_fix_rls_correct_schema.sql`
- **Previous Fix**: `supabase/migrations/032_fix_user_profiles_rls.sql` (✅ Applied successfully)
- **Failed Migrations**: `033_fix_organizations_rls.sql`, `034_fix_user_organizations_rls.sql`, `035_fix_all_init_tables_rls.sql` (❌ Referenced non-existent created_by column)
- **Instructions**: `CRITICAL_RLS_FIX_INSTRUCTIONS.md` (original user_profiles fix)

---

**Generated**: 2025-11-18
**Version**: 1.0
**Status**: ⚠️ **READY TO APPLY**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
