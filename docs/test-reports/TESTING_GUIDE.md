# Testing Guide for Unite-Hub

**Version**: 1.0.0
**Last Updated**: 2025-11-16
**Status**: Production-Ready Testing Infrastructure

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Test Coverage](#test-coverage)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Unite-Hub uses a comprehensive testing strategy combining:

- **Vitest** - Fast unit and integration testing for TypeScript/React
- **React Testing Library** - Component testing with user-centric approach
- **Playwright** - End-to-end browser testing across multiple devices
- **MSW (Mock Service Worker)** - API mocking for isolated tests

### Testing Pyramid

```
           /\
          /  \
         / E2E \         10% - Full user flows
        /------\
       /  Integ \        30% - API + Database
      /----------\
     /    Unit    \      60% - Functions + Components
    /--------------\
```

### Coverage Goals

- **Minimum**: 40% overall coverage (currently achieved)
- **Target**: 70% overall coverage
- **Critical paths**: 90% coverage (auth, payments, AI agents)

---

## Quick Start

### Install Dependencies

```bash
npm install
```

Dependencies are already in `package.json`:
- `vitest` - Test runner
- `@testing-library/react` - Component testing
- `@playwright/test` - E2E testing
- `happy-dom` - Fast DOM environment
- `msw` - API mocking

### Run All Tests

```bash
# Unit + Integration tests
npm test

# E2E tests
npm run test:e2e

# All tests (unit + integration + E2E)
npm run test:all
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Component tests only
npm run test:components

# E2E tests with UI
npm run test:e2e:ui
```

### Watch Mode (for development)

```bash
# Auto-rerun tests on file changes
npm run test:watch

# With interactive UI
npm run test:ui
```

---

## Test Structure

```
tests/
├── setup.ts                          # Global test configuration
├── helpers/                          # Test utilities
│   ├── auth.ts                       # Authentication mocks
│   ├── db.ts                         # Database helpers
│   └── api.ts                        # API test utilities
│
├── unit/                             # Unit tests (60% of tests)
│   ├── lib/
│   │   ├── rate-limit.test.ts        # Rate limiting logic
│   │   ├── supabase.test.ts          # Supabase client
│   │   └── auth.test.ts              # Auth helpers
│   └── agents/
│       ├── contact-intelligence.test.ts
│       ├── content-personalization.test.ts
│       └── email-processor.test.ts
│
├── integration/                      # Integration tests (30%)
│   ├── api/
│   │   ├── auth.test.ts              # Auth endpoints
│   │   ├── contacts.test.ts          # Contact CRUD
│   │   ├── campaigns.test.ts         # Campaign management
│   │   └── ai-agents.test.ts         # AI agent endpoints
│   └── database/
│       └── workspace-isolation.test.ts
│
├── components/                       # Component tests
│   ├── HotLeadsPanel.test.tsx
│   ├── EmailThread.test.tsx
│   └── ClientSelector.test.tsx
│
└── e2e/                              # E2E tests (10%)
    ├── auth-flow.spec.ts             # Login/logout flow
    ├── dashboard.spec.ts             # Dashboard navigation
    └── contact-management.spec.ts    # CRUD operations
```

---

## Running Tests

### Run Tests with Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/`:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - For CI/CD integration
- `coverage/coverage-summary.json` - Summary JSON

### Run Tests in CI Mode

```bash
CI=true npm test
```

CI mode:
- Runs once (no watch mode)
- Fails on coverage threshold violations
- Generates machine-readable reports

### Run Specific Test Files

```bash
# Run single test file
npx vitest tests/unit/lib/rate-limit.test.ts

# Run tests matching pattern
npx vitest --grep "authentication"

# Run only failed tests
npx vitest --changed
```

### Playwright E2E Tests

```bash
# Run all browsers
npm run test:e2e

# Run specific browser
npx playwright test --project=chromium

# Run with visible browser (headed mode)
npm run test:e2e:headed

# Run with interactive UI
npm run test:e2e:ui

# Debug mode
npx playwright test --debug
```

---

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent prop="value" />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthenticatedRequest } from '../helpers/api';

vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(async () => ({
    // Mock Supabase methods
  })),
}));

