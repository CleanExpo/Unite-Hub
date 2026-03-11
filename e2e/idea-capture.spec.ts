import { test, expect } from '@playwright/test'

test('capture panel opens from topbar', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('[type=email]', process.env.PLAYWRIGHT_TEST_EMAIL ?? '')
  await page.fill('[type=password]', process.env.PLAYWRIGHT_TEST_PASSWORD ?? '')
  await page.click('[type=submit]')
  await page.waitForURL('/founder/dashboard')

  await page.click('[aria-label="Capture idea"]')
  await expect(page.locator('text=Capture Idea')).toBeVisible()
  await expect(page.locator('textarea')).toBeVisible()
})
