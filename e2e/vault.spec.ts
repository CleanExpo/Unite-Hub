import { test, expect, loginAsFounder } from './fixtures/auth'

test.beforeEach(async ({ page }) => {
  await loginAsFounder(page)
})

test('vault page loads without error', async ({ page }) => {
  await page.goto('/founder/vault')
  await expect(page).toHaveURL('/founder/vault')
  await expect(page.locator('h1')).toBeVisible()
})
