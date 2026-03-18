import { test, expect } from '@playwright/test'

/**
 * Settings — E2E Smoke Tests
 *
 * Verifies the settings page loads correctly.
 * The settings page is an authenticated route under /founder/settings.
 */

test.describe('Settings', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/settings')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated settings tests
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test settings content.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('settings page loads without error', async ({ page }) => {
      await page.goto('/founder/settings')

      await expect(page).toHaveURL(/\/founder\/settings/)
      await expect(page.locator('body')).not.toContainText('Application error')
      await expect(page.locator('body')).not.toContainText('500')
    })

    test('settings page displays heading', async ({ page }) => {
      await page.goto('/founder/settings')

      const heading = page.locator('h1')
      await expect(heading).toContainText('Settings')
    })

    test('settings page has configuration sections', async ({ page }) => {
      await page.goto('/founder/settings')

      const sections = page.locator('section')
      const count = await sections.count()
      expect(count).toBeGreaterThan(0)
    })
  })
})
