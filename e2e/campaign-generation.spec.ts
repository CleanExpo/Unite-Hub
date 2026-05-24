import { test, expect } from '@playwright/test'

/**
 * Campaign Generation — E2E Smoke Tests
 *
 * Verifies the campaign generation page has the required elements.
 * Campaign generation is part of the campaigns section (/founder/campaigns).
 */

test.describe('Campaign Generation', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/campaigns')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated campaign generation tests
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test generation elements.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('campaigns page loads with generation capability', async ({ page }) => {
      await page.goto('/founder/campaigns')

      await expect(page).toHaveURL(/\/founder\/campaigns/)
      await expect(page.locator('body')).not.toContainText('Application error')
    })

    test('campaigns page has business selector or campaign list', async ({ page }) => {
      await page.goto('/founder/campaigns')

      // The campaign page should show either:
      // - A business selector to choose which business to generate campaigns for
      // - A list of existing campaigns
      // - A generate/create button
      const body = page.locator('body')
      await expect(body).not.toBeEmpty()

      // Check for campaign-related interactive elements
      const hasSelector = await page.locator('select, [role="combobox"], [data-testid="business-selector"]').count()
      const hasCampaignList = await page.locator('[data-testid="campaign-list"], table, [role="grid"]').count()
      const hasGenerateButton = await page.getByRole('button', { name: /generate|create|new/i }).count()

      // At least one of these elements should be present
      expect(
        hasSelector + hasCampaignList + hasGenerateButton,
        'Campaign page should have a selector, campaign list, or generate button'
      ).toBeGreaterThan(0)
    })
  })
})
