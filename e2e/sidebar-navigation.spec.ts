import { test, expect } from '@playwright/test'

/**
 * Sidebar Navigation — E2E Smoke Tests
 *
 * Verifies the sidebar renders and contains links to all major sections.
 * Requires authentication since the sidebar is part of the /founder layout.
 */

test.describe('Sidebar Navigation', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/founder/dashboard')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  // TODO: Add auth fixture setup for authenticated sidebar tests
  // The sidebar is only rendered within the authenticated (founder) layout.
  // Once PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars are set,
  // use loginAsFounder() from ./fixtures/auth to test sidebar content.
  test.describe('authenticated', () => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Skipped: PLAYWRIGHT_TEST_EMAIL not set — auth fixture required'
    )

    test.beforeEach(async ({ page }) => {
      const { loginAsFounder } = await import('./fixtures/auth')
      await loginAsFounder(page)
    })

    test('sidebar renders with Nexus branding', async ({ page }) => {
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.getByText('NEXUS')).toBeVisible()
    })

    test('sidebar contains links to major sections', async ({ page }) => {
      const expectedLinks = [
        { href: '/founder/dashboard', label: 'Dashboard' },
        { href: '/founder/kanban', label: 'Kanban' },
        { href: '/founder/vault', label: 'Vault' },
        { href: '/founder/approvals', label: 'Approvals' },
        { href: '/founder/advisory', label: 'Advisory' },
        { href: '/founder/campaigns', label: 'Campaigns' },
        { href: '/founder/contacts', label: 'Contacts' },
        { href: '/founder/settings', label: 'Settings' },
      ]

      for (const { href, label } of expectedLinks) {
        const link = page.locator(`a[href="${href}"]`)
        await expect(link, `Sidebar link "${label}" should exist`).toBeVisible()
      }
    })

    test('sidebar navigation links are clickable', async ({ page }) => {
      const kanbanLink = page.locator('a[href="/founder/kanban"]')
      await kanbanLink.click()
      await expect(page).toHaveURL(/\/founder\/kanban/)
    })
  })
})
