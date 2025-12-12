# Guardian v1.0 FINAL — Freeze Policy

**Effective**: 2025-12-12
**Version**: 1.0.0
**Status**: LOCKED (v2.0+ only for breaking changes)

---

## Overview

Guardian v1.0 has reached **FINAL** status. This document establishes the freeze policy that governs what changes are allowed post-release.

**Core Principle**: Guardian v1.0 runtime and core schemas are **frozen**. Additive, non-breaking extensions and critical patches are **allowed**. Breaking changes require v2.0.

---

## Frozen Surfaces (Immutable)

Once v1.0 FINAL ships, the following **CANNOT be modified** except for security/critical bugfixes:

### 1. **Core Guardian Tables (G-Series)**
- All tables in `guardian_*` prefix (except Z-series governance)
- Schemas: `guardian_rules`, `guardian_generated_*`, `guardian_incident_*`, `guardian_response_*`, `guardian_trace_*`
- RLS policies on these tables
- Column definitions and constraints

**Allowed**: Non-breaking schema additions (new nullable columns), new RLS policies (additive only), bugfix constraints.

### 2. **H-Series Schemas & Services (Intelligence)**
- `guardian_h_series_*` tables
- `src/lib/guardian/ai/*` service layer
- H01-H06 service interfaces (stability guarantees)

**Allowed**: New H-series phases (H07+), bugfixes, performance improvements that don't change API signatures.

### 3. **I-Series Simulation Schemas & Services**
- `guardian_remediation_*` tables (I04)
- `guardian_*_simulation_*` tables for future I-phases
- `src/lib/guardian/simulation/*` service layer
- Simulation API signatures

**Allowed**: New I-series phases (I05+), internal optimizations, additive simulation features.

### 4. **Z-Series Governance Logic**
- `guardian_z_*` tables and policies
- Core governance rule evaluation
- Policy application logic in `src/lib/guardian/governance/*`

**Allowed**: Adding new policy types (additive), expanding coverage, bugfixes.

### 5. **Core API Routes**
- `src/app/api/guardian/*` (all Guardian endpoints)
- Request/response schemas
- Authorization checks

**Allowed**: Adding new endpoints, query parameter expansions, response field additions (backward compatible), security improvements.

### 6. **Admin UI/UX**
- `src/app/guardian/admin/*` pages
- Dashboard layouts and critical workflows

**Allowed**: UX improvements, new tabs/sections, component updates, styling.

---

## Allowed Changes (Post-v1.0)

The following are **explicitly allowed** without version bump:

### 1. **Additive Plugin Architecture**
```
src/lib/guardian/plugins/*/
  - New plugin systems under plugins/ directory
  - No modifications to core Guardian services
  - Plugins use public APIs only
  - Migrations: supabase/migrations/guardian_plugins_*.sql
```

### 2. **Non-Breaking Schema Extensions**
```sql
-- ALLOWED: Add new nullable columns
ALTER TABLE guardian_rules ADD COLUMN IF NOT EXISTS new_field TEXT;

-- ALLOWED: Add new indices
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- ALLOWED: Add new enum values (if not breaking downstream)
ALTER TYPE rule_status ADD VALUE IF NOT EXISTS 'new_status';

-- NOT ALLOWED: Rename columns
-- NOT ALLOWED: Change column types
-- NOT ALLOWED: Drop columns
-- NOT ALLOWED: Change RLS logic (breaking)
```

### 3. **Documentation & Tests**
- All docs additions/improvements
- New test coverage
- Refinement of existing docs
- Examples and guides

### 4. **Critical Bugfixes & Security Patches**
- Production incident fixes (with ticket reference)
- Security vulnerability fixes (with CVE/CWE reference)
- Data integrity repairs
- Performance critical fixes

**Requirement**: Must include:
- Clear justification ticket ID
- Regression tests
- Changelog entry

### 5. **Internal Performance Improvements**
- Query optimizations
- Caching layer additions
- Index creation
- Service-level optimizations

**Requirement**: No API changes, no behavior changes.

---

## Breaking Changes (v2.0+ Only)

The following require a **major version bump** to v2.0:

- Removing/renaming Guardian tables
- Changing column types or constraints
- Altering core RLS policies (breaking tenant isolation)
- Removing API endpoints
- Changing request/response schemas (non-backward-compatible)
- Core governance logic overhauls
- Database migration reversals

---

## Override Mechanism (Documented, Auditable)

**ONLY for emergency patches with explicit justification**.

### Process

1. **Identify the need**
   - Production incident affecting customers
   - Security vulnerability
   - Data integrity issue
   - Must have ticket ID (e.g., INCIDENT-123, SECURITY-456)

2. **Request override**
   ```bash
   # Option A: Environment variable + commit message
   export GUARDIAN_FREEZE_OVERRIDE=1
   git commit -m "fix: Emergency patch for INCIDENT-123

   GUARDIAN_FREEZE_OVERRIDE: INCIDENT-123 | Urgent fix for data loss in correlation engine"

   # Option B: Freeze override file (for CI)
   # Create docs/guardian-freeze-override.txt:
   echo "INCIDENT-123 | Critical RLS policy bugfix preventing query errors" > docs/guardian-freeze-override.txt
   ```

