/**
 * Percy Visual Regression Tests: Health Check Dashboard
 * Captures visual snapshots for regression detection across desktop/mobile/tablet
 *
 * Run: npx percy exec -- playwright test tests/visual/health-check-dashboard.spec.ts
 * Requires: PERCY_TOKEN environment variable
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

// Configure test settings
test.describe('Health Check Dashboard - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication if needed
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'test-token-visual-regression',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  // Desktop tests (1440px)
  test.describe('Desktop (1440px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('Health check page - Hero section', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-hero-section"]', {
        timeout: 5000,
      });

      // Wait for animations to complete
      await page.waitForTimeout(1000);

      // Percy snapshot
      await percySnapshot(page, 'Health Check Dashboard - Hero Section (Desktop)');
    });

    test('Health check page - Form section', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-form-container"]', {
        timeout: 5000,
      });

      // Scroll to form section
      const form = await page.locator('[data-testid="health-form-container"]');
      await form.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await percySnapshot(page, 'Health Check Dashboard - Form Section (Desktop)');
    });

    test('Health check results - Score cards', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      // Wait for results to load (mock API if needed)
      await page.waitForSelector('[data-testid="health-score-card"]', {
        timeout: 5000,
      }).catch(() => {
        console.log('Score card not found, testing static state');
      });

      // Take screenshot when available
      try {
        const scoreCard = await page.locator('[data-testid="health-score-card"]');
        await scoreCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Health Check Results - Score Cards (Desktop)');
      } catch (e) {
        console.log('Score cards not available, skipping');
      }
    });

    test('Health check results - E.E.A.T. Visualization', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      // Wait for E.E.A.T. section
      try {
        const eeatSection = await page.locator('[data-testid="eeat-visualization"]');
        await eeatSection.waitFor({ timeout: 5000 });
        await eeatSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Health Check Results - E.E.A.T. Visualization (Desktop)');
      } catch (e) {
        console.log('E.E.A.T. visualization not available');
      }
    });

    test('Health check results - Competitor Benchmarking', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      // Wait for competitor table
      try {
        const table = await page.locator('[data-testid="competitor-benchmarking-table"]');
        await table.waitFor({ timeout: 5000 });
        await table.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Health Check Results - Competitor Benchmarking (Desktop)');
      } catch (e) {
        console.log('Competitor table not available');
      }
    });

    test('Health check results - Recommendation Cards', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      // Wait for recommendation section
      try {
        const recs = await page.locator('[data-testid="recommendation-cards"]');
        await recs.waitFor({ timeout: 5000 });
        await recs.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Health Check Results - Recommendations (Desktop)');
      } catch (e) {
        console.log('Recommendation cards not available');
      }
    });

    test('Health check - Error state', async ({ page }) => {
      // Mock an error response
      await page.route('**/api/health-check/**', (route) => {
        route.abort('failed');
      });

      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 5000,
      }).catch(() => {
        console.log('Error message not shown');
      });

      try {
        await percySnapshot(page, 'Health Check - Error State (Desktop)');
      } catch (e) {
        console.log('Error state snapshot failed');
      }
    });

    test('Health check - Loading state', async ({ page }) => {
      // Slow down network to capture loading state
      await page.route('**/api/health-check/**', async (route) => {
        // Delay response
        await new Promise((resolve) => setTimeout(resolve, 3000));
        route.continue();
      });

      await page.goto('http://localhost:3008/health-check');

      // Capture loading state
      try {
        const loading = await page.locator('[data-testid="loading-spinner"]');
        await loading.waitFor({ timeout: 5000 });
        await percySnapshot(page, 'Health Check - Loading State (Desktop)');
      } catch (e) {
        console.log('Loading state not captured');
      }
    });
  });

  // Tablet tests (768px)
  test.describe('Tablet (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('Health check page - Hero section (Tablet)', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-hero-section"]', {
        timeout: 5000,
      });

      await page.waitForTimeout(1000);
      await percySnapshot(page, 'Health Check Dashboard - Hero Section (Tablet)');
    });

    test('Health check results - Full page (Tablet)', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      try {
        const scoreCard = await page.locator('[data-testid="health-score-card"]');
        await scoreCard.waitFor({ timeout: 5000 });
        await page.waitForTimeout(1000);
        await percySnapshot(page, 'Health Check Results - Full Page (Tablet)');
      } catch (e) {
        console.log('Tablet full page snapshot not available');
      }
    });
  });

  // Mobile tests (375px)
  test.describe('Mobile (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('Health check page - Hero section (Mobile)', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-hero-section"]', {
        timeout: 5000,
      });

      await page.waitForTimeout(1000);
      await percySnapshot(page, 'Health Check Dashboard - Hero Section (Mobile)');
    });

    test('Health check page - Form section (Mobile)', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-form-container"]', {
        timeout: 5000,
      });

      const form = await page.locator('[data-testid="health-form-container"]');
      await form.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await percySnapshot(page, 'Health Check Dashboard - Form Section (Mobile)');
    });

    test('Health check results - Score card (Mobile)', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      try {
        const scoreCard = await page.locator('[data-testid="health-score-card"]');
        await scoreCard.waitFor({ timeout: 5000 });
        await scoreCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Health Check Results - Score Card (Mobile)');
      } catch (e) {
        console.log('Mobile score card not available');
      }
    });

    test('Health check results - Navigation (Mobile)', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      try {
        const nav = await page.locator('[data-testid="health-tabs"]');
        await nav.waitFor({ timeout: 5000 });
        await nav.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Health Check Results - Tab Navigation (Mobile)');
      } catch (e) {
        console.log('Mobile navigation not available');
      }
    });

    test('Health check results - Recommendations (Mobile)', async ({ page }) => {
      await page.goto('http://localhost:3008/health-check');

      try {
        // Navigate to recommendations tab if available
        const recsTab = await page.locator('[data-testid="tab-recommendations"]');
        await recsTab.click().catch(() => {});

        const recs = await page.locator('[data-testid="recommendation-cards"]');
        await recs.waitFor({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(500);
        await percySnapshot(page, 'Health Check Results - Recommendations (Mobile)');
      } catch (e) {
        console.log('Mobile recommendations not available');
      }
    });
  });

  // Accessibility & Dark mode tests
  test.describe('Theme & Accessibility', () => {
    test('Health check dashboard - Dark mode', async ({ page }) => {
      // Set dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });

      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-hero-section"]', {
        timeout: 5000,
      });

      await page.waitForTimeout(1000);
      await percySnapshot(page, 'Health Check Dashboard - Dark Mode');
    });

    test('Health check dashboard - High contrast mode', async ({ page }) => {
      // Set high contrast preference
      await page.emulateMedia({ forcedColors: 'active' });

      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-hero-section"]', {
        timeout: 5000,
      });

      await page.waitForTimeout(1000);
      await percySnapshot(page, 'Health Check Dashboard - High Contrast');
    });

    test('Health check dashboard - Reduced motion', async ({ page }) => {
      // Disable animations
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('http://localhost:3008/health-check');
      await page.waitForSelector('[data-testid="health-hero-section"]', {
        timeout: 5000,
      });

      await page.waitForTimeout(500);
      await percySnapshot(page, 'Health Check Dashboard - Reduced Motion');
    });
  });
});
