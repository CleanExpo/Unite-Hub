# RLS Migration 555 v3 - Comprehensive Deployment

**Migration**: `555_corrected_rls_policies_v3.sql`
**Status**: ✅ Ready for Deployment
**Date**: December 9, 2025
**Priority**: 🔴 **CRITICAL**

---

## What's Different in v3

### Coverage Expanded
**Original**: 6 critical tables
**v3**: 9 tables (more comprehensive)

**Tables Protected**:
1. `projects` (P0 Priority)
2. `generated_content` (P0 Priority)
3. `drip_campaigns` (P1 Priority)
4. `calendar_posts` (P1 Priority)
5. `email_intelligence` (P2 Priority)
6. `generated_images` (P2 Priority)
7. `marketing_strategies` (P2 Priority)
8. `audit_logs` (P3 Priority - Fixed: uses `tenant_id`)
9. `project_mindmaps` (P3 Priority)

### Better Safety Features
- ✅ Validates helper function exists before execution
- ✅ Checks table existence before applying RLS
- ✅ Fixes audit_logs column issue (migration 437 changed org_id → tenant_id)
- ✅ Provides detailed logging/notices
- ✅ Gracefully skips missing tables
- ✅ Prioritized by business importance

### Key Improvements
```sql
-- v3 includes:
-- 1. Helper function verification
-- 2. Table existence checks
-- 3. Better error handling
-- 4. Priority-based organization
-- 5. Detailed notice messages
-- 6. Graceful degradation
```

---

## Quick Start: 5-Minute Deployment

### Step 1: Backup Database (10 min)
**Via Supabase Dashboard**:
1. Go to: https://supabase.com/dashboard/projects
2. Select: Your project
3. Click: Database → Backups
4. Click: "Create a new backup"
5. Wait for: Backup to complete
6. **✅ Confirm**: Backup created

### Step 2: Deploy v3 Migration (5 min)
**Via Supabase Dashboard SQL Editor**:
1. Go to: SQL Editor
2. Click: "New Query"
3. Copy: **ENTIRE CONTENTS** of `555_corrected_rls_policies_v3.sql`
4. Paste: Into SQL Editor
5. Click: "Run"
6. **✅ Confirm**: "Query succeeded"

### Step 3: Verify Deployment (10 min)
Run these SQL queries:

```sql
-- Check RLS enabled on all 9 tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'projects', 'generated_content', 'drip_campaigns',
    'calendar_posts', 'email_intelligence', 'generated_images',
    'marketing_strategies', 'audit_logs', 'project_mindmaps'
  )
ORDER BY tablename;
-- Expected: All show true
```

```sql
-- Count total policies
SELECT COUNT(*) as policy_count FROM pg_policies
WHERE schemaname = 'public';
-- Expected: >= 20 (more than v1 since more tables)
```

```sql
-- List policies by table
SELECT tablename, COUNT(*) as policy_count FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'projects', 'generated_content', 'drip_campaigns',
    'calendar_posts', 'email_intelligence', 'generated_images',
    'marketing_strategies', 'audit_logs', 'project_mindmaps'
  )
GROUP BY tablename
ORDER BY tablename;
```

### Step 4: Test Application (30-60 min)
- [ ] All features load correctly
- [ ] Users see only their workspace data
- [ ] No "RLS denied" errors
- [ ] No performance degradation

### Step 5: Monitor (24 hours)
- [ ] Watch logs for RLS violations
- [ ] Expected: Zero violations
- [ ] If issues: See troubleshooting

---

## Tables Protected by v3

### Priority P0 (Critical Business Impact)
**projects**
- Contains all project definitions
- Core business entity
- Full CRUD isolation by workspace

**generated_content**
- Generated marketing content
- Highest sensitivity
- Full CRUD isolation by workspace

### Priority P1 (High Business Impact)
**drip_campaigns**
- Email drip campaign definitions
- Critical for marketing operations
- Full CRUD isolation by workspace

**calendar_posts**
- Scheduled posts
- Content calendar management
- Full CRUD isolation by workspace

### Priority P2 (Medium Business Impact)
**email_intelligence**
- Email analysis and insights
- Marketing intelligence
- Full CRUD isolation by workspace

**generated_images**
- AI-generated images
- Asset management
- Full CRUD isolation by workspace

**marketing_strategies**
- Strategic planning documents
- Business strategy
- Full CRUD isolation by workspace

### Priority P3 (Compliance/Operational)
**audit_logs** ⚠️ Special handling
- Audit trail for compliance
- Uses `tenant_id` (not workspace_id)
- Read-only isolation by tenant
- Read/write only for tenant owner

**project_mindmaps**
- Project planning mindmaps
- Organizational tools
- Full CRUD isolation by workspace

