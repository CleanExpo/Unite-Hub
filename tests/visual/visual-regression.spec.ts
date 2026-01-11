/**
 * Visual Regression Tests - Playwright Native
 *
 * Uses Playwright's built-in screenshot comparison (no external service needed).
 * Captures visual snapshots across 3 viewports:
 * - Mobile: 375×667
 * - Tablet: 768×1024
 * - Desktop: 1440×900
 *
 * Run locally:
 *   npm run test:visual:baseline  (capture/update baselines)
 *   npm run test:visual           (compare against baselines)
 *
 * Baselines stored in: tests/visual/visual-regression.spec.ts-snapshots/
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3008';

// Viewport sizes
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  desktop: { width: 1440, height: 900, name: 'desktop' },
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

    // Wait for animations to settle
    await page.waitForTimeout(300);

    // Capture screenshot with Playwright native
    await expect(page).toHaveScreenshot(`${pageName}-${viewport.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2, // 20% pixel difference tolerance for animations
    });
  }
}

/**
 * LANDING PAGE - Public homepage
 */
test.describe('Visual Regression - Landing Page', () => {
  test('should render correctly across all viewports', async ({ page }) => {
    await testPageAcrossViewports(page, BASE_URL, 'landing-page', 'h1');
  });
});

/**
 * HEALTH CHECK PAGE - Server status
 */
test.describe('Visual Regression - Health Check', () => {
  test('should render correctly across all viewports', async ({ page }) => {
    await testPageAcrossViewports(page, `${BASE_URL}/health-check`, 'health-check', 'h2');
  });
});

/**
 * DASHBOARD - Main app interface
 */
test.describe('Visual Regression - Dashboard', () => {
  test('should render layout across all viewports', async ({ page }) => {
    await testPageAcrossViewports(page, `${BASE_URL}/dashboard`, 'dashboard', '[data-testid="dashboard"]');
  });
});

/**
 * RESPONSIVE DESIGN - Test key breakpoints
 */
test.describe('Visual Regression - Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('responsive-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('responsive-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('responsive-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

/**
 * INTERACTION STATES - Visual states of interactive elements
 */
test.describe('Visual Regression - Interactive States', () => {
  test('button hover state', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find and hover over first button
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.hover();
      await page.waitForTimeout(200);
      await expect(button).toHaveScreenshot('button-hover.png');
    }
  });

  test('button focus state', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find and focus first button
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.focus();
      await page.waitForTimeout(200);
      await expect(button).toHaveScreenshot('button-focus.png');
    }
  });

  test('input focus state', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find first input
    const input = page.locator('input').first();
    if (await input.isVisible()) {
      await input.focus();
      await page.waitForTimeout(200);
      await expect(input).toHaveScreenshot('input-focus.png');
    }
  });
});

/**
 * ERROR PAGES - Test error page rendering
 */
test.describe('Visual Regression - Error Pages', () => {
  test('404 error page', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(`${BASE_URL}/nonexistent-page-12345`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('error-404.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

/**
 * COMPONENT SNAPSHOTS - Individual UI components
 */
test.describe('Visual Regression - Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('cards render correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const card = page.locator('[class*="card"]').first();
    if (await card.isVisible()) {
      await expect(card).toHaveScreenshot('component-card.png');
    }
  });

  test('navigation renders correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav').first();
    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('component-nav.png');
    }
  });
});
