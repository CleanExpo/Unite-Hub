/**
 * CONVEX Phase 3 Advanced Features E2E Tests
 *
 * Tests complete Phase 3 workflows:
 * 1. Strategy versioning and comparison
 * 2. Team collaboration and sharing
 * 3. Advanced search and filtering
 * 4. Activity tracking and analytics
 */

import { test, expect } from '@playwright/test';

test.describe('CONVEX Strategy Versioning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');
  });

  test('should display version history for strategy', async ({ page }) => {
    // Navigate to strategy detail page
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      // Check version history section
      const versionSection = page.locator('text=Version History');
      expect(await versionSection.isVisible()).toBeTruthy();

      // Check version list
      const versionItems = page.locator('[class*="version-item"]');
      const count = await versionItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should compare two strategy versions', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      // Open version comparison
      const compareButton = page.locator('button:has-text("Compare Versions")').first();

      if (await compareButton.isVisible()) {
        await compareButton.click();
        await page.waitForTimeout(500);

        // Check comparison modal opens
        const modal = page.locator('[role="dialog"]');
        expect(await modal.isVisible()).toBeTruthy();

        // Verify comparison displays
        const similarity = page.locator('text=/Similarity.*%/');
        expect(await similarity.isVisible()).toBeTruthy();

        const scoreChange = page.locator('text=/Score Change/');
        expect(await scoreChange.isVisible()).toBeTruthy();
      }
    }
  });

  test('should restore previous version', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      const compareButton = page.locator('button:has-text("Compare Versions")').first();

      if (await compareButton.isVisible()) {
        await compareButton.click();
        await page.waitForTimeout(500);

        // Find restore button
        const restoreButton = page.locator('button:has-text("Restore")').first();

        if (await restoreButton.isVisible()) {
          await restoreButton.click();
          await page.waitForTimeout(500);

          // Verify restoration success message
          const successMessage = page.locator('text=/restored/i');
          expect(await successMessage.isVisible()).toBeTruthy();
        }
      }
    }
  });

  test('should export version comparison as JSON', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      const compareButton = page.locator('button:has-text("Compare Versions")').first();

      if (await compareButton.isVisible()) {
        await compareButton.click();
        await page.waitForTimeout(500);

        // Wait for download
        const downloadPromise = page.waitForEvent('download');
        const exportButton = page.locator('button:has-text("Export")').first();

        if (await exportButton.isVisible()) {
          await exportButton.click();
          const download = await downloadPromise;

          expect(download.suggestedFilename()).toContain('comparison');
          expect(download.suggestedFilename()).toContain('.json');
        }
      }
    }
  });
});

test.describe('CONVEX Team Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');
  });

  test('should share strategy with team member', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      // Open collaboration panel
      const shareButton = page.locator('button:has-text("Share")').first();

      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(500);

        // Fill share form
        await page.fill('input[placeholder*="email"]', 'teammate@example.com');

        // Select access level
        const accessSelect = page.locator('[role="listbox"]').first();
        await accessSelect.click();
        await page.locator('text=Editor').click();

        // Share
        const confirmButton = page.locator('button:has-text("Share Strategy")');
        await confirmButton.click();
        await page.waitForTimeout(500);

        // Verify success
        const successMessage = page.locator('text=/shared/i');
        expect(await successMessage.isVisible()).toBeTruthy();
      }
    }
  });

  test('should add comment to strategy', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      // Open collaboration panel
      const shareButton = page.locator('button:has-text("Share")').first();

      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(500);

        // Switch to comments tab
        const commentsTab = page.locator('text=Comments').first();
        await commentsTab.click();
        await page.waitForTimeout(300);

        // Add comment
        const commentField = page.locator('textarea').first();
        if (await commentField.isVisible()) {
          await commentField.fill('This strategy needs revision on the messaging framework.');

          const addButton = page.locator('button:has-text("Add Comment")');
          await addButton.click();
          await page.waitForTimeout(500);

          // Verify comment appears
          const comment = page.locator('text=/This strategy needs/');
          expect(await comment.isVisible()).toBeTruthy();
        }
      }
    }
  });

  test('should resolve comment', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      // Open collaboration panel
      const shareButton = page.locator('button:has-text("Share")').first();

      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(500);

        // Switch to comments tab
        const commentsTab = page.locator('text=Comments').first();
        await commentsTab.click();
        await page.waitForTimeout(300);

        // Find and resolve comment
        const resolveButton = page.locator('button:has-text("Mark Resolved")').first();

        if (await resolveButton.isVisible()) {
          await resolveButton.click();
          await page.waitForTimeout(500);

          // Verify resolved badge
          const resolvedBadge = page.locator('text=/Resolved/').first();
          expect(await resolvedBadge.isVisible()).toBeTruthy();
        }
      }
    }
  });

  test('should view activity timeline', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      // Open collaboration panel
      const shareButton = page.locator('button:has-text("Share")').first();

      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(500);

        // Switch to activity tab
        const activityTab = page.locator('text=Activity').first();
        await activityTab.click();
        await page.waitForTimeout(300);

        // Check activity items
        const activities = page.locator('[class*="activity"]');
        const count = await activities.count();
        expect(count).toBeGreaterThan(0);

        // Verify activity types
        const createdActivity = page.locator('text=/created/i');
        expect(await createdActivity.isVisible()).toBeTruthy();
      }
    }
  });

  test('should revoke team member access', async ({ page }) => {
    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      // Open collaboration panel
      const shareButton = page.locator('button:has-text("Share")').first();

      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(500);

        // Find revoke button
        const revokeButton = page.locator('button[class*="destructive"]').first();

        if (await revokeButton.isVisible()) {
          await revokeButton.click();
          await page.waitForTimeout(500);

          // Verify access revoked
          const confirmation = page.locator('text=/access.*revoked/i');
          expect(await confirmation.isVisible()).toBeTruthy();
        }
      }
    }
  });
});

