import { test, expect } from '@playwright/test';

/**
 * Auth Smoke Tests — Nexus 2.0
 *
 * Verifies the PKCE middleware redirects unauthenticated requests correctly.
 * Founder-only routes live under /founder/* (middleware-protected).
 */

test.describe('Auth middleware', () => {
  test('unauthenticated root redirects to /auth/login', async ({ page }) => {
    await page.goto('/');

    // Root page.tsx performs a server-side redirect to /auth/login when no session
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('/auth/login page renders without error', async ({ page }) => {
    await page.goto('/auth/login');

    // Should land on login (not another redirect)
    await expect(page).toHaveURL(/\/auth\/login/);

    // Page should not be an error page
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('protected /founder route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/founder');

    // Middleware redirects unauthenticated /founder/* requests to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
