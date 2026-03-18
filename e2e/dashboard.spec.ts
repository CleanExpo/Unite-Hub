import { test, expect } from '@playwright/test'

/**
 * Dashboard — E2E Smoke Tests
 *
 * Verifies the dashboard page behaviour for both unauthenticated
 * and authenticated users.
 */

test.describe('Dashboard', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/dashboard')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated tests
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test authenticated behaviour.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('dashboard page loads and renders KPI cards', async ({ page }) => {
      await expect(page).toHaveURL(/\/founder\/dashboard/)
      await expect(page.locator('body')).not.toContainText('Application error')

      // KPI grid should be present
      const kpiGrid = page.locator('[data-testid="kpi-grid"]')
      await expect(kpiGrid).toBeVisible()
    })

    test('dashboard has no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      await page.goto('/founder/dashboard')
      await page.waitForLoadState('networkidle')

      // Filter out known benign errors (e.g. Supabase realtime in test env)
      const criticalErrors = errors.filter(
        (e) => !e.includes('realtime') && !e.includes('WebSocket')
      )
      expect(criticalErrors).toHaveLength(0)
    })
  })
})
