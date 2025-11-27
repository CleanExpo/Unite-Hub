# Complete Migration Reference - All Migrations (270-274)

**Updated**: 2025-11-27
**Status**: All migrations are valid and correctly implemented
**Next Step**: Apply in numerical order for Supabase deployment

---

## Quick Reference Table

| Migration | Purpose | Tables | Dependencies | Status |
|-----------|---------|--------|--------------|--------|
| **270** | Managed service core schema | 4+ | None | ✅ Prerequisites |
| **242** | CONVEX custom frameworks | 1+ | None | ✅ Independent |
| **272** | Managed service strategies | 4 | 270 | ✅ After 270 |
| **273** | Framework alerts & notifications | 3 | 242 | ✅ After 242 |
| **274** | Alert analytics & predictions | 4 | 242, 273 | ✅ After 242, 273 |

---

## Migration 270: Managed Service Schema

**File**: `supabase/migrations/270_managed_service_schema.sql`
**Purpose**: Foundation for managed service functionality
**Status**: ✅ Valid - must be applied first

**Tables Created**:
- `managed_service_projects` (referenced by migration 272)
- Other managed service core tables

**Dependencies**: None

**When to apply**: Before migrations 272

**Size**: ~17 KB
**Complexity**: Medium (4+ tables with relationships)

---

## Migration 242: CONVEX Custom Frameworks

**File**: `supabase/migrations/242_convex_custom_frameworks.sql`
**Purpose**: Framework definition and configuration storage
**Status**: ✅ Valid - can be applied immediately

**Tables Created**:
- `convex_custom_frameworks` (referenced by migrations 273, 274)

**Dependencies**: None

**When to apply**: Before migrations 273, 274

**Size**: Standard
**Complexity**: Low (core framework storage)

---

## Migration 272: Managed Service Strategies

**File**: `supabase/migrations/272_managed_service_strategies.sql`
**Purpose**: Strategic analysis and planning for managed services
**Status**: ✅ Valid - depends on migration 270

**Tables Created**:
- `managed_service_strategies` (FK to `managed_service_projects`)
- `strategy_execution_phases`
- `strategy_mutations`
- `strategy_sub_agent_executions`

**Dependencies**:
- ✅ `managed_service_projects` from migration 270

**Key Feature**: Conditional foreign key constraint
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'managed_service_projects') THEN
    ALTER TABLE managed_service_strategies
    ADD CONSTRAINT fk_managed_service_strategies_project_id
    FOREIGN KEY (project_id) REFERENCES managed_service_projects(id)
    ON DELETE CASCADE;
  END IF;
END $$;
```

**When to apply**: After migration 270

**Size**: ~7.1 KB
**Complexity**: Medium (4 tables, RLS policies, audit triggers)

---

## Migration 273: Framework Alerts & Notifications

**File**: `supabase/migrations/273_convex_framework_alerts.sql`
**Purpose**: Real-time alert rules, triggers, and notification delivery
**Status**: ✅ Valid - depends on migration 242

**Tables Created**:
- `convex_framework_alert_rules` (FK to `convex_custom_frameworks`)
- `convex_framework_alert_triggers`
- `convex_framework_alert_notifications`

**Dependencies**:
- ✅ `convex_custom_frameworks` from migration 242
- ✅ `workspaces` (earlier migration)
- ✅ `user_organizations` (earlier migration)

**Features**:
- 4 alert types: threshold, anomaly, performance, milestone
- 3 notification channels: email, in-app, slack
- 13 RLS policies for workspace isolation
- Full audit logging

**When to apply**: After migration 242

**Size**: ~12.3 KB
**Complexity**: High (3 tables, 13 RLS policies, audit triggers)

---

## Migration 274: Alert Analytics & Predictions

**File**: `supabase/migrations/274_alert_analytics_tables.sql`
**Purpose**: Analytics aggregation, pattern detection, and predictive intelligence
**Status**: ✅ Valid - depends on migrations 242 and 273

**Tables Created**:
- `convex_alert_analytics` (FK to `convex_custom_frameworks`)
- `convex_alert_patterns` (FK to framework)
- `convex_alert_predictions` (FK to framework)
- `convex_notification_preferences` (user-scoped)

**Dependencies**:
- ✅ `convex_custom_frameworks` from migration 242
- ✅ `convex_framework_alert_rules` from migration 273
- ✅ `workspaces` (earlier migration)
- ✅ `user_organizations` (earlier migration)

**Features**:
- Daily/weekly/monthly aggregations
- 5 pattern types: seasonal, cyclical, correlated, triggered_by, escalating
- AI prediction storage with token/cost tracking
- User preference management
- Helper functions: `get_alert_trend()`, `calculate_alert_health()`
- Full RLS and audit logging

**When to apply**: After migrations 242 and 273

**Size**: ~15.3 KB
**Complexity**: High (4 tables, helper functions, 4+ RLS policies)

---

## Application Sequence

### For Fresh Database (Recommended)

```
1. Apply all migrations up to 269 (if deploying to existing Supabase)
   OR start fresh if new deployment

2. Apply Migration 270
   - Creates managed_service_projects table
   - Foundation for migration 272

3. Apply Migration 242
   - Creates convex_custom_frameworks table
   - Required by migrations 273 and 274

4. Apply Migration 272
   - Creates strategy tables
   - Uses managed_service_projects (from 270)

5. Apply Migration 273
   - Creates alert rules and triggers
   - Uses convex_custom_frameworks (from 242)

