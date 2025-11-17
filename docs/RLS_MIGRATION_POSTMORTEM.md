# RLS Migration Postmortem - 2025-01-17

## What Went Wrong

**Problem**: 10+ failed migration attempts with "operator does not exist: uuid = text" error

**Root Cause**: The RLS helper functions (`get_user_workspaces`, `user_has_role_in_org_simple`) **did not exist** in the database, but migrations were trying to create policies that called these non-existent functions.

**Why It Took So Long**:
1. ❌ **No diagnostic ran first** - We should have checked what functions/policies already existed
2. ❌ **Assumed column types were the issue** - Wasted time on TEXT vs UUID casting
3. ❌ **Didn't isolate the problem** - Should have tested functions separately from policies
4. ❌ **Too complex migrations** - Tried to do everything at once (functions + policies + 9 tables)

## The Actual Solution (3 Simple Steps)

1. **Migration 023**: Create functions ONLY (no policies)
2. **Migration 024**: Test policies on ONE table (organizations)
3. **Migration 025**: Apply policies to all 9 tables

**Total time if done correctly**: 5 minutes instead of 2 hours

---

## Prevention Checklist - ALWAYS DO THIS BEFORE RLS MIGRATIONS

### Step 1: Run Diagnostic FIRST (Mandatory)

```sql
-- Check what functions exist
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%workspace%' OR p.proname LIKE '%org%' OR p.proname LIKE '%role%');

-- Check what policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'workspaces', 'contacts', 'emails');
```

**STOP HERE if functions don't exist** - Create functions first before any policies.

### Step 2: Verify Column Types (If Needed)

```sql
-- Only run this if you get type mismatch errors
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('id', 'org_id', 'workspace_id');
```

### Step 3: Create Functions Before Policies

**NEVER** create policies that reference functions that don't exist.

**Correct Order**:
1. Create/update helper functions
2. Test ONE policy on ONE table
3. Apply to all tables

**Wrong Order** (what we did):
1. Try to create everything at once
2. Get cryptic errors
3. Waste 2 hours debugging

---

## Standard RLS Migration Template

Use this template for ALL future RLS migrations:

```sql
-- =====================================================
-- MIGRATION XXX: RLS for [TABLE_NAME]
-- =====================================================

-- STEP 1: Verify prerequisites
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_user_workspaces'
  ) INTO func_exists;

  IF NOT func_exists THEN
    RAISE EXCEPTION 'Required function get_user_workspaces does not exist. Run function migration first.';
  END IF;
END $$;

-- STEP 2: Drop existing policies
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- STEP 3: Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create policies
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- STEP 5: Verify
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'table_name';

  IF policy_count = 0 THEN
    RAISE EXCEPTION 'No policies created on table_name';
  END IF;

  RAISE NOTICE '✅ SUCCESS: % policies on table_name', policy_count;
END $$;
```

---

## Emergency Diagnostic Script

**Location**: `scripts/rls-diagnostics.sql`

Run this IMMEDIATELY if you get RLS errors:

```sql
-- Quick diagnostic to identify RLS issues
\echo '=== FUNCTIONS ==='
SELECT p.proname, pg_get_function_result(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%workspace%' OR p.proname LIKE '%org%');

\echo '=== POLICIES ==='
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo '=== RLS STATUS ==='
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'workspaces', 'user_profiles',
                     'user_organizations', 'contacts', 'emails',
                     'campaigns', 'drip_campaigns', 'subscriptions');

\echo '=== COLUMN TYPES ==='
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name IN ('id', 'org_id', 'workspace_id', 'user_id'));
```

---

## Key Lessons

### For Claude (AI Assistant)

1. **ALWAYS run diagnostics before attempting fixes**
   - Don't assume what exists in the database
   - One diagnostic query saves hours of debugging

2. **Isolate the problem with minimal tests**
   - Create functions separately from policies
   - Test on ONE table before applying to ALL tables
   - Use the scientific method: change one variable at a time

3. **Follow the dependency chain**
   - Policies depend on functions
   - Functions depend on tables/columns
   - Work bottom-up, not top-down

4. **Listen to error patterns**
   - If the SAME error persists across 5+ attempts, the approach is wrong
   - Stop and diagnose, don't keep trying variations of the same solution

### For Developers

1. **Create pre-flight checks in migrations**
   - Verify prerequisites exist before creating dependent objects
   - Fail fast with clear error messages

2. **Use staged migrations**
   - Migration 1: Functions
   - Migration 2: Policies (test on 1 table)
   - Migration 3: Policies (all tables)

