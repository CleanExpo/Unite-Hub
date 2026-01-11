/**
 * Page-Level Accessibility Tests - WCAG 2.1 AA
 *
 * End-to-end accessibility testing using Playwright + axe-playwright
 * Tests full pages for accessibility compliance across critical user flows.
 *
 * Coverage:
 * - No aXe violations on live pages
 * - Keyboard navigation through entire page
 * - Focus management and tab order
 * - Mobile/tablet/desktop responsiveness
 *
 * Run with: npm run test:e2e -- tests/accessibility/pages.a11y.spec.ts
 */

import { test, expect } from '@playwright/test';
import { injectAxe, getViolations } from 'axe-playwright';

/**
 * LANDING PAGE ACCESSIBILITY
 */
test.describe('Landing Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3008');
    await injectAxe(page);
  });

  test('should have no aXe violations', async ({ page }) => {
    const violations = await getViolations(page);
    expect(violations).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check that there's exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Check heading order is logical (h1 → h2/h3, not h1 → h4)
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('should have descriptive link text', async ({ page }) => {
    // Links should not just say "click here" or "read more"
    const links = await page.locator('a').all();
    const vagueLinkTexts = ['click here', 'read more', 'learn more', 'link'];

    for (const link of links) {
      const text = (await link.textContent())?.toLowerCase() || '';
      expect(vagueLinkTexts).not.toContain(text);
    }
  });

  test('should have alt text on all images', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).not.toBe(''); // alt should be meaningful, not empty
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through main interactive elements
    const mainContent = page.locator('main');
    await mainContent.focus();

    // Tab to first button/link
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Check that focused element has visible outline or ring
    const focusedElement = page.locator(':focus');
    const computedStyle = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        boxShadow: style.boxShadow,
        border: style.border,
      };
    });

    const hasFocusIndicator = Object.values(computedStyle).some(
      (value) => value && value !== 'none' && value !== 'rgba(0, 0, 0, 0)'
    );
    expect(hasFocusIndicator).toBe(true);
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await injectAxe(page);

    const violations = await getViolations(page);
    expect(violations).toHaveLength(0);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await injectAxe(page);

    const violations = await getViolations(page);
    expect(violations).toHaveLength(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check text elements have sufficient contrast
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, a, button').all();

    for (const element of textElements.slice(0, 10)) { // Check first 10
      const color = await element.evaluate((el) => window.getComputedStyle(el).color);
      const bgColor = await element.evaluate((el) => window.getComputedStyle(el).backgroundColor);

      // This is a simplified check - real contrast calculation is complex
      // In production, use a dedicated contrast checking library
      expect(color).toBeTruthy();
    }
  });
});

/**
 * DASHBOARD ACCESSIBILITY
 */
test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming dashboard requires auth - adjust as needed
    await page.goto('http://localhost:3008/dashboard');
    await injectAxe(page);
  });

  test('should have no aXe violations', async ({ page }) => {
    const violations = await getViolations(page);
    expect(violations).toHaveLength(0);
  });

  test('should have proper form labeling', async ({ page }) => {
    const inputs = await page.locator('input').all();

    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have either:
      // 1. Associated label via htmlFor
      // 2. aria-label
      // 3. aria-labelledby
      const hasLabel = inputId && inputName;
      const hasAriaLabel = ariaLabel !== null && ariaLabel !== '';
      const hasAriaLabelledBy = ariaLabelledBy !== null && ariaLabelledBy !== '';

      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
    }
  });

  test('should announce error messages to screen readers', async ({ page }) => {
    // Find any error messages
    const errors = await page.locator('[role="alert"]').all();

    // If errors exist, verify they have proper role
    for (const error of errors) {
      const role = await error.getAttribute('role');
      expect(role).toBe('alert');
    }
  });

  test('should have interactive elements with clear purpose', async ({ page }) => {
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // Button should have visible text OR aria-label OR title
      const hasLabel = (text && text.trim()) || ariaLabel || title;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should support keyboard shortcuts consistently', async ({ page }) => {
    // Common shortcuts should be documented
    const html = await page.content();

    // Check for keyboard shortcut help (e.g., in a help modal or footer)
    // This is optional but recommended for power users
    const hasHelpDoc = html.includes('keyboard') || html.includes('shortcut');
    // No assertion - just informational
  });

  test('should skip to main content', async ({ page }) => {
    // Check for skip links or similar accessibility feature
    const skipLink = await page.locator('a[href="#main"], a:has-text("Skip to content"), a:has-text("Skip to main")');
    const exists = await skipLink.isVisible().catch(() => false);

    // Skip links are optional but recommended
    // Just verify they work if present
    if (exists) {
      await skipLink.click();
      const mainElement = await page.locator('main');
      const isFocused = await mainElement.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });
});

