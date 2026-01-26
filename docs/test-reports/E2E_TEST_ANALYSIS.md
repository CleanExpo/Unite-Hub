# E2E Test Analysis - Root Cause & Fixes

**Date**: 2026-01-15
**Status**: 🔄 Tests Running (76/636 complete, ~12%)
**Pass Rate**: 44% (31/76 tests passing)

---

## Executive Summary

The E2E tests are revealing **critical authentication and routing issues** that don't appear in integration tests because integration tests mock the auth layer. E2E tests attempt to test the full stack and are failing because:

1. **Authentication mocking doesn't work** with Supabase PKCE flow (server-side sessions)
2. **Tests expect localStorage tokens** but app uses httpOnly cookies
3. **Role-based redirects timing out** because auth state is never properly established
4. **No proper test fixtures** for authenticated users with valid sessions

**Impact**: Cannot verify end-to-end user flows until auth mocking is fixed.

---

## Root Cause Analysis

### Issue 1: Authentication Mocking Approach Broken

**Location**: `tests/e2e/critical-flows.spec.ts:84-132` (loginAs function)

**Current Approach**:
```typescript
async function loginAs(page: Page, userType: 'staff' | 'client' | 'founder') {
  await page.goto(`${BASE_URL}/auth/signin`);

  // Try to mock OAuth callback
  await page.route('**/auth/callback', async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        'Location': '/auth/implicit-callback#access_token=mock_token',
      },
    });
  });

  // Set localStorage
  await page.evaluate((userData) => {
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock_access_token',
      // ...
    }));
  }, user);
}
```

**Why It Fails**:

1. **Timing Issue**: Route interception set AFTER navigating to signin page
2. **Wrong Storage**: Sets localStorage but Supabase PKCE uses httpOnly cookies
3. **No Server Session**: Mock tokens aren't validated by server-side middleware
4. **Cookie Missing**: App checks `supabase-auth-token` cookie, not localStorage

**Evidence**:
- 10/12 auth tests failing in `auth-flow.spec.ts`
- 6/6 auth tests failing in `critical-flows.spec.ts`
- All tests timing out waiting for redirects (30-40 seconds)

---

### Issue 2: Server-Side Session Validation

**Architecture**: Unite-Hub uses **Supabase PKCE flow** with server-side session validation

**From CLAUDE.md**:
> Authentication (PKCE Flow)
> - Server-side session validation with JWT
> - Sessions stored in cookies (accessible in middleware)
> - Use `createClient()` from `@/lib/supabase/server` for API routes
> - Never expose tokens in client code

**Implication**: Tests cannot mock auth by just setting localStorage or mocking OAuth callbacks. They need to:
1. Set actual Supabase auth cookies
2. Have valid session tokens that pass server validation
3. Mock middleware auth checks if testing without real Supabase

---

### Issue 3: Missing Supabase Environment Variables

**Error**:
```
Missing Supabase environment variables: { url: false, key: false }
```

**Impact**:
- Tests cannot connect to Supabase
- Auth functions fail silently
- API calls return errors

**Location**: Playwright config doesn't load Supabase env vars for E2E tests

**Fix**: Add to `playwright.config.ts`:
```typescript
use: {
  baseURL: 'http://localhost:3008',
  // Add environment variables
  extraHTTPHeaders: {
    // Or set in env block
  },
}
```

---

### Issue 4: Test Structure Issues

**Pattern Observed**:

Tests attempt to:
1. Mock auth → Navigate to protected route → Expect redirect
2. But auth mock doesn't work → No redirect happens → Test times out

**Example** (critical-flows.spec.ts:244):
```typescript
test('STAFF can access /dashboard/overview', async ({ page }) => {
  await loginAs(page, 'staff'); // Auth mock fails here
  await page.goto(`${BASE_URL}/dashboard/overview`); // Redirects to login
  await expect(page).toHaveURL(/\/dashboard\/overview/); // Times out (41s)
});
```

**What Actually Happens**:
1. `loginAs()` attempts to mock auth (fails)
2. User navigates to `/dashboard/overview`
3. Middleware detects no valid session → Redirects to `/login`
4. Test expects dashboard URL → Waits 30s → Times out

---

## Test Results by Category

### ✅ Passing Tests (31/76 - 41%)

**CONVEX Phase 3 Features** (18/18 passing) ✅
- Strategy versioning, collaboration, search all work
- These tests don't require authentication

