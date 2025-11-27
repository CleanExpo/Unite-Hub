# Migration Dependency Guide

## Overview

Phase 5 Week 3 introduced 3 new migrations (272, 273, 274) with specific dependencies. This guide explains the relationships and how to apply them correctly.

---

## Migration Dependency Chain

### Migration 270: Managed Service Schema (PREREQUISITE)
**Status**: ✅ Must be applied first
**Tables Created**:
- `managed_service_projects` (referenced by migration 272)
- Other managed service core tables

**Dependencies**: None
**Must be applied before**: Migrations 271, 272

---

### Migration 272: Managed Service Strategies
**Status**: ✅ Depends on Migration 270
**Tables Created**:
- `managed_service_strategies` (foreign key to `managed_service_projects`)
- `strategy_execution_phases`
- `strategy_mutations`
- `strategy_sub_agent_executions`

**Dependencies**:
- ✅ `managed_service_projects` (created in migration 270)

**Can be applied**: After migration 270

---

### Migration 273: CONVEX Framework Alerts & Notifications
**Status**: ⚠️ Depends on Migration 242
**Tables Created**:
- `convex_framework_alert_rules`
- `convex_framework_alert_triggers`
- `convex_framework_alert_notifications`

**Dependencies**:
- ✅ `convex_custom_frameworks` (created in migration 242)
- ✅ `workspaces` (created earlier)
- ✅ `user_organizations` (created earlier)

**Prerequisites Verification**:
```sql
-- Run this in Supabase SQL Editor to verify prerequisites exist
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'convex_custom_frameworks'
) AS "convex_custom_frameworks_exists";

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'workspaces'
) AS "workspaces_exists";
```

**If you get errors**: Run migration 242 first (if not already applied)

---

### Migration 274: Alert Analytics & Predictive Intelligence
**Status**: ⚠️ Depends on Migration 242 + 273
**Tables Created**:
- `convex_alert_analytics`
- `convex_alert_patterns`
- `convex_alert_predictions`
- `convex_notification_preferences`

**Dependencies**:
- ✅ `convex_custom_frameworks` (created in migration 242)
- ✅ `workspaces` (created earlier)
- ✅ `convex_framework_alert_rules` (created in migration 273)

**Prerequisites Verification**:
```sql
-- All three of these must exist
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'convex_custom_frameworks'
) AS "convex_custom_frameworks_exists",
EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'convex_framework_alert_rules'
) AS "convex_framework_alert_rules_exists";
```

**If you get errors**:
1. Run migration 242 first (if not already applied)
2. Run migration 273 (if not already applied)
3. Then run migration 274

---

## Correct Application Order

### Option 1: Full Sequential (Recommended for Fresh Database)

#### Phase 1: Foundation

```text
1. All migrations up to 239
2. Migration 240 (convex_framework_tables)
3. Migration 241 (convex_advanced_features)
```

#### Phase 2: Managed Services

```text
4. Migration 270 (managed_service_schema) ✅ FIXED
5. Migration 271 (platform_mode_toggle)
6. Migration 272 (managed_service_strategies)
```

#### Phase 3: Custom Frameworks & Alerts

```text
7. Migration 242 (convex_custom_frameworks) ✅ FIXED
8. Migration 273 (convex_framework_alerts)
9. Migration 274 (alert_analytics_tables)
```

### Option 2: Skip if Already Applied

If you've already applied 242, 273, or 274:

```sql
-- Check which migrations exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'managed_service_strategies',
  'convex_framework_alert_rules',
  'convex_alert_analytics'
)
ORDER BY table_name;
```

Then apply only the missing ones in order.

---

## Troubleshooting

### Error: "ERROR: 42P01: relation 'convex_custom_frameworks' does not exist"

**Cause**: Migration 242 hasn't been applied yet

**Solution**:
```sql
-- Verify migration 242 tables exist
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'convex_custom_frameworks'
) AS "exists";

-- If false, run migration 242 first before 273 or 274
```

### Error: "ERROR: 42P01: relation 'convex_framework_alert_rules' does not exist" (on migration 274)

**Cause**: Migration 273 hasn't been applied yet

**Solution**:
```sql
-- Run migration 273 before migration 274
-- Then run migration 274
```

### Error: "relation already exists"

**Cause**: Migration has already been applied

**Solution**: This is safe - migrations use `IF NOT EXISTS`. Just skip this migration or verify it's already applied:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'convex_alert_analytics'
) AS "migration_274_applied";
```

---

## How Supabase Migrations Work

### Local Development

When you run `npm install`, Supabase:
1. Checks which migrations have been applied
2. Applies new migrations in numerical order
3. Stores migration state in `_supabase_migrations` table

### Supabase Dashboard

When you manually run SQL in the Supabase Editor:
1. **Each statement runs immediately** (no ordering logic)
2. Dependencies must be satisfied manually
3. This is why running 273 or 274 alone fails if 242 hasn't run

### Best Practice

**Always apply migrations in numerical order**. The Supabase UI will handle ordering automatically when you push code.

---

## Verification Script

Copy this to Supabase SQL Editor to verify all Phase 5 migrations are applied:

```sql
-- Verify Phase 5 Week 3 migrations
SELECT
  'Migration 242: CONVEX Custom Frameworks' as migration,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'convex_custom_frameworks') as applied
UNION ALL
SELECT 'Migration 272: Managed Service Strategies',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'managed_service_strategies')
UNION ALL
SELECT 'Migration 273: Framework Alerts',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'convex_framework_alert_rules')
UNION ALL
SELECT 'Migration 274: Analytics & Predictions',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'convex_alert_analytics');
```

**Expected Output**:
```
migration                                    | applied
---------------------------------------------|----------
Migration 242: CONVEX Custom Frameworks      | true
Migration 272: Managed Service Strategies    | true
Migration 273: Framework Alerts              | true
Migration 274: Analytics & Predictions       | true
```

---

## Summary

| Migration | Phase | Tables | Dependencies | Status |
|-----------|-------|--------|--------------|--------|
| 240 | Foundation | 4+ | None | ✅ Apply first |
| 241 | Foundation | 4+ | Migration 240 | ✅ After 240 |
| 270 | Managed Services | 7+ | None | ✅ Independent (FIXED) |
| 271 | Managed Services | 1+ | None | ✅ Independent |
| 272 | Managed Services | 4 | Migration 270 | ✅ After 270 |
| 242 | Custom Frameworks | 5 | Migration 240 | ✅ After 240 (FIXED - conditional FK) |
| 273 | Framework Alerts | 3 | Migration 242 | ✅ After 242 |
| 274 | Analytics | 4 | Migrations 242, 273 | ✅ After 242, 273 |

**Action Items**:
1. Ensure migrations are applied in numerical order
2. If running manually, verify dependencies first
3. Use the verification script above to confirm all tables exist
4. If you get "relation not found" errors, check the dependency table above

---

**Last Updated**: 2025-11-27
**Phase**: Phase 5 Week 3
