# E16-E18 Migration Steps - DO THIS IN ORDER

## Current Status
⚠️ **You ran the verification script before applying migrations**

The error `relation "kill_switch_flags" does not exist` means migrations haven't been applied yet.

---

## Step-by-Step Guide

### Step 1: Pre-Flight Check (Optional)

See what's currently in your database:

1. **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy & paste: `supabase/migrations/check_before_apply.sql`
3. Click **Run**

Expected: "⏳ Ready to apply - No migrations applied yet"

---

### Step 2: Apply E16 - Observability & Audit Trails

1. **Supabase Dashboard** → **SQL Editor** → **New Query**
2. **Open file**: `supabase/migrations/431_observability_audit_trails.sql`
3. **Copy entire contents** (Ctrl+A, Ctrl+C)
4. **Paste** into SQL Editor
5. Click **Run** (or Ctrl+Enter)

**Expected Output**:
```
DROP TABLE
DROP TABLE
CREATE TYPE
CREATE TYPE
CREATE TABLE
CREATE INDEX
CREATE INDEX
... (more indexes)
ALTER TABLE
CREATE POLICY
CREATE POLICY
CREATE POLICY
... (more policies)
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
GRANT
```

**Success**: No errors, only CREATE/DROP statements

⚠️ **If you see error**: Read error message and check troubleshooting below

---

### Step 3: Apply E17 - Backup & Export Infrastructure

