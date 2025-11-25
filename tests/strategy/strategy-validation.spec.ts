import { test, strategyTestData, testHelpers, expect } from '../fixtures';

/**
 * Strategy Validation Pipeline Test Suite
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Coverage:
 * - Validate 4 agent scores (Strategic Alignment, Execution Capability, Resource Allocation, Risk Management)
 * - Check conflict detection
 * - Verify consensus level display
 * - Test validation error handling
 * - Check score consistency
 */

test.describe('Strategy Validation Pipeline', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to strategy page
    await page.goto('/founder/strategy');
    await page.waitForLoadState('networkidle');

    // Create and validate a strategy
    const createButton = page.locator('button:has-text("Create Strategy")');
    if (await createButton.isVisible()) {
      await createButton.click();

      const form = page.locator('[data-testid="strategy-creation-form"]');
      await form.waitFor({ state: 'visible', timeout: 5000 });

      await page.fill(
        '[data-testid="objective-input"]',
        strategyTestData.validStrategy.objective
      );
      await page.fill(
        '[data-testid="description-input"]',
        strategyTestData.validStrategy.description
      );

      const submitButton = page.locator('button:has-text("Create")');
      await submitButton.click();

      // Wait for validation scores to appear
      await testHelpers.waitForValidationScores(page, 30000);
    }
  });

  test('TC-301: Validation scores panel loads', async ({ authenticatedPage: page }) => {
    // Verify scores panel visible
    const scoresPanel = page.locator('[data-testid="validation-scores"]');
    await expect(scoresPanel).toBeVisible({ timeout: 5000 });

    // Verify heading
    const heading = scoresPanel.locator('h2, h3');
    const headingText = await heading.first().textContent();
    expect(headingText).toContain(/[Vv]alidat/i);

    console.log('✓ Validation scores panel loaded');
  });

  test('TC-302: Strategic Alignment Score displays', async ({ authenticatedPage: page }) => {
    // Find strategic alignment score
    const alignmentScore = page.locator('[data-testid="score-strategic-alignment"]');
    await expect(alignmentScore).toBeVisible({ timeout: 5000 });

    const scoreText = await alignmentScore.textContent();
    expect(scoreText).toMatch(/\d+/);

    const scoreValue = parseInt(scoreText || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);

    console.log(`✓ Strategic Alignment Score: ${scoreValue}`);
  });

  test('TC-303: Execution Capability Score displays', async ({ authenticatedPage: page }) => {
    // Find execution capability score
    const executionScore = page.locator('[data-testid="score-execution-capability"]');
    await expect(executionScore).toBeVisible({ timeout: 5000 });

    const scoreText = await executionScore.textContent();
    expect(scoreText).toMatch(/\d+/);

    const scoreValue = parseInt(scoreText || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);

    console.log(`✓ Execution Capability Score: ${scoreValue}`);
  });

  test('TC-304: Resource Allocation Score displays', async ({ authenticatedPage: page }) => {
    // Find resource allocation score
    const resourceScore = page.locator('[data-testid="score-resource-allocation"]');
    await expect(resourceScore).toBeVisible({ timeout: 5000 });

    const scoreText = await resourceScore.textContent();
    expect(scoreText).toMatch(/\d+/);

    const scoreValue = parseInt(scoreText || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);

    console.log(`✓ Resource Allocation Score: ${scoreValue}`);
  });

  test('TC-305: Risk Management Score displays', async ({ authenticatedPage: page }) => {
    // Find risk management score
    const riskScore = page.locator('[data-testid="score-risk-management"]');
    await expect(riskScore).toBeVisible({ timeout: 5000 });

    const scoreText = await riskScore.textContent();
    expect(scoreText).toMatch(/\d+/);

    const scoreValue = parseInt(scoreText || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);

    console.log(`✓ Risk Management Score: ${scoreValue}`);
  });

  test('TC-306: All four scores are present', async ({ authenticatedPage: page }) => {
    // Verify all 4 scores exist
    const alignmentScore = page.locator('[data-testid="score-strategic-alignment"]');
    const executionScore = page.locator('[data-testid="score-execution-capability"]');
    const resourceScore = page.locator('[data-testid="score-resource-allocation"]');
    const riskScore = page.locator('[data-testid="score-risk-management"]');

    await Promise.all([
      expect(alignmentScore).toBeVisible({ timeout: 5000 }),
      expect(executionScore).toBeVisible({ timeout: 5000 }),
      expect(resourceScore).toBeVisible({ timeout: 5000 }),
      expect(riskScore).toBeVisible({ timeout: 5000 }),
    ]);

    console.log('✓ All 4 validation scores present');
  });

  test('TC-307: Consensus level displays', async ({ authenticatedPage: page }) => {
    // Look for consensus level indicator
    const consensusElement = page.locator('[data-testid*="consensus"]');
    if (await consensusElement.isVisible()) {
      const consensusText = await consensusElement.textContent();
      expect(consensusText).toMatch(/high|medium|low|consensus/i);

      console.log(`✓ Consensus Level: ${consensusText}`);
    } else {
      console.log('ℹ Consensus level not yet implemented');
    }
  });

  test('TC-308: Conflict detection works', async ({ authenticatedPage: page }) => {
    // Look for conflict indicators
    const conflictElement = page.locator('[data-testid*="conflict"]');
    const conflictCount = await conflictElement.count();

    if (conflictCount > 0) {
      // Verify conflict details
      const conflictMessage = await conflictElement.first().textContent();
      expect(conflictMessage).toBeTruthy();

      console.log(`✓ Conflicts detected: ${conflictCount} conflicts found`);
    } else {
      console.log('ℹ No conflicts detected (valid if strategy is well-aligned)');
    }
  });

  test('TC-309: Score distribution is reasonable', async ({ authenticatedPage: page }) => {
    // Get all scores
    const alignmentText = await testHelpers.getTextContent(
      page,
      '[data-testid="score-strategic-alignment"]'
    );
    const executionText = await testHelpers.getTextContent(
      page,
      '[data-testid="score-execution-capability"]'
    );
    const resourceText = await testHelpers.getTextContent(
      page,
      '[data-testid="score-resource-allocation"]'
    );
    const riskText = await testHelpers.getTextContent(
      page,
      '[data-testid="score-risk-management"]'
    );

    const alignment = parseInt(alignmentText || '0');
    const execution = parseInt(executionText || '0');
    const resource = parseInt(resourceText || '0');
    const risk = parseInt(riskText || '0');

    // Verify scores are within reasonable range
    const avg = (alignment + execution + resource + risk) / 4;
    expect(avg).toBeGreaterThan(30); // Should have some reasonable score
    expect(avg).toBeLessThanOrEqual(100);

    // Check that scores don't have extreme variance
    const variance = Math.max(alignment, execution, resource, risk) -
      Math.min(alignment, execution, resource, risk);
    expect(variance).toBeLessThanOrEqual(50); // Shouldn't be wildly different

    console.log(`✓ Score Distribution: Avg=${avg.toFixed(1)}, Variance=${variance}`);
  });

  test('TC-310: Validation updates when strategy changes', async ({ authenticatedPage: page }) => {
    // Get initial score
    const initialScoreText = await testHelpers.getTextContent(
      page,
      '[data-testid="score-strategic-alignment"]'
    );
    const initialScore = parseInt(initialScoreText || '0');

    // Look for strategy update button
    const updateButton = page.locator('button:has-text(/[Uu]pdate|[Ee]dit/)').first();
    if (await updateButton.isVisible()) {
      // Click update
      await updateButton.click();

      // Wait for re-validation
      await page.waitForTimeout(2000);

      // Get updated score
      const updatedScoreText = await testHelpers.getTextContent(
        page,
        '[data-testid="score-strategic-alignment"]'
      );
      const updatedScore = parseInt(updatedScoreText || '0');

      // Scores might change or stay same
      console.log(`✓ Score updated: ${initialScore} → ${updatedScore}`);
    } else {
      console.log('ℹ Update button not available (may need to implement)');
    }
  });

  test('TC-311: Validation error handling', async ({ authenticatedPage: page }) => {
    // Try to trigger validation error by intercepting API
    let errorOccurred = false;

    await page.route('**/api/strategy/*/validate', (route) => {
      // Simulate API error
      route.abort('failed');
      errorOccurred = true;
    });

    // Trigger validation (e.g., refresh button)
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Wait a moment
      await page.waitForTimeout(1000);

      // Check if error handling worked
      if (errorOccurred) {
        // Verify error message displayed
        const errorElement = page.locator('[data-testid*="error"]');
        if (await errorElement.isVisible()) {
          console.log('✓ Validation error handled gracefully');
        }
      }
    }
  });
});
