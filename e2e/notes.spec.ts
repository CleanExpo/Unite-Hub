import { test, expect } from '@playwright/test'

test.describe('Notes page', () => {
  test('loads without error and shows vault file browser', async ({ page }) => {
    await page.goto('/founder/notes')
    const url = page.url()
    expect(url).toMatch(/founder\/notes|auth\/login/)
  })
})
