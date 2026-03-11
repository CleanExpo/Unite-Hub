// Note: requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in .env.local
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('[type=email]', process.env.PLAYWRIGHT_TEST_EMAIL ?? '')
  await page.fill('[type=password]', process.env.PLAYWRIGHT_TEST_PASSWORD ?? '')
  await page.click('[type=submit]')
  await page.waitForURL('/founder/dashboard')
})

test('dashboard renders KPI grid', async ({ page }) => {
  await expect(page.locator('[data-testid="kpi-grid"]')).toBeVisible()
})

test('sidebar navigation works', async ({ page }) => {
  await page.click('a[href="/founder/kanban"]')
  await expect(page).toHaveURL('/founder/kanban')
})

test('vault page loads without error', async ({ page }) => {
  await page.goto('/founder/vault')
  await expect(page.locator('h1')).toContainText('Vault')
})
