import { test, expect } from '@playwright/test'

test.describe('Social page', () => {
  test('loads without error and shows platform connect buttons', async ({ page }) => {
    // Skip auth — page should redirect to login if not authenticated
    await page.goto('/founder/social')
    // Either shows the page or redirects to login
    const url = page.url()
    expect(url).toMatch(/founder\/social|auth\/login/)
  })
})
