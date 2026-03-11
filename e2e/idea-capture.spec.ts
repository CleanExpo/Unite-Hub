import { test, expect, loginAsFounder } from './fixtures/auth'

test.beforeEach(async ({ page }) => {
  await loginAsFounder(page)
})

test('capture panel opens from topbar', async ({ page }) => {
  await page.click('[aria-label="Capture idea"]')
  await expect(page.getByRole('heading').filter({ hasText: /capture/i })).toBeVisible()
  await expect(page.locator('textarea')).toBeVisible()
})