describe('API Endpoint', () => {
  it('should return data for authenticated user', async () => {
    const req = createAuthenticatedRequest({
      method: 'GET',
      url: 'http://localhost:3008/api/endpoint',
    });

    const { GET } = await import('@/app/api/endpoint/route');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete user flow', async ({ page }) => {
    await page.goto('/');

    await page.click('button:text("Action")');

    await expect(page).toHaveURL(/expected-url/);
    await expect(page.getByText('Expected Result')).toBeVisible();
  });
});
```

---

## Test Coverage

### Viewing Coverage Reports

```bash
# Generate and open HTML report
npm run test:coverage
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 40,
    functions: 40,
    branches: 40,
    statements: 40,
  },
}
```

### Files Excluded from Coverage

- `node_modules/`
- Test files (`*.test.ts`, `*.spec.ts`)
- Configuration files (`*.config.ts`)
- Type definitions (`*.d.ts`)
- Build artifacts (`.next/`, `dist/`)

### Priority Coverage Areas

**CRITICAL (90%+ coverage required):**
- Authentication (`src/lib/auth.ts`, `src/app/api/auth/*`)
- Rate limiting (`src/lib/rate-limit.ts`)
- Workspace isolation (all database queries)
- AI agents (`src/lib/agents/*`)

**HIGH (70%+ coverage):**
- API routes (`src/app/api/*`)
- Core components (`src/components/*`)
- Database helpers (`src/lib/db.ts`)

**MEDIUM (40%+ coverage):**
- UI components
- Utility functions
- Type definitions

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

Workflow file: `.github/workflows/ci-cd.yml`

```yaml
- name: Run Tests
  run: npm test

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Local Pre-Commit Checks

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm test -- --run --silent
```

### Coverage Gates

CI fails if:
- Any test fails
- Coverage drops below 40%
- New code has <50% coverage

---

## Best Practices

### Test Naming

```typescript
// ✅ GOOD - Descriptive test names
it('should return 401 when user is not authenticated', () => {});

// ❌ BAD - Vague test names
it('should work', () => {});
```

### Test Isolation

```typescript
// ✅ GOOD - Tests are independent
beforeEach(() => {
  vi.clearAllMocks();
  // Reset state
});

// ❌ BAD - Tests depend on each other
let sharedState = {};
it('test 1', () => { sharedState.foo = 'bar'; });
it('test 2', () => { expect(sharedState.foo).toBe('bar'); }); // ❌
```

### Mocking

```typescript
// ✅ GOOD - Mock external dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(async () => mockSupabase),
}));

// ❌ BAD - Don't mock internal business logic
vi.mock('@/lib/my-feature', () => ({})); // ❌
```

### Async Testing

```typescript
// ✅ GOOD - Use async/await or waitFor
it('should load data', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});

// ❌ BAD - Missing async handling
it('should load data', () => {
  render(<Component />);
  expect(screen.getByText('Data')).toBeInTheDocument(); // ❌ Fails
});
```

### Test Data

```typescript
// ✅ GOOD - Use test helpers
import { createMockContact } from '../helpers/db';
const contact = createMockContact({ ai_score: 85 });

// ❌ BAD - Hard-coded test data everywhere
const contact = { id: '123', name: 'John', ... }; // ❌
```

---

## Troubleshooting

### Tests Fail Locally but Pass in CI

**Cause**: Environment differences
**Fix**: Check `.env.test` vs CI environment variables

```bash
# Run with CI environment
CI=true npm test
```

### Flaky E2E Tests

**Cause**: Race conditions, timing issues
**Fix**: Use `waitFor` instead of fixed delays

```typescript
// ✅ GOOD
await page.waitForSelector('.loaded-content');

// ❌ BAD
await page.waitForTimeout(1000);
```

### Mock Not Working

**Cause**: Mock defined after import
**Fix**: Hoist mocks to top of file

```typescript
// ✅ GOOD - Mock before imports
vi.mock('@/lib/supabase', () => ({...}));
import { myFunction } from '@/lib/my-module';

// ❌ BAD - Import before mock
import { myFunction } from '@/lib/my-module';
vi.mock('@/lib/supabase', () => ({...})); // ❌ Too late
```

### Coverage Not Updating

**Cause**: Cached coverage data
**Fix**: Clear coverage and re-run

```bash
rm -rf coverage/
npm run test:coverage
```

### Playwright Tests Won't Run

**Cause**: Browsers not installed
**Fix**: Install Playwright browsers

```bash
npx playwright install
```

---

## Adding New Tests

### Checklist for New Features

When adding a new feature, create tests for:

1. **Unit Tests**
   - [ ] Core business logic functions
   - [ ] Helper utilities
   - [ ] Data transformations

2. **Integration Tests**
   - [ ] API endpoint authentication
   - [ ] Database operations
   - [ ] Workspace isolation

3. **Component Tests**
   - [ ] Component rendering
   - [ ] User interactions
   - [ ] Error states

4. **E2E Tests** (if user-facing)
   - [ ] Complete user flow
   - [ ] Error handling
   - [ ] Mobile responsiveness

### Test File Naming

- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- E2E tests: `*.spec.ts`

### Required Test Helpers

Import from `tests/helpers/`:
- `auth.ts` - Authentication mocks
- `db.ts` - Database test data
- `api.ts` - API request helpers

---

## Useful Commands Reference

```bash
# Development
npm run test:watch              # Watch mode for active development
npm run test:ui                 # Interactive test UI

# Running Tests
npm test                        # All unit + integration tests
npm run test:unit               # Unit tests only
npm run test:integration        # Integration tests only
npm run test:components         # Component tests only
npm run test:e2e                # E2E tests
npm run test:all                # Everything

# Coverage
npm run test:coverage           # Generate coverage report

# E2E Specific
npm run test:e2e:ui             # E2E with Playwright UI
npm run test:e2e:headed         # E2E with visible browser
npx playwright test --debug     # E2E debug mode
npx playwright show-report      # View E2E test report

# Debugging
npx vitest --inspect-brk        # Debug unit tests
npx playwright codegen          # Generate E2E test code
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Questions?** Open an issue or check the test examples in `tests/` directory.

**Last Updated**: 2025-11-16 by TDD Orchestrator
