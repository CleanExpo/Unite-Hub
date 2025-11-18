# Phase 6: Database Migration Deployment Guide

**Date:** 2025-01-18
**Status:** Ready for Production Deployment
**Priority:** ⚠️ CRITICAL - Security & Data Integrity

---

## 🎯 Overview

This guide provides step-by-step instructions for deploying all Unite-Hub database migrations to production Supabase.

**Current State:**
- Development database: All migrations applied and tested
- Production database: Migrations need to be applied
- Risk Level: HIGH - RLS policies and workspace isolation depend on these migrations

---

## 📋 Critical Migrations to Deploy (In Order)

### ✅ VERIFIED WORKING MIGRATIONS

These migrations have been tested in development and are ready for production:

1. **001_initial_schema.sql** (8,280 bytes)
   - Creates core tables: organizations, workspaces, contacts, campaigns, emails
   - Status: WORKING
   - Dependencies: None
   - Time: ~30 seconds

2. **002_team_projects_approvals.sql** (13,144 bytes)
   - Creates: team_members, projects, project_assignees, project_milestones, approvals, deliverables, project_messages, intake_submissions
   - Status: WORKING
   - Dependencies: 001
   - Time: ~45 seconds

3. **003_user_organizations.sql** (10,712 bytes)
   - Creates: user_profiles, user_organizations, organization_invites
   - Adds auto-triggers for user signup
   - Status: WORKING
   - Dependencies: 001
   - Time: ~30 seconds

4. **004_add_profile_fields.sql** (2,821 bytes)
   - Adds: username, bio, phone, website, timezone, notification_preferences to user_profiles
   - Status: WORKING
   - Dependencies: 003
   - Time: ~15 seconds

5. **038_DROP_AND_RECREATE.sql** (6,341 bytes) ⚠️ **CRITICAL**
   - Creates: projects (with workspace_id), email_integrations, sent_emails, client_emails
   - Uses DROP TABLE IF EXISTS to ensure clean schema
   - Status: WORKING (Phase 1 success)
   - Dependencies: 001, 003
   - Time: ~30 seconds

6. **023_CREATE_FUNCTIONS_ONLY.sql** (2,364 bytes) ⚠️ **REQUIRED FOR RLS**
   - Creates helper functions: get_user_workspace_id(), user_has_workspace_access()
   - Status: WORKING
   - Dependencies: 001, 003
   - Time: ~10 seconds

7. **025_COMPLETE_RLS.sql** (9,771 bytes) ⚠️ **SECURITY CRITICAL**
   - Enables RLS on 9 core tables
   - Adds workspace isolation policies
   - Status: WORKING
   - Dependencies: 023 (MUST have helper functions first)
   - Time: ~45 seconds

8. **029_media_files.sql** (6,961 bytes)
   - Creates media_files table for multimedia system
   - Status: WORKING
   - Dependencies: 001, 003
   - Time: ~20 seconds

9. **030_media_storage_bucket.sql** (4,760 bytes)
   - Creates Supabase Storage bucket for media uploads
   - Status: WORKING
   - Dependencies: 029
   - Time: ~15 seconds

10. **031_storage_policies.sql** (3,328 bytes)
    - Adds RLS policies for media storage bucket
    - Status: WORKING
    - Dependencies: 030
    - Time: ~10 seconds

---

## 🚨 CRITICAL: RLS Migration Workflow

**MUST FOLLOW THIS ORDER:**

```
1. Create helper functions (023_CREATE_FUNCTIONS_ONLY.sql)
   ↓
2. Test on ONE table (optional - already tested)
   ↓
3. Apply to all tables (025_COMPLETE_RLS.sql)
```

**DO NOT:**
- ❌ Create policies before functions exist → "uuid = text" error
- ❌ Apply to all tables at once without testing
- ❌ Skip diagnostics if errors occur

---

## 📝 Step-by-Step Deployment Instructions

### Prerequisites

1. **Supabase Dashboard Access**
   - URL: https://supabase.com/dashboard
   - Project: Unite-Hub production
   - Access: Database → SQL Editor

