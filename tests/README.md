# Unite-Hub Test Suite

Quick reference for the Unite-Hub testing infrastructure.

---

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## Test Structure

```
tests/
├── helpers/          # Reusable test utilities
│   ├── auth.ts       # Mock users, sessions, auth
│   ├── db.ts         # Mock data factories
│   └── api.ts        # API request helpers
│
├── unit/             # Fast, isolated tests
│   ├── lib/          # Library functions
│   └── agents/       # AI agent logic
│
├── integration/      # API + database tests
│   └── api/          # API endpoint tests
│
├── components/       # React component tests
│
└── e2e/              # Full user flow tests
```

---

## Writing Tests

### Use Test Helpers

```typescript
// Import from helpers
import { TEST_USER, createMockContact } from '../helpers/auth';
import { createAuthenticatedRequest } from '../helpers/api';
```

### Mock Supabase

```typescript
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(async () => mockSupabase),
}));
```

### Test Components

```typescript
import { render, screen } from '@testing-library/react';

render(<MyComponent />);
expect(screen.getByText('Expected')).toBeInTheDocument();
```

---

## Common Tasks

### Run Specific Test
```bash
npx vitest tests/unit/lib/rate-limit.test.ts
```

### Debug Test
```bash
npx vitest --inspect-brk
```

### Update Snapshots
```bash
npx vitest -u
```

### View Coverage
```bash
npm run test:coverage
open coverage/index.html
```

---

## Test Patterns

### Unit Test
```typescript
describe('functionName', () => {
  it('should do something', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });
});
```

### Component Test
```typescript
it('should render correctly', () => {
  render(<Component prop="value" />);
  expect(screen.getByText('Text')).toBeInTheDocument();
});
```

### API Test
```typescript
it('should return 200', async () => {
  const req = createAuthenticatedRequest({...});
  const response = await GET(req);
  expect(response.status).toBe(200);
});
```

### E2E Test
```typescript
test('should complete flow', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page).toHaveURL(/success/);
});
```

---

## Coverage Goals

- **Minimum**: 40% overall
- **Target**: 70% overall
- **Critical paths**: 90%

---

## Need Help?

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive documentation.
