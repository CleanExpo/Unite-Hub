# RLS Migration 555 - Deployment Execution Guide

**Status**: 🔴 **CRITICAL** | Ready for Immediate Deployment
**Date**: December 9, 2025
**Migration**: `supabase/migrations/555_enable_rls_critical_tables.sql`
**Dry-Run Verified**: ✅ YES (successful)

---

## Quick Start (2-3 Hours Total)

### STEP 1: Backup Database (10 minutes)

**⚠️ CRITICAL - Must complete before deployment**

**Option A: Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard/project/[your-project-id]/database/backups
2. Click: **"Create a new backup"**
3. Choose: **Backup type: On-Demand**
4. Click: **"Create"**
5. Wait for backup to complete (5-10 minutes)
6. ✅ Note the backup ID for your records

**Option B: Command Line**
```bash
# Export database dump
supabase db dump > backup-$(date +%Y-%m-%d-%H%M%S).sql

# Verify backup created
ls -lh backup-*.sql
```

**Verification**: You should see a backup file or ID before proceeding to Step 2.

---

### STEP 2: Deploy Migration (5 minutes)

**Via Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard/project/[your-project-id]/sql
2. Click: **"New Query"** (top right)
3. Copy entire migration file:
   ```bash
   cat supabase/migrations/555_enable_rls_critical_tables.sql
   ```
4. Paste into SQL Editor
5. Click: **"Run"** button (bottom right)
6. Wait for: `✅ Query succeeded` message
7. Check for errors (should see 0 errors)

**Alternative: Via CLI (if credentials available)**
```bash
supabase migration up 555
```

**What Happens**:
- RLS enabled on 6 tables
- 12+ policies created
- Helper functions created
- Performance indexes added
- Total execution: ~2 seconds

---

### STEP 3: Verify Deployment (10 minutes)

**Run these SQL queries in Supabase Dashboard → SQL Editor**

**Query 1: Check RLS Enabled**
```sql
-- Verify RLS is enabled on all 6 tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'contacts', 'campaigns', 'emails', 'projects', 'audit_log')
ORDER BY tablename;

-- Expected Result:
-- tablename    | rowsecurity
-- ─────────────┼─────────────
-- audit_log    | true
-- campaigns    | true
-- contacts     | true
-- emails       | true
-- projects     | true
-- users        | true
```

**Expected**: All 6 tables should show `rowsecurity = true`

**Query 2: Count Policies**
```sql
-- Count total policies created
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';

-- Expected: >= 12
```

**Expected**: Should return 12 or more policies

**Query 3: List All Policies**
```sql
-- List all policies by table
SELECT tablename, policyname, permissive, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected output shows policies like:
-- users | users_workspace_isolation | true | (auth.uid() = id OR ...)
-- users | users_self_update | true | (auth.uid() = id)
-- contacts | contacts_workspace_isolation | true | (workspace_id IN (...))
```

**Query 4: Verify Helper Functions**
```sql
-- Check helper functions created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%workspace%' OR routine_name LIKE '%admin%')
ORDER BY routine_name;

-- Expected:
-- routine_name             | routine_type
-- ─────────────────────────┼──────────────
-- get_current_workspace_id | FUNCTION
-- is_workspace_admin       | FUNCTION
```

**✅ If all 4 queries pass**: Migration deployed successfully!

---

### STEP 4: Application Testing (30-60 minutes)

**Test Checklist**

#### Basic Auth Flow
```
[ ] User can sign up
[ ] User can log in successfully
[ ] User dashboard loads without errors
[ ] User profile displays correct info
```

#### Workspace Isolation
```
[ ] User sees only their workspace members
[ ] User CANNOT see other workspace members
[ ] User cannot access other workspace contacts
[ ] User cannot modify other workspace campaigns
```

#### Data Operations
```
[ ] Create contact → Only visible in own workspace
[ ] Edit contact → Works for own workspace only
[ ] Delete campaign → Applies only to own workspace
[ ] View reports → Shows only own workspace data
```

#### Admin Functions
```
[ ] Admin can invite users to workspace
[ ] Admin can manage workspace settings
[ ] Admin can view all workspace members
[ ] Admin can remove users from workspace
[ ] Non-admin users are denied admin actions
```

#### Edge Cases
```
[ ] Logout and login → Still works
[ ] Switch workspaces (if multi-workspace) → Correct data shows
[ ] Invite new user → Gets workspace access
[ ] Remove user → Loses access immediately
```

#### Error Checking
```
[ ] No "RLS denied this operation" errors
[ ] No database connection errors
[ ] No authentication errors
[ ] No console errors in browser DevTools
```

