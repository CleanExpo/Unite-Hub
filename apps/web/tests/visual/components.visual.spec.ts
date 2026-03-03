/**
 * Visual Regression Tests - Components
 *
 * These tests capture visual snapshots of UI components to detect
 * unintended visual changes. Percy compares screenshots against
 * baseline images and flags any differences.
 *
 * Installation:
 * - pnpm add -D @percy/playwright (already installed)
 *
 * Setup:
 * 1. Sign up at https://percy.io
 * 2. Create a project and get PERCY_TOKEN
 * 3. Set environment variable: export PERCY_TOKEN=<your-token>
 *
 * Run tests:
 * - npx percy exec -- playwright test tests/visual
 *
 * CI Integration:
 * - Percy runs automatically in CI with PERCY_TOKEN secret
 */

import { test, expect } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Visual Regression - Dashboard Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard or component showcase page
    await page.goto('/')
  })

  test('Agent List Component - Default State', async ({ page }) => {
    // Navigate to a page with Agent List or mock the component
    await page.goto('/dashboard')

    // Wait for component to render
    await page.waitForSelector('[data-testid="agent-list"]', { timeout: 5000 })

    // Take Percy snapshot
    await percySnapshot(page, 'Agent List - Default State', {
      widths: [375, 768, 1280], // Mobile, Tablet, Desktop
    })
  })

  test('Agent List Component - With Active Agents', async ({ page }) => {
    // Set up test data or navigate to test environment
    await page.goto('/dashboard?test=active-agents')

    await page.waitForSelector('[data-testid="agent-list"]', { timeout: 5000 })

    await percySnapshot(page, 'Agent List - Active Agents', {
      widths: [375, 768, 1280],
    })
  })

  test('Agent List Component - Empty State', async ({ page }) => {
    await page.goto('/dashboard?test=empty-agents')

    await page.waitForSelector('[data-testid="agent-list"]', { timeout: 5000 })

    await percySnapshot(page, 'Agent List - Empty State', {
      widths: [375, 768, 1280],
    })
  })

  test('Queue Stats Component - Various States', async ({ page }) => {
    await page.goto('/dashboard')

    await page.waitForSelector('[data-testid="queue-stats"]', { timeout: 5000 })

    // Capture baseline
    await percySnapshot(page, 'Queue Stats - Normal Load', {
      widths: [375, 768, 1280],
    })

    // Test different data states (would require API mocking or test endpoints)
    // Example: High load state
    await page.goto('/dashboard?test=high-load')
    await percySnapshot(page, 'Queue Stats - High Load', {
      widths: [375, 768, 1280],
    })
  })

  test('Queue Stats Component - Color Coding', async ({ page }) => {
    await page.goto('/dashboard')

    await page.waitForSelector('[data-testid="queue-stats"]', { timeout: 5000 })

    // Verify color-coded stats are rendered correctly
    await percySnapshot(page, 'Queue Stats - Color Coding', {
      widths: [768, 1280],
      percyCSS: `
        /* Hide dynamic elements that change frequently */
        [data-testid="timestamp"] { opacity: 0; }
      `,
    })
  })
})

test.describe('Visual Regression - Form Components', () => {
  test('Task Submission Form - Default State', async ({ page }) => {
    await page.goto('/tasks/new')

    await page.waitForSelector('[data-testid="task-submission-form"]', {
      timeout: 5000,
    })

    await percySnapshot(page, 'Task Form - Default State', {
      widths: [375, 768, 1280],
    })
  })

  test('Task Submission Form - Filled State', async ({ page }) => {
    await page.goto('/tasks/new')

    await page.waitForSelector('[data-testid="task-submission-form"]', {
      timeout: 5000,
    })

    // Fill form fields
    await page.fill('[name="title"]', 'Test Task')
    await page.fill('[name="description"]', 'This is a test task description')
    await page.selectOption('[name="priority"]', 'high')

    await percySnapshot(page, 'Task Form - Filled State', {
      widths: [375, 768, 1280],
    })
  })

  test('Task Submission Form - Validation Errors', async ({ page }) => {
    await page.goto('/tasks/new')

    await page.waitForSelector('[data-testid="task-submission-form"]', {
      timeout: 5000,
    })

    // Trigger validation by submitting empty form
    await page.click('button[type="submit"]')

    // Wait for error messages
    await page.waitForSelector('.error-message', { timeout: 2000 })

    await percySnapshot(page, 'Task Form - Validation Errors', {
      widths: [375, 768, 1280],
    })
  })

  test('Task Submission Form - Loading State', async ({ page }) => {
    await page.goto('/tasks/new')

    await page.waitForSelector('[data-testid="task-submission-form"]', {
      timeout: 5000,
    })

    // Fill and submit form
    await page.fill('[name="title"]', 'Test Task')
    await page.fill('[name="description"]', 'Test description')

    // Intercept API call to delay response
    await page.route('**/api/tasks', (route) => {
      setTimeout(() => route.continue(), 3000)
    })

    await page.click('button[type="submit"]')

    // Capture loading state
    await page.waitForSelector('[data-loading="true"]', { timeout: 1000 })

    await percySnapshot(page, 'Task Form - Loading State', {
      widths: [375, 768, 1280],
    })
  })
})