3. **Document the current state**
   - Keep a "database state" document showing what functions/policies exist
   - Update it after each successful migration

4. **Test in isolation**
   - Use transaction blocks to test without committing
   - Create test migrations before production migrations

---

## Files to Keep

### Diagnostic Scripts
- ✅ `scripts/check-existing-objects.sql` - Check functions/policies
- ✅ `scripts/diagnose-database-state.sql` - Full database state

### Working Migrations
- ✅ `supabase/migrations/023_CREATE_FUNCTIONS_ONLY.sql` - Create functions
- ✅ `supabase/migrations/024_TEST_ONE_POLICY.sql` - Test policies
- ✅ `supabase/migrations/025_COMPLETE_RLS.sql` - Complete RLS

### Files to Delete
- ❌ All 020_* variants (V4, V5, V6, V7, SIMPLE, ABSOLUTE_FINAL, etc.)
- ❌ They represent failed approaches and clutter the migration history

---

## Prevention Tools

### 1. Pre-Migration Checklist Script

Create: `scripts/pre-migration-checklist.sh`

```bash
#!/bin/bash
echo "=== PRE-MIGRATION CHECKLIST ==="
echo ""
echo "1. Have you run diagnostics first?"
echo "   Run: psql -f scripts/rls-diagnostics.sql"
echo ""
echo "2. Do all required functions exist?"
echo "   Required: get_user_workspaces, user_has_role_in_org_simple"
echo ""
echo "3. Are you testing on ONE table first?"
echo "   Don't apply to all tables at once"
echo ""
echo "4. Have you backed up the database?"
echo "   Migrations are irreversible"
echo ""
read -p "All checks passed? (yes/no): " answer
if [ "$answer" != "yes" ]; then
  echo "❌ Aborting migration"
  exit 1
fi
echo "✅ Proceeding with migration"
```

### 2. Migration Template Generator

Create: `scripts/generate-rls-migration.sh`

```bash
#!/bin/bash
TABLE_NAME=$1
MIGRATION_NUMBER=$2

if [ -z "$TABLE_NAME" ] || [ -z "$MIGRATION_NUMBER" ]; then
  echo "Usage: ./generate-rls-migration.sh <table_name> <migration_number>"
  exit 1
fi

cat > "supabase/migrations/${MIGRATION_NUMBER}_rls_${TABLE_NAME}.sql" <<EOF
-- =====================================================
-- MIGRATION ${MIGRATION_NUMBER}: RLS for ${TABLE_NAME}
-- =====================================================

-- Prerequisite check
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_workspaces') THEN
    RAISE EXCEPTION 'Function get_user_workspaces does not exist';
  END IF;
END \$\$;

-- Drop existing policies
DROP POLICY IF EXISTS "${TABLE_NAME}_select" ON ${TABLE_NAME};
DROP POLICY IF EXISTS "${TABLE_NAME}_insert" ON ${TABLE_NAME};
DROP POLICY IF EXISTS "${TABLE_NAME}_update" ON ${TABLE_NAME};
DROP POLICY IF EXISTS "${TABLE_NAME}_delete" ON ${TABLE_NAME};

-- Enable RLS
ALTER TABLE ${TABLE_NAME} ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "${TABLE_NAME}_select"
  ON ${TABLE_NAME} FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "${TABLE_NAME}_insert"
  ON ${TABLE_NAME} FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "${TABLE_NAME}_update"
  ON ${TABLE_NAME} FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "${TABLE_NAME}_delete"
  ON ${TABLE_NAME} FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- Verification
DO \$\$
DECLARE policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = '${TABLE_NAME}';

  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Expected 4 policies, found %', policy_count;
  END IF;

  RAISE NOTICE '✅ SUCCESS: % policies on ${TABLE_NAME}', policy_count;
END \$\$;
EOF

echo "✅ Created migration: supabase/migrations/${MIGRATION_NUMBER}_rls_${TABLE_NAME}.sql"
```

---

## Summary

**What should have happened**:
1. Run diagnostic (30 seconds)
2. See no functions exist
3. Create functions (1 minute)
4. Create policies (1 minute)
5. Done (2.5 minutes total)

**What actually happened**:
1. Skip diagnostic
2. Create complex migration
3. Get cryptic error
4. Try 10+ variations
5. Finally run diagnostic
6. Realize functions don't exist
7. Create functions
8. Create policies
9. Done (2 hours total)

**Time saved by following this document**: ~115 minutes per RLS migration

**Never let this happen again.**
