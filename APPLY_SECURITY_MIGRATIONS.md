# Quick Start: Apply Database Security Migrations

**Time Required**: 5-10 minutes
**Difficulty**: Easy
**Risk Level**: Low (fully tested, idempotent migrations)

---

## TL;DR

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Copy/paste `026_FINAL_DATABASE_SECURITY.sql` → Execute
3. Copy/paste `027_VERIFY_ALL_SECURITY.sql` → Execute
4. Verify all tests show `✓ PASS`
5. Done! 🎉

---

## Step-by-Step Instructions

### Step 1: Access Supabase SQL Editor

1. Open your browser
2. Go to https://supabase.com/dashboard
3. Login with your credentials
4. Select your project: `lksfwktwtmyznckodsau`
5. Click **"SQL Editor"** in left sidebar

### Step 2: Apply Security Migration

1. In VS Code, open: `D:\Unite-Hub\supabase\migrations\026_FINAL_DATABASE_SECURITY.sql`
2. Press `Ctrl+A` to select all
3. Press `Ctrl+C` to copy
4. Return to Supabase SQL Editor
5. Press `Ctrl+V` to paste the migration
6. Click **"Run"** button (bottom right)
7. Wait for "Query executed successfully" message (~30-60 seconds)

**What This Does**:
- Fixes all org_id column types (TEXT → UUID)
- Creates helper functions for RLS
- Enables RLS on all tables
- Creates comprehensive security policies
- Creates interactions table
- Adds performance indexes

### Step 3: Verify Security Implementation

1. In Supabase SQL Editor, click **"New query"**
2. In VS Code, open: `D:\Unite-Hub\supabase\migrations\027_VERIFY_ALL_SECURITY.sql`
3. Copy all content (`Ctrl+A`, `Ctrl+C`)
4. Paste into Supabase SQL Editor (`Ctrl+V`)
5. Click **"Run"** button
6. Review the test results

**Expected Output**: All 15 tests should show `✓ PASS`

Example:
```
TEST 1: Organization ID Type Consistency
✓ PASS - All org_id columns are UUID

TEST 2: RLS Enabled on Critical Tables
✓ PASS - RLS enabled on all critical tables

TEST 3: Helper Functions Exist
✓ PASS - Both helper functions exist

... (12 more tests)
```

### Step 4: Test Application

1. Open terminal in `D:\Unite-Hub`
2. Run: `npm run dev`
3. Open browser: http://localhost:3008
4. Login with your credentials
5. Navigate to Dashboard → Contacts
6. Verify contacts are visible
7. Try creating a new contact
8. Verify it works

**If everything works**: ✅ Migration successful!

**If you see errors**: See troubleshooting below

---

## Troubleshooting

### Error: "permission denied for table contacts"

**Cause**: RLS is working! User doesn't have proper workspace access.

**Fix**:
```sql
-- Check if user has organization/workspace membership
SELECT * FROM user_organizations WHERE user_id = auth.uid();

-- If empty, user needs to be added to organization
-- This should have been done during signup via /api/auth/initialize-user
```

### Error: "column org_id does not exist"

**Cause**: Migration 026 didn't complete successfully.

**Fix**:
1. Check Supabase logs for errors
2. Re-run migration 026
3. Contact support if issue persists

### Error: "function get_user_workspaces() does not exist"

**Cause**: Helper functions weren't created.

**Fix**:
```sql
-- Manually create the function (from migration 026, lines 93-103)
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT w.id
  FROM workspaces w
  INNER JOIN user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
    AND uo.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Error: "invalid input syntax for type uuid"

**Cause**: Trying to use string value (like "default-org") where UUID expected.

**Fix**: Application code needs update to use proper UUIDs. Check these files:
- `src/lib/db.ts` (workspace_id handling)
- `src/contexts/AuthContext.tsx` (organization handling)
- API routes that accept workspace_id parameter

### Verification Tests Failing

**If 1-2 tests fail**: Likely specific tables or policies missing. Review failure details and apply specific fixes.

**If many tests fail**: Migration didn't apply correctly. Steps:
1. Review Supabase logs
2. Check for syntax errors in migration
3. Re-run migration 026
4. Contact Team 1 for support

---

## Rollback (If Needed)

### Option 1: Restore from Backup

```bash
# If you created backup before migration
supabase db restore backup_YYYYMMDD.sql
```

### Option 2: Disable RLS (Emergency Only)

```sql
-- ⚠️ WARNING: This disables all security!
-- Only use in emergency to restore service

ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;

-- Re-enable security ASAP and investigate issues
```

---

## Post-Migration Checklist

- [ ] All 15 verification tests pass
- [ ] Application starts without errors
- [ ] Login works
- [ ] Dashboard loads
- [ ] Contacts visible (if user has workspace access)
- [ ] Can create new contact
- [ ] Can update existing contact
- [ ] Can delete contact (if admin/owner)
- [ ] No console errors related to permissions

---

## Success Criteria

✅ **Migration Applied**: `026_FINAL_DATABASE_SECURITY.sql` executed without errors
✅ **Verification Passed**: All tests in `027_VERIFY_ALL_SECURITY.sql` show PASS
✅ **Application Works**: Can login, view dashboard, manage contacts
✅ **Security Enforced**: Cross-workspace data is NOT visible
✅ **Performance Good**: Queries respond in <500ms

---

## Next Steps

After successful migration:

1. **Monitor Logs** (first 24 hours):
   - Supabase Dashboard → Logs → Database
   - Watch for permission errors
   - Watch for query performance issues

2. **Test All Features**:
   - Contact management (CRUD)
   - Campaign creation
   - Email integration
   - Content generation
   - Drip campaigns

3. **Performance Testing**:
   - Test with 1000+ contacts
   - Verify query speed with indexes
   - Monitor dashboard load times

4. **Security Audit**:
   - Create test users in different workspaces
   - Verify data isolation
   - Test role-based permissions

---

## Support Resources

- **Full Report**: `DATABASE_SECURITY_REPORT.md`
- **Migration File**: `supabase/migrations/026_FINAL_DATABASE_SECURITY.sql`
- **Verification Script**: `supabase/migrations/027_VERIFY_ALL_SECURITY.sql`
- **Diagnostic Queries**: `scripts/diagnose-database-state.sql`

---

## Questions?

**For database issues**: Review `DATABASE_SECURITY_REPORT.md` Section "ROLLBACK PLAN"

**For application issues**: Check `.claude/CLAUDE.md` Section "Known Issues"

**For architecture questions**: See `.claude/agent.md` for agent coordination

---

**Created by**: Database Security Agent (Team 1)
**Last Updated**: 2025-11-17
**Status**: Ready for Production
