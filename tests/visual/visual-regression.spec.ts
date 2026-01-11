/**
 * Visual Regression Tests - Percy.io Integration
 *
 * Captures visual snapshots across 3 viewports:
 * - Mobile: 375×667
 * - Tablet: 768×1024
 * - Desktop: 1440×900
 *
 * Run locally:
 *   npm run test:visual:baseline  (capture baselines)
 *   npm run test:visual:percy     (run with Percy)
 *
 * CI/CD: Triggered on PR via GitHub Actions
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const BASE_URL = 'http://localhost:3008';

// Viewport sizes
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  desktop: { width: 1440, height: 900, name: 'Desktop' },
};

/**
 * Helper to test a page across all viewports
 */
async function testPageAcrossViewports(
  page: any,
  url: string,
  pageName: string,
  waitSelector?: string
) {
  for (const [key, viewport] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    await page.goto(url);

    // Wait for page to load
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 5000 }).catch(() => null);
    } else {
      await page.waitForLoadState('networkidle');
    }

    // Scroll to ensure all content is loaded
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.evaluate(() => window.scrollTo(0, 0));

    // Wait a bit for animations to settle
    await page.waitForTimeout(200);

    // Capture Percy snapshot
    await percySnapshot(page, `${pageName} - ${viewport.name}`, {
      widths: [viewport.width],
    });
  }
}

/**
 * LANDING PAGE - Public homepage
 */
test.describe('Visual Regression - Landing Page', () => {
  test('should render correctly across all viewports', async ({ page }) => {
    await testPageAcrossViewports(page, BASE_URL, 'Landing Page', 'h1');
  });
});

/**
 * HEALTH CHECK PAGE - Server status
 */
test.describe('Visual Regression - Health Check', () => {
  test('should render correctly across all viewports', async ({ page }) => {
    await testPageAcrossViewports(
      page,
      `${BASE_URL}/health-check`,
      'Health Check',
      'h2'
    );
  });
});

/**
 * DASHBOARD - Main app interface (authenticated)
 */
test.describe('Visual Regression - Dashboard', () => {
  test('should render layout across all viewports', async ({ page }) => {
    // Note: Dashboard requires auth - this test assumes public/guest access
    // For protected pages, configure Percy with auth in GitHub Actions
    await testPageAcrossViewports(
      page,
      `${BASE_URL}/dashboard`,
      'Dashboard',
      '[data-testid="dashboard"]'
    );
  });
});

/**
 * DESIGN TOKENS PAGE - Visual design reference
 */
