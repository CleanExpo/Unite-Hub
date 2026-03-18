import { test, expect } from '@playwright/test'

/**
 * Campaign Dashboard — E2E Smoke Tests
 *
 * Verifies the campaign dashboard page loads correctly.
 * The campaigns page is an authenticated route under /founder/campaigns.
 */

test.describe('Campaign Dashboard', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/campaigns')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated campaign tests
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test campaign dashboard content.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('campaigns page loads without error', async ({ page }) => {
      await page.goto('/founder/campaigns')

      await expect(page).toHaveURL(/\/founder\/campaigns/)
      await expect(page.locator('body')).not.toContainText('Application error')
      await expect(page.locator('body')).not.toContainText('500')
    })

    test('campaigns page renders heading', async ({ page }) => {
      await page.goto('/founder/campaigns')

      const heading = page.getByRole('heading', { name: /campaign/i })
      await expect(heading).toBeVisible()
    })
  })
})