test.describe('Visual Regression - PRD Generation Flow', () => {
  test('PRD Form - Initial State', async ({ page }) => {
    await page.goto('/prd/generate')

    await page.waitForSelector('form', { timeout: 5000 })

    await percySnapshot(page, 'PRD Form - Initial', {
      widths: [375, 768, 1280, 1920],
    })
  })

  test('PRD Form - With Input', async ({ page }) => {
    await page.goto('/prd/generate')

    await page.waitForSelector('form', { timeout: 5000 })

    // Fill form
    await page.fill('[name="product_name"]', 'Test Product')
    await page.fill('[name="description"]', 'A comprehensive test product')
    await page.fill('[name="target_audience"]', 'Developers')

    await percySnapshot(page, 'PRD Form - Filled', {
      widths: [375, 768, 1280],
    })
  })

  test('PRD Progress - In Progress', async ({ page }) => {
    // Mock progress state
    await page.goto('/prd/status/test-run-123')

    await page.waitForSelector('[data-testid="prd-progress"]', { timeout: 5000 })

    await percySnapshot(page, 'PRD Progress - 50%', {
      widths: [375, 768, 1280],
    })
  })

  test('PRD Result - Completed', async ({ page }) => {
    await page.goto('/prd/result/test-prd-123')

    await page.waitForSelector('[data-testid="prd-result"]', { timeout: 5000 })

    await percySnapshot(page, 'PRD Result - Completed', {
      widths: [768, 1280, 1920],
      minHeight: 1024, // Capture full document
    })
  })
})

test.describe('Visual Regression - Responsive Design', () => {
  test('Homepage - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/')

    await percySnapshot(page, 'Homepage - Mobile (375px)', {
      widths: [375],
    })
  })

  test('Homepage - Tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad
    await page.goto('/')

    await percySnapshot(page, 'Homepage - Tablet (768px)', {
      widths: [768],
    })
  })

  test('Homepage - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    await percySnapshot(page, 'Homepage - Desktop (1920px)', {
      widths: [1920],
    })
  })

  test('Dashboard - Responsive Grid', async ({ page }) => {
    await page.goto('/dashboard')

    // Test grid layout at different breakpoints
    await percySnapshot(page, 'Dashboard - Responsive Grid', {
      widths: [375, 768, 1024, 1280, 1920],
    })
  })
})

test.describe('Visual Regression - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
  })

  test('Dashboard - Dark Mode', async ({ page }) => {
    await page.goto('/dashboard')

    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 })

    await percySnapshot(page, 'Dashboard - Dark Mode', {
      widths: [768, 1280],
    })
  })

  test('PRD Form - Dark Mode', async ({ page }) => {
    await page.goto('/prd/generate')

    await page.waitForSelector('form', { timeout: 5000 })

    await percySnapshot(page, 'PRD Form - Dark Mode', {
      widths: [768, 1280],
    })
  })

  test('Components - Dark Mode Contrast', async ({ page }) => {
    await page.goto('/dashboard')

    await percySnapshot(page, 'Components - Dark Mode Contrast', {
      widths: [1280],
      percyCSS: `
        /* Highlight contrast issues */
        .low-contrast { outline: 2px solid red; }
      `,
    })
  })
})

test.describe('Visual Regression - Animation States', () => {
  test('Loading Spinners', async ({ page }) => {
    await page.goto('/dashboard?loading=true')

    // Wait for spinner to appear
    await page.waitForSelector('[data-testid="loading-spinner"]', {
      timeout: 2000,
    })

    await percySnapshot(page, 'Loading Spinner', {
      widths: [375, 768, 1280],
      enableJavaScript: false, // Freeze animations
    })
  })

  test('Progress Bars', async ({ page }) => {
    await page.goto('/prd/status/test-run-123')

    await page.waitForSelector('[role="progressbar"]', { timeout: 2000 })

    await percySnapshot(page, 'Progress Bar - 50%', {
      widths: [375, 768, 1280],
    })
  })

  test('Toast Notifications', async ({ page }) => {
    await page.goto('/dashboard')

    // Trigger a toast notification
    await page.click('[data-action="show-success-toast"]')

    await page.waitForSelector('[data-testid="toast"]', { timeout: 2000 })

    await percySnapshot(page, 'Toast - Success', {
      widths: [375, 768, 1280],
    })
  })
})

test.describe('Visual Regression - Accessibility Features', () => {
  test('Focus States', async ({ page }) => {
    await page.goto('/prd/generate')

    // Tab through form to show focus indicators
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await percySnapshot(page, 'Focus States - Form', {
      widths: [768, 1280],
    })
  })

  test('High Contrast Mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await page.goto('/dashboard')

    await percySnapshot(page, 'High Contrast Mode', {
      widths: [1280],
    })
  })

  test('Reduced Motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')

    await percySnapshot(page, 'Reduced Motion', {
      widths: [1280],
    })
  })
})