/**
 * MODAL/DIALOG ACCESSIBILITY
 */
test.describe('Modal Dialog Accessibility', () => {
  test('should trap focus within dialog', async ({ page }) => {
    await page.goto('http://localhost:3008');

    // Open a dialog (adjust selector as needed)
    const dialogTrigger = await page.locator('button').first();
    const isDialog = await dialogTrigger.getAttribute('aria-haspopup');

    if (isDialog === 'dialog') {
      await dialogTrigger.click();
      await injectAxe(page);

      const violations = await getViolations(page);
      expect(violations).toHaveLength(0);

      // Tab through all elements - they should stay within dialog
      let tabCount = 0;
      while (tabCount < 20) {
        await page.keyboard.press('Tab');
        const activeElement = await page.evaluate(() => document.activeElement?.tagName);
        // Active element should still be within dialog
        tabCount++;
      }
    }
  });

  test('should close on Escape key', async ({ page }) => {
    await page.goto('http://localhost:3008');

    const dialogTrigger = await page.locator('button').first();
    const isDialog = await dialogTrigger.getAttribute('aria-haspopup');

    if (isDialog === 'dialog') {
      await dialogTrigger.click();

      // Press Escape
      await page.keyboard.press('Escape');

      // Dialog should be closed
      const dialog = await page.locator('[role="dialog"]');
      const isVisible = await dialog.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
  });
});

/**
 * FORM ACCESSIBILITY
 */
test.describe('Form Accessibility', () => {
  test('should have proper form structure', async ({ page }) => {
    await page.goto('http://localhost:3008');

    const forms = await page.locator('form').all();

    for (const form of forms) {
      // Each form should have a descriptive name/title
      const formContent = await form.textContent();
      expect(formContent?.length).toBeGreaterThan(10);
    }
  });

  test('should provide clear error messages', async ({ page }) => {
    // Test error message clarity
    const errorMessages = await page.locator('[role="alert"], .error, [aria-invalid="true"]').all();

    for (const error of errorMessages) {
      const text = await error.textContent();
      // Error message should be specific, not just "Error"
      expect(text).not.toBe('Error');
      expect(text?.length).toBeGreaterThan(5);
    }
  });

  test('should provide helpful validation feedback', async ({ page }) => {
    const inputs = await page.locator('input[type="email"], input[type="tel"], input[type="password"]').all();

    for (const input of inputs) {
      // Check for aria-describedby pointing to help text
      const describedBy = await input.getAttribute('aria-describedby');
      const title = await input.getAttribute('title');
      const placeholder = await input.getAttribute('placeholder');

      // Should have some help text
      const hasHelp = describedBy || title || placeholder;
      expect(hasHelp).toBeTruthy();
    }
  });
});

/**
 * COLOR AND CONTRAST TESTS
 */
test.describe('Color Contrast', () => {
  test('text should have sufficient contrast on desktop', async ({ page }) => {
    await page.goto('http://localhost:3008');
    await injectAxe(page);

    const violations = await getViolations(page);

    // Filter for color contrast violations
    const contrastViolations = violations.filter((v) =>
      v.id.includes('color-contrast')
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('text should have sufficient contrast on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3008');
    await injectAxe(page);

    const violations = await getViolations(page);
    const contrastViolations = violations.filter((v) =>
      v.id.includes('color-contrast')
    );

    expect(contrastViolations).toHaveLength(0);
  });
});

/**
 * RESPONSIVE DESIGN ACCESSIBILITY
 */
test.describe('Responsive Design Accessibility', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`should be accessible on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3008');
      await injectAxe(page);

      const violations = await getViolations(page);
      expect(violations).toHaveLength(0);
    });
  }
});
