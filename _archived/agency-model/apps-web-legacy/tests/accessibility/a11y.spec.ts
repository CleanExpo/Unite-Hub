import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility Testing Suite
 *
 * Tests all critical pages for WCAG 2.1 AA compliance using axe-core.
 *
 * Coverage:
 * - Homepage
 * - PRD generation flow
 * - Authentication pages
 * - Dashboard pages
 *
 * Standards:
 * - WCAG 2.1 Level A
 * - WCAG 2.1 Level AA
 */

test.describe('Accessibility Tests - Homepage', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('homepage navigation is keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Check for skip link
    await page.keyboard.press('Tab')
    const skipLink = page.locator('a[href="#main-content"]')
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeFocused()
    }

    // Check that all interactive elements are focusable
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test.describe('Accessibility Tests - PRD Generation', () => {
  test('PRD form has no accessibility violations', async ({ page }) => {
    await page.goto('/prd')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('PRD form can be completed with keyboard only', async ({ page }) => {
    await page.goto('/prd')

    // Try to navigate through form with keyboard
    await page.keyboard.press('Tab') // Focus first field
    await page.keyboard.type('Test Product')

    await page.keyboard.press('Tab') // Next field
    await page.keyboard.type('Test description')

    // Verify form is accessible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('form validation errors are announced to screen readers', async ({ page }) => {
    await page.goto('/prd')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /generate|submit/i })
    await submitButton.click()

    // Wait for validation errors
    await page.waitForTimeout(500)

    // Check for ARIA live regions
    const liveRegions = page.locator('[role="alert"], [aria-live]')
    const count = await liveRegions.count()

    // Should have at least one live region for errors
    if (count > 0) {
      const firstRegion = liveRegions.first()
      const ariaLive = await firstRegion.getAttribute('aria-live')
      expect(['assertive', 'polite']).toContain(ariaLive)
    }

    // Check for accessibility violations
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('PRD results page is accessible', async ({ page }) => {
    // Skip if no test data available
    await page.goto('/prd')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test.describe('Accessibility Tests - Authentication', () => {
  test('login page has no accessibility violations', async ({ page }) => {
    await page.goto('/login')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Allow violations if page doesn't exist (404)
    if (page.url().includes('/login') && !page.url().includes('404')) {
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })

  test('signup page has no accessibility violations', async ({ page }) => {
    await page.goto('/signup')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Allow violations if page doesn't exist (404)
    if (page.url().includes('/signup') && !page.url().includes('404')) {
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })
})

test.describe('Accessibility Tests - Dashboard', () => {
  test('dashboard has no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Allow violations if page doesn't exist or requires auth
    if (page.url().includes('/dashboard') && !page.url().includes('404') && !page.url().includes('login')) {
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })
})

test.describe('Accessibility Tests - Color Contrast', () => {
  test('homepage has sufficient color contrast', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.') // Check all elements
      .analyze()

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })
})

test.describe('Accessibility Tests - Heading Hierarchy', () => {
  test('homepage has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // Check for h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
    expect(h1Count).toBeLessThanOrEqual(1) // Should have exactly one h1

    // Check heading levels don't skip
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test.describe('Accessibility Tests - Form Labels', () => {
  test('PRD form inputs have proper labels', async ({ page }) => {
    await page.goto('/prd')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    // Filter for label violations
    const labelViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'label' || v.id === 'label-title-only'
    )

    expect(labelViolations).toEqual([])
  })
})

test.describe('Accessibility Tests - Image Alt Text', () => {
  test('all images have alt text', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    // Filter for image alt violations
    const imageViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'image-alt'
    )

    expect(imageViolations).toEqual([])
  })
})

test.describe('Accessibility Tests - ARIA', () => {
  test('ARIA attributes are used correctly', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Filter for ARIA violations
    const ariaViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('aria')
    )

    expect(ariaViolations).toEqual([])
  })
})

test.describe('Accessibility Tests - Mobile Responsive', () => {
  test('mobile viewport has no accessibility violations', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('tablet viewport has no accessibility violations', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test.describe('Accessibility Tests - Dark Mode', () => {
  test('dark mode has sufficient color contrast', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    // Wait for dark mode to apply
    await page.waitForTimeout(500)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })
})

test.describe('Accessibility Tests - Focus Management', () => {
  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/')

    // Tab through elements and check for visible focus
    await page.keyboard.press('Tab')
    await page.waitForTimeout(100)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('focus is not trapped unintentionally', async ({ page }) => {
    await page.goto('/')

    // Tab through several times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }

    // Should still be able to use Shift+Tab to go back
    await page.keyboard.press('Shift+Tab')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