3. **Run gates with override**
   ```bash
   GUARDIAN_FREEZE_OVERRIDE=1 npm run guardian:gates
   # Output will include WARN entries and a banner
   ```

4. **Document in changelog**
   - Entry: `PATCH: Emergency fix for INCIDENT-123`
   - Impact: Explain what was changed and why
   - Testing: Link test coverage

5. **Post-merge review**
   - Remove `docs/guardian-freeze-override.txt` after merge
   - Ensure changelog is updated
   - Verify in CI gates report

### Audit Trail
- Override attempts logged in `docs/guardian-gates-report.json`
- Commit messages preserved (Git history)
- Changelog entry permanent

---

## Migration Governance

### Additive Migrations (Always Allowed)
```sql
-- Migration: supabase/migrations/NEW_NUMBER_description.sql
-- ✅ ALLOWED: Add new tables with tenant RLS
-- ✅ ALLOWED: Add new columns to existing tables
-- ✅ ALLOWED: Create new indices
-- ✅ ALLOWED: Add new RLS policies (if additive)
```

### Locked Migrations (Cannot Edit)
All migrations up to the last v1.0 FINAL migration are locked by SHA256 hash in `docs/guardian-migrations.lock.json`.

**Attempting to modify a locked migration will fail CI with**:
```
ERROR: Migration 614 (guardian_i04_...) has been modified!
Expected SHA256: abc123...
Got: def456...

Frozen migrations cannot be edited. For emergency fixes:
1. Create a NEW migration with the fix
2. Set GUARDIAN_FREEZE_OVERRIDE=1 and reference ticket
3. Add GUARDIAN_FREEZE_OVERRIDE: TICKET_ID to commit message
```

---

## Policy Enforcement

### What Enforces This Policy?

1. **guard-migrations.ts** — Prevents modification of locked migrations
2. **run-guardian-gates.ts** — Validates freeze policy on CI
3. **check-docs.ts** — Ensures required documentation exists
4. **Git commit hooks** (optional, configured locally) — Early warning
5. **Code review process** — Human gates for semantic changes

### Where & When It Runs?

| Tool | When | Where | Exit Code |
|------|------|-------|-----------|
| `guard-migrations.ts` | On any commit | CI + local (via npm script) | 1 = fail, 0 = pass |
| `run-guardian-gates.ts` | Pre-merge / release | CI pipeline | 1 = fail, 2 = warn, 0 = pass |
| `check-docs.ts` | On CI, release gates | CI pipeline | 1 = fail, 0 = pass |
| `generate-release-notes.ts` | Release preparation | Manual run | 0 = always |

---

## Compliance Checklist

Before merging any changes to Guardian:

- [ ] No locked migrations modified
- [ ] All docs completeness checks pass
- [ ] API signatures unchanged (or backward compatible)
- [ ] RLS policies not weakened
- [ ] Tests pass (unit + integration)
- [ ] No new Guardian table schema without RLS
- [ ] Changelog entry present (for non-trivial changes)
- [ ] If override used: ticket ID documented in commit message

---

## Timeline

| Phase | Status | Date | Actions |
|-------|--------|------|---------|
| **v1.0 RC** | Locked | 2025-12-12 | Last breaking changes merged |
| **v1.0 FINAL** | Frozen | 2025-12-12 | Freeze enforcement active |
| **v1.x (patch)** | Open | 2025-12-13+ | Bugfixes, security, additive features |
| **v2.0 (planning)** | Planned | TBD | Breaking changes, major refactors |

---

## Frequently Asked Questions

**Q: Can I add a new Guardian table?**
A: Yes, if it includes tenant RLS isolation and is non-breaking (new feature).

**Q: Can I modify an existing RLS policy?**
A: Only to strengthen security (make more restrictive). Weakening requires v2.0.

**Q: Can I change an API response schema?**
A: Only by adding new fields (backward compatible). Removing/renaming fields requires v2.0.

**Q: What if there's a critical bug in core Guardian?**
A: Use the override mechanism. Document in changelog, reference ticket.

**Q: When can I make breaking changes?**
A: v2.0 planning phase. v1.0 is locked.

**Q: How do I know if my change is allowed?**
A: Run `npm run guardian:gates` — it will tell you.

---

## Contact & Escalation

For questions about freeze policy interpretation:
1. Check `docs/GUARDIAN_FREEZE_CHECKLIST.md` for release guidance
2. Review `docs/GUARDIAN_COMPLETION_RECORD.md` for phase boundaries
3. Reference this policy document directly
4. For emergency overrides: file INCIDENT/SECURITY ticket with justification

---

**Policy Version**: 1.0
**Effective Date**: 2025-12-12
**Last Updated**: 2025-12-12
**Enforced By**: FINAL-OPS tooling