1. **SQL Editor** → **New Query** (don't reuse previous query)
2. **Open file**: `supabase/migrations/432_backup_export_infrastructure.sql`
3. **Copy entire contents**
4. **Paste** into SQL Editor
5. Click **Run**

**Expected Output**:
```
DROP TABLE
DROP TABLE
CREATE TYPE
CREATE TYPE
CREATE TABLE
... (indexes, policies, functions)
GRANT
```

**Success**: No errors

---

### Step 4: Apply E18 - Kill-Switch Controls

1. **SQL Editor** → **New Query**
2. **Open file**: `supabase/migrations/433_feature_flags_kill_switch.sql`
3. **Copy entire contents**
4. **Paste** into SQL Editor
5. Click **Run**

**Expected Output**:
```
DROP TABLE
DROP TABLE
CREATE TYPE
CREATE TABLE
... (indexes, policies)
DROP FUNCTION
DROP FUNCTION
DROP FUNCTION
DROP FUNCTION
CREATE FUNCTION (x5)
GRANT
INSERT 0 15  ← 15 kill-switches seeded!
CREATE TRIGGER
CREATE FUNCTION
```

**Success**: Should see "INSERT 0 15" (15 kill-switches inserted)

---

### Step 5: Verify Installation

1. **SQL Editor** → **New Query**
2. **Open file**: `supabase/migrations/verify_e16_e17_e18.sql`
3. **Copy entire contents**
4. **Paste** into SQL Editor
5. Click **Run**

**Expected Results** (scroll through output):

**Tables** - All should show `exists: t`:
```
E16: audit_events table | exists: t
E16: api_request_logs table | exists: t
E17: export_jobs table | exists: t
E17: export_job_items table | exists: t
E18: kill_switch_flags table | exists: t
E18: kill_switch_overrides table | exists: t
```

**Functions** - All should show `exists: t`:
```
record_audit_event | exists: t
record_api_request | exists: t
get_audit_summary | exists: t
cleanup_old_audit_logs | exists: t
queue_export_job | exists: t
start_export_job | exists: t
... (13 functions total)
```

**Kill-Switches** - Should see 15 rows:
```
autonomous_delivery | disabled | critical
auto_posting | disabled | high
auto_email_send | disabled | high
... (12 more)
```

**Summary** - All should show `exists: t`:
```
SUMMARY: Tables | audit_events | t
SUMMARY: Tables | api_request_logs | t
... (6 tables total)
SUMMARY: Functions | E16 Functions | 4
SUMMARY: Functions | E17 Functions | 4
SUMMARY: Functions | E18 Functions | 5
```

**Final Line**:
```
✅ Verification Complete | 2025-12-08 ...
```

---

## Quick Functionality Test

After verification passes, test each system:

### Test E16 (Audit Logging)

```sql
-- Record test audit event
SELECT record_audit_event(
  auth.uid(),                    -- tenant_id
  auth.uid(),                    -- user_id
  'campaign.created',            -- event_type
  'campaign',                    -- resource
  gen_random_uuid()::text,       -- resource_id
  'Test campaign created',       -- action
  '{"test": true}'::jsonb,       -- metadata
  '127.0.0.1',                   -- ip_address
  'Mozilla/5.0'                  -- user_agent
);

-- Should return: UUID (event ID)

-- Verify event was created
SELECT * FROM audit_events
WHERE action = 'Test campaign created'
ORDER BY created_at DESC
LIMIT 1;

-- Should return: 1 row with your test data
```

### Test E17 (Export Jobs)

```sql
-- Queue test export
SELECT queue_export_job(
  auth.uid(),                    -- tenant_id
  auth.uid(),                    -- user_id
  'audience.csv',                -- export_type
  '{"test": true}'::jsonb        -- metadata
);

-- Should return: UUID (job ID)

-- Verify job was queued
SELECT * FROM export_jobs
WHERE status = 'pending'
ORDER BY requested_at DESC
LIMIT 1;

-- Should return: 1 row with status='pending'
```

### Test E18 (Kill-Switches)

```sql
-- Check if autonomous_delivery is enabled
SELECT check_feature_flag(auth.uid(), 'autonomous_delivery');

-- Should return: false (disabled by default for safety)

-- List all high-risk kill-switches
SELECT key, name, enabled, is_kill_switch, metadata->>'risk_level' as risk_level
FROM kill_switch_flags
WHERE is_kill_switch = TRUE
  AND tenant_id IS NULL
ORDER BY
  CASE metadata->>'risk_level'
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;

-- Should return: 3 rows (autonomous_delivery, auto_posting, auto_email_send)
-- All should have enabled=false
```

---

## Troubleshooting Common Errors

### Error: "relation already exists"

This means the migration was partially applied before. Fix:

```sql
-- Drop and re-run migration
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS api_request_logs CASCADE;
-- Then re-run migration 431
```

### Error: "function name is not unique"

Migrations include DROP statements, but if you still see this:

```sql
-- E16: Drop all functions
DROP FUNCTION IF EXISTS record_audit_event(UUID, UUID, audit_event_type, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_api_request(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_audit_summary(UUID, INTEGER);
DROP FUNCTION IF EXISTS cleanup_old_audit_logs();

-- Then re-run migration 431
```

### Error: "type already exists"

Migrations use idempotent ENUMs (DO blocks), but if needed:

```sql
-- Check what exists
SELECT typname FROM pg_type
WHERE typname IN ('audit_event_type', 'export_type', 'export_job_status', 'feature_flag_category');

-- If needed (WARNING: check dependencies first)
DROP TYPE IF EXISTS audit_event_type CASCADE;
DROP TYPE IF EXISTS export_type CASCADE;
DROP TYPE IF EXISTS export_job_status CASCADE;
DROP TYPE IF EXISTS feature_flag_category CASCADE;

-- Then re-run migrations
```

### Error: "cannot change return type of existing function"

This is why migrations include DROP FUNCTION statements. If you see this:

```sql
-- Find function signatures
SELECT proname, pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE proname IN ('check_feature_flag', 'get_audit_summary', 'record_audit_event');

-- Drop with exact signature shown above
DROP FUNCTION function_name(exact_signature);

-- Then re-run migration
```

---

## After Migration Checklist

Once all 3 migrations are applied and verified:

- [ ] ✅ Migration 431 applied (E16 - Observability)
- [ ] ✅ Migration 432 applied (E17 - Backup/Export)
- [ ] ✅ Migration 433 applied (E18 - Kill-Switches)
- [ ] ✅ Verification script passes (all tables/functions exist)
- [ ] ✅ Test audit event created successfully
- [ ] ✅ Test export job queued successfully
- [ ] ✅ Test kill-switch check returns `false`
- [ ] 📖 Read status docs:
  - `docs/PHASE_E16_OBSERVABILITY_STATUS.md`
  - `docs/PHASE_E17_BACKUP_EXPORT_STATUS.md`
  - `docs/PHASE_E18_KILL_SWITCH_STATUS.md`

---

## Next Steps

After migrations are applied, you can:

1. **Test API endpoints** (if server running):
   ```bash
   # E16
   curl "http://localhost:3008/api/admin/audit-events?workspaceId=YOUR_ID&action=summary"

   # E17
   curl -X POST http://localhost:3008/api/admin/exports \
     -H "Content-Type: application/json" \
     -d '{"workspaceId":"YOUR_ID","action":"queue","type":"audience.csv"}'

   # E18
   curl "http://localhost:3008/api/admin/kill-switches?workspaceId=YOUR_ID&action=check&flagKey=autonomous_delivery"
   ```

2. **Set up background jobs** (see `APPLY_E16_E17_E18.md` section "Post-Migration Tasks")

3. **Integrate into your app**:
   - Add audit logging to API routes
   - Add export functionality to UI
   - Add kill-switch checks to autonomous features

---

**Current Step**: Apply migrations in order (431 → 432 → 433)

**Need help?** Check the error message and troubleshooting section above.