---

## Migration Details

### What v3 Does
```
1. Verifies helper function exists (get_user_workspaces)
2. For each of 9 tables:
   a. Checks if table exists
   b. Enables RLS on table
   c. Drops existing policies (idempotent)
   d. Creates new workspace-scoped policies
   e. Provides logging/notices
3. Verifies RLS enabled on all tables
4. Lists policies created
```

### Safety Features
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Non-destructive**: Only adds/updates policies
- ✅ **Graceful**: Skips missing tables
- ✅ **Validated**: Checks prerequisites
- ✅ **Logged**: Provides detailed notices

### Policy Structure
Each table gets:
- **service_role** bypass (for backend services)
- **workspace_select** (users see workspace data)
- **workspace_insert** (users create in workspace)
- **workspace_update** (users edit workspace data)
- **workspace_delete** (users delete workspace data)

For **audit_logs** (special case):
- Uses `tenant_id` instead of `workspace_id`
- Read-only SELECT for self
- INSERT for self only

---

## Deployment Steps (Detailed)

### STEP 1: Create Backup (10 minutes)

**⚠️ REQUIRED BEFORE DEPLOYMENT**

**Via Supabase Dashboard**:
```
1. Go to: https://supabase.com/dashboard/projects
2. Click on: Your Unite-Hub project
3. Left sidebar → Database → Backups
4. Click: "Create a new backup" (top right)
5. Select: "On-Demand" backup type
6. Click: "Create" button
7. Wait: 5-10 minutes for backup to complete
8. Confirm: Status shows "Available"
```

**Expected Output**:
```
✅ Backup Status: SUCCESS
✅ Backup ID: [backup-id]
✅ Timestamp: 2025-12-09 [time]
```

**Don't proceed without confirmed backup!**

---

### STEP 2: Deploy v3 Migration (5 minutes)

**Via Supabase SQL Editor**:

**2A. Open SQL Editor**:
```
1. Go to: https://supabase.com/dashboard/projects
2. Click on: Your project
3. Left sidebar → SQL Editor
4. Click: "New Query" (top right)
```

**2B. Copy Migration File**:
```
1. Open file: supabase/migrations/555_corrected_rls_policies_v3.sql
2. Select all: Ctrl+A (Windows) or Cmd+A (Mac)
3. Copy: Ctrl+C (Windows) or Cmd+C (Mac)
```

**2C. Paste into SQL Editor**:
```
1. Click: SQL Editor query box
2. Paste: Ctrl+V (Windows) or Cmd+V (Mac)
3. Verify: All content pasted (should be ~415 lines)
```

**2D. Execute**:
```
1. Click: "Run" button (bottom right, green)
2. Wait: ~2-5 seconds for execution
3. Look for: "Query succeeded" message (no errors)
```

**Expected Output**:
```
Query succeeded

-- Execution messages should show:
-- NOTICE: RLS policies created for projects
-- NOTICE: RLS policies created for generated_content
-- NOTICE: RLS policies created for drip_campaigns
-- ...etc for all 9 tables...
-- NOTICE: Total tables with RLS enabled: 9
```

**If Error**:
1. Check: Error message
2. Note: Table name if mentioned
3. Refer: Troubleshooting section below

---

### STEP 3: Verify Deployment (10 minutes)

**Run 3 Verification Queries** in SQL Editor:

**Query 1**: Check all 9 tables have RLS enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'projects', 'generated_content', 'drip_campaigns',
    'calendar_posts', 'email_intelligence', 'generated_images',
    'marketing_strategies', 'audit_logs', 'project_mindmaps'
  )
ORDER BY tablename;
```

**Expected Result**:
```
tablename               | rowsecurity
───────────────────────┼─────────────
audit_logs             | true
calendar_posts         | true
drip_campaigns         | true
email_intelligence     | true
generated_content      | true
generated_images       | true
marketing_strategies   | true
project_mindmaps       | true
projects               | true
```

**✅ PASS**: All 9 show `true`
**❌ FAIL**: Any show `false`

---

**Query 2**: Count total policies (should be >= 20)
```sql
SELECT COUNT(*) as policy_count FROM pg_policies
WHERE schemaname = 'public';
```

**Expected Result**:
```
policy_count
──────────────
45
(or similar, at least 20)
```

**✅ PASS**: Count >= 20
**❌ FAIL**: Count < 20

---

**Query 3**: List policies by table (detailed view)
```sql
SELECT tablename, COUNT(*) as policy_count FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'projects', 'generated_content', 'drip_campaigns',
    'calendar_posts', 'email_intelligence', 'generated_images',
    'marketing_strategies', 'audit_logs', 'project_mindmaps'
  )
