# Guardian Z-Series Operator Runbook

**Daily Operations, Troubleshooting & Common Tasks**

**Audience**: Operations teams, DevOps, Support engineers
**Last Updated**: 2025-12-12
**SLA**: P0 (critical), P1 (degradation), P2 (feature)

---

## Quick Reference

### Health Check (5 min)

```bash
npm run integrity:check
# Returns: Z-series health status across all 15 phases
# Expected: ✅ All 15 phases healthy, 235+ tests passing
```

### Common Issues & Solutions

| Issue | Symptom | Fix |
|-------|---------|-----|
| Z13 schedules not running | Tasks not executing on schedule | Check `guardian_meta_automation_schedules.next_run_at` + manual trigger |
| Z11 exports failing | Export status = 'failed' | Check export item size + PII scrubber warnings |
| Z15 restores blocked | Allowlist violation error | Check target_mode (merge vs replace) + scope allowlist |
| Z10 audit log not recording | No entries in audit table | Verify `logMetaAuditEvent()` called on all mutations |

---

## Daily Operations (7 AM)

### 1. Morning Health Check (5 min)

```bash
# Check database connectivity
psql -h supabase.co -d postgres -c "SELECT 1;"
# Expected: (1 row)

# Check Z-series table counts
psql -h supabase.co -d postgres -c "
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_name LIKE 'guardian_meta_%' OR table_name LIKE 'guardian_tenant_%';
"
# Expected: 30+ tables

# Check Supabase API
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  https://supabase.co/rest/v1/guardian_tenant_readiness_scores?limit=1 \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: HTTP 200

# Check Next.js app
curl http://localhost:3008/api/guardian/meta/readiness/overview?workspaceId=test \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: HTTP 200 or 401 (auth required, but route exists)
```

### 2. Review Overnight Audit Log (5 min)

```sql
-- Check for errors in overnight operations
SELECT COUNT(*) as error_count FROM guardian_meta_audit_log
WHERE created_at > NOW() - INTERVAL '12 hours'
AND (action LIKE '%error%' OR action LIKE '%failed%');

-- Check Z13 automation execution
SELECT action, COUNT(*) as count
FROM guardian_meta_audit_log
WHERE created_at > NOW() - INTERVAL '12 hours'
AND source = 'automation'
GROUP BY action;
-- Expected: kpi_eval, stack_readiness, improvement_outcome all showing executions
```

### 3. Check Z13 Automation (5 min)

```sql
-- List due schedules
SELECT id, task_type, cadence, next_run_at
FROM guardian_meta_automation_schedules
WHERE next_run_at <= NOW() + INTERVAL '1 hour'
AND is_active = true;

-- Run scheduler (manual trigger if needed)
-- POST /api/guardian/meta/automation/run-scheduler?workspaceId=XXX
curl -X POST http://localhost:3008/api/guardian/meta/automation/run-scheduler \
  -H "workspaceId: tenant-123" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 4. Check Error Rates (2 min)

```bash
# Check application logs for Z-series errors
tail -f /var/log/app.log | grep -i "guardian\|z01\|z02\|z03"
# Expected: < 1 error per 1000 requests

# Check Sentry/error tracking
# Expected: Error rate < 0.5%
```

**Action**: If error rate > 1%, escalate to P1

---

## Common Tasks

### Task: Create Readiness Assessment (Z01)

```typescript
// From CLI or automation:
import { computeReadinessScore } from '@/lib/guardian/meta/readinessComputationService';

