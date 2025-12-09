# Apply E16-E18 Migrations - Step-by-Step Guide

## ⚠️ Before You Start

**IMPORTANT**: These migrations include DROP statements to prevent function conflicts. They are safe to run multiple times (idempotent).

**Affected Tables** (will be dropped and recreated):
- E16: `audit_events`, `api_request_logs`
- E17: `export_jobs`, `export_job_items`
- E18: `kill_switch_flags`, `kill_switch_overrides`

**Affected Functions** (will be dropped and recreated):
- E16: `record_audit_event`, `record_api_request`, `get_audit_summary`, `cleanup_old_audit_logs`
- E17: `queue_export_job`, `start_export_job`, `complete_export_job`, `cleanup_old_export_jobs`
- E18: `check_feature_flag`, `enable_feature_flag`, `disable_feature_flag`, `set_feature_override`, `cleanup_expired_overrides`

---

## Step 1: Apply E16 (Observability & Audit Trails)

### Via Supabase Dashboard

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `supabase/migrations/431_observability_audit_trails.sql`
4. Paste into SQL Editor
5. Click "Run" (or Ctrl+Enter)
6. Verify no errors in output

### Expected Output
```
DROP TABLE
DROP TABLE
CREATE TYPE
CREATE TYPE
CREATE TABLE
CREATE INDEX (x6)
CREATE POLICY (x3)
CREATE FUNCTION (x4)
GRANT
```

---

## Step 2: Apply E17 (Backup & Export Infrastructure)

1. In Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `supabase/migrations/432_backup_export_infrastructure.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify no errors

### Expected Output
```
DROP TABLE
DROP TABLE
CREATE TYPE
CREATE TYPE
CREATE TABLE
CREATE INDEX (x6)
CREATE POLICY (x3)
CREATE FUNCTION (x4)
GRANT
```

---

## Step 3: Apply E18 (Kill-Switch Controls)

1. In Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `supabase/migrations/433_feature_flags_kill_switch.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify no errors

### Expected Output
```
DROP TABLE
DROP TABLE
CREATE TYPE
CREATE TABLE
CREATE INDEX (x5)
CREATE POLICY (x4)
DROP FUNCTION (x4)
CREATE FUNCTION (x5)
GRANT
INSERT 0 15  -- 15 kill-switches seeded
CREATE TRIGGER
CREATE FUNCTION
```

---

## Step 4: Verify Installation

### Run Verification Script

1. In Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `supabase/migrations/verify_e16_e17_e18.sql`
4. Paste into SQL Editor
5. Click "Run"

### Expected Results

**All tables should exist**:
```
audit_events: true
api_request_logs: true
export_jobs: true
export_job_items: true
kill_switch_flags: true
kill_switch_overrides: true
```

**All functions should exist** (13 total):
- E16: 4 functions
- E17: 4 functions
- E18: 5 functions

**15 kill-switches should be seeded**:
```
autonomous_delivery (disabled, CRITICAL)
auto_posting (disabled, HIGH)
auto_email_send (disabled, HIGH)
ai_content_generation (enabled, MEDIUM)
ai_campaign_optimization (disabled, MEDIUM)
... (10 more)
```

---

## Step 5: Quick Functionality Test

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

-- Verify event was created
SELECT * FROM audit_events
WHERE action = 'Test campaign created'
ORDER BY created_at DESC
LIMIT 1;

-- Get audit summary
SELECT get_audit_summary(auth.uid(), 24);
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

