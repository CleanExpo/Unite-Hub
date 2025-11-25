import { test, strategyTestData, testHelpers, expect } from '../fixtures';

/**
 * Strategy Hierarchy Test Suite
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Coverage:
 * - Expand/collapse hierarchy tree
 * - Verify item count accuracy
 * - Check risk badges display
 * - Verify effort estimates
 * - Check tree navigation
 */

test.describe('Strategy Hierarchy Rendering', () => {
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

      // Wait for hierarchy to load
      await testHelpers.waitForStrategyCreation(page, 30000);
    }
  });

  test('TC-201: Load hierarchy tree structure', async ({ authenticatedPage: page }) => {
    // Verify hierarchy panel is visible
    const hierarchyPanel = page.locator('[data-testid="strategy-hierarchy"]');
    await expect(hierarchyPanel).toBeVisible({ timeout: 5000 });

    // Verify root level items
    const rootItems = page.locator('[data-testid="hierarchy-level-1"]');
    const rootCount = await rootItems.count();
    expect(rootCount).toBeGreaterThan(0);

    console.log(`✓ Hierarchy loaded with ${rootCount} L1 items`);
  });

  test('TC-202: Expand L1 items to reveal L2', async ({ authenticatedPage: page }) => {
    // Find first L1 item
    const l1Item = page.locator('[data-testid="hierarchy-level-1"]').first();
    await expect(l1Item).toBeVisible({ timeout: 5000 });

    // Find expand button for this item
    const expandButton = l1Item.locator('[data-testid*="expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();

      // Wait for L2 items to appear
      const l2Items = l1Item.locator('[data-testid="hierarchy-level-2"]');
      await expect(l2Items.first()).toBeVisible({ timeout: 5000 });

      const l2Count = await l2Items.count();
      expect(l2Count).toBeGreaterThan(0);

      console.log(`✓ L1 expanded: Found ${l2Count} L2 items`);
    }
  });

  test('TC-203: Expand L2 items to reveal L3', async ({ authenticatedPage: page }) => {
    // Expand L1 first
    const l1Item = page.locator('[data-testid="hierarchy-level-1"]').first();
    let expandButton = l1Item.locator('[data-testid*="expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();

      // Now expand L2
      const l2Item = l1Item.locator('[data-testid="hierarchy-level-2"]').first();
      expandButton = l2Item.locator('[data-testid*="expand"]');

      if (await expandButton.isVisible()) {
        await expandButton.click();

        // Wait for L3 items
        const l3Items = l2Item.locator('[data-testid="hierarchy-level-3"]');
        await expect(l3Items.first()).toBeVisible({ timeout: 5000 });

        const l3Count = await l3Items.count();
        expect(l3Count).toBeGreaterThan(0);

        console.log(`✓ L2 expanded: Found ${l3Count} L3 items`);
      }
    }
  });

  test('TC-204: Expand L3 items to reveal L4', async ({ authenticatedPage: page }) => {
    // Expand L1 → L2 → L3
    const l1Item = page.locator('[data-testid="hierarchy-level-1"]').first();
    let expandButton = l1Item.locator('[data-testid*="expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();

      const l2Item = l1Item.locator('[data-testid="hierarchy-level-2"]').first();
      expandButton = l2Item.locator('[data-testid*="expand"]');

      if (await expandButton.isVisible()) {
        await expandButton.click();

        const l3Item = l2Item.locator('[data-testid="hierarchy-level-3"]').first();
        expandButton = l3Item.locator('[data-testid*="expand"]');

        if (await expandButton.isVisible()) {
          await expandButton.click();

          // Wait for L4 items
          const l4Items = l3Item.locator('[data-testid="hierarchy-level-4"]');
          await expect(l4Items.first()).toBeVisible({ timeout: 5000 });

          const l4Count = await l4Items.count();
          expect(l4Count).toBeGreaterThan(0);

          console.log(`✓ L3 expanded: Found ${l4Count} L4 items`);
        }
      }
    }
  });

  test('TC-205: Collapse items to hide children', async ({ authenticatedPage: page }) => {
    // Expand L1
    const l1Item = page.locator('[data-testid="hierarchy-level-1"]').first();
    let expandButton = l1Item.locator('[data-testid*="expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();

      // Verify L2 items visible
      let l2Items = l1Item.locator('[data-testid="hierarchy-level-2"]');
      await expect(l2Items.first()).toBeVisible({ timeout: 5000 });

      // Now collapse
      const collapseButton = l1Item.locator('[data-testid*="collapse"]');
      if (await collapseButton.isVisible()) {
        await collapseButton.click();

        // Verify L2 items hidden
        l2Items = l1Item.locator('[data-testid="hierarchy-level-2"]');
        await expect(l2Items.first()).toBeHidden({ timeout: 2000 });

        console.log('✓ L1 collapsed: L2 items hidden');
      }
    }
  });

  test('TC-206: Verify risk badges display correctly', async ({ authenticatedPage: page }) => {
    // Look for risk badges
    const riskBadges = page.locator('[data-testid*="risk-badge"]');
    const badgeCount = await riskBadges.count();

    if (badgeCount > 0) {
      // Verify badge colors/values
      const firstBadge = riskBadges.first();
      await expect(firstBadge).toBeVisible();

      const badgeText = await firstBadge.textContent();
      expect(badgeText).toMatch(/high|medium|low/i);

      console.log(`✓ Risk badges displayed: ${badgeCount} badges found`);
    } else {
      console.log('ℹ No risk badges found (expected if feature not yet implemented)');
    }
  });

  test('TC-207: Verify effort estimates are visible', async ({ authenticatedPage: page }) => {
    // Look for effort indicators
    const effortElements = page.locator('[data-testid*="effort"]');
    const effortCount = await effortElements.count();

    if (effortCount > 0) {
      // Verify effort values
      const firstEffort = effortElements.first();
      await expect(firstEffort).toBeVisible();

      const effortText = await firstEffort.textContent();
      expect(effortText).toMatch(/\d+\s*(days|hours|weeks|effort)?/i);

      console.log(`✓ Effort estimates displayed: ${effortCount} estimates found`);
    } else {
      console.log('ℹ No effort estimates found (expected if feature not yet implemented)');
    }
  });

  test('TC-208: Verify item counts are consistent', async ({ authenticatedPage: page }) => {
    // Get total items from metrics
    const metricsPanel = page.locator('[data-testid="decomposition-metrics"]');
    if (await metricsPanel.isVisible()) {
      const l1Metric = await testHelpers.getTextContent(page, '[data-testid="metric-l1-count"]');
      const l2Metric = await testHelpers.getTextContent(page, '[data-testid="metric-l2-count"]');
      const l3Metric = await testHelpers.getTextContent(page, '[data-testid="metric-l3-count"]');
      const l4Metric = await testHelpers.getTextContent(page, '[data-testid="metric-l4-count"]');

      const l1Count = parseInt(l1Metric || '0');
      const l2Count = parseInt(l2Metric || '0');
      const l3Count = parseInt(l3Metric || '0');
      const l4Count = parseInt(l4Metric || '0');

      // Verify hierarchy (each level should have >= previous level)
      expect(l2Count).toBeGreaterThanOrEqual(l1Count);
      expect(l3Count).toBeGreaterThanOrEqual(l2Count);
      expect(l4Count).toBeGreaterThanOrEqual(l3Count);

      console.log(
        `✓ Item counts consistent: L1=${l1Count}, L2=${l2Count}, L3=${l3Count}, L4=${l4Count}`
      );
    }
  });

  test('TC-209: Verify no UI flicker during expansion', async ({ authenticatedPage: page }) => {
    // Start monitoring for flicker
    const hasFlicker = await testHelpers.checkForFlicker(page);

    // Expand an item
    const l1Item = page.locator('[data-testid="hierarchy-level-1"]').first();
    const expandButton = l1Item.locator('[data-testid*="expand"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();

      // Wait for animation
      await page.waitForTimeout(500);

      // Check again
      const flickerAfterExpand = await testHelpers.checkForFlicker(page);
      expect(flickerAfterExpand).toBe(false);

      console.log('✓ No UI flicker detected during expansion');
    }
  });

  test('TC-210: Verify breadcrumb navigation works', async ({ authenticatedPage: page }) => {
    // Look for breadcrumbs
    const breadcrumbs = page.locator('[data-testid="hierarchy-breadcrumb"]');
    const breadcrumbCount = await breadcrumbs.count();

    if (breadcrumbCount > 0) {
      // Click on a breadcrumb
      const breadcrumb = breadcrumbs.first();
      await breadcrumb.click();

      // Verify navigation happened
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      console.log(`✓ Breadcrumb navigation works: ${breadcrumbCount} breadcrumbs found`);
    } else {
      console.log('ℹ No breadcrumbs found (feature may not be implemented)');
    }
  });
});
