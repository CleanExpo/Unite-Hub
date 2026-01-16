/**
 * Percy Visual Regression Tests
 *
 * Captures visual snapshots of critical pages for regression detection.
 * Run with: npm run test:percy
 */

import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3008';

// Critical pages to test visually
const CRITICAL_PAGES = [
  { path: '/', name: 'Landing Page' },
  { path: '/health-check', name: 'Health Check Dashboard' },
];

// Pages requiring authentication
const AUTHENTICATED_PAGES = [
  { path: '/dashboard', name: 'Main Dashboard' },
  { path: '/dashboard/contacts', name: 'Contacts CRM' },
  { path: '/dashboard/campaigns', name: 'Campaigns' },
  { path: '/dashboard/analytics', name: 'Analytics' },
];

test.describe('Percy Visual Regression - Public Pages', () => {
  for (const page of CRITICAL_PAGES) {
    test(`${page.name} - Visual Snapshot`, async ({ page: playwrightPage }) => {
      await playwrightPage.goto(`${BASE_URL}${page.path}`);
      await playwrightPage.waitForLoadState('networkidle');

      // Wait for animations to complete
      await playwrightPage.waitForTimeout(500);

      // Hide dynamic elements
      await playwrightPage.evaluate(() => {
        document.querySelectorAll('[data-testid="timestamp"], [data-testid="live-indicator"]').forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });

      await percySnapshot(playwrightPage, page.name, {
        widths: [375, 768, 1440],
        minHeight: 1024,
      });
    });
  }
});

test.describe('Percy Visual Regression - Authenticated Pages', () => {
  test.skip(true, 'Requires authentication setup');

  // TODO: Add authentication before running these tests
  // This would typically be done in a beforeEach hook

  for (const page of AUTHENTICATED_PAGES) {
    test(`${page.name} - Visual Snapshot`, async ({ page: playwrightPage }) => {
      await playwrightPage.goto(`${BASE_URL}${page.path}`);
      await playwrightPage.waitForLoadState('networkidle');
      await playwrightPage.waitForTimeout(500);

      await percySnapshot(playwrightPage, page.name, {
        widths: [375, 768, 1440],
        minHeight: 1024,
      });
    });
  }
});

test.describe('Percy Component Snapshots', () => {
  test.skip(true, 'Requires component showcase page');

  test('Button variants', async ({ page }) => {
    await page.goto(`${BASE_URL}/component-showcase`);
    const showcase = page.locator('[data-testid="button-showcase"]');
    await showcase.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log('Button showcase not found, skipping');
    });
    await percySnapshot(page, 'Button Variants');
  });

  test('Card components', async ({ page }) => {
    await page.goto(`${BASE_URL}/component-showcase`);
    const showcase = page.locator('[data-testid="card-showcase"]');
    await showcase.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log('Card showcase not found, skipping');
    });
    await percySnapshot(page, 'Card Components');
  });

  test('Form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/component-showcase`);
    const showcase = page.locator('[data-testid="form-showcase"]');
    await showcase.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log('Form showcase not found, skipping');
    });
    await percySnapshot(page, 'Form Elements');
  });
});

test.describe('Percy State-based Snapshots', () => {
  test('Error page state', async ({ page }) => {
    // Navigate to a non-existent page to capture 404
    await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, '404 Error Page', {
      widths: [375, 1440],
    });
  });

  test('Loading skeleton state', async ({ page }) => {
    // Use route interception to delay API responses
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.continue();
    });

    await page.goto(`${BASE_URL}/health-check`);

    // Capture loading state immediately
    await percySnapshot(page, 'Loading Skeleton State', {
      widths: [1440],
    });
  });
});