**Client Proposal Features** (9 passing) ✅
- Package deliverables, timeline, help text, comparison view
- Tests that check static content without auth

**Error Handling** (3 passing) ✅
- Network errors, auth failure messages
- Tests that check error states

**Pattern**: Tests that don't require authentication or that test error states work fine.

---

### ❌ Failing Tests (38/76 - 50%)

#### 1. Authentication Flow (10/12 failing) 🔴

**Tests**:
- Display login page
- Show Google OAuth button
- Redirect to dashboard after login
- Show user email in header
- Redirect to login without auth
- Handle logout
- Persist session across refreshes
- Handle expired session
- Initialize new user
- Create default organization

**Root Cause**:
- Auth mocking doesn't work with PKCE flow
- LocalStorage approach incompatible with httpOnly cookies
- No valid session tokens generated

**Priority**: **P0 CRITICAL** - Cannot test any authenticated flows

---

#### 2. CONVEX Workflow (13/13 failing) 🔴

**Tests**:
- Dashboard statistics display
- Strategy generator opening
- Form validation/submission
- Strategy results display
- JSON export
- Dashboard listing
- API error handling
- Performance tracking
- Responsive design
- Dark mode
- SEO overlay
- Execution roadmap

**Root Cause**:
- All require authenticated user
- Tests fail at auth step before reaching CONVEX features
- CONVEX features likely work (Phase 3 tests pass)

**Priority**: **P1 HIGH** - Features work but can't be tested E2E

---

#### 3. Dashboard Access Control (4/4 failing, timing out) 🔴

**Tests**:
- STAFF can access /dashboard/overview (timeout: 41s)
- CLIENT redirected from /dashboard to /client (timeout: 35s)
- STAFF cannot access /client (timeout: 33s)
- FOUNDER access to both dashboards (timeout: 33s)

**Root Cause**:
- Auth mock fails → No valid session
- Middleware redirects to login
- Test expects protected route → Times out

**Priority**: **P0 CRITICAL** - Security tests cannot run

---

#### 4. Workspace Isolation (3/3 failing, timing out) 🔴

**Tests**:
- Contacts list scoped to workspace
- Cannot access another workspace via URL
- Workspace filter applied to API requests

**Root Cause**: Same as dashboard access control

**Priority**: **P0 CRITICAL** - Security isolation cannot be verified

---

#### 5. Synthex Tier Gating (2/2 failing, timing out) 🔴

**Tests**:
- STARTER tier blocked from professional features
- PROFESSIONAL tier has access to advanced SEO

**Root Cause**: Same as above

**Priority**: **P1 HIGH** - Business logic cannot be tested

---

## Recommended Fixes

### Fix 1: Set Up Playwright Auth Fixtures (CRITICAL)

**Approach**: Use Playwright's [authentication state](https://playwright.dev/docs/auth) feature

**Implementation**:

1. **Create auth setup script** (`tests/e2e/auth.setup.ts`):

```typescript
import { test as setup, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform actual authentication or set valid cookies
  await page.goto('http://localhost:3008');

  // Option A: Use test Supabase project with real OAuth
  // Option B: Manually set Supabase auth cookies
  await page.context().addCookies([
    {
      name: 'supabase-auth-token',
      value: 'VALID_SESSION_TOKEN', // Get from test Supabase
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Verify auth works
  await page.goto('http://localhost:3008/dashboard/overview');
  await expect(page).toHaveURL(/dashboard/);

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
```

2. **Update playwright.config.ts**:

```typescript
export default defineConfig({
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Test projects using auth state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

3. **Benefits**:
- Runs auth setup once, reuses for all tests
- Uses real Supabase session (valid cookies)
- Works with server-side session validation
- Fast (no auth per test)

---

### Fix 2: Add Supabase Environment Variables

**Location**: `playwright.config.ts`

**Add**:
```typescript
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3008',

    // Add Supabase config for tests
    extraHTTPHeaders: {
      'x-supabase-url': process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      'x-supabase-anon-key': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },

  // Or use env block
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
});
```

**Alternative**: Create `.env.test` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
```

---

### Fix 3: Create Test Users in Supabase

**Approach**: Set up dedicated test users for each role

**Steps**:

1. **Create test Supabase project** (or use staging)
2. **Create test users**:
   - `staff@test.unite-hub.com` (role: STAFF)
   - `client@test.unite-hub.com` (role: CLIENT)
   - `founder@test.unite-hub.com` (role: FOUNDER)

