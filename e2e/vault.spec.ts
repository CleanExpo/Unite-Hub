import { test, expect } from '@playwright/test'

/**
 * Vault — E2E Smoke Tests
 *
 * Verifies the credentials vault page loads correctly.
 * The vault page is an authenticated route under /founder/vault.
 */

test.describe('Vault', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/vault')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated vault tests
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test vault content.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('vault page loads without error', async ({ page }) => {
      await page.goto('/founder/vault')

      await expect(page).toHaveURL(/\/founder\/vault/)
      await expect(page.locator('body')).not.toContainText('Application error')
      await expect(page.locator('body')).not.toContainText('500')
    })

    test('vault page renders heading', async ({ page }) => {
      await page.goto('/founder/vault')

      await expect(page.getByRole('heading', { name: /vault/i, level: 1 })).toBeVisible()
    })

    test('vault page shows lock screen or entry grid', async ({ page }) => {
      await page.goto('/founder/vault')

      // Either the lock screen OR the vault grid is rendered — both are valid initial states
      const hasLock = await page.locator('[data-testid="vault-lock"], input[type="password"]').count()
      const hasGrid = await page.locator('[data-testid="vault-grid"], [data-testid="vault-entry"]').count()
      expect(hasLock + hasGrid).toBeGreaterThan(0)
    })
  })
})