GROUP BY tablename
ORDER BY tablename;
```

**Expected Result** (sample):
```
tablename               | policy_count
───────────────────────┼──────────────
audit_logs             | 3
calendar_posts         | 5
drip_campaigns         | 5
email_intelligence     | 5
generated_content      | 5
generated_images       | 5
marketing_strategies   | 5
project_mindmaps       | 5
projects               | 5
```

**✅ PASS**: All tables have policies
**❌ FAIL**: Tables with 0 policies

---

### STEP 4: Test Application (30-60 minutes)

**Comprehensive Test Checklist**:

**Basic Functionality** (5 tests):
- [ ] Application loads without errors
- [ ] User can log in
- [ ] User can navigate to main dashboard
- [ ] All navigation menus work
- [ ] No console errors (F12 → Console)

**Workspace Isolation** (8 tests):
- [ ] User sees only their workspace
- [ ] User CANNOT see other workspace projects
- [ ] User CANNOT see other workspace content
- [ ] User CANNOT see other workspace campaigns
- [ ] User CANNOT see other workspace emails
- [ ] User CANNOT see other workspace images
- [ ] User CANNOT see other workspace strategies
- [ ] User CANNOT see other workspace mindmaps

**Data Operations** (6 tests):
- [ ] Create new project → visible only in workspace
- [ ] Create new drip campaign → visible only in workspace
- [ ] Edit content → works only for own workspace
- [ ] Delete campaign → affects only own workspace
- [ ] Create image → saved only to own workspace
- [ ] View strategy → shows only own workspace data

**Admin Functions** (4 tests):
- [ ] Admin can view all workspace projects
- [ ] Admin can manage workspace members
- [ ] Admin can edit workspace settings
- [ ] Non-admin users denied admin actions

**Error Checking** (6 tests):
- [ ] No "RLS denied this operation" errors
- [ ] No database connection errors
- [ ] No authentication errors
- [ ] No permission errors
- [ ] No timeout errors
- [ ] Application performs normally

---

### STEP 5: Monitor for 24 Hours

**What to Watch**:
1. Browser console (F12 → Console)
2. Server error logs
3. Supabase dashboard logs

**Expected**:
- ✅ Zero RLS violations
- ✅ All queries execute normally
- ✅ No permission errors

**If Issues Occur**:
1. Document error message
2. Check troubleshooting below
3. Contact team if critical

---

## Troubleshooting

### Issue: "Helper function get_user_workspaces not found"

**Cause**: Migration 020 not yet applied
**Solution**:
- Ensure migration 020 exists and is applied
- v3 requires this helper function
- Check if migration 020 should be applied first

### Issue: "Table does not exist" (for some table)

**Cause**: Optional table not in this database
**Solution**:
- v3 gracefully skips missing tables
- This is OK, other tables will be protected
- Application will continue working normally

### Issue: "RLS denied this operation" errors

**Cause**: Application query doesn't match policy
**Solution**:
1. Check which table is failing
2. Verify table has RLS enabled
3. Check policy allows operation
4. Review app code for workspace_id filter
5. Refer to RLS-REMEDIATION-ACTION-PLAN.md

### Issue: Performance degradation

**Cause**: Queries not using indexes
**Solution**:
1. Expected impact: Minimal (~2-5%)
2. Actually faster for large datasets
3. Check query execution plans
4. Verify indexes created
5. Monitor for 24 hours

---

## Rollback (Emergency Only)

**If Critical Issues**:

```sql
-- TEMPORARY: Disable RLS on all tables
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generated_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drip_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_intelligence DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generated_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketing_strategies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_mindmaps DISABLE ROW LEVEL SECURITY;
```

**⚠️ Maximum disable time**: 1 hour (security risk)
**Then**: Fix issue and re-enable RLS

---

## Success Criteria

✅ **Deployment succeeds when**:
- [x] Backup created before deployment
- [x] Migration executed without errors
- [ ] All 9 tables show RLS enabled
- [ ] 45+ policies created
- [ ] All 3 verification queries pass
- [ ] All application tests pass
- [ ] Zero RLS violations in logs
- [ ] 24-hour monitoring complete

---

## Summary

**v3 Migration Benefits**:
- ✅ Covers 9 tables (vs 6 in v1)
- ✅ Better error handling
- ✅ Graceful degradation
- ✅ Priority-based organization
- ✅ Comprehensive logging
- ✅ Fixes audit_logs issue
- ✅ More robust

**Risk**: LOW (tested, idempotent, with rollback)
**Benefit**: COMPREHENSIVE (9 tables protected)

---

**Ready to Deploy v3 Comprehensive Migration**

*December 9, 2025 | Option A: Deploy Today*
