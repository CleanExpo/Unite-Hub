# P1-T3: Database Migration Consistency Report

**Date**: 2025-11-28
**Status**: COMPLETE

---

## Executive Summary

**Total Migration Files**: 369
**Unique Prefixes**: ~290
**Duplicate Prefixes**: 79 files share prefixes with other files
**Idempotent Migrations**: 463 patterns detected (good coverage)

---

## Critical Issues

### 1. Duplicate Migration Numbers (HIGH SEVERITY)

| Prefix | Count | Impact |
|--------|-------|--------|
| 020_* | 14 | RLS policy iterations - should consolidate |
| 038_* | 12 | Core SaaS tables - chaos of variants |
| 039_* | 4 | Intelligence system variants |
| 100_* | 3 | Multi-agent/automation conflicts |
| 153_* | 3 | Client sites / narrative conflicts |
| 152_* | 3 | Autonomy / broadcast conflicts |
| 151_* | 3 | Founder / search console conflicts |
| 150_* | 3 | Tenant expansion conflicts |
| 148_* | 3 | Founder ops conflicts |
| 040_* | 3 | AI score / projects conflicts |
| 030_* | 3 | Storage bucket variants |
| 028_* | 3 | Mindmap variants |
| 019_* | 3 | Organization ID fix variants |
| 014_* | 3 | Username constraint variants |
| 008_* | 3 | Drip campaigns variants |

**Total duplicate groups**: 15 with 3+ files
**Additional**: 30+ prefixes with exactly 2 files

### 2. Sequence Gaps

| Gap Range | Missing Numbers |
|-----------|-----------------|
| 015-019 | 016, 017, 018 |
| 074-076 | 075 |
| 076-079 | 077, 078 |
| 205-220 | 206-219 (14 missing) |
| 256-260 | 257-259 |
| 260-270 | 261-269 |
| 270-273 | (minor gap) |
| 281-282 | (no gap) |
| 282-290 | 283-289 (7 missing) |

---

## Variant File Patterns

### FIXED/CLEAN/FINAL Variants
```
028_mindmap_feature.sql
028_mindmap_feature_FIXED.sql
028_mindmap_feature_rollback.sql

038_core_saas_tables.sql
038_core_saas_tables_FIXED.sql
038_CLEAN.sql
038_DROP_AND_RECREATE.sql
038_FINAL_core_tables_no_rls.sql
038_minimal_test.sql
038_NO_WORKSPACE_REFS.sql
038_ONE_AT_A_TIME.sql
038_step1_projects.sql
038_TWO_STEP.sql
038_ultra_minimal.sql
038_WORKING.sql

020_implement_real_rls_policies.sql
020_implement_real_rls_policies_CLEAN.sql
020_implement_real_rls_policies_CORE_ONLY.sql
020_implement_real_rls_policies_FINAL.sql
020_implement_real_rls_policies_SIMPLE.sql
020_implement_real_rls_policies_v2.sql
020_implement_real_rls_policies_v3.sql
020_implement_real_rls_policies_v4.sql
020_implement_real_rls_policies_v5.sql
020_implement_real_rls_policies_v6.sql
020_implement_real_rls_policies_v7.sql
020_ABSOLUTE_FINAL.sql
020_CORE_TABLES_ONLY.sql
020_test_rls_policies.sql
```

### Version Suffixes (_v2, _v3)
- 014_fix_username_constraint_v2.sql
- 019_fix_organization_id_type_v2.sql
- 019_fix_organization_id_type_v3.sql
- 039_autonomous_intelligence_system_v2.sql
- 039_autonomous_intelligence_system_v3.sql
- 046_ai_usage_tracking_CLEANED.sql

---

## Idempotency Analysis

**Good Patterns Found** (463 occurrences):
- `CREATE TABLE IF NOT EXISTS` - Standard
- `DO $$ ... IF NOT EXISTS ... END $$;` - PL/pgSQL conditional
- `DROP POLICY IF EXISTS` - RLS cleanup

**Files with good idempotency**: ~150 migrations
**Files needing review**: ~219 migrations (may not be idempotent)

---

## Migration Categories

### Core Schema (001-050)
- Initial tables, auth, organizations, contacts, campaigns
- Heavy variant pollution in 014-040 range
- **Status**: Needs cleanup

### Feature Tables (051-100)
- Xero, SEO, anomaly detection, strategy systems
- Mixed duplicate issues
- **Status**: Moderate cleanup needed

### Advanced Systems (101-200)
- Autonomous engines, billing, voice, compliance
- Heavy duplication in 140-160 range
- **Status**: Significant cleanup needed

### AGI Layer (200-256)
- Monitoring, reasoning, orchestration, AGI governance
- Gap 205-220 is intentional (reserved)
- **Status**: Clean

### Synthex/Phase 6 (260-290)
- Managed services, alerts, agent tables, phase 6 schemas
- Relatively clean
- **Status**: Good

---

## Recommendations

### Immediate (P7 Cleanup)
1. Archive all variant files (_v2, _FIXED, _CLEAN, etc.) to `_archived_migrations/`
2. Keep only the final working version of each migration
3. Document which migration was actually applied to production

### Short-term (Post-Launch)
1. Consolidate 020_* into single verified RLS migration
2. Consolidate 038_* into single core tables migration
3. Create migration manifest documenting applied vs archived

### Long-term
1. Implement proper migration versioning (Supabase CLI)
2. Add migration tests to CI/CD
3. Create rollback scripts for critical migrations

---

## Files to Archive (79 candidates)

```
_archived_migrations/
├── 020_variants/           # 13 files
├── 038_variants/           # 11 files
├── 039_variants/           # 3 files
├── 028_variants/           # 2 files
├── 019_variants/           # 2 files
├── 014_variants/           # 2 files
├── 008_variants/           # 2 files
└── misc_variants/          # ~44 files
```

---

## Applied Migration Verification

**Note**: Cannot verify which migrations were actually applied without database access. Recommend running:

```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

---

**Generated**: 2025-11-28
**Audit Task**: P1-T3
