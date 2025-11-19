import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Staff Authentication
 * Phase 2 Step 8 - Testing & QA Foundation
 *
 * Smoke tests for staff auth flow and protected routes.
 * Assumes valid staff user exists in Supabase (per docs/PHASE2_CLIENT_AUTH_IMPLEMENTATION.md).
 */

test.describe('Staff authentication', () => {
  test('redirects unauthenticated user from /staff to /auth/login', async ({ page }) => {
    await page.goto('/staff');

    // Should redirect to login page
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('staff login page loads correctly', async ({ page }) => {
    await page.goto('/auth/login');

    // Should display login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // TODO: Add authenticated tests once test credentials are standardized
  // test('should allow staff login with valid credentials', async ({ page }) => { ... });
  // test('should allow staff logout', async ({ page }) => { ... });
});
