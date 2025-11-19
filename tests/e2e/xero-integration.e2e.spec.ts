import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Xero Multi-Account Integration
 * Phase 2 Step 9 - Xero Integration Unification & Verification
 *
 * Smoke tests for Xero integration. Does NOT modify any data.
 * Verifies that:
 * 1) The Xero status endpoint responds without 500 errors.
 * 2) The Integrations page renders and mentions Xero.
 */

test.describe('Xero multi-account integration (smoke)', () => {
  test('Xero status endpoint responds without server error', async ({ request }) => {
    const response = await request.get('/api/integrations/xero/status');

    // Should not be a 500 server error
    expect(response.status()).not.toBe(500);

    // Should be 200 (connected) or 401 (not authenticated)
    expect([200, 401]).toContain(response.status());
  });

  test('Integrations settings page renders Xero section', async ({ page }) => {
    await page.goto('/dashboard/settings/integrations');

    // Should render page body
    await expect(page.locator('body')).toBeVisible();

    // Very loose assertion to avoid coupling to specific UI copy
    // Just verify "Xero" appears somewhere on the page
    const xeroText = page.locator('text=Xero');
    await expect(xeroText.first()).toBeVisible({ timeout: 10000 });
  });

  // TODO: Add authenticated tests once test credentials are standardized
  // test('should display connected Xero accounts when authenticated', async ({ page }) => { ... });
  // test('should allow connecting new Xero account', async ({ page }) => { ... });
  // test('should allow setting primary account', async ({ page }) => { ... });
  // test('should allow updating account label', async ({ page }) => { ... });
  // test('should allow disconnecting specific account', async ({ page }) => { ... });
});
