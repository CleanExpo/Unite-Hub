# Guardian Z-Series Release Checklist

**Pre-Production Verification & Deployment Steps**

**Status**: Ready for Production (Z01-Z15)
**Target Audience**: Operators, DevOps, Release Managers
**Last Updated**: 2025-12-12

---

## Overview

This checklist ensures all Guardian Z-Series phases (Z01-Z15) are production-ready before deployment. Each section covers database, services, APIs, UI, testing, and validation steps.

**Estimated Time**: 1-2 hours for full deployment

---

## Phase 1: Pre-Deployment Validation (30 min)

### 1.1 Database Readiness

- [ ] All migrations (601-610) applied in Supabase Dashboard
  - [ ] Migration 601: Z01-Z03 tables + RLS
  - [ ] Migration 602: Z04-Z05 tables + RLS
  - [ ] Migration 603: Z06-Z09 tables + RLS
  - [ ] Migration 604: Z10 governance + audit tables + RLS
  - [ ] Migration 605: Z10 audit log table + RLS (if separate)
  - [ ] Migration 606: Z11 export tables + RLS
  - [ ] Migration 607: Z12 improvement tables + RLS
  - [ ] Migration 608: Z13 automation tables + RLS
  - [ ] Migration 609: Z14 status tables + RLS
  - [ ] Migration 610: Z15 backup tables + RLS

**Verification**:
```sql
-- Check all Z-series tables exist
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name LIKE 'guardian_meta_%' OR table_name LIKE 'guardian_tenant_%' OR table_name LIKE 'guardian_adoption_%';
-- Should return 30+ tables
```

- [ ] RLS enabled on all Z-series tables
  - [ ] Check: Every table has Row Level Security enabled
  - [ ] Test: Query from two different workspace contexts; confirm isolation

**Verification**:
```sql
-- Check RLS is enforced
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND (tablename LIKE 'guardian_meta_%' OR tablename LIKE 'guardian_tenant_%');
-- Should show rowsecurity = 't' for all Z-series tables
```

- [ ] Indexes created for performance
  - [ ] Verify key indexes on tenant_id, created_at, status fields
  - [ ] Run ANALYZE on all Z-series tables

**Verification**:
```sql
-- Check key indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND (tablename LIKE 'guardian_meta_%' OR tablename LIKE 'guardian_tenant_%')
ORDER BY indexname;
```

### 1.2 Code Readiness

- [ ] All Z-series services compiled without errors
  ```bash
  npm run typecheck
  # Should output: ✅ No errors
  ```

- [ ] All Z-series tests passing
  ```bash
  npm run test -- z01_ z02_ z03_ z04_ z05_ z06_ z07_ z08_ z09_ z10_ z11_ z12_ z13_ z14_ z15_
  # Should show 235+ tests passing
  ```

- [ ] No TypeScript errors in Z-series code
  ```bash
  npx tsc --noEmit src/lib/guardian/meta/**/*.ts src/app/api/guardian/meta/**/*.ts src/app/guardian/admin/**/*.tsx
  # Should exit with code 0
  ```

- [ ] No ESLint issues
  ```bash
  npm run lint -- src/lib/guardian/meta src/app/api/guardian/meta src/app/guardian/admin
  # Should output: ✅ 0 errors
  ```

### 1.3 Environment Readiness

- [ ] ANTHROPIC_API_KEY set and valid
  - [ ] Test: Can create a message with Claude API

- [ ] SUPABASE_SERVICE_ROLE_KEY configured
  - [ ] Test: Can read from Supabase as admin

- [ ] NEXTAUTH_SECRET configured for session security

---

## Phase 2: Deployment Steps (45 min)

### 2.1 Database Deployment

- [ ] Back up production database
  ```bash
  # Use Supabase Dashboard → Backups
  # Create backup snapshot before applying migrations
  ```

- [ ] Apply all migrations in order
  - [ ] Open Supabase Dashboard → SQL Editor
  - [ ] Copy migration 601_*.sql content
  - [ ] Paste and execute
  - [ ] Wait for completion ✅
  - [ ] Repeat for migrations 602-610

- [ ] Verify schema integrity post-migration
  ```bash
  npm run check:db
  # Should verify all Z-series tables + RLS
  ```

