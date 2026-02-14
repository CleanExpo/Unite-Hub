# Supabase SQL Editor Testing Guide

**Date**: 2026-01-28
**Purpose**: Test critical SQL migration files in Supabase SQL Editor
**Estimated Time**: 45-60 minutes

---

## Prerequisites

1. Access to Supabase Dashboard → SQL Editor
2. Database connection (local or cloud project)
3. **IMPORTANT**: Backup your database before running any migrations

---

## Testing Phases

### Phase 1: Core Foundation Tables (CRITICAL - 6 files)

These files create the essential database structure. **Must run in order.**

#### Test Batch 1A: Initial Schema

**File**: `001_initial_schema.sql`

**Run in SQL Editor**:
```bash
# Location
supabase/migrations/001_initial_schema.sql
```

**Expected Result**:
- Tables created: `profiles`, `contacts`, `organizations`, `campaigns`, `messages`
- No errors
- Check: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`

**If Errors**:
- Check if tables already exist (run `DROP TABLE IF EXISTS` first)
- Review error message for specific syntax issues

---

#### Test Batch 1B: User Organizations

**File**: `003_user_organizations.sql`

**Expected Result**:
- Table created: `user_organizations`
- Junction table for users ↔ organizations
- RLS policies created

**Verification**:
```sql
-- Check table structure
\d user_organizations

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_organizations';

-- Should return: true
```

---

#### Test Batch 1C: User Profiles

**File**: `005_user_profile_enhancements.sql`

**Expected Result**:
- `user_profiles` table enhanced with additional fields
- Columns added for onboarding, preferences, etc.

---

#### Test Batch 1D: Media Files

**File**: `029_media_files.sql`

**Expected Result**:
- Table created: `media_files`
- Storage bucket configured
- RLS policies for media access

**Status**: ✅ This file was validated and cleaned

---

#### Test Batch 1E: Core SaaS Tables

**File**: `038_core_saas_tables.sql`

**Expected Result**:
- Multiple SaaS tables created (workspaces, subscriptions, etc.)
- Foreign key relationships established

---

#### Test Batch 1F: Phase 1 Core

**File**: `048_phase1_core_tables.sql`

**Expected Result**:
- Phase 1 feature tables
- Complete core database structure

---

### Phase 2: RLS Security Layer (5 files)

**⚠️ IMPORTANT**: Run these AFTER Phase 1 is complete and verified

#### Test Batch 2A: Helper Functions

**File**: `023_CREATE_FUNCTIONS_ONLY.sql`

**Purpose**: Creates helper functions for RLS policies

**Expected Result**:
- Functions created: `get_user_role()`, `has_workspace_access()`, etc.
- No errors

**Verification**:
```sql
-- List functions
SELECT proname, proargnames
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname LIKE '%workspace%';
```

---

#### Test Batch 2B: Initial RLS Policies

**File**: `020_implement_real_rls_policies.sql`

**Expected Result**:
- RLS enabled on core tables
- Basic policies created

---

#### Test Batch 2C: Complete RLS

**File**: `025_COMPLETE_RLS.sql`

**Expected Result**:
- All tables have RLS policies
- Workspace isolation enforced

**Critical Verification**:
```sql
-- Test workspace isolation
SET app.current_workspace_id = 'test-workspace-123';

-- Try to access data (should return empty or error if not in workspace)
SELECT * FROM contacts LIMIT 1;
```

---

#### Test Batch 2D: Final Security

**File**: `026_FINAL_DATABASE_SECURITY.sql`

**⚠️ Known Issues**:
- SQL injection warning (EXECUTE statements)
- Duplicate policy names

**Status**: Review before running - may need manual fixes

---

#### Test Batch 2E: Extended Policies

**File**: `402_extended_rls_policies.sql`

**Expected Result**:
- Additional RLS policies for extended features

---

### Phase 3: Feature Tables (5 files)

Run these based on which features you need:

#### Drip Campaigns
**File**: `008_drip_campaigns.sql`
**Creates**: Campaign automation tables

#### Contact Enhancements
**File**: `009_contacts_enhancements.sql`
**Creates**: Enhanced contact fields (lead scoring, tags, etc.)

#### Calendar System
**File**: `013_calendar_system.sql`
**Creates**: Scheduling and calendar tables

#### Client Chat
**File**: `088_client_chat.sql`
**Creates**: Real-time chat tables

#### Billing
**File**: `102_billing_tables.sql`
**Creates**: Subscription and billing tables

---

## Testing Process

### For Each File:

1. **Open File**:
   ```bash
   # In your editor
   code supabase/migrations/001_initial_schema.sql
   ```

2. **Copy SQL Content**

3. **Open Supabase Dashboard**:
   - Go to: https://app.supabase.com
   - Select your project
   - Navigate to: SQL Editor → New Query

4. **Paste & Run**:
   - Paste the SQL content
   - Click "Run" button
   - Wait for completion

5. **Check Results**:
   - ✅ Green "Success" message = Passed
   - ❌ Red error message = Failed (see Troubleshooting below)

6. **Verify Tables Created**:
   ```sql
   -- List all tables
   SELECT schemaname, tablename, tableowner
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

