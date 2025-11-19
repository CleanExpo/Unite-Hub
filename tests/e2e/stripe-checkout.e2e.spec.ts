/**
 * E2E Test: Stripe Checkout Flow
 * Phase 3 Step 6 - Payment Integration
 *
 * Tests the complete payment flow from proposal selection to Stripe checkout.
 * Note: These tests verify the flow without actually processing payments.
 */

import { test, expect } from '@playwright/test';

test.describe('Stripe Checkout Flow', () => {
  test('should create checkout session and redirect', async ({ page }) => {
    const mockIdeaId = 'test-idea-uuid-123';
    const mockTier = 'better';
    const mockPackageId = 'pkg-better';

    // Navigate to checkout page
    await page.goto(`/client/proposals/checkout?ideaId=${mockIdeaId}&tier=${mockTier}&packageId=${mockPackageId}`);

    // Verify loading state
    await expect(page.locator('text=Redirecting to Checkout')).toBeVisible({ timeout: 3000 });

    // In test environment, this would redirect to Stripe
    // We verify the loading indicators appear
    await expect(page.locator('[class*="animate-spin"]')).toBeVisible();
  });

  test('should handle missing parameters', async ({ page }) => {
    await page.goto('/client/proposals/checkout');

    // Should show error
    await expect(page.locator('text=/Missing required parameters|Invalid/')).toBeVisible({ timeout: 5000 });

    // Should show retry button
    await expect(page.locator('button:has-text("Return to Proposals")')).toBeVisible();
  });

  test('should display success page', async ({ page }) => {
    await page.goto('/client/proposals/success?session_id=cs_test_123');

    // Verify success message
    await expect(page.locator('h1:has-text("Payment Successful")')).toBeVisible();

    // Verify next steps
    await expect(page.locator('text=What happens next')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('button:has-text("View Project")')).toBeVisible();
  });

  test('should display cancelled page', async ({ page }) => {
    await page.goto('/client/proposals/cancelled?idea_id=test-idea-123');

    // Verify cancelled message
    await expect(page.locator('h1:has-text("Payment Cancelled")')).toBeVisible();

    // Verify retry button
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });
});
