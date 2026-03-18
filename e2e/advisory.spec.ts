import { test, expect } from '@playwright/test'

/**
 * Advisory Workbench — E2E Smoke Tests
 *
 * Verifies the MACAS advisory workbench page loads correctly.
 * The advisory page is an authenticated route under /founder/advisory.
 */

test.describe('Advisory Workbench', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/advisory')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated advisory tests
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test the advisory workbench.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('advisory page loads without error', async ({ page }) => {
      await page.goto('/founder/advisory')

      await expect(page).toHaveURL(/\/founder\/advisory/)
      await expect(page.locator('body')).not.toContainText('Application error')
      await expect(page.locator('body')).not.toContainText('500')
    })

    test('advisory page renders workbench heading', async ({ page }) => {
      await page.goto('/founder/advisory')

      const heading = page.getByRole('heading', { name: /advisory/i })
      await expect(heading).toBeVisible()
    })
  })
})
