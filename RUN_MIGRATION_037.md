# How to Run Migration 037: RLS Policy Cleanup

**Purpose:** Clean up duplicate RLS policies from earlier migrations

**Status:** ⏳ Ready to Run (not yet executed)

---

## What This Migration Does

Migration 037 removes duplicate RLS (Row Level Security) policies that were created during earlier migrations. Specifically:

1. **Drops old policies using helper functions:**
   - Organizations table: 3 old policies
   - Workspaces table: 3 old policies

2. **Keeps new policies with direct subqueries:**
   - Organizations: 4 policies (SELECT, INSERT, UPDATE, DELETE)
   - User_organizations: 4 policies (already correct)
   - Workspaces: 4 policies (SELECT, INSERT, UPDATE, DELETE)

3. **Verifies final policy counts:**
   - Expected: 4 policies per table
   - Total: 12 policies across 3 core tables

---

## Why Run This Migration

**Problem:** Earlier migrations may have left duplicate policies that:
- Use helper functions (`user_has_role_in_org`) that don't exist
- Cause confusion and potential security issues
- Make policy management difficult

**Solution:** This migration cleans up duplicates and ensures consistent policy structure.

---

## How to Run

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Unite-Hub project
3. Navigate to **SQL Editor**

### Step 2: Copy Migration SQL
1. Open `supabase/migrations/037_cleanup_duplicate_rls_policies.sql`
2. Copy the entire file contents (133 lines)

### Step 3: Execute Migration
1. In SQL Editor, click **New Query**
2. Paste the migration SQL
3. Click **Run** button
4. Wait for execution (should take ~1-2 seconds)

### Step 4: Verify Results
Look for these success messages in the output:

```
✅ Organizations table has exactly 4 policies
✅ Workspaces table has exactly 4 policies
✅ User_organizations table has exactly 4 policies
```

You should also see a policy count table:
```
 tablename          | policy_count
--------------------+--------------
 organizations      |            4
 user_organizations |            4
 workspaces         |            4
```

---

## Expected Output

### Success Messages
```sql
NOTICE:  ✅ Organizations table has exactly 4 policies
NOTICE:  ✅ Workspaces table has exactly 4 policies
NOTICE:  ✅ User_organizations table has exactly 4 policies
```

### Policy Summary
```
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('organizations', 'user_organizations', 'workspaces')
ORDER BY tablename, cmd;
```

**Expected 12 policies:**
- Organizations: 4 (INSERT, SELECT, UPDATE, DELETE)
- User_organizations: 4 (INSERT, SELECT, UPDATE, DELETE)
- Workspaces: 4 (INSERT, SELECT, UPDATE, DELETE)

---

## Troubleshooting

### If you see warnings

**Warning: "Expected 4 policies for X table, found Y"**

**Cause:** Some policies weren't cleaned up properly

**Solution:**
1. Check which policies exist:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'organizations';
   ```
2. Manually drop duplicate policies:
   ```sql
   DROP POLICY IF EXISTS "old_policy_name" ON table_name;
   ```
3. Re-run the migration

### If migration fails

**Error: "policy does not exist"**

**Solution:** This is OK—the migration uses `DROP POLICY IF EXISTS`, so it won't fail if a policy doesn't exist.

**Error: "permission denied"**

**Solution:** Make sure you're using the service role connection in Supabase Dashboard (default).

---

## Verification Checklist

After running the migration, verify:

- [ ] Organizations table has exactly 4 policies
- [ ] Workspaces table has exactly 4 policies
- [ ] User_organizations table has exactly 4 policies
- [ ] No policies reference `user_has_role_in_org` function
- [ ] All policies use direct subqueries to `user_organizations`
- [ ] No warnings in migration output

---

## Impact

**Before Migration:**
- Multiple duplicate policies
- Policies using non-existent helper functions
- Potential security gaps

**After Migration:**
- Clean, consistent policy structure
- 4 policies per core table (12 total)
- All policies use direct subqueries
- Easier to maintain and audit

---

## Next Steps After Running

1. **Test workspace isolation:**
   ```bash
   # Run the test script
   psql < scripts/test-workspace-isolation.sql
   ```

2. **Verify in production:**
   - Create a test workspace
   - Add test contacts
   - Verify users can only see their workspace data

3. **Monitor for issues:**
   - Check audit logs for permission errors
   - Verify all dashboard pages still work
   - Test contact creation/updates

---

## Related Files

- Migration file: `supabase/migrations/037_cleanup_duplicate_rls_policies.sql`
- Test script: `scripts/test-workspace-isolation.sql`
- RLS workflow: `.claude/RLS_WORKFLOW.md`
- Documentation: `docs/RLS_MIGRATION_POSTMORTEM.md`

---

**Estimated Time:** 5 minutes
**Risk Level:** Low (only drops duplicate policies, keeps core policies intact)
**Rollback:** Not needed (migration only drops old/duplicate policies)

---

**Run this migration before going to production to ensure clean RLS policy structure.**
