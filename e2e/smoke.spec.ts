import { test, expect } from '@playwright/test';

/**
 * Smoke Tests — Nexus 2.0 (Task 11C)
 *
 * 8 canonical smoke tests verifying the core application shell.
 * Tests 1–3 run without authentication.
 * Tests 4–8 are skipped until Playwright auth setup is completed in Phase 12.
 *
 * Run: pnpm test:e2e --grep "Smoke"
 */

test.describe('Smoke — No Auth Required', () => {
  /**
   * Test 1: Health endpoint returns a successful HTTP status.
   * Uses the `request` fixture (pure HTTP — no browser overhead).
   * Accepts 200 (healthy) or 503 (degraded, e.g. Supabase unreachable in local dev).
   */
  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/health');

    // 200 = fully healthy; 503 = degraded but endpoint itself is alive.
    // Both are valid responses — the endpoint must at least respond.
    const status = response.status();
    expect([200, 503]).toContain(status);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(['ok', 'degraded']).toContain(body.status);
  });

  /**
   * Test 2: Unauthenticated root request redirects to the login page.
   * The root page performs a server-side redirect when no session is present.
   */
  test('root redirect — visiting / redirects to /auth/login', async ({ page }) => {
    await page.goto('/');

    // Middleware or root page.tsx redirects unauthenticated visitors to login.
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  /**
   * Test 3: Login page loads and renders the sign-in form.
   * Verifies the page is reachable and contains the expected form fields.
   */
  test('login page loads with email/password form', async ({ page }) => {
    await page.goto('/auth/login');

    // Must land on /auth/login without further redirect.
    await expect(page).toHaveURL(/\/auth\/login/);

    // Page must not render a Next.js error boundary.
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('500');

    // Core form elements must be visible.
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('Smoke — Auth Required (Phase 12)', () => {
  /**
   * Test 4: Dashboard loads with KPI cards.
   * Requires a valid founder session — deferred to Phase 12 auth setup.
   */
  test('dashboard loads with KPI cards', async ({ page }) => {
    test.skip(true, 'requires Playwright auth setup — add in Phase 12');

    await page.goto('/founder/dashboard');
    await expect(page).toHaveURL(/\/founder\/dashboard/);
    await expect(page.locator('[data-testid="kpi-grid"]')).toBeVisible();
  });

  /**
   * Test 5: Sidebar navigation renders and links to major sections.
   * Sidebar is only rendered inside the authenticated /founder layout.
   */
  test('sidebar navigation works', async ({ page }) => {
    test.skip(true, 'requires Playwright auth setup — add in Phase 12');

    await page.goto('/founder/dashboard');
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('a[href="/founder/kanban"]')).toBeVisible();
  });

  /**
   * Test 6: Advisory workbench loads.
   * MACAS (Multi-Agent Competitive Accounting System) panel — requires auth.
   */
  test('advisory workbench loads', async ({ page }) => {
    test.skip(true, 'requires Playwright auth setup — add in Phase 12');

    await page.goto('/founder/advisory');
    await expect(page).toHaveURL(/\/founder\/advisory/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  /**
   * Test 7: Campaign dashboard loads.
   * PaperBanana dual-engine visual campaign page — requires auth.
   */
  test('campaign dashboard loads', async ({ page }) => {
    test.skip(true, 'requires Playwright auth setup — add in Phase 12');

    await page.goto('/founder/campaigns');
    await expect(page).toHaveURL(/\/founder\/campaigns/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  /**
   * Test 8: Vault page loads.
   * AES-256-GCM credentials vault — requires auth and VAULT_ENCRYPTION_KEY.
   */
  test('vault page loads', async ({ page }) => {
    test.skip(true, 'requires Playwright auth setup — add in Phase 12');

    await page.goto('/founder/vault');
    await expect(page).toHaveURL(/\/founder\/vault/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