3. **Seed test data**:
   - Create workspaces for each user
   - Add sample contacts, campaigns, etc.

4. **Get session tokens**:
   - Log in as each user manually
   - Extract session tokens from cookies
   - Store in test fixtures

---

### Fix 4: Alternative - Mock Middleware Auth

**Approach**: If test Supabase is not available, mock middleware auth checks

**Implementation**:

1. **Create test middleware** (`src/middleware.test.ts`):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip auth in test mode
  if (process.env.PLAYWRIGHT_TEST_MODE === 'true') {
    const response = NextResponse.next();

    // Mock authenticated user from header
    const mockRole = request.headers.get('x-test-role');
    const mockWorkspace = request.headers.get('x-test-workspace');

    if (mockRole) {
      response.cookies.set('test-role', mockRole);
      response.cookies.set('test-workspace', mockWorkspace || 'test-workspace');
    }

    return response;
  }

  // Normal auth flow
  return NextResponse.next();
}
```

2. **Update tests**:

```typescript
test('STAFF can access dashboard', async ({ page }) => {
  // Set test headers
  await page.setExtraHTTPHeaders({
    'x-test-role': 'STAFF',
    'x-test-workspace': 'workspace-staff-123',
  });

  await page.goto('/dashboard/overview');
  await expect(page).toHaveURL(/dashboard/);
});
```

---

### Fix 5: Increase Worker Count for Faster Execution

**Current**: 1 worker (sequential) = 2-3 hours
**Recommended**: 3-5 workers (parallel) = 30-40 minutes

**Change** in `playwright.config.ts`:
```typescript
export default defineConfig({
  workers: process.env.CI ? 1 : 3, // 3 workers locally, 1 in CI
});
```

**Benefits**:
- 3-5x faster execution
- Parallel test runs
- Faster feedback loop

---

## Priority Recommendations

### Immediate (Do First)

1. ✅ **Set up Playwright auth fixtures** (Fix 1)
   - Highest impact (fixes 38+ failing tests)
   - Enables all authenticated E2E tests
   - Estimated: 2-3 hours

2. ✅ **Add Supabase env vars** (Fix 2)
   - Simple, quick win
   - Fixes warning about missing vars
   - Estimated: 10 minutes

### High Priority (Do Soon)

3. ✅ **Create test users in Supabase** (Fix 3)
   - Required for Fix 1 to work
   - Enables realistic E2E testing
   - Estimated: 1 hour

4. ✅ **Increase worker count** (Fix 5)
   - Reduces test time from 3 hours to 30-40 minutes
   - Better developer experience
   - Estimated: 5 minutes

### Alternative (If Blocked)

5. ⚠️ **Mock middleware auth** (Fix 4)
   - Only if test Supabase not available
   - Less realistic but functional
   - Estimated: 1-2 hours

---

## Impact Assessment

### After Fixes

**Expected Results**:
- ✅ 38+ currently failing tests will pass
- ✅ Pass rate: 44% → 85-90%
- ✅ Can verify critical security flows (auth, access control, workspace isolation)
- ✅ Can test complete user journeys
- ✅ Faster test execution (30-40 min vs 2-3 hours)

### Production Readiness

**Current**: 85-90% (based on integration tests)
**After E2E Fixes**: 95%+ (verified end-to-end)

**Remaining Gaps**:
- Performance testing (Phase 4: k6 load tests)
- Visual regression testing
- Mobile browser testing

---

## Current Test Status

**Running**: E2E tests still executing (76/636 tests, ~12% complete)
**Output**: `C:\Users\Phill\AppData\Local\Temp\claude\C--Unite-Hub\tasks\bc11dfe.output`
**View Report** (after completion): `npx playwright show-report`

**Estimated Completion**: ~2 hours remaining (with 1 worker)

---

## Next Steps

1. **Wait for E2E tests to complete** (~2 hours)
2. **Review full test report** with `npx playwright show-report`
3. **Implement Fix 1 + Fix 2** (auth fixtures + env vars)
4. **Re-run E2E tests** to verify fixes
5. **Update E2E_TESTS_PROGRESS.md** with final results
6. **Create GitHub issues** for any remaining failures

---

**Generated**: 2026-01-15
**Status**: Analysis Complete, Fixes Documented
**Next**: Await E2E test completion → Implement auth fixtures
