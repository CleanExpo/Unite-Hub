# Database Migration Guide - Organization ID Type Fix

**Date**: January 17, 2025
**Issue**: Foreign key constraint error when applying migration 019
**Root Cause**: `organizations.id` is TEXT/VARCHAR but should be UUID
**Impact**: CRITICAL - Subscriptions, invoices, and other features broken

---

## 🔴 THE PROBLEM

You're getting this error when trying to apply migration 019:

```
ERROR: 42804: foreign key constraint "subscriptions_org_id_fkey" cannot be implemented
DETAIL: Key columns "org_id" and "id" are of incompatible types: uuid and character varying.
```

**What This Means**:
- `organizations.id` is currently `character varying` (TEXT)
- `subscriptions.org_id` is trying to be `uuid`
- Foreign keys require BOTH columns to be the same type
- This breaks subscriptions, invoices, and organization relationships

---

## 🔍 STEP 1: DIAGNOSE YOUR DATABASE

Before fixing, we need to know the current state.

### Run Diagnostic Query

**Go to**: Supabase Dashboard → SQL Editor

**Copy and paste this**:
```sql
-- Check organizations.id type
SELECT
  'organizations.id' as column_ref,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name = 'id';

-- Check all org_id foreign keys
SELECT
  table_name || '.org_id' as column_ref,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'org_id'
ORDER BY table_name;
```

**Click "Run"**

### Interpret Results

**Scenario A**: `organizations.id` is **`character varying`**
```
column_ref         | data_type         | character_maximum_length
organizations.id   | character varying | 255
```
→ **Action**: Use Migration 019 V2 (fixes the root cause)

**Scenario B**: `organizations.id` is **`uuid`**
```
column_ref         | data_type
organizations.id   | uuid
```
→ **Action**: Some foreign keys might still be TEXT - use Migration 019 V2

---

## ✅ STEP 2: APPLY THE FIX

### Use Migration 019 V2 (Recommended)

This migration:
1. Checks current types
2. Converts `organizations.id` from TEXT to UUID (if needed)
3. Converts ALL foreign keys to UUID
4. Re-creates foreign key constraints
5. Verifies everything is UUID

**File**: `supabase/migrations/019_fix_organization_id_type_v2.sql`

### How to Apply

1. **Go to**: Supabase Dashboard → SQL Editor

2. **Copy the entire file**: `019_fix_organization_id_type_v2.sql`

3. **Paste** into SQL Editor

4. **Click "Run"**

5. **Watch the output** - you'll see:
```
NOTICE: Current state:
NOTICE:   organizations.id = character varying
NOTICE:   subscriptions.org_id = character varying
NOTICE: Converting organizations.id from TEXT to UUID...
NOTICE:   Dropped user_organizations FK
NOTICE:   Dropped workspaces FK
NOTICE:   Converted organizations.id to UUID
NOTICE:   Converted user_organizations.org_id to UUID
NOTICE:   Converted workspaces.org_id to UUID
NOTICE:   Converted subscriptions.org_id to UUID
NOTICE:   Re-created user_organizations FK
NOTICE:   Re-created workspaces FK
NOTICE:   Re-created subscriptions FK
NOTICE: Migration complete: All org_id columns are now UUID
NOTICE: === VERIFICATION RESULTS ===
NOTICE: organizations.id: uuid
NOTICE: subscriptions.org_id: uuid
NOTICE: user_organizations.org_id: uuid
NOTICE: workspaces.org_id: uuid
NOTICE: ✅ SUCCESS: All org_id columns are UUID
```

6. **If successful**, you'll see `✅ SUCCESS` at the end

---

## 🚨 TROUBLESHOOTING

### Error: "Invalid UUID"

**Symptom**:
```
ERROR: invalid input syntax for type uuid: "default-org"
```

**Cause**: Your database has organization IDs that aren't valid UUIDs (e.g., "default-org", "org-123")

**Fix**:

