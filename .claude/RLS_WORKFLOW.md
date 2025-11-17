# RLS Migration Workflow - MANDATORY PROCESS

**CRITICAL**: This document MUST be followed for ALL future RLS migrations.

---

## The 3-Step Process (Do NOT skip steps)

### Step 1: ALWAYS Run Diagnostics First ⚠️

**Before touching ANY migration code**, run:

```bash
# In Supabase SQL Editor
\i scripts/rls-diagnostics.sql
```

**What to check**:
- ✅ Do helper functions exist? (get_user_workspaces, user_has_role_in_org_simple)
- ✅ How many tables have RLS enabled?
- ✅ How many policies exist?
- ✅ Are all ID columns UUID type?

**STOP if functions don't exist** → Go to Step 2
**STOP if policies are missing** → Go to Step 3

### Step 2: Create Functions BEFORE Policies

**If diagnostic shows no functions**, create them FIRST:

```sql
-- Run: supabase/migrations/023_CREATE_FUNCTIONS_ONLY.sql
-- This creates get_user_workspaces() and user_has_role_in_org_simple()
```

**Verify it worked**:
```sql
SELECT proname FROM pg_proc WHERE proname IN ('get_user_workspaces', 'user_has_role_in_org_simple');
-- Should return 2 rows
```

### Step 3: Test on ONE Table Before All Tables

**NEVER apply policies to all tables at once**. Test on ONE table first:

```sql
-- Example: Test on organizations table only
-- Run: supabase/migrations/024_TEST_ONE_POLICY.sql
```

**If this fails**, you know the problem is in the policy logic, not the function.

**If this succeeds**, apply to all tables:

```sql
-- Run: supabase/migrations/025_COMPLETE_RLS.sql
```

---

## Error Decision Tree

```
Got "uuid = text" error?
│
├─→ Did you run diagnostics first?
│   ├─→ NO → ❌ STOP. Run scripts/rls-diagnostics.sql
│   └─→ YES → Continue
│
├─→ Do helper functions exist?
│   ├─→ NO → ❌ Run migration 023_CREATE_FUNCTIONS_ONLY.sql
│   └─→ YES → Continue
│
├─→ Did you test on ONE table first?
│   ├─→ NO → ❌ STOP. Test on organizations table only
│   └─→ YES → Continue
│
└─→ Check column types in diagnostic output
    ├─→ If TEXT → Run migration to convert to UUID
    └─→ If UUID → Policy syntax error (check USING/WITH CHECK)
```

---

## Common Mistakes (Never Do These)

❌ **Creating policies without functions**
```sql
-- BAD: Policy references non-existent function
CREATE POLICY "..." USING (workspace_id IN (SELECT get_user_workspaces()));
-- ERROR: function get_user_workspaces() does not exist
```

✅ **Create functions first, then policies**
```sql
-- GOOD: Step 1 - Create function
CREATE FUNCTION get_user_workspaces() ...

-- GOOD: Step 2 - Create policy
CREATE POLICY "..." USING (workspace_id IN (SELECT get_user_workspaces()));
```

---

❌ **Applying to all tables at once**
```sql
-- BAD: Create policies on 9 tables in one migration
-- If it fails, you don't know which table caused the error
```

✅ **Test on one table first**
```sql
-- GOOD: Test on organizations table only
-- If it fails, you know the exact table/policy
-- If it succeeds, apply to remaining tables
```

---

❌ **Mixing UUID and TEXT casting randomly**
```sql
-- BAD: Inconsistent casting
WHERE uo.org_id::text = w.org_id  -- Mixed types

-- BAD: Unnecessary casting
WHERE uo.org_id::text = w.org_id::text  -- Both already UUID
```

✅ **Use native types (no casting needed if both UUID)**
```sql
-- GOOD: Native UUID comparison
WHERE uo.org_id = w.org_id  -- Clean, no casting
```

---

## Migration Naming Convention

Use this format for all RLS migrations:

```
023_CREATE_FUNCTIONS_ONLY.sql      ← Creates helper functions
024_TEST_ONE_POLICY.sql             ← Tests on 1 table
025_COMPLETE_RLS.sql                ← Applies to all tables
026_RLS_[table_name].sql            ← Single table RLS (if needed)
```

**Do NOT create**:
- ❌ `020_v4.sql`, `020_v5.sql`, etc. (version numbers in filename)
- ❌ `020_SIMPLE.sql`, `020_ABSOLUTE_FINAL.sql` (trial and error names)

**Why?**: Failed migrations clutter the history. Get it right the first time by following this workflow.

---

## Pre-Flight Checklist (Before Running ANY RLS Migration)

```
[ ] 1. Ran scripts/rls-diagnostics.sql
[ ] 2. Reviewed diagnostic output
[ ] 3. Helper functions exist (or created them in Step 2)
[ ] 4. Tested on ONE table first (or this IS the one-table test)
[ ] 5. All ID columns are UUID type (checked in diagnostic)
[ ] 6. Backed up database (optional but recommended)
```

**If all boxes are checked** → Proceed with migration
**If ANY box is unchecked** → STOP and fix it first

---

## Success Criteria

After running a migration, you should see:

```sql
-- In Supabase SQL Editor output:
✅ SUCCESS: 2 functions created
✅ SUCCESS: 4 policies on organizations
✅ SUCCESS: Database is FULLY SECURED
```

**If you see this instead**:
```sql
ERROR: operator does not exist: uuid = text
ERROR: function get_user_workspaces() does not exist
ERROR: relation "generatedContent" does not exist
```

→ You skipped the diagnostic step. Go back to Step 1.

---

## When to Use This Workflow

**ALWAYS** use this workflow when:
- Adding RLS to a new table
- Modifying existing RLS policies
- Debugging RLS issues
- Migrating RLS from one environment to another

**Exception**: If you're 100% certain the functions exist and you're only modifying a policy on ONE table, you can skip to Step 3. But when in doubt, run the diagnostic.

---

## Time Investment

- **Following this workflow**: 5 minutes per RLS migration
- **Skipping this workflow**: 2 hours of debugging

**Choose wisely.**

---

## Questions?

**Q**: Can I skip the diagnostic if I "know" the functions exist?
**A**: No. The diagnostic takes 30 seconds. Debugging a failed migration takes hours.

**Q**: Can I test on multiple tables at once instead of one?
**A**: No. If it fails, you won't know which table caused the error.

**Q**: What if the diagnostic shows functions exist but I still get errors?
**A**: Then the error is in your policy syntax, not the functions. Check the USING/WITH CHECK clauses.

**Q**: Can I create policies before functions if I plan to create functions later?
**A**: No. PostgreSQL validates policies when they're created. They will fail if functions don't exist.

---

**This workflow is mandatory. Follow it every time. No exceptions.**
