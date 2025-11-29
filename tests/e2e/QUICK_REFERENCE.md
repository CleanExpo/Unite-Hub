# E2E Tests - Quick Reference

## Run Tests

```bash
# All tests
npm run test:e2e

# Specific test file
npx playwright test critical-flows.spec.ts

# Specific test
npx playwright test -g "should redirect unauthenticated users"

# Headed mode (see browser)
npm run test:e2e:headed

# UI mode (interactive)
npm run test:e2e:ui

# Debug mode
npx playwright test --debug

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Slow motion (1 second delay)
npx playwright test --headed --slow-mo=1000

# Generate trace
npx playwright test --trace on
```

## View Results

```bash
# Show HTML report
npx playwright show-report

# Show trace
npx playwright show-trace trace.zip
```

## Test Helpers

```typescript
import { loginAs, logout, isAuthenticated } from './helpers';
import { mockContactsAPI, mockTierGating } from './helpers';

// Login
await loginAs(page, 'staff');
await loginAs(page, 'client');
await loginAs(page, 'founder');

// Check auth
const authenticated = await isAuthenticated(page);
const token = await getAuthToken(page);

// Logout
await logout(page);

// Mock APIs
await mockContactsAPI(page);
await mockWorkspaceIsolation(page);
await mockTierGating(page, 'starter');
await mockRateLimiting(page, 10, 60000);
```

## Test Structure

```
tests/e2e/
├── critical-flows.spec.ts    # Main test suite
│   ├── Authentication Flow (6 tests)
│   ├── Dashboard Access Control (4 tests)
│   ├── Workspace Isolation (3 tests)
│   ├── Synthex Tier Gating (3 tests)
│   ├── API Security (5 tests)
│   └── Cross-Cutting Concerns (4 tests)
├── helpers/
│   ├── auth-helpers.ts       # Login, logout, auth checks
│   ├── api-mocks.ts          # API mocking utilities
│   └── index.ts              # Exports
└── README.md                 # Full documentation
```

## Common Commands

```bash
# Run all tests
npm run test:e2e

# Run and watch changes
npx playwright test --ui

# Run with screenshots
npx playwright test --screenshot=on

# Run with video
npx playwright test --video=on

# Update snapshots
npx playwright test --update-snapshots

# List all tests
npx playwright test --list

# Show config
npx playwright show-config
```

## Debugging

```bash
# Debug specific test
npx playwright test --debug -g "test name"

# Pause on failure
npx playwright test --headed --pause-on-failure

# Step through test
npx playwright test --headed --debug

# View traces
npx playwright show-trace trace.zip

# View logs
DEBUG=pw:api npx playwright test
```

## Environment Variables

```bash
# Set base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3008 npm run test:e2e

# Run in CI mode
CI=true npm run test:e2e
```

## Test Data

```typescript
// Mock users
TEST_USERS = {
  staff: 'staff@test.unite-hub.com',
  client: 'client@test.unite-hub.com',
  founder: 'founder@test.unite-hub.com',
  admin: 'admin@test.unite-hub.com',
}

// Mock workspaces
MOCK_WORKSPACES = {
  staff: 'ws-staff-e2e-test',
  client: 'ws-client-e2e-test',
}

// Mock tiers
MOCK_TIERS = {
  starter: ['basic_seo', 'basic_analytics'],
  professional: ['basic_seo', 'basic_analytics', 'advanced_seo', 'competitor_analysis'],
  elite: ['basic_seo', 'basic_analytics', 'advanced_seo', 'competitor_analysis', 'white_label', 'custom_reporting'],
}
```

## Test Coverage

Total: 25+ tests across 6 critical areas

- ✅ Authentication Flow
- ✅ Dashboard Access Control
- ✅ Workspace Isolation
- ✅ Tier Gating (Synthex)
- ✅ API Security
- ✅ Cross-Cutting Concerns

## Troubleshooting

```bash
# Tests timing out?
# Increase timeout in playwright.config.ts

# Element not found?
await expect(page.locator('button')).toBeVisible();

# Tests fail inconsistently?
# Enable retries in playwright.config.ts

# Browser won't close?
test.afterEach(async ({ page }) => {
  await logout(page);
});
```

## CI/CD

```yaml
# GitHub Actions
- run: npx playwright install --with-deps
- run: npm run test:e2e
- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: test-results/
```

## Next Steps

1. Run tests: `npm run test:e2e`
2. View report: `npx playwright show-report`
3. Add to CI/CD pipeline
4. Expand test coverage

---

**More Info**: See `tests/e2e/README.md` for full documentation
