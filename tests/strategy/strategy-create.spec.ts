import { test, strategyTestData, testHelpers, expect } from '../fixtures';

/**
 * Strategy Creation Test Suite
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Coverage:
 * - Open strategy page
 * - Submit new strategic objective
 * - Wait for backend validation
 * - Assert L1-L4 hierarchy presence
 * - Check decomposition metrics
 */

test.describe('Strategy Creation Flow', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to strategy page
    await page.goto('/founder/strategy');
    await page.waitForLoadState('networkidle');
  });

  test('TC-101: Load strategy dashboard', async ({ authenticatedPage: page }) => {
    // Verify page title
    const pageTitle = await page.locator('h1').first();
    await expect(pageTitle).toContainText(/[Ss]trategy/i);

    // Verify main sections are visible
    await expect(page.locator('[data-testid="strategy-hierarchy"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="strategy-controls"]')).toBeVisible();
  });

  test('TC-102: Submit new strategic objective', async ({ authenticatedPage: page }) => {
    // Click create strategy button
    const createButton = page.locator('button:has-text("Create Strategy")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for dialog/form to appear
    const form = page.locator('[data-testid="strategy-creation-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Fill in strategy details
    await page.fill('[data-testid="objective-input"]', strategyTestData.validStrategy.objective);
    await page.fill(
      '[data-testid="description-input"]',
      strategyTestData.validStrategy.description
    );

    // Select priority
    const prioritySelect = page.locator('[data-testid="priority-select"]');
    await prioritySelect.click();
    await page.click('text=High');

    // Submit form
    const submitButton = page.locator('button:has-text("Create")');
    await submitButton.click();

    // Verify submission confirmation
    await expect(page.locator('[data-testid="strategy-created-notification"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('TC-103: Wait for backend validation', async ({ authenticatedPage: page }) => {
    // Create a strategy first
    const createButton = page.locator('button:has-text("Create Strategy")');
    await createButton.click();

    const form = page.locator('[data-testid="strategy-creation-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    await page.fill('[data-testid="objective-input"]', strategyTestData.validStrategy.objective);
    await page.fill(
      '[data-testid="description-input"]',
      strategyTestData.validStrategy.description
    );

    const submitButton = page.locator('button:has-text("Create")');
    await submitButton.click();

    // Wait for validation to complete (spinner should disappear)
    const loadingSpinner = page.locator('[data-testid="validation-spinner"]');
    await expect(loadingSpinner).toBeHidden({ timeout: 30000 });

    // Verify validation scores appear
    await expect(page.locator('[data-testid="validation-scores"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('TC-104: Assert L1-L4 hierarchy presence', async ({ authenticatedPage: page }) => {
    // Create a strategy
    const createButton = page.locator('button:has-text("Create Strategy")');
    await createButton.click();

    const form = page.locator('[data-testid="strategy-creation-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    await page.fill('[data-testid="objective-input"]', strategyTestData.validStrategy.objective);
    await page.fill(
      '[data-testid="description-input"]',
      strategyTestData.validStrategy.description
    );

    const submitButton = page.locator('button:has-text("Create")');
    await submitButton.click();

    // Wait for hierarchy to load
    await testHelpers.waitForStrategyCreation(page, 30000);

    // Verify L1 items exist
    const l1Items = page.locator('[data-testid*="l1-item"]');
    const l1Count = await l1Items.count();
    expect(l1Count).toBeGreaterThan(0);

    // Verify L2 items exist
    const l2Items = page.locator('[data-testid*="l2-item"]');
    const l2Count = await l2Items.count();
    expect(l2Count).toBeGreaterThan(l1Count);

    // Verify L3 items exist
    const l3Items = page.locator('[data-testid*="l3-item"]');
    const l3Count = await l3Items.count();
    expect(l3Count).toBeGreaterThan(l2Count);

    // Verify L4 items exist
    const l4Items = page.locator('[data-testid*="l4-item"]');
    const l4Count = await l4Items.count();
    expect(l4Count).toBeGreaterThan(l3Count);

    console.log(
      `✓ Hierarchy verified: L1=${l1Count}, L2=${l2Count}, L3=${l3Count}, L4=${l4Count}`
    );
  });

  test('TC-105: Check decomposition metrics', async ({ authenticatedPage: page }) => {
    // Create a strategy
    const createButton = page.locator('button:has-text("Create Strategy")');
    await createButton.click();

    const form = page.locator('[data-testid="strategy-creation-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    await page.fill('[data-testid="objective-input"]', strategyTestData.validStrategy.objective);
    await page.fill(
      '[data-testid="description-input"]',
      strategyTestData.validStrategy.description
    );

    const submitButton = page.locator('button:has-text("Create")');
    await submitButton.click();

    // Wait for metrics panel
    await expect(page.locator('[data-testid="decomposition-metrics"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify specific metric values
    const level1Count = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-l1-count"]'
    );
    expect(parseInt(level1Count || '0')).toBeGreaterThan(0);

    const level2Count = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-l2-count"]'
    );
    expect(parseInt(level2Count || '0')).toBeGreaterThan(0);

    const hierarchyScore = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-hierarchy-score"]'
    );
    expect(parseInt(hierarchyScore || '0')).toBeGreaterThan(50);
    expect(parseInt(hierarchyScore || '0')).toBeLessThanOrEqual(100);

    console.log(`✓ Decomposition metrics verified: Score=${hierarchyScore}`);
  });

  test('TC-106: Validate error handling on invalid input', async ({
    authenticatedPage: page,
  }) => {
    // Open creation form
    const createButton = page.locator('button:has-text("Create Strategy")');
    await createButton.click();

    const form = page.locator('[data-testid="strategy-creation-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Submit without filling required fields
    const submitButton = page.locator('button:has-text("Create")');
    await submitButton.click();

    // Verify error messages appear
    const errorMessage = page.locator('[data-testid="form-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/required|invalid/i);
  });

  test('TC-107: Verify API request structure', async ({ authenticatedPage: page }) => {
    let capturedRequest: any = null;

    // Intercept API calls
    await page.route('**/api/strategy/create', (route) => {
      capturedRequest = route.request();
      // Don't actually send the request - just verify it
      route.abort();
    });

    // Try to create strategy
    const createButton = page.locator('button:has-text("Create Strategy")');
    await createButton.click();

    const form = page.locator('[data-testid="strategy-creation-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    await page.fill('[data-testid="objective-input"]', strategyTestData.validStrategy.objective);
    await page.fill(
      '[data-testid="description-input"]',
      strategyTestData.validStrategy.description
    );

    const submitButton = page.locator('button:has-text("Create")');
    await submitButton.click();

    // Wait a moment for request to be captured
    await page.waitForTimeout(500);

    // Verify request was made
    expect(capturedRequest).toBeDefined();
    expect(capturedRequest.method()).toBe('POST');

    // Verify request body structure
    const postData = capturedRequest.postDataJSON();
    expect(postData).toHaveProperty('objective');
    expect(postData).toHaveProperty('description');
  });
});
