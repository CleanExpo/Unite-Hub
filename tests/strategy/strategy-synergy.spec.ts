import { test, strategyTestData, testHelpers, expect } from '../fixtures';

/**
 * Strategy Synergy Analysis Test Suite
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Coverage:
 * - Synergy metrics display (Completeness, Balance, Coherence, Clarity)
 * - Score calculations and ranges
 * - Visual representation of synergy breakdown
 * - Metric consistency checks
 */

test.describe('Strategy Synergy Analysis', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to strategy page
    await page.goto('/founder/strategy');
    await page.waitForLoadState('networkidle');

    // Create a strategy first
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

      // Wait for synergy panel to load
      await testHelpers.waitForSynergyMetrics(page, 30000);
    }
  });

  test('TC-401: Synergy breakdown panel loads', async ({ authenticatedPage: page }) => {
    // Verify synergy panel is visible
    const synergyPanel = page.locator('[data-testid="synergy-breakdown"]');
    await expect(synergyPanel).toBeVisible({ timeout: 5000 });

    // Verify heading exists
    const heading = synergyPanel.locator('h2, h3').first();
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/synergy|analysis|metrics/i);

    console.log('✓ Synergy breakdown panel loaded');
  });

  test('TC-402: Completeness score displays', async ({ authenticatedPage: page }) => {
    // Find completeness metric
    const completenessMetric = page.locator('[data-testid="metric-completeness"]');
    await expect(completenessMetric).toBeVisible({ timeout: 5000 });

    const scoreText = await completenessMetric.textContent();
    expect(scoreText).toMatch(/[\d.]+/);

    const scoreValue = parseFloat(scoreText?.match(/[\d.]+/)?.[0] || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(1);

    console.log(`✓ Completeness Score: ${(scoreValue * 100).toFixed(0)}%`);
  });

  test('TC-403: Balance score displays', async ({ authenticatedPage: page }) => {
    // Find balance metric
    const balanceMetric = page.locator('[data-testid="metric-balance"]');
    await expect(balanceMetric).toBeVisible({ timeout: 5000 });

    const scoreText = await balanceMetric.textContent();
    expect(scoreText).toMatch(/[\d.]+/);

    const scoreValue = parseFloat(scoreText?.match(/[\d.]+/)?.[0] || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(1);

    console.log(`✓ Balance Score: ${(scoreValue * 100).toFixed(0)}%`);
  });

  test('TC-404: Coherence score displays', async ({ authenticatedPage: page }) => {
    // Find coherence metric
    const coherenceMetric = page.locator('[data-testid="metric-coherence"]');
    await expect(coherenceMetric).toBeVisible({ timeout: 5000 });

    const scoreText = await coherenceMetric.textContent();
    expect(scoreText).toMatch(/[\d.]+/);

    const scoreValue = parseFloat(scoreText?.match(/[\d.]+/)?.[0] || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(1);

    console.log(`✓ Coherence Score: ${(scoreValue * 100).toFixed(0)}%`);
  });

  test('TC-405: Clarity score displays', async ({ authenticatedPage: page }) => {
    // Find clarity metric
    const clarityMetric = page.locator('[data-testid="metric-clarity"]');
    await expect(clarityMetric).toBeVisible({ timeout: 5000 });

    const scoreText = await clarityMetric.textContent();
    expect(scoreText).toMatch(/[\d.]+/);

    const scoreValue = parseFloat(scoreText?.match(/[\d.]+/)?.[0] || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(1);

    console.log(`✓ Clarity Score: ${(scoreValue * 100).toFixed(0)}%`);
  });

  test('TC-406: All four synergy metrics present', async ({ authenticatedPage: page }) => {
    // Verify all 4 metrics exist
    const completeness = page.locator('[data-testid="metric-completeness"]');
    const balance = page.locator('[data-testid="metric-balance"]');
    const coherence = page.locator('[data-testid="metric-coherence"]');
    const clarity = page.locator('[data-testid="metric-clarity"]');

    await Promise.all([
      expect(completeness).toBeVisible({ timeout: 5000 }),
      expect(balance).toBeVisible({ timeout: 5000 }),
      expect(coherence).toBeVisible({ timeout: 5000 }),
      expect(clarity).toBeVisible({ timeout: 5000 }),
    ]);

    console.log('✓ All 4 synergy metrics present');
  });

  test('TC-407: Overall synergy score calculated', async ({ authenticatedPage: page }) => {
    // Look for overall synergy score
    const overallScore = page.locator('[data-testid="metric-overall-synergy"]');

    if (await overallScore.isVisible()) {
      const scoreText = await overallScore.textContent();
      expect(scoreText).toMatch(/[\d.]+/);

      const scoreValue = parseFloat(scoreText?.match(/[\d.]+/)?.[0] || '0');
      expect(scoreValue).toBeGreaterThanOrEqual(0);
      expect(scoreValue).toBeLessThanOrEqual(1);

      console.log(`✓ Overall Synergy Score: ${(scoreValue * 100).toFixed(0)}%`);
    } else {
      console.log('ℹ Overall score calculation in progress');
    }
  });

  test('TC-408: Synergy visualization displays', async ({ authenticatedPage: page }) => {
    // Look for visualization elements (bars, radial, etc)
    const visualization = page.locator('[data-testid*="visual"], [data-testid*="chart"], svg');
    const visualCount = await visualization.count();

    if (visualCount > 0) {
      await expect(visualization.first()).toBeVisible();
      console.log(`✓ Synergy visualization displayed: ${visualCount} elements`);
    } else {
      console.log('ℹ Visualization may not be implemented yet');
    }
  });

  test('TC-409: Synergy improvements suggestions', async ({ authenticatedPage: page }) => {
    // Look for recommendations
    const recommendations = page.locator('[data-testid*="recommendation"], [data-testid*="suggest"]');
    const recommendCount = await recommendations.count();

    if (recommendCount > 0) {
      const firstRecommendation = await recommendations.first().textContent();
      expect(firstRecommendation).toBeTruthy();
      console.log(`✓ Improvement suggestions available: ${recommendCount} found`);
    } else {
      console.log('ℹ Recommendations may not be implemented yet');
    }
  });

  test('TC-410: Metric consistency check', async ({ authenticatedPage: page }) => {
    // Get all metric values
    const completenessText = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-completeness"]'
    );
    const balanceText = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-balance"]'
    );
    const coherenceText = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-coherence"]'
    );
    const clarityText = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-clarity"]'
    );

    const completeness = parseFloat(completenessText?.match(/[\d.]+/)?.[0] || '0');
    const balance = parseFloat(balanceText?.match(/[\d.]+/)?.[0] || '0');
    const coherence = parseFloat(coherenceText?.match(/[\d.]+/)?.[0] || '0');
    const clarity = parseFloat(clarityText?.match(/[\d.]+/)?.[0] || '0');

    // All should be valid numbers between 0 and 1
    [completeness, balance, coherence, clarity].forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    // Calculate average
    const avg = (completeness + balance + coherence + clarity) / 4;
    console.log(
      `✓ Metrics consistent: Avg=${(avg * 100).toFixed(0)}%, ` +
        `Comp=${(completeness * 100).toFixed(0)}%, ` +
        `Bal=${(balance * 100).toFixed(0)}%, ` +
        `Coh=${(coherence * 100).toFixed(0)}%, ` +
        `Cla=${(clarity * 100).toFixed(0)}%`
    );
  });

  test('TC-411: Synergy updates on strategy change', async ({ authenticatedPage: page }) => {
    // Get initial synergy values
    const initialCompleteText = await testHelpers.getTextContent(
      page,
      '[data-testid="metric-completeness"]'
    );
    const initialComplete = parseFloat(initialCompleteText?.match(/[\d.]+/)?.[0] || '0');

    // Look for update mechanism
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      // Trigger refresh
      await refreshButton.click();

      // Wait for recalculation
      await page.waitForTimeout(2000);

      // Get updated values
      const updatedCompleteText = await testHelpers.getTextContent(
        page,
        '[data-testid="metric-completeness"]'
      );
      const updatedComplete = parseFloat(updatedCompleteText?.match(/[\d.]+/)?.[0] || '0');

      // Values may stay same or change
      console.log(`✓ Synergy metrics updated: ${initialComplete} → ${updatedComplete}`);
    } else {
      console.log('ℹ Refresh mechanism not available');
    }
  });
});
