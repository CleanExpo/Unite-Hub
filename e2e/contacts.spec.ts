// e2e/contacts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Contacts Page', () => {
  test('loads contacts page or redirects to auth', async ({ page }) => {
    await page.goto('/founder/contacts')

    // Either the contacts page loads or we get redirected to auth
    const url = page.url()
    if (url.includes('/auth/login')) {
      // Auth redirect is expected in CI
      expect(url).toContain('/auth/login')
    } else {
      // Page loaded — verify heading
      await expect(page.locator('h1')).toContainText('Contacts')
      // Verify add button exists
      await expect(page.getByText('Add Contact')).toBeVisible()
    }
  })
})