#### Option A: Convert Invalid IDs to UUIDs (Recommended)

```sql
-- Step 1: Find invalid UUIDs
SELECT id FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2: For each invalid ID, generate a new UUID
UPDATE organizations
SET id = gen_random_uuid()::text
WHERE id = 'default-org';  -- Replace with your invalid ID

-- Step 3: Update all foreign keys
UPDATE user_organizations
SET org_id = 'NEW-UUID-HERE'
WHERE org_id = 'default-org';

UPDATE workspaces
SET org_id = 'NEW-UUID-HERE'
WHERE org_id = 'default-org';

-- Repeat for subscriptions, invoices, etc.
```

#### Option B: Keep TEXT Type (Not Recommended)

If you absolutely must keep TEXT organization IDs:

```sql
-- This ensures all columns stay TEXT
-- But this prevents proper foreign key constraints
ALTER TABLE subscriptions ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE invoices ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE payment_methods ALTER COLUMN org_id TYPE TEXT;
```

**Warning**: This is NOT recommended because:
- ❌ Breaks foreign key integrity
- ❌ Allows invalid data
- ❌ Prevents Supabase optimizations

### Error: "Column does not exist"

**Symptom**:
```
ERROR: column "org_id" does not exist
```

**Cause**: Your database schema is different from expected

**Fix**: Check which tables exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizations',
    'user_organizations',
    'workspaces',
    'subscriptions',
    'invoices',
    'payment_methods',
    'auditLogs',
    'generatedContent'
  )
ORDER BY table_name;
```

Then modify migration 019 V2 to only include tables that exist.

---

## ✅ STEP 3: VERIFY THE FIX

After applying migration 019 V2, verify everything worked:

```sql
-- All should be 'uuid'
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('id', 'org_id')
  AND table_name IN (
    'organizations',
    'user_organizations',
    'workspaces',
    'subscriptions',
    'invoices',
    'payment_methods'
  )
ORDER BY table_name, column_name;
```

**Expected Result**:
```
table_name           | column_name | data_type
organizations        | id          | uuid
subscriptions        | org_id      | uuid
user_organizations   | org_id      | uuid
workspaces           | org_id      | uuid
invoices             | org_id      | uuid
payment_methods      | org_id      | uuid
```

**If you see ANY `character varying` or `text`**, the migration didn't complete successfully.

---

## 📋 STEP 4: APPLY REMAINING MIGRATIONS

Once migration 019 V2 is successful, apply the other migrations in order:

### Migration 020: Real RLS Policies

```sql
-- Copy and paste: supabase/migrations/020_implement_real_rls_policies.sql
-- This should now work because all org_id types are UUID
```

### Migration 021: Interactions Table

```sql
-- Copy and paste: supabase/migrations/021_create_interactions_table.sql
```

### Migration 022: Performance Indexes

```sql
-- Copy and paste: supabase/migrations/022_add_performance_indexes.sql
```

---

## 🔍 DETAILED EXPLANATION

### Why This Happened

**Root Cause**: Inconsistent type definitions across migrations

**Migration History**:
1. Migration 001 created `organizations` with `id TEXT` (wrong)
2. Migration 003 created `user_organizations` with `org_id UUID` (right)
3. Migration 012 created `subscriptions` with `org_id TEXT` (wrong)

**Result**: Some tables use UUID, some use TEXT → foreign keys fail

### The Fix

Migration 019 V2 does a **schema-wide type normalization**:

1. **Identifies the problem**: Checks if `organizations.id` is TEXT
2. **Drops all constraints**: Temporarily removes foreign keys
3. **Converts primary key**: Changes `organizations.id` to UUID
4. **Converts foreign keys**: Changes all `org_id` columns to UUID
5. **Re-creates constraints**: Adds back foreign keys with matching types
6. **Verifies**: Confirms all types are now UUID

**Idempotent**: Safe to run multiple times - checks state first

---

## 📊 IMPACT ANALYSIS

### Before Fix

**Broken Features**:
- ❌ Cannot create subscriptions
- ❌ Cannot create invoices
- ❌ Cannot link payment methods to organizations
- ❌ Foreign key constraints fail
- ❌ Data integrity compromised

**Error Messages**:
```
ERROR: foreign key constraint cannot be implemented
DETAIL: incompatible types: uuid and character varying
```

### After Fix

**Working Features**:
- ✅ Subscriptions can be created
- ✅ Invoices link to organizations
- ✅ Payment methods work
- ✅ Foreign key constraints enforced
- ✅ Data integrity maintained

**Type Consistency**:
```
organizations.id          → UUID ✓
user_organizations.org_id → UUID ✓
workspaces.org_id         → UUID ✓
subscriptions.org_id      → UUID ✓
invoices.org_id           → UUID ✓
payment_methods.org_id    → UUID ✓
```

---

## ⚠️ IMPORTANT NOTES

### Data Loss Risk

**Low Risk** if:
- ✅ All organization IDs are already valid UUIDs
- ✅ You have backups
- ✅ You're running on a development/staging database first

**High Risk** if:
- ❌ You have custom organization IDs like "default-org", "org-123"
- ❌ No database backups
- ❌ Running directly on production

**Recommendation**: Always test on staging first!

### Backup Before Running

```bash
# Create backup via Supabase Dashboard
# Project Settings → Database → Backups → Create backup

