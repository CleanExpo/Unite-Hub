---
paths: {**/*.test.ts,**/*.spec.ts,tests/**/*,__tests__/**/*}
---

# Testing Guidelines

## Test Structure

**235+ tests** (100% pass). Add tests for new features.

## Test Commands

```bash
npm run test              # Run Vitest tests
npm run test:e2e          # Playwright E2E tests
npm run typecheck         # TypeScript validation
```

## Test Patterns

**Unit Tests** (Vitest):
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

**API Tests**:
```typescript
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/route';

it('should validate workspace', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    query: { workspaceId: 'test-id' }
  });
  
  await handler(req, res);
  expect(res._getStatusCode()).toBe(200);
});
```

**E2E Tests** (Playwright):
```typescript
import { test, expect } from '@playwright/test';

test('should load dashboard', async ({ page }) => {
  await page.goto('http://localhost:3008/dashboard');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

## Testing Requirements

- **Unit tests** for business logic
- **Integration tests** for API routes  
- **E2E tests** for critical user flows
- **All acceptance criteria** must pass before marking feature complete