**If all tests pass**: Migration is working correctly! ✅

**If tests fail**: See troubleshooting section below.

---

### STEP 5: Monitor Logs (Ongoing - 24 hours)

**What to Watch For**:
- Browser console errors
- Server error logs
- Database query errors
- RLS policy violation errors

**Check Daily**:
```bash
# View recent logs (if available)
tail -f logs/error.log | grep -i "rls\|policy"
```

**In Supabase Dashboard**:
1. Go to: Database → Logs → Query Performance
2. Look for errors starting with "RLS denied"
3. Also check: Database → Logs → Error logs

**Expected**: Zero RLS violations (unless app has bugs)

---

## Troubleshooting

### Issue 1: "RLS denied this operation"

**Cause**: User trying to access data outside their workspace

**Solution**:
1. Check if query includes workspace filter: `.where("workspace_id", "=", workspaceId)`
2. Verify user is authenticated
3. Check their workspace_id is set correctly in users table
4. Review the specific RLS policy that's blocking the query

**SQL Check**:
```sql
-- Verify user's workspace
SELECT id, workspace_id, role FROM public.users
WHERE id = 'USER_ID_HERE';
```

### Issue 2: Users can't access their own data

**Cause**: RLS policy too restrictive or workspace_id NULL

**Solution**:
1. Verify workspace_id column exists and has values
2. Check that user's workspace_id is set
3. Test helper function:
```sql
SELECT get_current_workspace_id();
-- Should return a UUID, not NULL
```

### Issue 3: Admin features broken

**Cause**: Admin policy denies actions

**Solution**:
1. Check role column is set correctly:
```sql
SELECT id, workspace_id, role FROM public.users
WHERE id = 'ADMIN_USER_ID';
-- role should be 'admin'
```

2. Test admin check:
```sql
SELECT is_workspace_admin();
-- Should return true for actual admins
```

### Issue 4: Performance degradation

**Cause**: Missing indexes on workspace_id

**Solution**:
```sql
-- Check if indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'users' AND indexname LIKE '%workspace%';
-- Should show: idx_users_workspace_id, idx_users_role_workspace

-- If missing, create them:
CREATE INDEX IF NOT EXISTS idx_users_workspace_id
  ON public.users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_role_workspace
  ON public.users(workspace_id, role);
```

---

## Rollback (If Needed)

**EMERGENCY: Disable RLS temporarily**

If critical issues occur and you need to rollback immediately:

```sql
-- TEMPORARY: Disable RLS to restore functionality
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log DISABLE ROW LEVEL SECURITY;

-- Alert team immediately
-- Root cause analysis
-- Deploy fix
-- Re-enable RLS
```

**CRITICAL**: Disable RLS <1 hour maximum (data exposure risk)

---

## Post-Deployment Communication

### To Team
```
📢 RLS Migration 555 Deployed Successfully

Status: ✅ Live in production
Time: [deployment time]
Impact: Multi-tenant workspace isolation now enforced at database layer

What Changed:
- RLS enabled on 6 critical tables
- 12+ workspace-scoped policies active
- All queries now filtered by workspace
- Performance impact: minimal (~2-5%)

Testing: [all test results]
Monitoring: Logs will be monitored for 24 hours

Questions? See RLS-REMEDIATION-ACTION-PLAN.md
```

### To Management
```
🔒 Security Issue RESOLVED

Critical RLS Gap (0% enforcement) has been remediated.
- Workspace isolation now enforced at database layer
- Data leakage vulnerability eliminated
- Zero application code changes required
- Full rollback plan documented
```

---

## Success Criteria

✅ **Deployment is successful when**:
- [ ] All 6 tables show RLS enabled
- [ ] 12+ policies created
- [ ] Helper functions exist
- [ ] All 4 verification queries pass
- [ ] Application testing passes
- [ ] No RLS denial errors in logs
- [ ] Team is notified and agrees

---

## Reference Files

| File | Purpose |
|------|---------|
| `supabase/migrations/555_enable_rls_critical_tables.sql` | Migration SQL |
| `RLS-REMEDIATION-ACTION-PLAN.md` | Comprehensive guide |
| `RLS-CRITICAL-FIX-SUMMARY.md` | Executive summary |
| `IMMEDIATE-ACTION-SUMMARY.md` | 8-step guide |
| `scripts/deploy-rls-fix.mjs` | Deployment helper |

---

## Timeline

**This Document**: Guides manual deployment
**Total Time**: 1-2 hours active time + 24-hour monitoring
**Deadline**: This week (critical security issue)

---

**RLS Migration 555 Deployment Ready**

*Created: December 9, 2025 | Status: Awaiting Manual Deployment*