# Or use pg_dump
pg_dump -h your-db.supabase.co -U postgres -d postgres > backup.sql
```

### Rollback Procedure

If migration fails and you need to rollback:

```sql
-- Restore from backup
-- Supabase Dashboard → Database → Backups → Restore

-- Or manually revert
ALTER TABLE organizations ALTER COLUMN id TYPE TEXT;
ALTER TABLE subscriptions ALTER COLUMN org_id TYPE TEXT;
-- etc.
```

---

## 📞 NEED HELP?

### Common Questions

**Q: Can I skip this migration?**
A: No - subscriptions, invoices, and billing will not work without it.

**Q: Will this break my app?**
A: No - if all your organization IDs are valid UUIDs, the migration is seamless. The app code doesn't change.

**Q: How long does it take?**
A: 1-5 seconds for small databases (< 1000 orgs), up to 30 seconds for larger databases.

**Q: Can I run this on production?**
A: Yes, but ALWAYS test on staging first and create a backup.

### Still Having Issues?

1. **Check diagnostic output**: Look at the NOTICE messages during migration
2. **Verify types**: Run the verification query in Step 3
3. **Check for invalid UUIDs**: Run the UUID validation query
4. **Review error messages**: Note the exact table and column mentioned
5. **Contact support**: Provide the error message and diagnostic results

---

## 📚 RELATED DOCUMENTATION

- [DATABASE_SECURITY_FIXES_2025-11-17.md](./DATABASE_SECURITY_FIXES_2025-11-17.md) - RLS policies
- [PARALLEL_SECURITY_FIXES_COMPLETE_2025-01-17.md](./PARALLEL_SECURITY_FIXES_COMPLETE_2025-01-17.md) - Overall security fixes
- [Supabase Foreign Keys Guide](https://supabase.com/docs/guides/database/tables#foreign-keys)

---

## ✅ CHECKLIST

Before applying migration:
- [ ] Created database backup
- [ ] Ran diagnostic query
- [ ] Identified current types (UUID vs TEXT)
- [ ] Checked for invalid UUIDs
- [ ] Tested on staging environment

After applying migration:
- [ ] Verified all types are UUID
- [ ] Checked foreign key constraints exist
- [ ] Tested creating a subscription
- [ ] Tested creating an invoice
- [ ] Verified app still works

---

**Last Updated**: 2025-01-17
**Migration File**: `019_fix_organization_id_type_v2.sql`
**Status**: Production-Ready (with backups)
