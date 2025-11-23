# Phase 18 - Abacus Innovation Cycle

**Generated**: 2025-11-23
**Status**: Active
**Mode**: Abacus PR Integration

---

## Abacus PR Requests

### 1. routing-upgrade-proposal

**Source**: `docs/abacus/routing-map.json`

**Proposal Scope**:
- Modernize Next.js routing structure
- Apply AppShellLayout to all route groups
- Consolidate duplicate layouts
- Standardize dynamic route patterns

**Expected Changes**:
```
src/app/(dashboard)/layout.tsx    → AppShellLayout wrapper
src/app/(client)/layout.tsx       → AppShellLayout wrapper
src/app/(staff)/layout.tsx        → AppShellLayout wrapper
src/app/(marketing)/layout.tsx    → Consistent header/footer
```

**Validation Checklist**:
- [ ] No broken routes after merge
- [ ] Auth preserved on protected routes
- [ ] Workspace isolation maintained
- [ ] Tests pass

---

### 2. api-layer-refactor-proposal

**Source**: `docs/abacus/api-map.json`

**Proposal Scope**:
- Consistent service layer patterns
- Standardized error handling
- Workspace-aware API grouping
- Response format normalization

**Expected Changes**:
```typescript
// Before: Inconsistent patterns
export async function GET(req) {
  try {
    // Manual auth check
    // Different error formats
  }
}

// After: Consistent withAuth pattern
export const GET = withAuth(async (req, auth) => {
  // Standard response format
  return NextResponse.json({ success: true, data: [...] });
}, { requireWorkspace: true });
```

**Priority Endpoints** (from audit):
- `/api/contacts/*` - 6 endpoints
- `/api/campaigns/*` - 2 endpoints
- `/api/email/*` - 6 endpoints
- `/api/integrations/gmail/*` - 13 endpoints

**Validation Checklist**:
- [ ] All endpoints return consistent format
- [ ] Error codes standardized
- [ ] Auth middleware applied everywhere
- [ ] Workspace filtering verified

---

### 3. env-and-config-hardening

**Source**: `docs/abacus/env-map.json`

**Proposal Scope**:
- Environment variable validation
- Config schema with defaults
- Secret rotation support
- Environment-specific configs

**Expected Changes**:
```typescript
// src/lib/config/env-schema.ts
export const envSchema = z.object({
  // Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),

  // Optional with defaults
  OPENROUTER_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
});

// Runtime validation
export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid env: ${result.error.message}`);
  }
  return result.data;
}
```

**Validation Checklist**:
- [ ] No secrets exposed to client
- [ ] Required vars enforced at startup
- [ ] Defaults documented
- [ ] .env.example updated

---

### 4. auth-middleware-enhancements

**Source**: `docs/abacus/auth-map.json`

**Proposal Scope**:
- Enhanced middleware with rate limiting
- Audit logging integration
- Permission-based access control
- Token refresh handling

**Expected Changes**:
```typescript
// Enhanced withAuth options
export function withAuth(
  handler: AuthHandler,
  options?: {
    requireWorkspace?: boolean;
    allowAdmin?: boolean;
    rateLimit?: { requests: number; window: number };
    audit?: boolean;
    permissions?: string[];
  }
)
```

**Validation Checklist**:
- [ ] Existing routes not broken
- [ ] Rate limiting tested
- [ ] Audit logs written
- [ ] Performance acceptable

---

## Phase 18 Task Plan

### Week 1: PR Review & Safety

| Task | Hours | Owner | Status |
|------|-------|-------|--------|
| Review routing-upgrade-proposal PR | 2h | Claude | Pending |
| Review api-layer-refactor-proposal PR | 3h | Claude | Pending |
| Review env-and-config-hardening PR | 2h | Claude | Pending |
| Review auth-middleware-enhancements PR | 3h | Claude | Pending |
| Run E2E tests on each PR | 4h | Claude | Pending |

### Week 2: Merge & Deploy

| Task | Hours | Owner | Status |
|------|-------|-------|--------|
| Merge approved PRs | 2h | Claude | Pending |
| Run migrations (if any) | 1h | Claude | Pending |
| Deploy to staging | 1h | Claude | Pending |
| Smoke test all routes | 2h | Claude | Pending |
| Deploy to production | 1h | Claude | Pending |

### Week 3: Monitoring & Iteration

| Task | Hours | Owner | Status |
|------|-------|-------|--------|
| Monitor error rates | 2h | DevOps | Pending |
| Analyze performance impact | 2h | Claude | Pending |
| Document changes | 2h | Docs | Pending |
| Plan Phase 19 | 2h | Claude | Pending |

---

## Safety Summary

### Pre-Merge Verification

Before merging ANY Abacus PR:

1. **Code Review**
   - [ ] No auth removals
   - [ ] Workspace isolation preserved
   - [ ] No breaking changes to public API
   - [ ] Protected files unchanged

2. **Test Coverage**
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] E2E tests pass
   - [ ] No test regressions

3. **Documentation**
   - [ ] API changes documented
   - [ ] Migration guide included
   - [ ] CHANGELOG updated

4. **Security**
   - [ ] No secrets exposed
   - [ ] RLS policies verified
   - [ ] Admin overrides audited

### Protected Files (DO NOT MERGE changes to these without explicit review)

```
src/lib/supabase.ts
src/lib/auth/middleware.ts
src/contexts/AuthContext.tsx
src/app/api/auth/**
supabase/migrations/**
.env*
```

### Rollback Plan

If issues detected post-merge:

```bash
# Immediate revert
git revert <merge-commit>
git push origin main

# Verify
npm run build
npm run test
```

---

## Immediate Actions for Pit Crew

### Action 1: Run Migration 100
```bash
# Go to Supabase Dashboard → SQL Editor
# Run: supabase/migrations/100_website_audits.sql
```

### Action 2: Execute Lighthouse Audit
```bash
# Using Playwright MCP or manual
npx lighthouse https://unite-hub.vercel.app/dashboard/overview --output=json --output-path=./lighthouse-report.json
```

### Action 3: Create E2E Test for Audits
```bash
# Create: tests/e2e/website-audits.spec.ts
# Test: Create audit → View audit → Check scores
```

### Action 4: Request Abacus PRs
```markdown
## Abacus PR Request

Please create the following PRs for Unite-Hub:

1. **routing-upgrade-proposal** - Modernize routing with AppShellLayout
2. **api-layer-refactor-proposal** - Standardize API patterns
3. **env-and-config-hardening** - Environment validation
4. **auth-middleware-enhancements** - Rate limiting and audit logging

Reference maps in: `docs/abacus/`

Follow safety guidelines in: `docs/abacus/INTEGRATION_SAFETY.md`
```

---

## Pending PRs from Abacus

| PR Name | Branch | Status | Tests | Docs |
|---------|--------|--------|-------|------|
| routing-upgrade-proposal | abacus/routing-upgrade | Requested | - | - |
| api-layer-refactor-proposal | abacus/api-refactor | Requested | - | - |
| env-and-config-hardening | abacus/env-hardening | Requested | - | - |
| auth-middleware-enhancements | abacus/auth-enhancements | Requested | - | - |

---

## Success Criteria

Phase 18 is complete when:

1. All 4 Abacus PRs reviewed and merged (or rejected with documentation)
2. E2E tests for audit workflow passing
3. Lighthouse audit shows no regressions
4. All documentation updated
5. Phase 19 plan created

---

## Next Phase Preview

**Phase 19: Production Hardening**
- Database connection pooling
- Advanced caching strategies
- Distributed tracing
- Load testing

---

**Document Updated**: 2025-11-23
