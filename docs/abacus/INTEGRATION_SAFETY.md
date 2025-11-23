# Abacus.ai Deep Agent Integration Safety Layer

**Generated**: 2025-11-23
**Status**: Active
**Mode**: Safe Innovation Pipeline

---

## Overview

This document defines the safety protocols for integrating Abacus.ai Deep Agent with Unite-Hub. Abacus operates as an **innovation engine** that proposes changes via pull requests, while Claude serves as the **primary engine** responsible for review, validation, and merging.

---

## Permission Matrix

### Abacus Permissions

| Action | Allowed | Notes |
|--------|---------|-------|
| Read repo | YES | Full read access to all files |
| Analyze repo | YES | Generate maps and reports |
| Generate branches | YES | Create feature branches only |
| Generate PRs | YES | All changes via PR, never direct |
| Build reference apps | YES | Proof-of-concept implementations |
| Modify main directly | **NO** | All changes through PRs |
| Overwrite architecture | **NO** | Must preserve existing patterns |

### Claude Responsibilities

| Action | Required | Notes |
|--------|----------|-------|
| Review Abacus PRs | YES | Code review before merge |
| Validate changes | YES | Test coverage, RLS, auth |
| Apply migrations | YES | Only Claude runs migrations |
| Maintain auth/RLS | YES | Protect workspace isolation |
| Protect routing | YES | No breaking route changes |
| Update docs | YES | Document all merged changes |
| Run E2E tests | YES | Tests must pass before merge |

---

## Safety Requirements

### Non-Negotiable Rules

1. **No breaking refactors** - Existing functionality must not break
2. **No deleting core files** - Critical files are protected
3. **No auth removal** - Authentication must remain on all routes
4. **No workspace isolation changes** - Without explicit approval
5. **All changes version-controlled** - Every change in git history
6. **Tests required for merge** - No untested code merged
7. **Docs required for merge** - No undocumented features merged

### Protected Files

These files cannot be modified by Abacus without Claude review:

```
src/lib/supabase.ts
src/lib/auth/middleware.ts
src/contexts/AuthContext.tsx
src/app/api/auth/**
supabase/migrations/**
.env*
```

### Protected Patterns

These patterns must be preserved:

1. **Workspace filtering** - All queries must include workspace_id
2. **Auth headers** - Bearer token pattern on API calls
3. **RLS policies** - Row Level Security on all tables
4. **Route structure** - App Router organization

---

## Integration Workflow

### Step 1: Abacus Scans Repository

Abacus generates four maps:

1. **routing-map.json** - All routes and their types
2. **api-map.json** - API endpoints with methods
3. **env-map.json** - Environment variables used
4. **auth-map.json** - Auth patterns and protected routes

### Step 2: Abacus Creates Feature Branch

```bash
# Branch naming convention
abacus/feature-{description}
abacus/upgrade-{component}
abacus/reference-{app-name}
```

### Step 3: Abacus Opens Pull Request

PR must include:
- Description of changes
- Impact analysis
- Test coverage
- Documentation updates

### Step 4: Claude Reviews PR

Claude checks:
- [ ] No breaking changes
- [ ] Auth preserved
- [ ] Workspace isolation maintained
- [ ] Tests pass
- [ ] Docs updated
- [ ] RLS policies intact

### Step 5: Claude Merges (if approved)

```bash
git checkout main
git merge --no-ff abacus/feature-{name}
git push origin main
```

### Step 6: Claude Runs Migrations

Only Claude executes database migrations:
```bash
# In Supabase SQL Editor
# Copy and run migration SQL
```

---

## Abacus Innovation Goals

### Goal 1: Repository Mapping

Generate comprehensive maps of:
- All 104+ API routes
- All dashboard/client/staff routes
- Environment variable usage
- Authentication patterns

### Goal 2: Non-Destructive Upgrades

Propose improvements via PRs:
- Performance optimizations
- Code quality improvements
- Pattern standardization
- Dependency updates

### Goal 3: Reference Mini-Apps

Build proof-of-concept implementations:
- Payment flow reference
- Routing pattern examples
- Pipeline architecture demos
- Integration patterns

### Goal 4: Future Phase Proposals

Generate proposals for:
- Phase 18: Advanced Analytics
- Phase 19: Billing Integration
- Phase 20: Real-time Features
- Phase 21-25: Scaling & Optimization

---

## Branch Protection Rules

### Main Branch

```yaml
protection_rules:
  require_pull_request: true
  require_review: true
  require_status_checks: true
  require_linear_history: false
  allow_force_push: false
  allow_deletions: false
```

### Feature Branches

```yaml
naming_pattern: "abacus/*"
auto_delete_on_merge: true
require_tests: true
require_docs: true
```

---

## Review Checklist

### For Every Abacus PR

```markdown
## Claude Review Checklist

### Safety
- [ ] No core files deleted
- [ ] Auth middleware preserved
- [ ] RLS policies unchanged
- [ ] Workspace filtering maintained

### Quality
- [ ] Tests included
- [ ] Tests pass
- [ ] Docs updated
- [ ] No console errors

### Compatibility
- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Migration included (if needed)
- [ ] Environment variables documented

### Approval
- [ ] Code review complete
- [ ] Ready to merge
```

---

## Error Recovery

### If Abacus Breaks Something

1. **Immediate**: Revert the PR
   ```bash
   git revert <merge-commit>
   git push origin main
   ```

2. **Investigate**: Identify root cause

3. **Document**: Add to blocked patterns

4. **Notify**: Update safety rules

### Blocked Patterns Registry

Track patterns that Abacus should never attempt:

```json
{
  "blocked_patterns": [
    "direct_main_push",
    "auth_removal",
    "rls_bypass",
    "workspace_filter_removal"
  ],
  "blocked_files": [
    "src/lib/supabase.ts",
    "src/contexts/AuthContext.tsx"
  ]
}
```

---

## Communication Protocol

### Abacus → Claude

Via PR descriptions and comments.

### Claude → Abacus

Via review comments and merge decisions.

### Documentation

All decisions documented in:
- PR comments
- docs/abacus/decisions.md
- CHANGELOG.md

---

## Success Metrics

### Safety Metrics

- Zero production incidents from Abacus changes
- 100% test coverage on merged PRs
- 100% doc coverage on merged PRs

### Innovation Metrics

- Number of improvements proposed
- Number of improvements merged
- Code quality score improvement
- Performance improvement percentage

---

## Next Steps

1. Generate initial repository maps
2. Create first reference mini-app (payments)
3. Propose Phase 18 enhancements
4. Establish PR review cadence

---

## Appendix: Map Schemas

### routing-map.json

```json
{
  "routes": [
    {
      "path": "/dashboard/overview",
      "type": "page",
      "auth_required": true,
      "layout": "dashboard"
    }
  ]
}
```

### api-map.json

```json
{
  "endpoints": [
    {
      "path": "/api/contacts",
      "methods": ["GET", "POST"],
      "auth_required": true,
      "workspace_filtered": true
    }
  ]
}
```

### auth-map.json

```json
{
  "patterns": {
    "bearer_token": true,
    "cookie_session": true,
    "rls_enabled": true
  },
  "protected_routes": ["/dashboard/*", "/api/*"]
}
```

### env-map.json

```json
{
  "variables": {
    "NEXT_PUBLIC_SUPABASE_URL": {
      "required": true,
      "client_exposed": true
    },
    "ANTHROPIC_API_KEY": {
      "required": true,
      "client_exposed": false
    }
  }
}
```
