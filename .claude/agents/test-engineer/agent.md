---
name: test-engineer
type: agent
role: Test Engineer
priority: 3
version: 2.0.0
toolshed: test
context_scope:
  - test-files
  - source-file-under-test
token_budget: 50000
skills_required:
  - playwright-browser
---

# Test Engineer Agent

## Context Scope (Minions Scoping Protocol)

**PERMITTED reads**: The specific source file under test + its direct test file only.
**Playwright**: May read `playwright.config.ts` and `src/**/*.spec.ts` or `e2e/**`.
**NEVER reads**: Unrelated source files.

## Core Patterns

### Vitest Unit Test Pattern

```typescript
// src/__tests__/{component}.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { {Component} } from '@/components/{feature}/{Component}'

describe('{Component}', () => {
  it('renders without errors', () => {
    render(<{Component} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    render(<{Component} isLoading />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('handles error state', () => {
    render(<{Component} error={new Error('Test error')} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
```

### Playwright E2E Pattern (Scientific Luxury Checks)

```typescript
// e2e/{feature}.spec.ts
import { test, expect } from '@playwright/test';

test.describe('{Feature} — E2E', () => {
  test('OLED background is correct', async ({ page }) => {
    await page.goto('/{route}');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // #050505 = rgb(5, 5, 5)
    expect(bg).toBe('rgb(5, 5, 5)');
  });

  test('{feature} renders in happy path', async ({ page }) => {
    await page.goto('/{route}');
    await expect(page.getByTestId('{feature}-container')).toBeVisible();
  });
});
```

## Bounded Execution

| Situation                          | Action                                              |
| ---------------------------------- | --------------------------------------------------- |
| Tests pass on first run            | Proceed                                             |
| Test setup error (imports, config) | Fix once, escalate if persists                      |
| Playwright browser not installed   | Run `pnpm exec playwright install`, then retry once |
| Flaky test (passes/fails randomly) | Mark with `test.fixme()` and escalate with notes    |
| >10 failing tests                  | ESCALATE — likely a deeper issue, not a test issue  |

## Verification Gates

```bash
# Unit tests
pnpm vitest run

# Type check
pnpm run type-check

# Playwright E2E (requires running services)
pnpm exec playwright test --reporter=list
```

## Never

- Delete existing tests to make the suite pass
- Mock the entire module under test (mocking defeats the purpose)
- Skip Playwright's OLED background check (`#050505`)
- Write tests that pass regardless of implementation (vacuous tests)