### 2.2 Service Deployment

- [ ] Deploy Z-series services
  - [ ] `src/lib/guardian/meta/readinessComputationService.ts`
  - [ ] `src/lib/guardian/meta/upliftPlanService.ts`
  - [ ] `src/lib/guardian/meta/exportBundleService.ts`
  - [ ] `src/lib/guardian/meta/metaTaskRunner.ts`
  - [ ] `src/lib/guardian/meta/zSeriesValidationGate.ts`
  - [ ] All other Z01-Z15 services

**Verification**:
```bash
# Build services
npm run build
# Should complete without errors
```

### 2.3 API Route Deployment

- [ ] Deploy all Z-series API routes
  - [ ] 3 routes per phase × 15 phases = 45+ routes
  - [ ] All routes under `/app/api/guardian/meta/**`

**Verification**:
```bash
# Test API routes
curl http://localhost:3008/api/guardian/meta/readiness/overview?workspaceId=test-123
# Should return valid JSON (may be 401 without auth)
```

### 2.4 UI Deployment

- [ ] Deploy all admin consoles
  - [ ] `/guardian/admin/readiness`
  - [ ] `/guardian/admin/uplift`
  - [ ] `/guardian/admin/editions`
  - [ ] `/guardian/admin/executive`
  - [ ] `/guardian/admin/adoption`
  - [ ] `/guardian/admin/lifecycle`
  - [ ] `/guardian/admin/integrations`
  - [ ] `/guardian/admin/goals`
  - [ ] `/guardian/admin/knowledge-hub`
  - [ ] `/guardian/admin/meta-governance` (updated)
  - [ ] `/guardian/admin/exports`
  - [ ] `/guardian/admin/improvement`
  - [ ] `/guardian/admin/automation`
  - [ ] `/guardian/admin/status`
  - [ ] `/guardian/admin/backups`

**Verification**:
```bash
# Start dev server
npm run dev
# Navigate to http://localhost:3008/guardian/admin/readiness?workspaceId=test-123
# Should load without errors
```

### 2.5 Configuration Initialization

- [ ] Initialize Z10 governance defaults for first tenant
  ```bash
  # Run initialization script or POST to /api/guardian/meta/governance/prefs
  # Create default feature flags
  # Create default governance policies
  ```

- [ ] Initialize Z13 automation defaults (optional)
  ```bash
  # Create default schedules for readiness eval
  # Can be configured per-tenant via UI
  ```

---

## Phase 3: Testing & Validation (30 min)

### 3.1 Full Test Suite

- [ ] Run complete Z-series test suite
  ```bash
  npm run test
  # Should pass 235+ tests with 0 failures
  ```

- [ ] Check test coverage
  ```bash
  npm run test -- --coverage
  # Should show high coverage (80%+) for all Z-series code
  ```

### 3.2 Z-Series Validation Gate

- [ ] Run validation gate on test tenant
  ```bash
  # Navigate to /guardian/admin/meta-governance
  # Click "Run Validation"
  # Should pass all checks or show remediations only
  ```

**Expected Output**:
- ✅ All tables exist
- ✅ RLS enabled
- ✅ Governance defaults configured
- ✅ Indexes present
- ✅ Audit logging functional

### 3.3 Multi-Tenant Isolation Tests

- [ ] Verify RLS prevents cross-tenant access
  ```typescript
  // Create two test workspaces A and B
  // As workspace A, create readiness score
  // As workspace B, query readiness scores
  // Should return empty (no cross-tenant leakage)
  ```

- [ ] Verify tenant_id filtering on all APIs
  ```bash
  # Test API with different workspaceIds
  # Each should only return data for that workspace
  ```

### 3.4 Export & Backup Testing

- [ ] Create test export bundle (Z11)
  - [ ] Navigate to `/guardian/admin/exports`
  - [ ] Create bundle with scope = [readiness, uplift]
  - [ ] Verify export completes successfully
  - [ ] Check: Export is PII-scrubbed

- [ ] Create test backup (Z15)
  - [ ] Navigate to `/guardian/admin/backups`
  - [ ] Create backup with scope = [governance, automation]
  - [ ] Verify backup completes
  - [ ] Check: Checksum calculated, items stored