test.describe('Visual Regression - Design Tokens', () => {
  test('should render design system colors correctly', async ({ page }) => {
    // This tests the color swatches and design tokens
    await page.setViewportSize({
      width: VIEWPORTS.desktop.width,
      height: VIEWPORTS.desktop.height,
    });

    // Test primary button
    await page.goto(`${BASE_URL}?showcase=buttons`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
    await percySnapshot(page, 'Design System - Buttons', {
      widths: [VIEWPORTS.desktop.width],
    });

    // Test color palette
    await page.goto(`${BASE_URL}?showcase=colors`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
    await percySnapshot(page, 'Design System - Colors', {
      widths: [VIEWPORTS.desktop.width],
    });
  });
});

/**
 * COMPONENT SHOWCASE - UI component gallery
 */
test.describe('Visual Regression - Component Library', () => {
  const components = [
    { name: 'Buttons', selector: '[data-testid="button-showcase"]' },
    { name: 'Forms', selector: '[data-testid="form-showcase"]' },
    { name: 'Cards', selector: '[data-testid="card-showcase"]' },
    { name: 'Dialogs', selector: '[data-testid="dialog-showcase"]' },
    { name: 'Badges', selector: '[data-testid="badge-showcase"]' },
  ];

  for (const component of components) {
    test(`${component.name} component`, async ({ page }) => {
      await page.setViewportSize({
        width: VIEWPORTS.desktop.width,
        height: VIEWPORTS.desktop.height,
      });

      await page.goto(`${BASE_URL}/components?filter=${component.name.toLowerCase()}`);
      await page.waitForLoadState('networkidle');

      // Wait for component to render
      await page.waitForSelector(component.selector, { timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(200);

      await percySnapshot(page, `Components - ${component.name}`, {
        widths: [VIEWPORTS.desktop.width],
      });
    });
  }
});

/**
 * RESPONSIVE DESIGN - Test key breakpoints
 */
test.describe('Visual Regression - Responsive Design', () => {
  test('should adapt correctly to mobile viewport', async ({ page }) => {
    await page.setViewportSize({
      width: VIEWPORTS.mobile.width,
      height: VIEWPORTS.mobile.height,
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Check that mobile menu is visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    const isVisible = await mobileMenu.isVisible().catch(() => false);

    if (isVisible) {
      await percySnapshot(page, 'Responsive - Mobile Menu Open', {
        widths: [VIEWPORTS.mobile.width],
      });
    }
  });

  test('should adapt correctly to tablet viewport', async ({ page }) => {
    await page.setViewportSize({
      width: VIEWPORTS.tablet.width,
      height: VIEWPORTS.tablet.height,
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    await percySnapshot(page, 'Responsive - Tablet Layout', {
      widths: [VIEWPORTS.tablet.width],
    });
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({
      width: VIEWPORTS.desktop.width,
      height: VIEWPORTS.desktop.height,
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    await percySnapshot(page, 'Responsive - Desktop Layout', {
      widths: [VIEWPORTS.desktop.width],
    });
  });
});

/**
 * INTERACTION STATES - Visual states of interactive elements
 */
test.describe('Visual Regression - Interactive States', () => {
  test('should capture button states', async ({ page }) => {
    await page.setViewportSize({
      width: VIEWPORTS.desktop.width,
      height: VIEWPORTS.desktop.height,
    });

    await page.goto(`${BASE_URL}?showcase=buttons`);
    await page.waitForLoadState('networkidle');

    // Hover over button
    const button = page.locator('button').first();
    await button.hover();
    await page.waitForTimeout(200);

    await percySnapshot(page, 'States - Button Hover', {
      widths: [VIEWPORTS.desktop.width],
    });

    // Focus on button
    await button.focus();
    await page.waitForTimeout(200);

    await percySnapshot(page, 'States - Button Focus', {
      widths: [VIEWPORTS.desktop.width],
    });
  });

  test('should capture form input states', async ({ page }) => {
    await page.setViewportSize({
      width: VIEWPORTS.desktop.width,
      height: VIEWPORTS.desktop.height,
    });

    await page.goto(`${BASE_URL}?showcase=forms`);
    await page.waitForLoadState('networkidle');

    const input = page.locator('input').first();

    // Empty state
    await percySnapshot(page, 'States - Input Empty', {
      widths: [VIEWPORTS.desktop.width],
    });

    // Focused state
    await input.focus();
    await page.waitForTimeout(200);

    await percySnapshot(page, 'States - Input Focused', {
      widths: [VIEWPORTS.desktop.width],
    });

    // Filled state
    await input.fill('test@example.com');
    await page.waitForTimeout(200);

    await percySnapshot(page, 'States - Input Filled', {
      widths: [VIEWPORTS.desktop.width],
    });
  });
});

/**
 * DARK MODE - Test theme switching (if implemented)
 */
test.describe('Visual Regression - Theming', () => {
  test('should render dark theme correctly', async ({ page }) => {
    await page.setViewportSize({
      width: VIEWPORTS.desktop.width,
      height: VIEWPORTS.desktop.height,
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check if dark mode is active (Synthex theme)
    const htmlElement = page.locator('html');
    const isDark = await htmlElement.evaluate((el) =>
      window.getComputedStyle(el).colorScheme === 'dark'
    );

    if (isDark) {
      await percySnapshot(page, 'Theme - Dark Mode (Synthex)', {
        widths: [VIEWPORTS.desktop.width],
      });
    }
  });
});

/**
 * ERROR STATES - Test error page rendering
 */
test.describe('Visual Regression - Error Pages', () => {
  test('should render 404 error page', async ({ page }) => {
    await page.setViewportSize({
      width: VIEWPORTS.desktop.width,
      height: VIEWPORTS.desktop.height,
    });

    await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);

    await percySnapshot(page, 'Error - 404 Page', {
      widths: [VIEWPORTS.desktop.width],
    });
  });
});
