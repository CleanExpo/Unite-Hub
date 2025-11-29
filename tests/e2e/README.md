# Unite-Hub E2E Test Suite

Comprehensive end-to-end tests for critical user flows and security boundaries.

## Overview

This test suite validates:

1. **Authentication Flow** - OAuth, session persistence, role-based redirects
2. **Dashboard Access Control** - Staff vs client access patterns
3. **Workspace Isolation** - Data scoping, unauthorized access prevention
4. **Tier Gating (Synthex)** - Feature restrictions by subscription tier
5. **API Security** - Auth validation, workspace filtering, rate limiting
6. **Cross-Cutting Concerns** - SEO, error handling, responsiveness

## Test Structure

```
tests/e2e/
├── critical-flows.spec.ts    # Main test suite (6 test suites, 25+ tests)
├── helpers/
│   ├── auth-helpers.ts       # Authentication utilities
│   ├── api-mocks.ts          # API mocking utilities
│   └── index.ts              # Helper exports
└── README.md                 # This file
```

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Specific Test Suite

```bash
npx playwright test critical-flows.spec.ts
```

### Specific Test

```bash
npx playwright test -g "should redirect unauthenticated users to login"
```

### Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Debug Mode

```bash
npx playwright test --debug
```

### UI Mode (Interactive)

```bash
npx playwright test --ui
```

## Test Coverage

### 1. Authentication Flow (6 tests)

- ✅ Redirect unauthenticated users to login
- ✅ Complete Google OAuth flow and create session
- ✅ Persist session after page reload
- ✅ Redirect STAFF role to /dashboard
- ✅ Redirect CLIENT role to /client
- ✅ Handle logout and clear session

### 2. Dashboard Access Control (4 tests)

- ✅ STAFF can access /dashboard/overview
- ✅ CLIENT is redirected from /dashboard to /client/home
- ✅ STAFF cannot access /client portal
- ✅ FOUNDER has access to both /dashboard and /founder routes

### 3. Workspace Isolation (3 tests)

- ✅ Contacts list only shows workspace-scoped data
- ✅ Cannot access another workspace via URL manipulation
- ✅ Workspace filter is applied to all API requests

### 4. Synthex Tier Gating (3 tests)

- ✅ STARTER tier blocked from professional features
- ✅ PROFESSIONAL tier has access to advanced SEO
- ✅ ELITE tier has full feature access

### 5. API Security (5 tests)

- ✅ Unauthorized API requests return 401
- ✅ Valid token grants API access
- ✅ Workspace filter is enforced on API endpoints
- ✅ API validates required parameters
- ✅ API rate limiting is enforced

### 6. Cross-Cutting Concerns (4 tests)

- ✅ All pages have proper meta tags for SEO
- ✅ Error pages handle 404 gracefully
- ✅ Application is responsive on mobile viewports
- ✅ Application handles network errors gracefully

**Total: 25 tests across 6 critical areas**

## Test Helpers

### Authentication Helpers

```typescript
import { loginAs, logout, isAuthenticated, getAuthToken } from './helpers';

// Login as staff user
await loginAs(page, 'staff');

// Check if authenticated
const authenticated = await isAuthenticated(page);

// Get auth token
const token = await getAuthToken(page);

// Logout
await logout(page);
```

### API Mocking Helpers

```typescript
import {
  mockContactsAPI,
  mockWorkspaceIsolation,
  mockTierGating,
  mockRateLimiting,
  mockNetworkErrors
} from './helpers';

// Mock contacts API
await mockContactsAPI(page);

// Mock workspace isolation
await mockWorkspaceIsolation(page);

// Mock tier gating
await mockTierGating(page, 'starter');

// Mock rate limiting
await mockRateLimiting(page, 10, 60000);

// Mock network errors
await mockNetworkErrors(page, 0.5);
```

## Test Data

### Mock Users

```typescript
const TEST_USERS = {
  staff: {
    email: 'staff@test.unite-hub.com',
    role: 'STAFF',
    workspaceId: 'ws-staff-e2e-test',
  },
  client: {
    email: 'client@test.unite-hub.com',
    role: 'CLIENT',
    workspaceId: 'ws-client-e2e-test',
  },
  founder: {
    email: 'founder@test.unite-hub.com',
    role: 'FOUNDER',
    workspaceId: 'ws-founder-e2e-test',
  },
};
```