- [ ] Test restore workflow (Z15)
  - [ ] Navigate to `/guardian/admin/backups`
  - [ ] Click Restore on backup
  - [ ] Verify preview shows diff
  - [ ] Type "RESTORE" + confirm
  - [ ] Verify restore completes (do NOT actually restore prod data)

### 3.5 Automation Testing (Z13)

- [ ] Create test schedule
  - [ ] Task type: kpi_eval
  - [ ] Cadence: hourly
  - [ ] Run at: :00 minutes

- [ ] Test scheduler execution
  - [ ] Manually trigger: `POST /api/guardian/meta/automation/run-scheduler`
  - [ ] Verify: Task executes, logs created, next_run_at updated

- [ ] Test trigger evaluation
  - [ ] Create test trigger (readiness score < 50)
  - [ ] Manually trigger: `POST /api/guardian/meta/automation/run-triggers`
  - [ ] Verify: Trigger evaluated, cooldown applied

---

## Phase 4: Production Hardening (15 min)

### 4.1 Security

- [ ] All API routes validate `workspaceId`
  ```typescript
  // Verify: Every API route validates workspaceId before querying
  // Verify: Admin-only routes check admin role
  ```

- [ ] Error boundary wraps all routes
  ```typescript
  // Verify: All routes use withErrorBoundary
  // Verify: No stack traces exposed in errors
  ```

- [ ] No PII in logs or responses
  ```bash
  # Search codebase for hardcoded emails, IPs, secrets
  grep -r "@example.com\|192\.168\|api_key" src/lib/guardian/meta/
  # Should return 0 results (only in comments/docs)
  ```

### 4.2 Performance

- [ ] No N+1 queries in Z-series services
  ```typescript
  // Review services: readinessComputationService, exportBundleService, etc.
  // Verify: Use Promise.all() for parallel queries
  ```

- [ ] Indexes optimize key query paths
  ```sql
  -- Run EXPLAIN on slow queries
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT * FROM guardian_tenant_readiness_scores
  WHERE tenant_id = 'xxx' ORDER BY created_at DESC LIMIT 10;
  -- Should use index scan, not seq scan
  ```

- [ ] RLS policies are efficient
  ```sql
  -- Verify RLS policies use indexed columns
  SELECT * FROM pg_policies WHERE schemaname = 'public'
  AND (tablename LIKE 'guardian_meta_%' OR tablename LIKE 'guardian_tenant_%');
  -- Should show: USING (tenant_id = get_current_workspace_id())
  ```

### 4.3 Observability

- [ ] Audit logging configured (Z10)
  - [ ] Verify: All Z-series mutations logged to `guardian_meta_audit_log`
  - [ ] Verify: Logs include actor, source, action, summary, timestamp

- [ ] Error tracking configured
  - [ ] Verify: Sentry/error tracking sends Z-series errors
  - [ ] Verify: Errors tagged with phase (Z01, Z02, etc.)

---

## Phase 5: Production Rollout (30 min)

### 5.1 Staged Rollout

- [ ] Deploy to staging environment first
  - [ ] Run full validation gate on staging
  - [ ] Smoke test all 15 consoles on staging
  - [ ] Verify data isolation on staging

- [ ] Run canary: Enable for 10% of production tenants
  - [ ] Set feature flags for canary cohort
  - [ ] Monitor: Errors, latency, RLS violations
  - [ ] Wait 24 hours with 0 critical issues

- [ ] Full production rollout
  - [ ] Enable all feature flags for all tenants
  - [ ] Monitor: Error rates, latency, audit log volume
  - [ ] Verify: All 15 consoles accessible

### 5.2 Post-Deployment Verification

- [ ] Verify all consoles load in production
  ```bash
  # Test 3-4 random admin consoles on prod
  # Should load within 2 seconds
  ```

- [ ] Verify no PII in exports/backups
  ```bash
  # Create export bundle on prod
  # Download JSON
  # Grep for emails, IPs, secrets
  # Should find 0
  ```

- [ ] Verify RLS enforced on prod
  ```bash
  # As two different users, query Z-series data
  # Should only see own tenant data
  ```