2. **Backup Existing Data** (if any)
   ```sql
   -- Run this first to backup existing tables
   SELECT * INTO backup_organizations FROM organizations;
   SELECT * INTO backup_contacts FROM contacts;
   -- etc.
   ```

### Deployment Steps

#### Step 1: Initial Schema (001)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify: Check "Table Editor" - should see organizations, workspaces, contacts, campaigns, emails

**Expected Output:**
```
SUCCESS: Created tables: organizations, workspaces, contacts, campaigns, emails, etc.
```

#### Step 2: Team & Projects (002)

1. Copy contents of `supabase/migrations/002_team_projects_approvals.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify: Check "Table Editor" - should see team_members, projects, approvals, etc.

**Expected Output:**
```
SUCCESS: Created 8 tables
```

#### Step 3: User Management (003)

1. Copy contents of `supabase/migrations/003_user_organizations.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify:
   - Check "Table Editor" - should see user_profiles, user_organizations, organization_invites
   - Check "Database" → "Triggers" - should see on_auth_user_created, on_user_profile_created

**Expected Output:**
```
SUCCESS: Created user tables and triggers
```

#### Step 4: Profile Enhancements (004)

1. Copy contents of `supabase/migrations/004_add_profile_fields.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify: Check user_profiles table columns - should see username, bio, phone, website, timezone

**Expected Output:**
```
SUCCESS: Added profile fields
```

#### Step 5: Core SaaS Tables (038) ⚠️ CRITICAL

1. Copy contents of `supabase/migrations/038_DROP_AND_RECREATE.sql`
2. **IMPORTANT:** This will DROP existing projects, email_integrations, sent_emails, client_emails tables
3. Paste into SQL Editor
4. Click "Run"
5. Verify: Check projects table - should have workspace_id column

**Expected Output:**
```
SUCCESS: 4 tables created (projects, email_integrations, sent_emails, client_emails)
```

**If Error:** See troubleshooting section below

#### Step 6: RLS Helper Functions (023) ⚠️ REQUIRED

1. Copy contents of `supabase/migrations/023_CREATE_FUNCTIONS_ONLY.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify:
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('get_user_workspace_id', 'user_has_workspace_access');
   ```
   Should return 2 rows

**Expected Output:**
```
SUCCESS: Created helper functions
```

#### Step 7: Enable RLS (025) ⚠️ SECURITY CRITICAL

1. **VERIFY Step 6 completed successfully** - Functions MUST exist
2. Copy contents of `supabase/migrations/025_COMPLETE_RLS.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('organizations', 'workspaces', 'contacts', 'campaigns', 'emails', 'contacts_tags', 'tags', 'user_profiles', 'user_organizations');
   ```
   All tables should show rowsecurity = true

**Expected Output:**
```
SUCCESS: RLS enabled on 9 tables
```

**If Error "operator does not exist: uuid = text":**
- Helper functions don't exist
- Go back to Step 6
- Run diagnostics (see Troubleshooting section)

#### Step 8: Media System (029, 030, 031)

1. Run `029_media_files.sql`
2. Run `030_media_storage_bucket.sql`
3. Run `031_storage_policies.sql`
4. Verify: Check "Storage" → should see "media-uploads" bucket

**Expected Output:**
```
SUCCESS: Media system configured
```

---

## 🔍 Verification Checklist

After deployment, verify everything works:

### Database Verification

```sql
-- 1. Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Should return ~30 tables

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
-- Should return 9+ tables

-- 3. Check helper functions exist
SELECT proname FROM pg_proc
WHERE proname IN ('get_user_workspace_id', 'user_has_workspace_access');
-- Should return 2 rows

-- 4. Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Should return 5+ triggers

-- 5. Check storage bucket exists
SELECT name FROM storage.buckets;
-- Should return 'media-uploads'
```

### Application Verification

1. **Login Test**
   - Go to https://your-app.vercel.app/login
   - Create new account
   - Verify user_profiles record created
   - Verify organization created
   - Verify user_organizations record created

2. **Workspace Isolation Test**
   - Create contact as User A
   - Login as User B (different org)
   - Verify User B cannot see User A's contact

3. **Media Upload Test**
   - Upload file to /dashboard/media
   - Verify file appears in Supabase Storage
   - Verify media_files record created

---

## 🐛 Troubleshooting

### Error: "column workspace_id does not exist"

**Cause:** Existing projects table has wrong schema

**Fix:**
```sql
-- Check existing table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects';