const score = await computeReadinessScore('tenant-123');
console.log(score);
// Output: { score: 67, status: 'operational', computed_at: '...' }
```

Or via API:
```bash
POST /api/guardian/meta/readiness/compute
{
  "workspaceId": "tenant-123"
}
```

### Task: Generate Uplift Plan (Z02)

```bash
POST /api/guardian/meta/uplift/plans
{
  "workspaceId": "tenant-123",
  "readinessSnapshotId": "snapshot-uuid"
}
# Returns: { planId: "..." }
```

Then check:
```bash
GET /api/guardian/meta/uplift/plans?workspaceId=tenant-123
# Lists all plans for tenant
```

### Task: Create Export Bundle (Z11)

```bash
POST /api/guardian/meta/exports
{
  "workspaceId": "tenant-123",
  "bundleKey": "cs_transfer_kit",
  "label": "Q1 2025 Handoff",
  "scope": ["readiness", "uplift", "playbooks"]
}
# Returns: { bundleId: "..." }
```

Monitor export:
```bash
GET /api/guardian/meta/exports/[bundleId]?workspaceId=tenant-123
# Check status: pending → building → ready (or failed)
```

### Task: Create Z13 Automation Schedule

```bash
POST /api/guardian/meta/automation/schedules
{
  "workspaceId": "tenant-123",
  "taskType": "stack_readiness",
  "cadence": "daily",
  "runAtHour": 2,
  "runAtMinute": 0,
  "label": "Nightly Readiness"
}
# Returns: { scheduleId: "..." }
```

Verify schedule:
```bash
GET /api/guardian/meta/automation/schedules?workspaceId=tenant-123
# Should see next_run_at set to tomorrow 2:00 AM UTC
```

### Task: Create Backup Before Major Changes (Z15)

```bash
POST /api/guardian/meta/backups
{
  "workspaceId": "tenant-123",
  "backupKey": "pre_upgrade_2025q1",
  "label": "Pre-Q1 Upgrade",
  "description": "Full backup before deploying edition changes",
  "scope": ["governance", "automation", "playbooks", "improvement_loop"]
}
# Returns: { backupId: "..." }
```

Monitor:
```bash
GET /api/guardian/meta/backups?workspaceId=tenant-123
# Check status: pending → building → ready
```

### Task: Restore Configuration from Backup (Z15)

**CRITICAL: Preview first, always!**

```bash
# Step 1: Create preview (no changes applied)
POST /api/guardian/meta/restores/preview
{
  "workspaceId": "tenant-123",
  "backupId": "backup-uuid",
  "targetMode": "merge"
}
# Returns: { restoreRunId: "...", previewDiff: {...} }

# Step 2: Review preview diff
GET /api/guardian/meta/restores/[restoreRunId]?workspaceId=tenant-123
# Check: previewDiff shows what will change

# Step 3: Apply restore (requires confirmation)
POST /api/guardian/meta/restores/[restoreRunId]/apply
{
  "workspaceId": "tenant-123",
  "confirm": true
}
# Returns: { status: "completed", resultSummary: {...} }
```

### Task: Run Z-Series Validation Gate

```bash
GET /api/guardian/meta/z-series/validate?workspaceId=tenant-123
# Returns detailed validation results with remediation steps
# Status: pass | warn | fail
```

Or via UI:
- Navigate to `/guardian/admin/meta-governance`
- Click "Run Validation"
- Review results + recommendations

---

## Troubleshooting

### Problem: Z13 Schedules Not Running

**Symptoms**:
- `guardian_meta_automation_schedules.next_run_at` not advancing
- No executions in `guardian_meta_automation_executions`
- No audit log entries for scheduled tasks

**Diagnosis**:

```sql
-- Check schedule config
SELECT id, task_type, cadence, next_run_at, is_active
FROM guardian_meta_automation_schedules
WHERE is_active = true
ORDER BY next_run_at;

-- Check if scheduler is configured to run
-- (This depends on your deployment: cron job, scheduler service, etc.)
```

**Solutions**:

1. **Schedule not due yet**
   - Check `next_run_at`: If future, schedule hasn't reached run time
   - Wait for scheduled time or manually trigger

2. **Scheduler service not running**
   - Verify: Cron job / scheduler service is active
   - Start: `npm run start -- --scheduler`
   - Check: Logs show "Scheduler running"

3. **Permision issue**
   - Verify: Scheduler has admin auth for the workspace
   - Check: `SUPABASE_SERVICE_ROLE_KEY` configured
   - Verify: No RLS violations in audit log

**Manual Fix**:
```bash
# Manually trigger scheduler
POST /api/guardian/meta/automation/run-scheduler?workspaceId=tenant-123
# Should execute all due schedules immediately
```

### Problem: Z11 Exports Failing

**Symptoms**:
- Export status = 'failed'
- `error_message` contains scrubber warnings
- Exports not downloadable

**Diagnosis**:

```sql
-- Check export status
SELECT id, status, error_message, created_at
FROM guardian_meta_export_bundles
WHERE status = 'failed'
ORDER BY created_at DESC LIMIT 10;

-- Check bundle items
SELECT item_key, checksum, content->'warnings' as warnings
FROM guardian_meta_export_bundle_items
WHERE bundle_id = 'failed-bundle-uuid';
```

**Solutions**:

1. **Payload too large**
   - Reduce scope: Exclude large items like raw logs or raw snapshot data
   - Use smaller time period: `period_start` / `period_end`
   - Fix: Retry with smaller scope

2. **PII detection warnings**
   - Warnings indicate potential email/IP/secret patterns
   - Safe if warnings only (scrubber redacted them)
   - Fix: Review warnings, retry if acceptable

3. **Missing governance settings**
   - Verify: `guardian_meta_governance_prefs` exists for tenant
   - Create: Default governance via Z10 console
   - Fix: Retry export

**Manual Fix**:
```bash
# Delete failed export and retry
DELETE FROM guardian_meta_export_bundles WHERE id = 'failed-uuid';
DELETE FROM guardian_meta_export_bundle_items WHERE bundle_id = 'failed-uuid';

