import { test, expect, loginAsFounder } from './fixtures/auth'

test('vault page renders heading', async ({ page }) => {
  await loginAsFounder(page)
  await page.goto('/founder/vault')
  await expect(page.getByRole('heading', { name: /vault/i, level: 1 })).toBeVisible()
})

test('vault page shows lock screen or entry grid', async ({ page }) => {
  await loginAsFounder(page)
  await page.goto('/founder/vault')
  // Either the lock screen OR the vault grid is rendered — both are valid initial states
  // They are not tested simultaneously; we confirm the page isn't blank
  await expect(page.locator('body')).not.toBeEmpty()
  // Check for vault-specific content (lock form or grid)
  const hasLock = await page.locator('[data-testid="vault-lock"], input[type="password"]').count()
  const hasGrid = await page.locator('[data-testid="vault-grid"], [data-testid="vault-entry"]').count()
  expect(hasLock + hasGrid).toBeGreaterThan(0)
})