6. Apply Migration 274
   - Creates analytics tables
   - Uses convex_custom_frameworks (from 242)
   - Uses convex_framework_alert_rules (from 273)
```

### For Existing Database

If you've already applied some migrations:

```
Check what exists:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'managed_service_projects',
  'convex_custom_frameworks',
  'managed_service_strategies',
  'convex_framework_alert_rules',
  'convex_alert_analytics'
);

Apply only missing ones in order.
```

---

## Dependency Graph

```
Migration 270              Migration 242
    ↓                          ↓
Managed Service        CONVEX Framework
Projects               (standalone)
    ↓                          ↓
Migration 272           Migrations 273 & 274
Strategy Tables         Alert Systems
    (independent)       (interdependent)
                              ↓
                        Analytics tables
                        (depend on 273)
```

---

## Verification Scripts

### Check All Prerequisites Exist

```sql
-- Run this after applying all migrations
SELECT
  'Migration 270: managed_service_projects' as migration,
  EXISTS (SELECT 1 FROM information_schema.tables
          WHERE table_name = 'managed_service_projects') as applied
UNION ALL
SELECT 'Migration 242: convex_custom_frameworks',
  EXISTS (SELECT 1 FROM information_schema.tables
          WHERE table_name = 'convex_custom_frameworks')
UNION ALL
SELECT 'Migration 272: managed_service_strategies',
  EXISTS (SELECT 1 FROM information_schema.tables
          WHERE table_name = 'managed_service_strategies')
UNION ALL
SELECT 'Migration 273: convex_framework_alert_rules',
  EXISTS (SELECT 1 FROM information_schema.tables
          WHERE table_name = 'convex_framework_alert_rules')
UNION ALL
SELECT 'Migration 274: convex_alert_analytics',
  EXISTS (SELECT 1 FROM information_schema.tables
          WHERE table_name = 'convex_alert_analytics');
```

**Expected Output**: All should be `true`

### Check Foreign Key Constraints

```sql
-- Verify all constraints are in place
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND constraint_type = 'FOREIGN KEY'
AND table_name LIKE 'managed_service_%'
OR table_name LIKE 'convex_%'
ORDER BY table_name;
```

### Check RLS Policies

```sql
-- Verify all policies are enabled
SELECT tablename,
       (SELECT array_agg(policyname) FROM pg_policies
        WHERE tablename = t.tablename) as policies
FROM (SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'managed_service_%'
      OR tablename LIKE 'convex_%') t
ORDER BY tablename;
```

---

## Common Issues & Solutions

### Issue: "relation 'managed_service_projects' does not exist"

**Cause**: Migration 270 hasn't been applied

**Solution**:
```sql
-- 1. Check if migration 270 exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'managed_service_projects') as exists;

-- 2. If false, run migration 270 first
-- 3. Then run migration 272
```

### Issue: "relation 'convex_custom_frameworks' does not exist"

**Cause**: Migration 242 hasn't been applied

**Solution**:
```sql
-- 1. Check if migration 242 exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'convex_custom_frameworks') as exists;

-- 2. If false, run migration 242 first
-- 3. Then run migrations 273 and 274
```

### Issue: "relation 'convex_framework_alert_rules' does not exist" (on migration 274)

**Cause**: Migration 273 hasn't been applied

**Solution**:
```sql
-- 1. Run migration 273 first
-- 2. Then run migration 274
```

### Issue: "duplicate_object" errors on RLS policies

**Cause**: Migration has already been applied

**Solution**: This is safe - migrations use `IF NOT EXISTS` and exception handlers
```sql
-- Check if migration was applied
SELECT EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'convex_alert_analytics') as migration_applied;

-- If true, this migration has already been run - skip it
```

---

## Supabase Deployment Checklist

Before deploying to production:

- [ ] All migrations files are in `supabase/migrations/` directory
- [ ] Migrations are numbered sequentially (270, 272, 273, 274)
- [ ] No migration files have been deleted or reordered
- [ ] Run verification script above to check all tables exist
- [ ] Verify all RLS policies are in place
- [ ] Test API endpoints with proper workspace filtering
- [ ] Confirm Bearer token authentication works
- [ ] Verify audit logging is functional

---

## Related Documentation

- [MIGRATION_DEPENDENCY_GUIDE.md](MIGRATION_DEPENDENCY_GUIDE.md) - Detailed dependency analysis
- [PHASE5_WEEK3_PLAN.md](PHASE5_WEEK3_PLAN.md) - Week 3 implementation plan
- [PHASE5_WEEK3_COMPLETION_SUMMARY.md](PHASE5_WEEK3_COMPLETION_SUMMARY.md) - Deliverables summary
- [PHASE5_WEEKS1-3_SUMMARY.md](PHASE5_WEEKS1-3_SUMMARY.md) - Complete Phase 5 summary

---

## Summary

All 5 migrations (270, 242, 272, 273, 274) are **correctly implemented and ready for deployment**:

✅ Migration 270: Foundation for managed services
✅ Migration 242: Framework definitions
✅ Migration 272: Strategy analysis (depends on 270)
✅ Migration 273: Alert rules (depends on 242)
✅ Migration 274: Analytics & predictions (depends on 242, 273)

**Apply in order**: 270 → 242 → 272 → 273 → 274

All have proper error handling, conditional constraints, and full RLS enforcement. No code changes needed.

---

**Last Updated**: 2025-11-27
**Migration Status**: All valid and tested ✅
**Ready for Deployment**: Yes ✅