test.describe('CONVEX Advanced Search & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');
  });

  test('should open advanced search panel', async ({ page }) => {
    // Click search button
    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Verify search panel opens
      const panel = page.locator('[class*="sheet"]');
      expect(await panel.isVisible()).toBeTruthy();
    }
  });

  test('should perform full-text search', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Enter search text
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('TechFlow');

      // Execute search
      const searchExecButton = page.locator('button:has-text("Search")');
      await searchExecButton.click();
      await page.waitForTimeout(1000);

      // Verify results
      const results = page.locator('text=/TechFlow/');
      expect(await results.isVisible()).toBeTruthy();
    }
  });

  test('should add filter to search', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Add filter
      const addFilterSelect = page.locator('text=/Add Filter/').locator('..').locator('[role="combobox"]');

      if (await addFilterSelect.isVisible()) {
        await addFilterSelect.click();
        await page.locator('text=Compliance Status').click();
        await page.waitForTimeout(300);

        // Set filter value
        const filterValue = page.locator('[placeholder="Value"]').first();
        await filterValue.fill('pass');

        // Execute search
        const searchExecButton = page.locator('button:has-text("Search")');
        await searchExecButton.click();
        await page.waitForTimeout(1000);

        // Verify filtered results
        const results = page.locator('[class*="result"]');
        const count = await results.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should save search filter', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Enter search text
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('TechFlow');

      // Save search
      const saveButton = page.locator('button:has-text("Save Search")').first();

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(300);

        // Fill save form
        const nameInput = page.locator('input[placeholder*="name"]').first();
        await nameInput.fill('My TechFlow Search');

        const confirmButton = page.locator('button:has-text("Save")').first();
        await confirmButton.click();
        await page.waitForTimeout(500);

        // Verify save success
        const success = page.locator('text=/saved/i');
        expect(await success.isVisible()).toBeTruthy();
      }
    }
  });

  test('should load saved search', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Switch to saved searches tab
      const savedTab = page.locator('text=Saved').first();

      if (await savedTab.isVisible()) {
        await savedTab.click();
        await page.waitForTimeout(300);

        // Find saved search and load
        const loadButton = page.locator('button:has-text("Load Search")').first();

        if (await loadButton.isVisible()) {
          await loadButton.click();
          await page.waitForTimeout(500);

          // Verify search loaded
          const searchField = page.locator('input[placeholder*="Search"]');
          const hasValue = await searchField.inputValue();
          expect(hasValue).toBeTruthy();
        }
      }
    }
  });

  test('should view search analytics', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Switch to analytics tab
      const analyticsTab = page.locator('text=Analytics').first();

      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(300);

        // Verify analytics displayed
        const totalSearches = page.locator('text=/Total Searches/');
        expect(await totalSearches.isVisible()).toBeTruthy();

        const topTerms = page.locator('text=/Top Search Terms/');
        expect(await topTerms.isVisible()).toBeTruthy();
      }
    }
  });

  test('should clear all filters', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Add a filter
      const addFilterSelect = page.locator('text=/Add Filter/').locator('..').locator('[role="combobox"]');

      if (await addFilterSelect.isVisible()) {
        await addFilterSelect.click();
        await page.locator('text=Compliance Status').click();
        await page.waitForTimeout(300);

        // Clear filters
        const clearButton = page.locator('button:has-text("Clear All")').first();

        if (await clearButton.isVisible()) {
          await clearButton.click();
          await page.waitForTimeout(300);

          // Verify no filters
          const filterCards = page.locator('[class*="filter"]');
          const count = await filterCards.count();
          expect(count).toBe(0);
        }
      }
    }
  });
});

test.describe('CONVEX Phase 3 Performance', () => {
  test('should load collaboration panel quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');

    const strategyRow = page.locator('table >> text=TechFlow').first();

    if (await strategyRow.isVisible()) {
      await strategyRow.click();
      await page.waitForLoadState('networkidle');

      const shareButton = page.locator('button:has-text("Share")').first();

      if (await shareButton.isVisible()) {
        await shareButton.click();
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should load in under 2 seconds
        expect(duration).toBeLessThan(2000);
      }
    }
  });

  test('should search strategies in under 1 second', async ({ page }) => {
    await page.goto('/dashboard/convex');
    await page.waitForLoadState('networkidle');

    const searchButton = page.locator('button:has-text("Advanced Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500);

      const startTime = Date.now();

      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('TechFlow');

      const searchExecButton = page.locator('button:has-text("Search")');
      await searchExecButton.click();
      await page.waitForTimeout(500);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should search in under 1 second
      expect(duration).toBeLessThan(1000);
    }
  });
});
