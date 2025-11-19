# Phase 2 – Testing Complete Guide

**Created**: 2025-11-19
**Status**: 📋 Testing Strategy
**Priority**: P1 (Required for Production)
**Estimated Time**: 8-12 hours

---

## Overview

This document defines the comprehensive testing strategy for Unite-Hub's Phase 2 staff and client portals. Testing ensures production readiness with E2E tests, component tests, API tests, and database security (RLS) tests.

---

## Testing Stack

### Tools & Frameworks

- **Vitest** - Unit and integration tests (already configured)
- **Playwright** - End-to-end browser tests
- **React Testing Library** - Component tests
- **MSW (Mock Service Worker)** - API mocking
- **Supertest** - API route testing
- **@supabase/supabase-js** - RLS policy testing

### Installation

```bash
# Already installed
npm install --save-dev vitest @vitejs/plugin-react

# Add E2E testing
npm install --save-dev @playwright/test

# Add component testing
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Add API mocking
npm install --save-dev msw

# Add API testing
npm install --save-dev supertest @types/supertest
```

---

## Test Coverage Goals

### Minimum Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| **Unit Tests** | 80% | P1 |
| **Integration Tests** | 70% | P1 |
| **E2E Tests** | Critical flows | P0 |
| **Component Tests** | 75% | P1 |
| **API Tests** | 90% | P0 |
| **RLS Tests** | 100% | P0 |

---

## Test Structure

```
tests/
├── unit/                      # Unit tests (pure functions)
│   ├── lib/
│   │   ├── auth.test.ts
│   │   └── validators.test.ts
│   └── utils/
│
├── integration/               # Integration tests (API + DB)
│   ├── api/
│   │   ├── staff.test.ts
│   │   ├── client.test.ts
│   │   └── ai.test.ts
│   └── services/
│       ├── staffService.test.ts
│       └── clientService.test.ts
│
├── components/                # Component tests (React)
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   └── Toast.test.tsx
│   ├── staff/
│   │   └── TaskCard.test.tsx
│   └── client/
│       └── IdeaRecorder.test.tsx
│
├── e2e/                       # End-to-end tests (Playwright)
│   ├── staff-auth.spec.ts
│   ├── staff-tasks.spec.ts
│   ├── client-ideas.spec.ts
│   └── client-vault.spec.ts
│
├── security/                  # Security tests (RLS, auth)
│   ├── rls-staff.test.ts
│   └── rls-client.test.ts
│
└── fixtures/                  # Test data and mocks
    ├── staff.ts
    ├── client.ts
    └── handlers.ts            # MSW handlers
```

---

## Implementation Guide

### Step 1: E2E Tests (Playwright)

**File**: `tests/e2e/staff-auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Staff Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('http://localhost:3008/staff');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should allow staff login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3008/auth/login');

    // Fill login form
    await page.fill('input[type="email"]', 'staff@unite-hub.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to staff dashboard
    await expect(page).toHaveURL(/\/staff/);

    // Should display staff name in header
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3008/auth/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error toast
    await expect(page.locator('text=/Invalid email or password/i')).toBeVisible();
  });

  test('should allow staff logout', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3008/auth/login');
    await page.fill('input[type="email"]', 'staff@unite-hub.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/staff/);

    // Click logout button
    await page.click('button[title="Logout"]');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);

    // Should show success toast
    await expect(page.locator('text=/Logged out successfully/i')).toBeVisible();
  });
});
```

**File**: `tests/e2e/staff-tasks.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Staff Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3008/auth/login');
    await page.fill('input[type="email"]', 'staff@unite-hub.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/staff/);
  });

  test('should display task list', async ({ page }) => {
    await page.goto('http://localhost:3008/staff/tasks');

    // Should display tasks
    await expect(page.locator('[data-testid="task-card"]').first()).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('http://localhost:3008/staff/tasks');

    // Click "In Progress" filter
    await page.selectOption('select[name="status"]', 'in_progress');

    // Wait for API call
    await page.waitForTimeout(500);

    // Should only show in-progress tasks
    const tasks = page.locator('[data-testid="task-card"]');
    await expect(tasks.first()).toContainText('In Progress');
  });

  test('should update task status', async ({ page }) => {
    await page.goto('http://localhost:3008/staff/tasks');

    // Find first task
    const firstTask = page.locator('[data-testid="task-card"]').first();

    // Change status
    await firstTask.locator('select[name="status"]').selectOption('completed');

    // Should show success toast
    await expect(page.locator('text=/Task status updated/i')).toBeVisible();
  });

  test('should show loading state while fetching tasks', async ({ page }) => {
    await page.goto('http://localhost:3008/staff/tasks');

    // Should show spinner initially
    await expect(page.locator('[role="status"]')).toBeVisible();

    // Spinner should disappear after loading
    await expect(page.locator('[role="status"]')).not.toBeVisible({ timeout: 5000 });
  });
});
```

