# RLS Migration Workflow

**MANDATORY**: Follow this 3-step process for ALL RLS work
**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15

---

## ⚠️ CRITICAL: RLS Migration Workflow (MANDATORY)

**Before ANY RLS-related work**:

### Step 1: Run Diagnostics (30 seconds, saves 2 hours)

```bash
# In Supabase SQL Editor
\i scripts/rls-diagnostics.sql
```

### Step 2: Follow 3-Step Process

See `.claude/RLS_WORKFLOW.md` for complete workflow:
- Create helper functions FIRST (migration 023)
- Test on ONE table (migration 024)
- Apply to all tables (migration 025)

### Common Error

```
Error: "operator does not exist: uuid = text"
Root Cause: Helper functions don't exist in database
Solution: Run diagnostics, create functions (023), THEN policies
```

**DO NOT skip diagnostics. DO NOT create policies before functions exist.**

## Files

- `scripts/rls-diagnostics.sql` - Pre-flight diagnostic script
- `docs/RLS_MIGRATION_POSTMORTEM.md` - Common RLS errors and prevention
- `.claude/RLS_WORKFLOW.md` - Complete workflow documentation

---

**To be migrated from**: CLAUDE.md lines 559-583
