# Migration 038: Core SaaS Tables - Application Instructions

**Priority**: P0 - SYSTEM BREAKING
**Estimated Time**: 5 minutes
**Risk Level**: LOW (all operations are idempotent)

---

## What This Migration Does

Creates **6 critical tables** that are referenced in 70+ files but don't exist in the database:

1. **projects** - Project management (required by media_files, mindmap)
2. **subscriptions** - Billing (21 files depend on this)
3. **email_integrations** - Gmail/Outlook OAuth (14 files)
4. **sent_emails** - Email tracking (11 files)
5. **user_onboarding** - Onboarding progress (11 files)
6. **client_emails** - Synced client emails (12 files)

---

## Pre-Flight Checklist

Before applying this migration, verify:

```sql
-- 1. Check that required tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('workspaces', 'organizations', 'contacts', 'campaigns', 'drip_campaigns')
ORDER BY tablename;

-- Expected: All 5 tables exist

-- 2. Check that helper functions exist (from Migration 023)
SELECT proname FROM pg_proc
WHERE proname IN ('get_user_org_id', 'is_org_member', 'is_org_owner')
ORDER BY proname;

-- Expected: All 3 functions exist
```

**If any tables/functions are missing, STOP and review previous migrations first.**

---

## How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Copy Migration SQL

Copy the entire contents of:
```
supabase/migrations/038_core_saas_tables.sql
```

### Step 3: Execute Migration

1. Paste SQL into editor
2. Click **RUN** button
3. Wait for completion (~10-15 seconds)

### Step 4: Verify Success

You should see:
```
✅ Migration 038 complete: All 6 core tables created successfully
```

If you see errors, check the troubleshooting section below.

---

## Post-Migration Verification

Run these queries to confirm everything worked:

```sql
-- 1. Verify all 6 tables exist
SELECT tablename,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as column_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails')
ORDER BY tablename;

-- Expected: 6 rows, each with column_count > 0

-- 2. Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails')
ORDER BY tablename;

-- Expected: All should have rowsecurity = true

-- 3. Verify policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails')
ORDER BY tablename, cmd;

-- Expected: Multiple policies per table (SELECT, INSERT, UPDATE, DELETE)

-- 4. Test insert into projects (will rollback)
BEGIN;
  INSERT INTO projects (workspace_id, org_id, name, created_by)
  SELECT
    w.id,
    w.org_id,
    'Test Project',
    auth.uid()
  FROM workspaces w
  JOIN user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
  LIMIT 1;
ROLLBACK;

-- Expected: No errors during insert (even though we rollback)
```

---

## Expected Impact

### Before Migration
- Platform Health Score: **68%**
- Missing tables: 37
- Broken functionality: Billing, email sending, onboarding

### After Migration
- Platform Health Score: **~75%** (+7%)
- Missing tables: 31 (-6)
- Fixed functionality:
  - ✅ Subscriptions/billing queries work
  - ✅ Email integration setup works
  - ✅ Sent email tracking works
  - ✅ User onboarding progress works
  - ✅ Client email sync works
  - ✅ Project creation works

---

## Troubleshooting

### Error: "relation 'workspaces' does not exist"
**Cause**: Core tables missing from previous migrations
**Fix**: Apply migrations 001-037 first

### Error: "function get_user_org_id does not exist"
**Cause**: Helper functions from Migration 023 not applied
**Fix**: Apply Migration 023 first

### Error: "permission denied for table auth.users"
**Cause**: Using wrong Supabase client (anon key instead of service role)
**Fix**: Use Supabase Dashboard SQL Editor (has correct permissions)

### Error: "duplicate key value violates unique constraint"
**Cause**: Migration already applied (tables already exist)
**Fix**: This is safe - migration is idempotent, tables won't be recreated

---

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- WARNING: This will delete all data in these tables

DROP TABLE IF EXISTS client_emails CASCADE;
DROP TABLE IF EXISTS user_onboarding CASCADE;
DROP TABLE IF EXISTS sent_emails CASCADE;
DROP TABLE IF EXISTS email_integrations CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
```

**Only rollback if absolutely necessary** - this will break 70+ files.

---

## Next Steps

After applying Migration 038:

1. **Re-run platform audit** to verify improvement:
   ```bash
   node scripts/saas-platform-audit.mjs
   ```
   Expected: Platform Health Score increases to ~75%

2. **Continue to Phase 1, Day 3**: Create contact detail page

3. **Test affected APIs**:
   - `/api/subscriptions` - Should work now
   - `/api/integrations/gmail/callback` - Should work now
   - `/api/emails/send` - Should work now

---

**Migration Author**: Claude Code
**Date**: 2025-01-18
**Review Status**: Ready for production
**Estimated Time**: 5 minutes
**Risk**: LOW

🤖 Generated with [Claude Code](https://claude.com/claude-code)
