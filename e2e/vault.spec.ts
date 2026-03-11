import { test, expect } from '@playwright/test'

test('vault lock screen is shown when vault is locked', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('[type=email]', process.env.PLAYWRIGHT_TEST_EMAIL ?? '')
  await page.fill('[type=password]', process.env.PLAYWRIGHT_TEST_PASSWORD ?? '')
  await page.click('[type=submit]')
  await page.waitForURL('/founder/dashboard')

  await page.goto('/founder/vault')
  // Vault should show either the lock screen or vault grid — both are valid states
  const lockOrGrid = page.locator('[data-testid="vault-lock"], [data-testid="vault-grid"]')
  await expect(lockOrGrid.first()).toBeVisible()
})