-- If workspace_id missing, manually drop and recreate
DROP TABLE IF EXISTS projects CASCADE;
-- Then run migration 038 again
```

### Error: "operator does not exist: uuid = text"

**Cause:** Helper functions don't exist in database

**Fix:**
```sql
-- 1. Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('get_user_workspace_id', 'user_has_workspace_access');

-- 2. If empty, run diagnostics
\i scripts/rls-diagnostics.sql

-- 3. Create functions first
\i supabase/migrations/023_CREATE_FUNCTIONS_ONLY.sql

-- 4. Then run RLS policies
\i supabase/migrations/025_COMPLETE_RLS.sql
```

### Error: "relation already exists"

**Cause:** Table already created from previous migration

**Solutions:**

**Option 1: Skip if no schema changes**
- If table already exists with correct schema, skip migration
- Verify schema matches expected structure

**Option 2: DROP and recreate if schema changed**
```sql
DROP TABLE IF EXISTS table_name CASCADE;
-- Then run migration again
```

### Error: "policy already exists"

**Cause:** RLS policy already created

**Fix:**
```sql
-- Check existing policies
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'your_table';

-- Drop duplicate policy
DROP POLICY IF EXISTS policy_name ON table_name;

-- Then run migration again
```

---

## 📊 Migration Status Tracking

Create a tracking table to monitor migration status:

```sql
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('success', 'failed', 'rolled_back')),
  error_message TEXT,
  applied_by TEXT
);

-- Track each migration
INSERT INTO migration_history (migration_name, status, applied_by)
VALUES ('001_initial_schema', 'success', 'admin@unite-hub.com');
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] All tables have RLS enabled
- [ ] Helper functions exist (get_user_workspace_id, user_has_workspace_access)
- [ ] Workspace isolation policies active
- [ ] Storage bucket has RLS policies
- [ ] No public access to sensitive tables
- [ ] Service role key stored securely (not in git)
- [ ] Anon key has limited permissions
- [ ] Database backups enabled
- [ ] SSL enforced for all connections

---

## 📈 Performance Optimization

After migrations, add performance indexes:

```sql
-- Already included in migrations, but verify:
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);

-- Check indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 🎯 Rollback Plan

If deployment fails:

### Rollback Step 1: Disable RLS
```sql
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
-- etc.
```

### Rollback Step 2: Drop Failed Tables
```sql
DROP TABLE IF EXISTS table_name CASCADE;
```

### Rollback Step 3: Restore from Backup
```sql
INSERT INTO organizations SELECT * FROM backup_organizations;
INSERT INTO contacts SELECT * FROM backup_contacts;
-- etc.
```

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ All 10 migrations applied without errors
2. ✅ All verification queries return expected results
3. ✅ Login test passes
4. ✅ Workspace isolation test passes
5. ✅ Media upload test passes
6. ✅ No console errors in browser
7. ✅ No 500 errors in API routes
8. ✅ RLS policies active on all tables
9. ✅ Application loads and functions normally
10. ✅ Performance is acceptable (<500ms page loads)

---

## 📞 Support

If you encounter issues:

1. Check Supabase Dashboard → "Database" → "Logs"
2. Check browser console for errors
3. Run diagnostics: `scripts/rls-diagnostics.sql`
4. Review error in troubleshooting section above
5. Check migration status in `migration_history` table

---

## 🎉 Next Steps After Deployment

Once migrations are deployed:

1. ✅ Update environment variables in production
2. ✅ Run end-to-end tests
3. ✅ Monitor error logs for 24 hours
4. ✅ Set up database backups
5. ✅ Configure monitoring/alerts
6. ✅ Document any production-specific configurations

---

**Estimated Total Time:** 30-45 minutes
**Risk Level:** HIGH (database changes)
**Recommended:** Deploy during low-traffic period
**Backup:** REQUIRED before deployment

---

*Last Updated: 2025-01-18*
*Phase 6: Production Deployment & Testing*