7. **Verify RLS Enabled** (for RLS files):
   ```sql
   -- Check RLS status
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND rowsecurity = true;
   ```

---

## Common Errors & Solutions

### Error: "relation already exists"

**Cause**: Table was already created in a previous migration
**Solution**:
```sql
-- Drop the table first (WARNING: loses data)
DROP TABLE IF EXISTS table_name CASCADE;

-- Then re-run the migration
```

### Error: "operator does not exist: uuid = text"

**Cause**: Missing RLS helper functions
**Solution**: Run `023_CREATE_FUNCTIONS_ONLY.sql` first

### Error: "policy with name already exists"

**Cause**: Duplicate policy names
**Solution**:
```sql
-- Drop existing policy
DROP POLICY IF EXISTS policy_name ON table_name;

-- Then re-run the migration
```

### Error: "permission denied for schema auth"

**Cause**: Trying to access `auth.users` directly
**Solution**: This is expected - our automated fixes commented these out. The migration should still work for other parts.

### Error: "syntax error near..."

**Cause**: Unbalanced quotes or SQL syntax error
**Solution**: File needs manual fix (see SQL_MIGRATION_STATUS.md for list)

---

## Validation Queries

### After Phase 1 (Core Tables):

```sql
-- Should see at least these tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'profiles',
  'contacts',
  'organizations',
  'user_organizations',
  'media_files'
)
ORDER BY tablename;
-- Expected: 5 rows
```

### After Phase 2 (RLS):

```sql
-- All core tables should have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'profiles',
  'contacts',
  'organizations'
)
ORDER BY tablename;
-- Expected: All should show "t" (true)

-- Check number of policies created
SELECT COUNT(*) FROM pg_policies;
-- Expected: > 20 policies
```

### Workspace Isolation Test:

```sql
-- Create test workspace
INSERT INTO workspaces (id, name)
VALUES ('test-ws-1', 'Test Workspace 1');

-- Create test contact
INSERT INTO contacts (workspace_id, email, name)
VALUES ('test-ws-1', 'test@example.com', 'Test Contact');

-- Test isolation (should return 1)
SELECT COUNT(*) FROM contacts
WHERE workspace_id = 'test-ws-1';

-- Test cross-workspace protection (should return 0)
SELECT COUNT(*) FROM contacts
WHERE workspace_id = 'different-workspace-id';
```

---

## Automated Testing Script

For bulk testing, use our validation script:

```bash
# From project root
node scripts/validate-sql-migrations.mjs

# See which files are clean
# Output will show 112 clean files ready for testing
```

---

## Rollback Procedure

If a migration fails and causes issues:

### Option 1: Drop Specific Table
```sql
DROP TABLE IF EXISTS problematic_table CASCADE;
```

### Option 2: Restore from Backup
```sql
-- If you took a backup before testing
-- Restore from Supabase Dashboard → Database → Backups
```

### Option 3: Reset Database (Last Resort)
```bash
# Local development only
supabase db reset

# Re-run migrations from scratch
```

---

## Success Criteria

### Phase 1 Complete ✅:
- [ ] 6 core files run without errors
- [ ] At least 15 tables created
- [ ] Foreign key relationships verified

### Phase 2 Complete ✅:
- [ ] 5 RLS files run successfully
- [ ] All core tables have RLS enabled
- [ ] Workspace isolation test passes

### Phase 3 Complete ✅:
- [ ] Feature tables created as needed
- [ ] No critical errors in SQL Editor

---

## Next Steps After Testing

1. **Document Results**:
   - Which files passed/failed
   - Any errors encountered
   - Workarounds applied

2. **Fix Remaining Issues**:
   - Files with unbalanced quotes (4 files)
   - Review duplicate policy warnings

3. **Production Deployment**:
   - Run successful migrations in production database
   - Verify RLS policies in production
   - Test with real user workflows

---

## Support

**Issues**: See `docs/SQL_MIGRATION_STATUS.md` for detailed error breakdown

**Backup Location**: `supabase/migrations_backup/` (original files before automated fixes)

**Scripts**:
- `scripts/validate-sql-migrations.mjs` - Validation tool
- `scripts/fix-sql-migrations.mjs` - Automated fixes
- `scripts/fix-sql-complex-issues.mjs` - Advanced fixes

---

**Last Updated**: 2026-01-28
**Total Files to Test**: 16 (6 core + 5 RLS + 5 features)
**Estimated Time**: 45-60 minutes
**Success Rate**: 112/395 files (28.4%) are validated and clean
