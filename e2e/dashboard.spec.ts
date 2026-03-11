import { test, expect, loginAsFounder } from './fixtures/auth'

test.beforeEach(async ({ page }) => {
  await loginAsFounder(page)
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
  await expect(page.getByRole('heading', { name: /vault/i, level: 1 })).toBeVisible()
})
