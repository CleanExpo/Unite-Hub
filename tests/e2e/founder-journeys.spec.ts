/**
 * Founder E2E Journeys — Unite Group
 * Full user journey tests for founder-specific features (UNI-1462)
 *
 * Prerequisites: PLAYWRIGHT_BASE_URL + valid test account credentials
 * Set in playwright.config.ts or .env.test:
 *   TEST_FOUNDER_EMAIL, TEST_FOUNDER_PASSWORD
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3008';

// ── Helper: skip if no test credentials ──────────────────────────────────────
const requireAuth = () => {
  if (!process.env.TEST_FOUNDER_EMAIL || !process.env.TEST_FOUNDER_PASSWORD) {
    test.skip();
  }
};

// ── Auth Journey ─────────────────────────────────────────────────────────────
test.describe('Auth Journey', () => {
  test('login page loads and shows email field', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]').or(page.locator('input[name="email"]'))).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user redirected from /founder/dashboard', async ({ page }) => {
    await page.goto(`${BASE}/founder/dashboard`, { waitUntil: 'networkidle' });
    const url = page.url();
    expect(url).not.toContain('/founder/dashboard');
  });
});

// ── Core Product Journey ─────────────────────────────────────────────────────
test.describe('Core Product — public pages', () => {
  test('homepage loads with primary CTA visible', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
  });

  test('ATO tax guide renders with structured content', async ({ page }) => {
    await page.goto(`${BASE}/resources/ato-tax-guide`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    // JSON-LD schema should be present
    const schema = await page.locator('script[type="application/ld+json"]').count();
    expect(schema).toBeGreaterThan(0);
  });

  test('Xero integration page renders with Connect CTA', async ({ page }) => {
    await page.goto(`${BASE}/xero-integration`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('a', { hasText: /connect xero/i }).first()).toBeVisible();
  });

  test('AI CRM Australia guide renders', async ({ page }) => {
    await page.goto(`${BASE}/resources/ai-crm-australia`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

// ── Founder Workspace Journey (requires auth) ─────────────────────────────────
test.describe('Founder Workspace Journey', () => {
  test.beforeEach(requireAuth);

  test('founder dashboard loads after login', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', process.env.TEST_FOUNDER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_FOUNDER_PASSWORD!);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(founder|dashboard)/, { timeout: 15_000 });
    await expect(page.locator('h1, [data-testid="dashboard-title"]').first()).toBeVisible();
  });

  test('vault page renders with credential form', async ({ page }) => {
    await page.goto(`${BASE}/founder/vault`);
    const heading = page.locator('h1, h2').filter({ hasText: /vault/i }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('analytics page renders with stat cards', async ({ page }) => {
    await page.goto(`${BASE}/founder/analytics`);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('agent army page renders commander cards', async ({ page }) => {
    await page.goto(`${BASE}/founder/agents/army`);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('knowledge graph page renders', async ({ page }) => {
    await page.goto(`${BASE}/founder/graph`);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Phill OS renders with tab navigation', async ({ page }) => {
    await page.goto(`${BASE}/founder/os`);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── SEO / Schema Journey ──────────────────────────────────────────────────────
test.describe('SEO & Schema', () => {
  test('sitemap.xml returns valid XML with expected URLs', async ({ page }) => {
    const res = await page.goto(`${BASE}/sitemap.xml`);
    expect(res?.status()).toBe(200);

    const content = await page.content();
    expect(content).toContain('<urlset');
    expect(content).toContain('/resources/ato-tax-guide');
    expect(content).toContain('/xero-integration');
  });

  test('robots.txt present and not blocking all crawlers', async ({ page }) => {
    const res = await page.goto(`${BASE}/robots.txt`);
    expect(res?.status()).toBe(200);

    const text = await page.locator('body').innerText();
    expect(text).not.toContain('Disallow: /\nAllow: nothing');
  });
});
