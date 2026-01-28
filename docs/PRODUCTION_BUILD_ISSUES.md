# Production Build Issues

**Date**: 2026-01-28
**Status**: BLOCKING - Production build fails
**Impact**: Cannot execute load tests until resolved

---

## Executive Summary

While attempting to execute load tests (final 2% to reach 100% production readiness), discovered that the production build (`npm run build`) fails with multiple missing module errors. These issues prevent:
1. Building production bundle
2. Running production server
3. Executing load tests
4. Deploying to production

## Missing Modules Identified

### Critical Missing Modules

1. **@/lib/email/emailService**
   - Imported by: `src/lib/workflows/executors/EmailExecutor.ts`
   - Required for: Email workflow execution
   - Priority: P0

2. **@/lib/guardian/access**
   - Imported by: `src/app/api/guardian/notifications/logs/route.ts`
   - Required for: Guardian role-based access control
   - Priority: P1 (diagnostic endpoint)

3. **@/lib/ai/personalization**
   - Imported by: `src/lib/workflows/executors/EmailExecutor.ts`
   - Required for: AI-powered content personalization
   - Priority: P0

### Stub Modules Created (Temporary)

Created minimal stubs for build testing:
- `src/lib/guardian/tenant.ts` - Guardian tenant context
- `src/lib/unite/aiGovernanceService.ts` - AI usage logging
- `src/lib/core/logService.ts` - Unified logging
- `src/lib/core/permissionService.ts` - Permission checks

**Note**: These stubs allow imports to resolve but don't provide actual functionality.

## Build Error Analysis

### Error 1: EmailExecutor Missing Dependencies

```
Module not found: Can't resolve '@/lib/email/emailService'
Module not found: Can't resolve '@/lib/ai/personalization'
```

**Impact**: Email workflow execution will fail at runtime.

**Affected Routes**:
- Campaign workflow execution
- Email automation
- Drip campaigns

### Error 2: Guardian Access Control

```
Module not found: Can't resolve '@/lib/guardian/access'
```

**Impact**: Guardian notification logs endpoint non-functional.

**Affected Routes**:
- `/api/guardian/notifications/logs`

### Additional Warnings

1. **Zustand Version Mismatch**
   - reactflow packages require zustand 4.5.7
   - Project has zustand 5.0.8
   - **Risk**: Potential runtime errors in drip campaign builder

2. **Overly Broad File Patterns**
   - `path.join(basePath, clientId, folderType)` matches 47,862 files
   - **Risk**: Slow builds, over-bundling

## Root Cause Analysis

### Why Wasn't This Caught Earlier?

1. **Development Server More Permissive**
   - Next.js dev server (Turbopack) doesn't enforce strict module resolution
   - Missing modules may fail silently or at runtime

2. **Incomplete Migration**
   - Code references modules that were planned but never implemented
   - OR modules were refactored/moved and imports not updated

3. **Test Coverage Gaps**
   - Unit tests passing (89%) but not covering these import paths
   - No build verification in CI/CD

## Impact Assessment

| Component | Status | Can Deploy? | Can Test? |
|-----------|--------|-------------|-----------|
| Core Application | ⚠️ Warnings | No | No |
| Email Workflows | ❌ Broken | No | No |
| Guardian System | ❌ Broken | No | No |
| AI Personalization | ❌ Broken | No | No |
| Load Testing | ⛔ Blocked | N/A | No |

## Action Plan

### Phase 1: Identify Missing Modules (1-2 hours)

```bash
# Find all imports of missing modules
grep -r "@/lib/email/emailService" src/
grep -r "@/lib/ai/personalization" src/
grep -r "@/lib/guardian/access" src/

# Check if modules exist elsewhere (renamed/moved)
find src/ -name "emailService.*"
find src/ -name "personalization.*"
find src/ -name "access.*"
```

### Phase 2: Resolve Import Errors (2-4 hours)

**Option A: Implement Missing Modules**
- Create full implementations of missing services
- Most thorough but time-intensive

**Option B: Refactor Imports**
- Update imports to point to actual existing modules
- Quick fix if modules exist but were renamed

**Option C: Comment Out Non-Critical Routes**
- Temporarily disable guardian/diagnostics endpoints
- Fastest path to working build
- **Recommended for immediate load testing**

### Phase 3: Fix Zustand Version Conflict (30 minutes)

```bash
# Option 1: Downgrade to 4.5.7 (safe for reactflow)
npm install zustand@4.5.7

# Option 2: Update reactflow (may require code changes)
npm update @reactflow/core @reactflow/background @reactflow/controls
```

### Phase 4: Verify Build (15 minutes)

```bash
# Clean build
rm -rf .next
npm run build

# Verify no errors
echo $?  # Should be 0
```

### Phase 5: Execute Load Tests (1 hour)

```bash
# Start production server
npm run start

# Run load test suite
npx artillery run tests/load/basic-load.yml --output basic-report.json
npx artillery run tests/load/stress-test.yml --output stress-report.json
npx artillery run tests/load/spike-test.yml --output spike-report.json
```

## Immediate Next Steps

### Recommended Approach (Fastest to Load Testing)

1. **Comment out problematic routes** (15 minutes)
   - Guardian notification logs
   - Unite AI logs
   - Diagnostics logs
   - EmailExecutor (if not critical for load test)

2. **Fix zustand version** (30 minutes)
   - Downgrade to 4.5.7 for compatibility

3. **Build and test** (45 minutes)
   - Clean build
   - Start production server
   - Execute basic load test

4. **Document results** (30 minutes)
   - Performance baselines
   - Update production readiness

**Total Time**: 2 hours to load test results

### Thorough Approach (Production-Ready)

1. **Implement missing modules** (4-8 hours)
   - emailService with multi-provider support
   - AI personalization service
   - Guardian access control

2. **Fix all build warnings** (2-4 hours)
   - Zustand version resolution
   - Broad file pattern optimization

3. **Full regression testing** (2-4 hours)
   - Unit tests for new modules
   - Integration tests
   - End-to-end workflows

**Total Time**: 8-16 hours to production-ready build

## Updated Production Readiness

### Before Build Attempt: 98%
- All infrastructure documented
- Security features implemented
- Load testing suite created

### After Build Discovery: ~90%
- **Actual blocking issues found**
- Cannot build production bundle
- Cannot execute load tests
- Module architecture incomplete

**Critical Gap**: Missing service layer implementations

## Lessons Learned

1. **Test Production Builds Early**
   - Development server hides build issues
   - CI/CD should run `npm run build` on every PR

2. **Module Architecture Verification**
   - Verify all imports resolve before marking complete
   - Use TypeScript project references for better error catching

3. **Honest Assessment > Optimistic Metrics**
   - 98% ready but can't build = not production-ready
   - Better to find issues in testing than production

---

## Next Actions

**Immediate** (Choose one):
1. Implement fast path (comment out routes) → Load test in 2 hours
2. Implement thorough path (all modules) → Production-ready in 8-16 hours

**After Resolution**:
1. Execute load test suite
2. Document performance baselines
3. Update production readiness based on actual working build
4. Add `npm run build` to CI/CD pipeline

---

**Status**: BLOCKING
**Owner**: Development Team
**Priority**: P0
**Est. Time to Resolve**: 2-16 hours (depending on approach)
**Blocker For**: Load testing, production deployment

**Last Updated**: 2026-01-28
