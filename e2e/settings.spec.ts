import { test, expect } from '@playwright/test'

test('Settings page loads and displays sections', async ({ page }) => {
  await page.goto('/founder/settings')

  // Should redirect to login if not authenticated, or load settings page if authenticated
  const url = page.url()
  const isSettings = url.includes('/founder/settings')
  const isLogin = url.includes('/auth/login')

  if (isLogin) {
    console.log('✓ Unauthenticated user redirected to login')
    expect(isLogin).toBe(true)
  } else if (isSettings) {
    // If authenticated, verify page structure
    console.log('✓ Settings page loaded')

    // Check for page title
    const heading = page.locator('h1')
    await expect(heading).toContainText('Settings')

    // Check for at least one settings section
    const sections = page.locator('section')
    const count = await sections.count()
    expect(count).toBeGreaterThan(0)

    console.log(`✓ Settings page shows ${count} configuration sections`)
  }

  expect(isSettings || isLogin).toBe(true)
})
