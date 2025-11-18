# Unite-Hub Testing Guide

Quick reference for writing and running tests in the Unite-Hub project.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only

# Run specific test file
npx vitest tests/unit/components/ErrorState.test.tsx

# Run all tests (unit + integration + E2E)
npm run test:all
```

---

## Test Structure

```
tests/
├── helpers/              # Reusable test utilities
│   ├── auth.ts           # Mock users, sessions, auth
│   ├── db.ts             # Mock data factories
│   └── api.ts            # API request helpers
│
├── fixtures/             # Test data
│   └── index.ts          # Common scenarios, templates
│
├── utils/                # Test utilities
│   └── test-providers.tsx  # React context providers
│
├── unit/                 # Fast, isolated tests
│   ├── components/       # Component tests
│   ├── lib/              # Library function tests
│   └── agents/           # AI agent logic tests
│
├── integration/          # API + database tests
│   ├── api/              # API endpoint tests
│   └── features/         # Feature integration tests
│
└── e2e/                  # Full user flow tests
    ├── auth-flow.spec.ts
    └── dashboard.spec.ts
```

---

## Common Test Patterns

See the full guide in `tests/README.md` for detailed examples.

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';

it('should render component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### API Testing

```typescript
import { createAuthenticatedRequest } from '../helpers/api';

it('should return 200', async () => {
  const req = createAuthenticatedRequest({
    url: 'http://localhost:3008/api/contacts',
  });
  const response = await GET(req);
  expect(response.status).toBe(200);
});
```

---

**For complete documentation, see**:
- [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) - Current coverage status
- [tests/README.md](./tests/README.md) - Detailed testing patterns

---

**Last Updated**: 2025-11-18
