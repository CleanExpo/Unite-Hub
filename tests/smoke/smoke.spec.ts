/**
 * Smoke Tests — Unite Group
 * Run on every deployment via GitHub Actions smoke-tests.yml
 * Checks 10–12 of the 12-point pre-production checklist (UNI-1461)
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://unite-group.in';

// ── Check 10: Homepage renders without JS errors ─────────────────────────────
test('Check 10: Homepage renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await expect(page).not.toHaveTitle('Error');

  // Filter out expected third-party noise
  const criticalErrors = errors.filter(
    (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
  );
  expect(criticalErrors, `Console errors: ${criticalErrors.join(', ')}`).toHaveLength(0);
});

// ── Check 11: Key resource pages render ─────────────────────────────────────
test('Check 11: Resource pages render (ATO guide + Xero integration)', async ({ page }) => {
  // ATO Tax Guide
  const atoRes = await page.goto(`${BASE}/resources/ato-tax-guide`);
  expect(atoRes?.status(), 'ATO tax guide should return 200').toBe(200);
  await expect(page.locator('h1').first()).toBeVisible();

  // Xero Integration
  const xeroRes = await page.goto(`${BASE}/xero-integration`);
  expect(xeroRes?.status(), 'Xero integration page should return 200').toBe(200);
  await expect(page.locator('h1').first()).toBeVisible();
});

// ── Check 12: Auth flow redirects correctly ──────────────────────────────────
test('Check 12: Protected routes redirect to login', async ({ page }) => {
  // Visiting a protected founder route without auth should redirect
  await page.goto(`${BASE}/founder/dashboard`, { waitUntil: 'networkidle' });

  const finalUrl = page.url();
  // Should land on login/auth page, not the protected page
  const isRedirected =
    finalUrl.includes('/login') ||
    finalUrl.includes('/auth') ||
    finalUrl.includes('/signup') ||
    finalUrl !== `${BASE}/founder/dashboard`;

  expect(isRedirected, `Expected redirect from /founder/dashboard, got: ${finalUrl}`).toBe(true);
});
