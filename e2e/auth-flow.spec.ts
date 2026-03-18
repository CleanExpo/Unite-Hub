import { test, expect } from '@playwright/test'

/**
 * Auth Flow — E2E Smoke Tests
 *
 * Verifies the Supabase PKCE login page renders correctly and
 * the middleware redirects unauthenticated users as expected.
 */

test.describe('Auth Flow', () => {
  test('login page loads without error', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/auth/login')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('login page has submit button', async ({ page }) => {
    await page.goto('/auth/login')

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toContainText(/sign in/i)
  })

  test('login page has Google OAuth button', async ({ page }) => {
    await page.goto('/auth/login')

    const googleButton = page.getByText(/continue with google/i)
    await expect(googleButton).toBeVisible()
  })

  test('login page displays Nexus branding', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.getByText('Nexus — Unite Group')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Sign in')
  })

  test('login form rejects empty submission', async ({ page }) => {
    await page.goto('/auth/login')

    // HTML5 validation should prevent empty submission
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('unauthenticated root redirects to login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('unauthenticated /founder route redirects to login', async ({ page }) => {
    await page.goto('/founder')

    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
