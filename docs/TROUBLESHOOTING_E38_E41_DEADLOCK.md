# Deadlock Resolution for E38-E41 Migrations

## Error
```
ERROR: 40P01: deadlock detected
Process waits for AccessExclusiveLock blocked by another process
```

## Cause
Running migrations 527-530 simultaneously or having active queries on founder tables during migration.

## Resolution Steps

### 1. Check for Blocking Queries (Supabase Dashboard → SQL Editor)

```sql
SELECT
  pid,
  usename,
  application_name,
  state,
  query_start,
  state_change,
  LEFT(query, 100) AS query_snippet
FROM pg_stat_activity
WHERE state != 'idle'
  AND pid != pg_backend_pid()
ORDER BY query_start;
```

### 2. Terminate Long-Running Queries (if safe)

```sql
-- Check what's blocking
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Terminate if needed (replace PID)
SELECT pg_terminate_backend(12345);
```

### 3. Run Migrations Sequentially

**Option A: Run one at a time in Supabase Dashboard SQL Editor**
1. Copy/paste migration 527 → Run
2. Wait for completion
3. Copy/paste migration 528 → Run
4. Wait for completion
5. Copy/paste migration 529 → Run
6. Wait for completion
7. Copy/paste migration 530 → Run

**Option B: Use transaction blocks**
```sql
BEGIN;
\i supabase/migrations/527_founder_observatory.sql
COMMIT;

BEGIN;
\i supabase/migrations/528_drift_detector.sql
COMMIT;

BEGIN;
\i supabase/migrations/529_early_warning.sql
COMMIT;

BEGIN;
\i supabase/migrations/530_governance_forecast.sql
COMMIT;
```

### 4. Verify Tables Created

```sql
-- Check all E38-E41 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'founder_observatory_events',
    'observatory_aggregates',
    'drift_events',
    'drift_baselines',
    'early_warning_events',
    'warning_thresholds',
    'governance_forecast',
    'forecast_models'
  )
ORDER BY table_name;

-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'founder_observatory_events',
  'observatory_aggregates',
  'drift_events',
  'drift_baselines',
  'early_warning_events',
  'warning_thresholds',
  'governance_forecast',
  'forecast_models'
)
ORDER BY tablename, policyname;
```

### 5. Test Functions

```sql
-- Test observatory summary (replace tenant_id)
SELECT get_observatory_summary('00000000-0000-0000-0000-000000000000', 7);

-- Test drift summary
SELECT get_drift_summary('00000000-0000-0000-0000-000000000000');

-- Test warning summary
SELECT get_warning_summary('00000000-0000-0000-0000-000000000000');

-- Test forecast accuracy
SELECT get_forecast_accuracy('00000000-0000-0000-0000-000000000000');
```

## Prevention

1. **Close IDE connections** to database before migrations
2. **Stop dev server** (`npm run dev`) before migrations
3. **Run migrations during low-activity periods**
4. **Use single SQL Editor tab** in Supabase Dashboard
5. **Wait for completion** before running next migration

## Status Check

After resolution, verify E38-E41 is ready:
- [ ] All 8 tables created
- [ ] All RLS policies active
- [ ] All 4 summary functions work
- [ ] API routes return 200 OK
- [ ] No blocking queries remain