### Mock Workspaces

```typescript
const MOCK_WORKSPACES = {
  staff: {
    id: 'ws-staff-e2e-test',
    name: 'Staff Test Workspace',
    contacts: [
      { id: 'contact-1', name: 'John Doe', email: 'john@example.com' },
      { id: 'contact-2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
  },
  client: {
    id: 'ws-client-e2e-test',
    name: 'Client Test Workspace',
    contacts: [
      { id: 'contact-3', name: 'Bob Wilson', email: 'bob@example.com' },
    ],
  },
};
```

### Mock Tiers

```typescript
const MOCK_TIERS = {
  starter: {
    features: ['basic_seo', 'basic_analytics'],
  },
  professional: {
    features: ['basic_seo', 'basic_analytics', 'advanced_seo', 'competitor_analysis'],
  },
  elite: {
    features: ['basic_seo', 'basic_analytics', 'advanced_seo', 'competitor_analysis', 'white_label', 'custom_reporting'],
  },
};
```

## Configuration

Tests use the Playwright configuration from `playwright.config.ts`:

- **Base URL**: `http://localhost:3008` (or `PLAYWRIGHT_TEST_BASE_URL`)
- **Browsers**: Chromium, Firefox, WebKit
- **Timeout**: 60 seconds per test
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 (sequential execution for test isolation)
- **Screenshots**: Only on failure
- **Videos**: Retained on failure
- **Traces**: On first retry

## Environment Variables

```env
# Base URL for tests
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3008

# Run in CI mode (enables retries)
CI=true
```

## Debugging Tips

### View Test Report

```bash
npx playwright show-report
```

### Run with Trace Viewer

```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Run with Browser DevTools

```bash
npx playwright test --headed --debug
```

### Slow Motion

```bash
npx playwright test --headed --slow-mo=1000
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

## Known Limitations

### 1. OAuth Mocking

The Google OAuth flow is mocked for test isolation. In a real environment, you would:

- Use Playwright's `context.grantPermissions()` for real OAuth
- Or use a test OAuth provider
- Or use Supabase test users with email/password

### 2. Database State

Tests do not interact with a real database. To test against a real database:

- Set up a separate test database
- Use migrations to create schema
- Seed test data before tests
- Clean up after tests

### 3. Rate Limiting

The rate limiting test may fail if rate limiting is not implemented. This serves as a reminder to implement it.

## Best Practices

### 1. Test Isolation

Each test should:
- Start with a clean state
- Not depend on other tests
- Clean up after itself

### 2. Selectors

Use stable selectors:
- ✅ `button[aria-label="Save"]`
- ✅ `[data-testid="contact-list"]`
- ❌ `.css-class-12345`
- ❌ `div > div > div`

### 3. Waiting

Use built-in waiting:
- ✅ `await expect(locator).toBeVisible()`
- ✅ `await page.waitForURL()`
- ❌ `await page.waitForTimeout(5000)`

### 4. Assertions

Use descriptive assertions:
- ✅ `await expect(page).toHaveURL(/\/dashboard/)`
- ✅ `await expect(button).toBeDisabled()`
- ❌ `expect(url.includes('dashboard')).toBeTruthy()`

## Troubleshooting

### Tests fail with "Navigation timeout"

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  navigationTimeout: 60000, // 60 seconds
}
```

### Tests fail with "Element not found"

Check if element exists before interacting:

```typescript
await expect(page.locator('button')).toBeVisible();
await page.click('button');
```

### Tests fail inconsistently

Enable retries:

```typescript
retries: 2,
```

### Browser doesn't close after test

Use proper teardown:

```typescript
test.afterEach(async ({ page }) => {
  await logout(page);
});
```

## Contributing

When adding new tests:

1. Follow the existing structure
2. Use helpers for common operations
3. Add meaningful test names
4. Include assertions
5. Update this README

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Unite-Hub Documentation](../../README.md)
