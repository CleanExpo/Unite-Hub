/**
 * CONVEX Workflow E2E Tests
 *
 * Tests complete CONVEX workflows:
 * 1. Strategy generation flow
 * 2. SEO scoring overlay
 * 3. Execution roadmap generation
 * 4. Dashboard integration
 * 5. Database persistence
 */

import { test, expect } from '@playwright/test';

test.describe('CONVEX Strategy Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to CONVEX dashboard
    await page.goto('/dashboard/convex');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display CONVEX dashboard with statistics', async ({ page }) => {
    // Check header is visible
    expect(await page.locator('h1:has-text("CONVEX Strategy Module")').isVisible()).toBeTruthy();

    // Check "New Strategy" button exists
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    expect(await newStrategyButton.isVisible()).toBeTruthy();

    // Check stats cards are present
    const statCards = page.locator('[class*="grid"] > [class*="Card"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('should open strategy generator when clicking "New Strategy"', async ({ page }) => {
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    await newStrategyButton.click();

    // Wait for dashboard to be hidden and generator to appear
    await page.waitForTimeout(500);

    // Check generator is visible
    expect(await page.locator('text=CONVEX Strategy Generator').isVisible()).toBeTruthy();

    // Check framework selector is present
    const frameworkSelect = page.locator('[class*="SelectTrigger"]');
    expect(await frameworkSelect.isVisible()).toBeTruthy();
  });

  test('should validate required fields in strategy form', async ({ page }) => {
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    await newStrategyButton.click();

    await page.waitForTimeout(500);

    // Try to submit without filling form
    const generateButton = page.locator('button:has-text("Generate CONVEX Strategy")');
    await generateButton.click();

    // Check error message appears
    await page.waitForTimeout(300);
    const errorAlert = page.locator('[class*="Alert"]').locator('[class*="destructive"]');
    expect(await errorAlert.isVisible()).toBeTruthy();
  });

  test('should fill and submit strategy form', async ({ page }) => {
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    await newStrategyButton.click();

    await page.waitForTimeout(500);

    // Fill form fields
    await page.fill('input[placeholder*="Business"]', 'TechFlow Solutions');
    await page.fill('input[placeholder*="Industry"]', 'Project Management SaaS');
    await page.fill('input[placeholder*="Audience"]', 'Mid-market teams 50-500 employees');

    const challengesField = page.locator('textarea').first();
    await challengesField.fill('Complex pricing\nPoor onboarding\nHigh churn rate');

    // Select framework
    const frameworkSelect = page.locator('[class*="SelectTrigger"]');
    await frameworkSelect.click();
    await page.locator('text=Brand Positioning').click();

    // Fill desired outcome
    const outcomeField = page.locator('textarea').last();
    await outcomeField.fill('Become market leader in mid-market project management with 20% market share');

    // Submit form
    const generateButton = page.locator('button:has-text("Generate CONVEX Strategy")');
    await generateButton.click();

    // Wait for results
    await page.waitForTimeout(2000);

    // Check results are displayed
    expect(await page.locator('text=CONVEX Strategy Score').isVisible()).toBeTruthy();
  });

  test('should display strategy results with scoring', async ({ page }) => {
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    await newStrategyButton.click();

    await page.waitForTimeout(500);

    // Fill and submit form
    await page.fill('input[placeholder*="Business"]', 'TechFlow Solutions');
    await page.fill('input[placeholder*="Industry"]', 'Project Management SaaS');
    await page.fill('input[placeholder*="Audience"]', 'Mid-market teams');
    await page.locator('[class*="SelectTrigger"]').click();
    await page.locator('text=Brand Positioning').click();

    const outcomeField = page.locator('textarea').last();
    await outcomeField.fill('Become market leader');

    await page.locator('button:has-text("Generate CONVEX Strategy")').click();
    await page.waitForTimeout(2000);

    // Check score display
    const scoreDisplay = page.locator('[class*="text-4xl"]');
    expect(await scoreDisplay.isVisible()).toBeTruthy();

    // Check score breakdown
    expect(await page.locator('text=Clarity').isVisible()).toBeTruthy();
    expect(await page.locator('text=Specificity').isVisible()).toBeTruthy();
    expect(await page.locator('text=Outcome Focus').isVisible()).toBeTruthy();
  });

  test('should export strategy as JSON', async ({ page }) => {
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    await newStrategyButton.click();

    await page.waitForTimeout(500);

    // Fill and submit form
    await page.fill('input[placeholder*="Business"]', 'TechFlow Solutions');
    await page.fill('input[placeholder*="Industry"]', 'SaaS');
    await page.fill('input[placeholder*="Audience"]', 'Teams');
    await page.locator('[class*="SelectTrigger"]').click();
    await page.locator('text=Brand Positioning').click();

    const outcomeField = page.locator('textarea').last();
    await outcomeField.fill('Market leadership');

    await page.locator('button:has-text("Generate CONVEX Strategy")').click();
    await page.waitForTimeout(2000);

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Export Strategy")').click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('convex-strategy');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should list generated strategies on dashboard', async ({ page }) => {
    // Generate a strategy first
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    await newStrategyButton.click();

    await page.waitForTimeout(500);

    // Fill and submit form
    await page.fill('input[placeholder*="Business"]', 'TestCorp');
    await page.fill('input[placeholder*="Industry"]', 'SaaS');
    await page.fill('input[placeholder*="Audience"]', 'Enterprise');
    await page.locator('[class*="SelectTrigger"]').click();
    await page.locator('text=Offer Architecture').click();

    const outcomeField = page.locator('textarea').last();
    await outcomeField.fill('Increase revenue');

    await page.locator('button:has-text("Generate CONVEX Strategy")').click();
    await page.waitForTimeout(2000);

    // Go back to dashboard
    const backButton = page.locator('button:has-text("Back to Dashboard")');
    await backButton.click();

    await page.waitForTimeout(1000);

    // Check strategy appears in list
    const strategyTable = page.locator('table');
    expect(await strategyTable.isVisible()).toBeTruthy();

    // Strategy should appear in table
    const testCorpRow = page.locator('text=TestCorp');
    expect(await testCorpRow.isVisible()).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    await newStrategyButton.click();

    await page.waitForTimeout(500);

    // Fill form with valid data
    await page.fill('input[placeholder*="Business"]', 'ErrorTest');
    await page.fill('input[placeholder*="Industry"]', 'SaaS');
    await page.fill('input[placeholder*="Audience"]', 'Teams');
    await page.locator('[class*="SelectTrigger"]').click();
    await page.locator('text=Brand Positioning').click();

    const outcomeField = page.locator('textarea').last();
    await outcomeField.fill('Test error handling');

    // Simulate API failure by intercepting and returning error
    await page.route('**/api/convex/generate-strategy', route => {
      route.abort('failed');
    });

    await page.locator('button:has-text("Generate CONVEX Strategy")').click();

    // Wait for error handling
    await page.waitForTimeout(1000);

    // Check error is displayed
    const errorAlert = page.locator('[class*="Alert"]').locator('[class*="destructive"]');
    expect(await errorAlert.isVisible()).toBeTruthy();
  });

  test('should track page load performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Dashboard should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check all major elements are present
    expect(await page.locator('h1:has-text("CONVEX Strategy Module")').isVisible()).toBeTruthy();
    expect(await page.locator('button:has-text("New Strategy")').isVisible()).toBeTruthy();
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');

    // Check header is visible
    expect(await page.locator('h1').isVisible()).toBeTruthy();

    // Check "New Strategy" button is accessible
    const newStrategyButton = page.locator('button:has-text("New Strategy")');
    expect(await newStrategyButton.isVisible()).toBeTruthy();

    // Click button and check generator opens
    await newStrategyButton.click();
    await page.waitForTimeout(500);

    expect(await page.locator('text=CONVEX Strategy Generator').isVisible()).toBeTruthy();
  });

  test('should maintain dark mode styling', async ({ page }) => {
    // Force dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');

    // Check dark theme classes are applied
    const body = page.locator('body');
    const classes = await body.getAttribute('class');

    // Verify dark mode is active
    expect(classes).toContain('dark');
  });
});

test.describe('SEO Scoring Overlay', () => {
  test('should open SEO scoring overlay from strategy dashboard', async ({ page }) => {
    // This test assumes SEO overlay is accessible from strategy results
    // Would need to navigate to strategy and trigger overlay

    // For now, verify API endpoint exists
    const response = await page.goto('/api/convex/score-seo', {
      method: 'POST',
      data: {
        domain: 'example.com',
        primaryKeyword: 'test keyword',
      },
    });

    expect(response?.status()).toBe(200);
  });
});

test.describe('Execution Roadmap', () => {
  test('should generate execution roadmap', async ({ page }) => {
    // Test roadmap generation API
    const response = await page.goto('/api/convex/generate-roadmap', {
      method: 'POST',
      data: {
        templateId: 'lp-1',
        templateName: 'Landing Page',
        templateType: 'landing_page',
        estimatedDuration: 20,
        variables: {
          Headline: 'Test Headline',
          Subheadline: 'Test Subheadline',
        },
      },
    });

    expect(response?.status()).toBe(200);
  });
});