-- Verify job was queued
SELECT * FROM export_jobs
WHERE status = 'pending'
ORDER BY requested_at DESC
LIMIT 1;
```

### Test E18 (Kill-Switches)

```sql
-- Check if autonomous_delivery is enabled
SELECT check_feature_flag(auth.uid(), 'autonomous_delivery');
-- Expected: false (disabled by default for safety)

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
```

---

## Troubleshooting

### Error: "relation already exists"

**Solution**: Migrations include DROP statements, but if you see this error:
```sql
-- Manually drop and re-run
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS api_request_logs CASCADE;
-- Then re-run migration 431
```

### Error: "function name is not unique"

**Solution**: Drop all conflicting functions:
```sql
-- E16 conflicts
DROP FUNCTION IF EXISTS record_audit_event(UUID, UUID, audit_event_type, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_api_request(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_audit_summary(UUID, INTEGER);

-- E17 conflicts
DROP FUNCTION IF EXISTS queue_export_job(UUID, UUID, export_type, JSONB);
DROP FUNCTION IF EXISTS start_export_job(UUID);
DROP FUNCTION IF EXISTS complete_export_job(UUID, BOOLEAN, TEXT, BIGINT, INTEGER, TEXT, TIMESTAMPTZ);

-- E18 conflicts
DROP FUNCTION IF EXISTS check_feature_flag(UUID, TEXT);
DROP FUNCTION IF EXISTS enable_feature_flag(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS disable_feature_flag(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS set_feature_override(UUID, TEXT, BOOLEAN, TEXT, UUID, TIMESTAMPTZ);

-- Then re-run migrations
```

### Error: "type already exists"

**Solution**: Migrations use idempotent ENUM creation (DO blocks), but if needed:
```sql
-- Check existing types
SELECT typname FROM pg_type WHERE typname LIKE '%audit%' OR typname LIKE '%export%' OR typname LIKE '%feature%';

-- Drop if needed (DANGEROUS - check dependencies first)
DROP TYPE IF EXISTS audit_event_type CASCADE;
DROP TYPE IF EXISTS export_type CASCADE;
DROP TYPE IF EXISTS export_job_status CASCADE;
DROP TYPE IF EXISTS feature_flag_category CASCADE;
```

---

## Rollback (Emergency Only)

**⚠️ WARNING**: This will delete all audit logs, export jobs, and kill-switch configurations!

```sql
-- E18 Rollback
DROP TABLE IF EXISTS kill_switch_overrides CASCADE;
DROP TABLE IF EXISTS kill_switch_flags CASCADE;
DROP TYPE IF EXISTS feature_flag_category CASCADE;
DROP FUNCTION IF EXISTS check_feature_flag(UUID, TEXT);
DROP FUNCTION IF EXISTS enable_feature_flag(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS disable_feature_flag(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS set_feature_override(UUID, TEXT, BOOLEAN, TEXT, UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS cleanup_expired_overrides();

-- E17 Rollback
DROP TABLE IF EXISTS export_job_items CASCADE;
DROP TABLE IF EXISTS export_jobs CASCADE;
DROP TYPE IF EXISTS export_type CASCADE;
DROP TYPE IF EXISTS export_job_status CASCADE;
DROP FUNCTION IF EXISTS queue_export_job(UUID, UUID, export_type, JSONB);
DROP FUNCTION IF EXISTS start_export_job(UUID);
DROP FUNCTION IF EXISTS complete_export_job(UUID, BOOLEAN, TEXT, BIGINT, INTEGER, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS cleanup_old_export_jobs();

-- E16 Rollback
DROP TABLE IF EXISTS api_request_logs CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TYPE IF EXISTS audit_event_type CASCADE;
DROP FUNCTION IF EXISTS record_audit_event(UUID, UUID, audit_event_type, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_api_request(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_audit_summary(UUID, INTEGER);
DROP FUNCTION IF EXISTS cleanup_old_audit_logs();
```

---

## Post-Migration Tasks

### 1. Update API Services (Already Done ✅)
- `src/lib/core/auditService.ts`
- `src/lib/core/exportService.ts`
- `src/lib/core/killSwitchService.ts`

### 2. Update API Routes (Already Done ✅)
- `src/app/api/admin/audit-events/route.ts`
- `src/app/api/admin/exports/route.ts`
- `src/app/api/admin/kill-switches/route.ts`

### 3. Set Up Background Jobs (TODO)

**Export Job Processor**:
```typescript
// src/app/api/cron/process-exports/route.ts
import { listExportJobs } from "@/lib/core/exportService";

export async function GET() {
  const jobs = await listExportJobs(null, "pending", 10);

  for (const job of jobs) {
    // Process export job
    await processExportJob(job.id);
  }

  return NextResponse.json({ processed: jobs.length });
}
```

**Add to vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-exports",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 4. Set Up Cleanup Jobs (TODO)

```typescript
// src/app/api/cron/cleanup-old-data/route.ts
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  // Cleanup old audit logs (90d retention)
  await supabaseAdmin.rpc("cleanup_old_audit_logs");

  // Cleanup old exports (30d retention)
  await supabaseAdmin.rpc("cleanup_old_export_jobs");

  // Cleanup expired kill-switch overrides
  await supabaseAdmin.rpc("cleanup_expired_overrides");

  return NextResponse.json({ success: true });
}
```

### 5. Test API Endpoints

```bash
# E16: Audit Events
curl "http://localhost:3008/api/admin/audit-events?workspaceId=YOUR_WORKSPACE_ID&action=summary"

# E17: Export Jobs
curl -X POST http://localhost:3008/api/admin/exports \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"YOUR_WORKSPACE_ID","action":"queue","type":"audience.csv"}'

# E18: Kill-Switches
curl "http://localhost:3008/api/admin/kill-switches?workspaceId=YOUR_WORKSPACE_ID&action=check&flagKey=autonomous_delivery"
```

---

## Success Checklist

- [ ] Migration 431 applied successfully (E16)
- [ ] Migration 432 applied successfully (E17)
- [ ] Migration 433 applied successfully (E18)
- [ ] Verification script shows all tables exist
- [ ] Verification script shows all functions exist
- [ ] 15 kill-switches seeded in `kill_switch_flags`
- [ ] Test audit event recorded successfully
- [ ] Test export job queued successfully
- [ ] Test kill-switch check returns `false` (disabled)
- [ ] No errors in Supabase logs
- [ ] API endpoints responding (if testing locally)

---

**Status**: Ready to apply ✅
**Estimated Time**: 10 minutes
**Risk Level**: Low (migrations are idempotent with DROP statements)

**Questions?** Check docs:
- `docs/PHASE_E16_OBSERVABILITY_STATUS.md`
- `docs/PHASE_E17_BACKUP_EXPORT_STATUS.md`
- `docs/PHASE_E18_KILL_SWITCH_STATUS.md`