# Retry with smaller scope
POST /api/guardian/meta/exports
{
  "workspaceId": "tenant-123",
  "bundleKey": "cs_transfer_kit",
  "scope": ["readiness"] // Start small
}
```

### Problem: Z15 Restore Blocked (Allowlist Violation)

**Symptoms**:
- Restore apply fails: "Operation not in allowlist"
- Error: "Cannot restore scope X in replace mode"
- No changes applied

**Diagnosis**:

```sql
-- Check restore status
SELECT id, status, error_message, target_mode
FROM guardian_meta_restore_runs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

**Allowlist Rules**:
```
✅ merge mode:   All scopes safe (upserts)
❌ replace mode: Only certain scopes (uplift, playbooks, improvement_loop)
❌ status scope: Never restored (derived data, computed)
```

**Solutions**:

1. **Replace mode not allowed for this scope**
   - Check: Restore is using `targetMode: 'merge'`
   - Fix: Change to merge mode (upserts instead of replaces)

2. **Status scope in restore**
   - Status scope never restorable (it's computed)
   - Fix: Exclude status from backup scope

**Manual Fix**:
```bash
# Preview restore with merge mode instead
POST /api/guardian/meta/restores/preview
{
  "workspaceId": "tenant-123",
  "backupId": "backup-uuid",
  "targetMode": "merge"  # Change from 'replace'
}

# Should preview successfully
# Then apply:
POST /api/guardian/meta/restores/[restoreRunId]/apply
{
  "workspaceId": "tenant-123",
  "confirm": true
}
```

### Problem: Z10 Audit Log Not Recording

**Symptoms**:
- No entries in `guardian_meta_audit_log`
- All operations appear unlogged
- Compliance risk

**Diagnosis**:

```sql
-- Check if audit table exists and has entries
SELECT COUNT(*) FROM guardian_meta_audit_log;
SELECT * FROM guardian_meta_audit_log ORDER BY created_at DESC LIMIT 5;
```

**Solutions**:

1. **Audit log table doesn't exist**
   - Fix: Apply migration 610 (includes audit log table)

2. **RLS blocking inserts**
   - Check: Audit log RLS policy allows inserts
   - Verify: `tenant_id = get_current_workspace_id()`
   - Fix: Disable RLS temporarily if needed (dangerous!)

3. **Logging calls not triggered**
   - Verify: All mutations call `logMetaAuditEvent()`
   - Check: Logs in `src/lib/guardian/meta/*/Service.ts`
   - Fix: Add missing `await logMetaAuditEvent()` calls

**Manual Fix**:
```bash
# Manually log test event
POST /api/guardian/meta/audit/test
{
  "workspaceId": "tenant-123",
  "action": "test",
  "summary": "Test audit entry"
}

# Should see entry in guardian_meta_audit_log
```

---

## Performance Tuning

### Slow Z01 Readiness Computation

```sql
-- Analyze readiness query
EXPLAIN (ANALYZE, BUFFERS)
SELECT overall_guardian_score, status, computed_at
FROM guardian_tenant_readiness_scores
WHERE tenant_id = 'xxx'
ORDER BY computed_at DESC LIMIT 1;
```

**Optimization**:
- Ensure index on (tenant_id, created_at DESC)
- Cache latest score in Redis (optional)
- Consider materialized view if recomputing frequently

### Slow Z11 Export Creation

```sql
-- Check which scope items are slowest
SELECT item_key, length(content::text) as size_bytes
FROM guardian_meta_export_bundle_items
WHERE bundle_id = 'slow-bundle'
ORDER BY size_bytes DESC;
```

**Optimization**:
- Reduce scope: Don't export large items (raw logs, snapshots)
- Archive old bundles: `DELETE FROM guardian_meta_export_bundles WHERE created_at < NOW() - INTERVAL '90 days'`
- Index on bundle_id, item_key

### Slow Z13 Scheduler Execution

```sql
-- Check execution times
SELECT task_type, MAX(finished_at - started_at) as max_duration
FROM guardian_meta_automation_executions
GROUP BY task_type;
```

**Optimization**:
- Reduce task count: Don't create too many schedules per tenant
- Parallel execution: Run tasks in Promise.all() instead of sequentially
- Time windows: Spread schedules across hours (don't run all at XX:00)

---

## Alerts & Monitoring

### Key Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Z-series API error rate | > 1% | P1: Investigate logs |
| Z-series API latency p99 | > 2s | P2: Profile + optimize |
| Audit log insertion errors | > 10/min | P1: Check RLS policies |
| Z13 schedule failures | > 5% | P1: Check task configs |
| Z15 restore failures | > 10% | P2: Check allowlists |
| Z11 export failures | > 5% | P2: Check payload size |

### Prometheus Queries

```prometheus
# Error rate
rate(guardian_api_errors_total{phase=~"z0[1-9]|z1[0-5]"}[5m]) > 0.01

# Latency
histogram_quantile(0.99, guardian_api_latency_seconds{phase=~"z0[1-9]|z1[0-5]"}) > 2

# Audit log lag
rate(guardian_audit_log_lag_seconds[5m]) > 60
```

### Sentry Configuration

Tag Z-series errors with:
- `phase`: z01, z02, ..., z15
- `operation`: readiness_compute, export_create, restore_apply, etc.
- `tenant_id`: For debugging

---

## Escalation Procedures

### P0 (Critical Outage)

**Triggers**: Z-series completely down, cannot create/read meta data

1. **Immediate**: Disable feature flag `enableZSeries: false`
2. **Investigate**: Check database connectivity + API logs
3. **Communicate**: Notify customers (if exposed)
4. **Restore**: Enable feature flag once fixed

**Escalate to**: Engineering lead, on-call engineer

### P1 (Degradation)

**Triggers**: > 1% error rate, Z13 not running, Z15 restores failing

1. **Diagnose**: Run validation gate + check audit log
2. **Fix**: Apply quick fix (restart service, run scheduler, etc.)
3. **Monitor**: Verify resolution within 30 min

**Escalate to**: On-call engineer if not resolved in 30 min

### P2 (Feature Issue)

**Triggers**: Single feature not working (slow export, validation warning, etc.)

1. **Document**: Create issue with reproduction steps
2. **Investigate**: At next available window
3. **Plan fix**: Schedule for next sprint if needed

**Escalate to**: Engineering backlog

---

## Maintenance Windows

### Weekly Maintenance (Sunday 2 AM UTC, 30 min)

- [ ] Run full Z-series test suite
- [ ] Archive old audit log entries (> 90 days)
- [ ] Analyze key tables for query optimization

### Monthly Maintenance (First Sunday, 2 AM UTC, 1 hour)

- [ ] Backup all Z-series configuration
- [ ] Vacuum/analyze all Z-series tables
- [ ] Review error logs for patterns
- [ ] Update metrics dashboards

### Quarterly Maintenance

- [ ] Review Z-series performance metrics
- [ ] Plan optimizations based on usage patterns
- [ ] Security audit (check for PII leakage)
- [ ] Update runbook based on lessons learned

---

## Quick Commands Reference

```bash
# Health check
npm run integrity:check

# Run validation gate
curl GET /api/guardian/meta/z-series/validate?workspaceId=XXX

# Manual scheduler trigger
curl -X POST /api/guardian/meta/automation/run-scheduler?workspaceId=XXX

# Manual trigger evaluation
curl -X POST /api/guardian/meta/automation/run-triggers?workspaceId=XXX

# Check audit log
psql -c "SELECT * FROM guardian_meta_audit_log ORDER BY created_at DESC LIMIT 20;"

# List failed exports
psql -c "SELECT id, status, error_message FROM guardian_meta_export_bundles WHERE status='failed';"

# List failed restores
psql -c "SELECT id, status, error_message FROM guardian_meta_restore_runs WHERE status='failed';"

# Archive old audit log
psql -c "DELETE FROM guardian_meta_audit_log WHERE created_at < NOW() - INTERVAL '90 days';"
```

---

## References

- **Quick Start**: [README_GUARDIAN_META_STACK.md](README_GUARDIAN_META_STACK.md)
- **Full Index**: [Z_SERIES_INDEX.md](Z_SERIES_INDEX.md)
- **Release Checklist**: [Z_SERIES_RELEASE_CHECKLIST.md](Z_SERIES_RELEASE_CHECKLIST.md)
- **Architecture**: [Z_SERIES_COMPATIBILITY_MATRIX.md](Z_SERIES_COMPATIBILITY_MATRIX.md)

---

**Status**: ✅ Production Operations Guide
**Last Updated**: 2025-12-12
**Next Review**: 2025-01-12