**File**: `tests/e2e/client-ideas.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Client Ideas', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('http://localhost:3008/client/login');
    await page.fill('input[type="email"]', 'client@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/client/);
  });

  test('should submit new idea', async ({ page }) => {
    await page.goto('http://localhost:3008/client/ideas');

    // Fill idea form
    await page.fill('input[name="title"]', 'My New App Idea');
    await page.fill('textarea[name="description"]', 'A revolutionary app that solves real problems for users.');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success toast
    await expect(page.locator('text=/Idea submitted successfully/i')).toBeVisible();

    // Form should be reset
    await expect(page.locator('input[name="title"]')).toHaveValue('');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('http://localhost:3008/client/ideas');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/Title must be at least 5 characters/i')).toBeVisible();
    await expect(page.locator('text=/Description must be at least 20 characters/i')).toBeVisible();
  });
});
```

**Configure Playwright** (`playwright.config.ts`):

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3008',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3008',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Step 2: Component Tests

**File**: `tests/components/ui/Button.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading spinner when loading prop is true', () => {
    render(<Button loading>Click Me</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

**File**: `tests/components/staff/TaskCard.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from '@/components/staff/TaskCard';

const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'high',
  deadline: '2025-12-31',
};

describe('TaskCard Component', () => {
  it('should render task information', () => {
    render(<TaskCard task={mockTask} onStatusChange={jest.fn()} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onStatusChange when status is changed', async () => {
    const handleStatusChange = jest.fn();
    render(<TaskCard task={mockTask} onStatusChange={handleStatusChange} />);

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(handleStatusChange).toHaveBeenCalledWith('1', 'completed');
    });
  });

  it('should display priority badge', () => {
    render(<TaskCard task={mockTask} onStatusChange={jest.fn()} />);

    expect(screen.getByText('high')).toBeInTheDocument();
  });
});
```

---

### Step 3: API Route Tests

**File**: `tests/integration/api/staff.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/staff/tasks/route';

// Mock Supabase
jest.mock('@/lib/auth/supabase', () => ({
  getStaffSession: jest.fn(() => ({
    user: { id: 'staff-123' },
    staff: { id: 'staff-123', role: 'developer', active: true },
  })),
}));

describe('GET /api/staff/tasks', () => {
  it('should return tasks for authenticated staff', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/staff/tasks',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should filter tasks by status', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/staff/tasks?status=completed',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.every((task: any) => task.status === 'completed')).toBe(true);
  });

  it('should return 401 for unauthenticated requests', async () => {
    // Mock unauthenticated session
    jest.mock('@/lib/auth/supabase', () => ({
      getStaffSession: jest.fn(() => null),
    }));

    const { req } = createMocks({
      method: 'GET',
      url: '/api/staff/tasks',
    });

    const response = await GET(req as any);
    expect(response.status).toBe(401);
  });
});
```

---

### Step 4: RLS Policy Tests

**File**: `tests/security/rls-staff.test.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