- [ ] Check audit log for deployment
  ```bash
  # Should see initialization events for governance setup
  # Should see export/backup events during testing
  ```

### 5.3 Monitoring Setup

- [ ] Configure dashboards
  - [ ] Z-series API latency
  - [ ] Z-series error rates
  - [ ] Audit log volume (should be < 1000/hour at baseline)
  - [ ] RLS policy hit count

- [ ] Configure alerts
  - [ ] Error rate > 1% → alert
  - [ ] API latency p99 > 2s → alert
  - [ ] Audit log errors → alert
  - [ ] RLS policy failures → alert

---

## Phase 6: Rollback Plan (If Needed)

### 6.1 Quick Rollback

If critical issues discovered:

- [ ] Disable all Z-series feature flags
  ```sql
  UPDATE guardian_meta_feature_flags
  SET enable_z_ai_hints = false, enable_z_exports = false,
      enable_z_automation = false, enable_z_backups = false;
  ```

- [ ] Revert to previous Next.js deployment
  ```bash
  # If using Vercel: Click "Rollback" on previous deployment
  # If self-hosted: Revert code, restart app
  ```

- [ ] Restore database from pre-migration backup (if needed)
  ```bash
  # Use Supabase Dashboard → Backups → Restore
  # Should take 5-10 minutes
  ```

### 6.2 Post-Rollback Recovery

- [ ] Investigate root cause
  - [ ] Check error logs
  - [ ] Run validation gate
  - [ ] Check for data issues

- [ ] Document issue
  - [ ] Create incident report
  - [ ] Schedule post-mortem

- [ ] Plan re-deployment
  - [ ] Fix identified issues
  - [ ] Run full test suite again
  - [ ] Re-deploy with fixes

---

## Success Criteria

✅ **All of the following must be true**:

- [ ] All 235+ tests passing
- [ ] TypeScript 0 errors
- [ ] Validation gate: PASS (or warnings only)
- [ ] All 15 admin consoles load successfully
- [ ] Multi-tenant isolation verified
- [ ] Exports PII-scrubbed
- [ ] Backups encrypted + checksummed
- [ ] Automation tasks executing
- [ ] Audit log recording all operations
- [ ] No critical security issues
- [ ] Error rate < 0.5%
- [ ] API latency p99 < 2 seconds

---

## Post-Deployment Checklist (Day 1)

- [ ] Monitor error rates (should be < 0.1%)
- [ ] Monitor latency (should be < 500ms p50)
- [ ] Verify audit log entries accumulating
- [ ] Spot-check 3-4 tenant exports (PII-free)
- [ ] Spot-check 3-4 tenant backups (valid)
- [ ] Verify Z13 automation ran on schedule
- [ ] Check Z10 governance policies applied correctly

---

## Rollout Communication

**Announce** (Internal team):
> Guardian Z-Series (Z01-Z15) deployed to production. Tenants now have:
> - Z01-Z09: Readiness visibility + adoption planning
> - Z10: Governance controls + audit logging
> - Z11: Safe exports for customer handoffs
> - Z13: Scheduled automation for Z-series tasks
> - Z14: Role-safe status pages
> - Z15: Safe backup + restore workflows
>
> All data is multi-tenant isolated via RLS. All operations are audit-logged. Full docs at [Z_SERIES_INDEX.md](Z_SERIES_INDEX.md).

**Announce** (To customers, if applicable):
> Your platform now has Guardian Z-Series! Check your admin console for readiness assessments, improvement plans, and automation scheduling. New features are fully optional and advisory-only.

---

## References

- **Full Index**: [Z_SERIES_INDEX.md](Z_SERIES_INDEX.md)
- **Architecture**: [Z_SERIES_COMPATIBILITY_MATRIX.md](Z_SERIES_COMPATIBILITY_MATRIX.md)
- **Operations**: [Z_SERIES_OPERATOR_RUNBOOK.md](Z_SERIES_OPERATOR_RUNBOOK.md)
- **Quickstart**: [README_GUARDIAN_META_STACK.md](README_GUARDIAN_META_STACK.md)

---

**Status**: ✅ Ready for Production
**Last Updated**: 2025-12-12
**Estimated Deployment Time**: 2 hours
