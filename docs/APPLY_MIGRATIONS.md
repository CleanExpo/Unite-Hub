# How to Apply Database Migrations to Supabase

## Overview

This guide explains how to apply pending database migrations to your Supabase project. Migrations are SQL files that create or modify database tables, indexes, and policies.

---

## Current Issue: Missing `user_onboarding` Table

**Error Message:**
```
Error fetching onboarding status: {
  code: PGRST205,
  message: "Could not find the table 'public.user_onboarding' in the schema cache"
}
```

**Root Cause:** Migration file `007_user_onboarding.sql` exists locally but hasn't been applied to the Supabase database.

---

## ⚡ Quick Fix (Recommended)

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/lksfwktwtmyznckodsau**
2. Navigate to: **SQL Editor** (in left sidebar)
3. Click: **New Query**

### Step 2: Run Migration Script

1. Open file: `D:\Unite-Hub\scripts\apply-onboarding-migration.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click: **Run** (or press `Ctrl+Enter`)

### Step 3: Verify Success

You should see output like:
```
NOTICE: Creating user_onboarding table...
NOTICE: ✅ user_onboarding table created successfully
NOTICE: ✅ VERIFICATION PASSED: user_onboarding table exists
```

### Step 4: Confirm in Table Editor

1. Navigate to: **Table Editor** (in left sidebar)
2. Look for: `user_onboarding` table
3. Verify columns exist: `id`, `user_id`, `step_1_complete`, `step_2_complete`, etc.

---

## 🔍 Verify Migration Applied

Run this query in SQL Editor:

```sql
-- Check if table exists
SELECT * FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_onboarding';
```

**Expected Result:** 1 row returned with table details.

---

## Alternative Methods

### Method 1: Supabase CLI (Advanced)

If you have Supabase CLI installed and configured:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref lksfwktwtmyznckodsau

# Apply all pending migrations
supabase db push
```

**Note:** This method requires:
- Supabase CLI installed globally
- Project linked to local environment
- Database password configured

### Method 2: Run Original Migration File

If you prefer to run the original migration:

1. Open: `D:\Unite-Hub\supabase\migrations\007_user_onboarding.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Run the query

**Difference from Quick Fix:**
- Quick fix includes verification checks
- Quick fix is idempotent (safe to run multiple times)
- Original migration assumes table doesn't exist

---

## 📋 Migration Files in This Project

Current migrations in `D:\Unite-Hub\supabase\migrations/`:

```
001_initial_schema.sql          ✅ Applied
002_team_projects_approvals.sql ✅ Applied
003_user_organizations.sql      ✅ Applied
004_email_integrations.sql      ✅ Applied
005_user_profile_enhancements.sql ✅ Applied
006_whatsapp_integration.sql    ✅ Applied
007_user_onboarding.sql         ❌ PENDING (FIX THIS)
```

---

## 🚨 Troubleshooting

### Issue: "relation already exists"

**Cause:** Table was already created manually or by a previous run.

**Solution:** This is fine! The quick fix script is idempotent and will skip creation.

### Issue: "permission denied"

**Cause:** Insufficient database permissions.

**Solution:**
1. Ensure you're logged in as project owner
2. Check Supabase dashboard permissions
3. Contact Supabase support if needed

### Issue: "function uuid_generate_v4() does not exist"

**Cause:** Missing PostgreSQL extension.

**Solution:** Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue: "syntax error near..."

**Cause:** SQL syntax issue or PostgreSQL version incompatibility.

**Solution:**
1. Verify you copied the entire script
2. Ensure no special characters were corrupted
3. Check PostgreSQL version in Supabase (should be 14+)

---

## 🔐 Security & RLS Policies

The `user_onboarding` table includes Row Level Security (RLS) policies:

- **SELECT Policy:** Users can only view their own onboarding record
- **INSERT Policy:** Users can only create their own onboarding record
- **UPDATE Policy:** Users can only update their own onboarding record

**Policy Logic:**
```sql
auth.uid() = user_id
```

This ensures users cannot access other users' onboarding data.

---

## 📊 Table Structure

After applying the migration, you'll have:

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → auth.users)
- `step_1_complete` (Boolean) - Welcome & Profile Setup
- `step_2_complete` (Boolean) - Connect First Integration
- `step_3_complete` (Boolean) - Import Contacts
- `step_4_complete` (Boolean) - Create First Campaign (optional)
- `step_5_complete` (Boolean) - Dashboard Tour
- `completed_at` (Timestamp)
- `skipped` (Boolean)
- `current_step` (Integer, 1-5)
- `onboarding_data` (JSONB)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Indexes:**
- `idx_user_onboarding_user_id` - Fast user lookups
- `idx_user_onboarding_completed` - Fast completed user queries

**Constraints:**
- Unique constraint on `user_id` (one record per user)
- Check constraint on `current_step` (must be 1-5)

**Triggers:**
- Auto-updates `updated_at` on every update
- Auto-sets `completed_at` when all required steps are complete

---

## 🧪 Test the Migration

After applying, test with:

```sql
-- Insert a test onboarding record (as authenticated user)
INSERT INTO user_onboarding (user_id, step_1_complete)
VALUES (auth.uid(), true)
ON CONFLICT (user_id)
DO UPDATE SET step_1_complete = true;

-- Retrieve your onboarding status
SELECT * FROM user_onboarding WHERE user_id = auth.uid();

-- Clean up test data (optional)
DELETE FROM user_onboarding WHERE user_id = auth.uid();
```

---

## 📚 Additional Resources

- **Supabase Migrations Guide:** https://supabase.com/docs/guides/database/migrations
- **SQL Editor Docs:** https://supabase.com/docs/guides/database/sql-editor
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **Supabase CLI:** https://supabase.com/docs/guides/cli

---

## 📝 Future Migration Best Practices

When creating new migrations:

1. **Version Number:** Use sequential numbering (008_, 009_, etc.)
2. **Idempotent:** Use `IF NOT EXISTS` and `IF EXISTS` clauses
3. **Rollback Plan:** Include comments on how to rollback changes
4. **Test Locally:** Test migration on local Supabase instance first
5. **Apply to Production:** Use Supabase dashboard or CLI
6. **Verify:** Always verify table/column existence after applying
7. **Document:** Update this guide with new migration steps

---

## ✅ Success Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Ran `apply-onboarding-migration.sql` script
- [ ] Saw success messages in output
- [ ] Verified table exists in Table Editor
- [ ] Tested query: `SELECT * FROM user_onboarding LIMIT 1;`
- [ ] No more "table not found" errors in application
- [ ] Onboarding flow works in dashboard

---

**Last Updated:** 2025-11-15
**Migration Version:** 007
**Status:** ✅ Ready to Apply