describe('Staff RLS Policies', () => {
  let staffUserId: string;
  let otherStaffUserId: string;

  beforeAll(async () => {
    // Create test users
    const { data: user1 } = await supabaseAdmin.auth.admin.createUser({
      email: 'staff1@test.com',
      password: 'password123',
    });
    staffUserId = user1!.user!.id;

    const { data: user2 } = await supabaseAdmin.auth.admin.createUser({
      email: 'staff2@test.com',
      password: 'password123',
    });
    otherStaffUserId = user2!.user!.id;

    // Create staff records
    await supabaseAdmin.from('staff_users').insert([
      { id: staffUserId, email: 'staff1@test.com', role: 'developer', active: true },
      { id: otherStaffUserId, email: 'staff2@test.com', role: 'developer', active: true },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await supabaseAdmin.from('staff_users').delete().in('id', [staffUserId, otherStaffUserId]);
    await supabaseAdmin.auth.admin.deleteUser(staffUserId);
    await supabaseAdmin.auth.admin.deleteUser(otherStaffUserId);
  });

  it('should allow staff to view their own tasks', async () => {
    // Create client as staff user
    const supabaseStaff = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Sign in as staff1
    await supabaseStaff.auth.signInWithPassword({
      email: 'staff1@test.com',
      password: 'password123',
    });

    // Create task for staff1
    const { data: task } = await supabaseAdmin.from('tasks').insert({
      assigned_to: staffUserId,
      title: 'Test Task',
      status: 'todo',
    }).select().single();

    // Staff1 should see their own task
    const { data: tasks } = await supabaseStaff
      .from('tasks')
      .select('*')
      .eq('assigned_to', staffUserId);

    expect(tasks).toHaveLength(1);
    expect(tasks![0].id).toBe(task!.id);
  });

  it('should NOT allow staff to view other staff tasks (if my_tasks_only filter)', async () => {
    const supabaseStaff = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    await supabaseStaff.auth.signInWithPassword({
      email: 'staff1@test.com',
      password: 'password123',
    });

    // Create task for staff2
    await supabaseAdmin.from('tasks').insert({
      assigned_to: otherStaffUserId,
      title: 'Other Staff Task',
      status: 'todo',
    });

    // Staff1 queries with my_tasks_only filter
    const { data: tasks } = await supabaseStaff
      .from('tasks')
      .select('*')
      .eq('assigned_to', staffUserId); // Only their tasks

    // Should NOT include staff2's task
    expect(tasks!.every((task) => task.assigned_to === staffUserId)).toBe(true);
  });
});
```

**File**: `tests/security/rls-client.test.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

describe('Client RLS Policies', () => {
  let clientUserId: string;
  let otherClientUserId: string;

  beforeAll(async () => {
    // Create test client users
    // ... similar setup as staff RLS tests
  });

  it('should allow clients to view only their own ideas', async () => {
    // ... test implementation
  });

  it('should allow clients to create ideas', async () => {
    // ... test implementation
  });

  it('should NOT allow clients to view other clients\' vault entries', async () => {
    // ... test implementation
  });

  it('should allow clients to update only their own vault entries', async () => {
    // ... test implementation
  });
});
```

---

## Test Execution

### npm Scripts

**Update `package.json`**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:components": "vitest run tests/components",
    "test:security": "vitest run tests/security",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:components && npm run test:security && npm run test:e2e"
  }
}
```

### CI/CD Integration (GitHub Actions)

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

      - name: Run component tests
        run: npm run test:components

      - name: Run security tests
        run: npm run test:security
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Testing Checklist

### E2E Tests
- [ ] Staff authentication flow (login, logout, redirect)
- [ ] Staff task management (list, filter, update status)
- [ ] Staff project listing
- [ ] Client authentication flow
- [ ] Client idea submission
- [ ] Client vault CRUD operations
- [ ] Error handling (invalid credentials, API failures)
- [ ] Loading states visible during operations

### Component Tests
- [ ] Button component (all variants, states)
- [ ] Input component (validation, errors)
- [ ] Toast component (display, auto-dismiss)
- [ ] TaskCard component (render, interactions)
- [ ] IdeaRecorder component (form submission)
- [ ] Modal component (open, close, portal rendering)

### API Route Tests
- [ ] GET /api/staff/tasks (auth, filtering, pagination)
- [ ] POST /api/staff/tasks (create task, validation)
- [ ] PUT /api/staff/tasks/[id] (update, authorization)
- [ ] GET /api/staff/projects
- [ ] GET /api/staff/activity
- [ ] POST /api/client/ideas (create, validation)
- [ ] GET /api/client/vault
- [ ] POST /api/client/vault (create, encryption)
- [ ] Unauthorized access returns 401
- [ ] Invalid input returns 400

### RLS Security Tests
- [ ] Staff can view only their own tasks (with filter)
- [ ] Clients can view only their own ideas
- [ ] Clients can view only their own vault entries
- [ ] Clients cannot update other clients' data
- [ ] Unauthenticated users cannot access any data
- [ ] Admin users can view all data (if applicable)

### Service Layer Tests
- [ ] getStaffTasks() with filters
- [ ] updateTaskStatus() error handling
- [ ] submitIdea() validation
- [ ] getVaultEntries() authentication

---

## Next Steps

After completing testing:

1. Review test coverage report (`npm run test:coverage`)
2. Fix any failing tests
3. Add missing tests for uncovered code
4. Set up CI/CD pipeline (GitHub Actions)
5. Document testing guidelines for future development

---

**Status**: 📋 Ready for Implementation
**Estimated Time**: 8-12 hours
**Priority**: P1 (Required for production)
