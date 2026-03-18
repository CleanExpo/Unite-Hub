import { test, expect } from '@playwright/test'

/**
 * Approvals — E2E Smoke Tests
 *
 * Verifies the approvals page loads correctly.
 * The approvals page is an authenticated route under /founder/approvals.
 */

test.describe('Approvals', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/approvals')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated approvals tests
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test approvals content.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('approvals page loads without error', async ({ page }) => {
      await page.goto('/founder/approvals')

      await expect(page).toHaveURL(/\/founder\/approvals/)
      await expect(page.locator('body')).not.toContainText('Application error')
      await expect(page.locator('body')).not.toContainText('500')
    })

    test('approvals page renders heading', async ({ page }) => {
      await page.goto('/founder/approvals')

      const heading = page.getByRole('heading', { name: /approval/i })
      await expect(heading).toBeVisible()
    })
  })
})
