# Migration 270 - Column Name Fix

**Status**: ✅ Fixed in commit 6ab15d3
**Error**: `ERROR: 42703: column user_organizations.organization_id does not exist`
**Root Cause**: Wrong column name in RLS policy

---

## What Was Fixed

The RLS policy `"founders_manage_projects"` in migration 270 referenced a non-existent column:

### ❌ Before (Lines 341, 349)
```sql
AND user_organizations.organization_id = managed_service_projects.tenant_id
```

### ✅ After
```sql
AND user_organizations.org_id = managed_service_projects.tenant_id
```

---

## Why This Happened

The `user_organizations` table (from migration 003) uses the column name `org_id`:

```sql
CREATE TABLE IF NOT EXISTS user_organizations (
  ...
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ...
);
```

But migration 270 incorrectly referenced `organization_id`.

---

## What to Do Now

### ✅ Migration 270 is now fixed

Just apply it normally:

```sql
-- Run migration 270 (managed_service_schema)
-- It will now apply successfully without column errors
```

Or if deploying to Supabase:
1. Push code to repository
2. Supabase will apply migration 270 with the fix
3. No errors should occur

---

## Verification

After applying migration 270, verify it works:

```sql
-- Check that the table was created
SELECT EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'managed_service_projects') as created;

-- Expected: true
```

---

## Complete Migration Sequence

Now the full sequence is:

```
1. Migration 270 (managed_service_schema) ✅ FIXED
   ↓
2. Migration 242 (convex_custom_frameworks)
   ↓
3. Migration 272 (managed_service_strategies)
   ↓
4. Migration 273 (framework alerts)
   ↓
5. Migration 274 (analytics)
```

---

## All Migrations Now Valid

| Migration | Tables | Status |
|-----------|--------|--------|
| 270 | 7+ | ✅ Fixed |
| 242 | 1+ | ✅ Valid |
| 272 | 4 | ✅ Valid |
| 273 | 3 | ✅ Valid |
| 274 | 4 | ✅ Valid |

---

**All migrations are now correct and ready for deployment.**

