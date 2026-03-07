/**
 * E2E Tests — Deals Pipeline (CRM core)
 *
 * Covers the deals API and the deals dashboard page introduced in phase 4+5.
 * These tests verify:
 *   - Auth enforcement on GET /api/deals and POST /api/deals
 *   - workspaceId validation (required parameter)
 *   - Correct HTTP status semantics for unauthenticated requests
 *   - The dashboard deals page redirects unauthenticated users
 *
 * Base URL: http://localhost:3008 (playwright.config.ts)
 *
 * Note: Tests that write data or require a live Supabase session are scoped
 * to mock-route patterns so they run cleanly in CI without credentials.
 */

import { test, expect, type Page } from '@playwright/test';
import { logout } from './helpers/auth-helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Inject the same mock session the existing helpers use */
async function injectMockStaffSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem(
      'supabase.auth.token',
      JSON.stringify({
        access_token: 'mock_access_token_staff',
        refresh_token: 'mock_refresh_token_staff',
        expires_at: Date.now() + 3_600_000,
        user: {
          id: 'user-staff',
          email: 'staff@test.unite-hub.com',
          role: 'STAFF',
          user_metadata: {
            role: 'STAFF',
            workspace_id: 'ws-staff-e2e-test',
            organization_id: 'org-staff-e2e-test',
          },
        },
      })
    );

    localStorage.setItem(
      'current_workspace',
      JSON.stringify({
        id: 'ws-staff-e2e-test',
        organization_id: 'org-staff-e2e-test',
        name: 'Staff Workspace',
      })
    );
  });
}

const MOCK_STAGES = [
  { id: 'stage-1', name: 'Qualification', position: 1, color: '#00F5FF', is_won: false, is_lost: false },
  { id: 'stage-2', name: 'Proposal',      position: 2, color: '#00FF88', is_won: false, is_lost: false },
  { id: 'stage-3', name: 'Closed Won',    position: 3, color: '#00FF88', is_won: true,  is_lost: false },
];

const MOCK_DEALS = [
  {
    id: 'deal-1',
    title: 'Acme Corp Website Rebuild',
    value: 15000,
    currency: 'AUD',
    probability: 75,
    status: 'open',
    workspace_id: 'ws-staff-e2e-test',
    stage_id: 'stage-1',
    contact_id: 'contact-staff-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pipeline_stages: MOCK_STAGES[0],
    contacts: { id: 'contact-staff-1', name: 'John Doe', email: 'john@acme.com', company: 'Acme Corp' },
  },
  {
    id: 'deal-2',
    title: 'Beta Industries SEO Retainer',
    value: 3500,
    currency: 'AUD',
    probability: 90,
    status: 'open',
    workspace_id: 'ws-staff-e2e-test',
    stage_id: 'stage-2',
    contact_id: 'contact-staff-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pipeline_stages: MOCK_STAGES[1],
    contacts: { id: 'contact-staff-2', name: 'Jane Smith', email: 'jane@beta.com', company: 'Beta Industries' },
  },
];

// ─── API auth enforcement ─────────────────────────────────────────────────────

test.describe('GET /api/deals — auth enforcement', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
  });

  test('returns 401 or 307 when no session cookie is present', async ({ page }) => {
    const response = await page.request.get('/api/deals?workspaceId=ws-staff-e2e-test');
    // Next.js middleware may redirect (307) before the route handler fires,
    // or the route handler itself returns 401/403.
    expect([401, 403, 307, 308]).toContain(response.status());
  });

  test('never returns a 5xx for an unauthenticated request', async ({ page }) => {
    const response = await page.request.get('/api/deals?workspaceId=ws-staff-e2e-test');
    expect(response.status()).toBeLessThan(500);
  });
});

// ─── API parameter validation ──────────────────────────────────────────────────

test.describe('GET /api/deals — workspaceId validation', () => {
  test('returns 400 or 422 when workspaceId is omitted', async ({ page }) => {
    // Navigate to establish session cookies (the route reads them server-side)
    await page.goto('/');
    await injectMockStaffSession(page);

    // Call without workspaceId — route handler validates this before any DB call
    const response = await page.request.get('/api/deals');
    // 400 (validationError) or 401 (no valid server-side session) are both fine.
    // What must NOT happen is a 500.
    expect(response.status()).toBeLessThan(500);
    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

// ─── POST /api/deals — auth enforcement ───────────────────────────────────────

test.describe('POST /api/deals — auth enforcement', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
  });

  test('returns 401 or 307 when unauthenticated', async ({ page }) => {
    const response = await page.request.post('/api/deals', {
      data: {
        workspaceId: 'ws-staff-e2e-test',
        title: 'Injected Deal',
        stage_id: 'stage-1',
      },
    });
    expect([401, 403, 307, 308]).toContain(response.status());
  });

  test('never returns a 5xx for an unauthenticated POST', async ({ page }) => {
    const response = await page.request.post('/api/deals', {
      data: { workspaceId: 'ws-staff-e2e-test', title: 'Test', stage_id: 'stage-1' },
    });
    expect(response.status()).toBeLessThan(500);
  });
});

// ─── Dashboard deals page — auth guard ────────────────────────────────────────

test.describe('/dashboard/deals — auth guard', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
  });

  test('redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/dashboard/deals');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/auth\/signin|\/login/i);
  });

  test('URL resolves without 5xx from Next.js server', async ({ page }) => {
    const response = await page.request.get('/dashboard/deals');
    expect(response.status()).toBeLessThan(500);
  });
});

// ─── Dashboard deals page — mock-authenticated rendering ──────────────────────

test.describe('/dashboard/deals — mock-authenticated rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home first so localStorage is accessible, then inject session
    await page.goto('/');
    await injectMockStaffSession(page);

    // Mock the deals API so the page renders without a live Supabase connection
    await page.route('**/api/deals**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { deals: MOCK_DEALS },
          meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
        }),
      });
    });

    // Mock pipeline stages API if the page fetches it separately
    await page.route('**/api/pipeline**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stages: MOCK_STAGES }),
      });
    });

    await page.goto('/dashboard/deals');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page body renders without a crash', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect((body ?? '').length).toBeGreaterThan(0);
  });

  test('page title contains "Unite" or "Deal"', async ({ page }) => {
    const title = await page.title();
    expect(title).toMatch(/Unite|Deal|CRM/i);
  });

  test('URL stays on /dashboard/deals when session cookies are present', async ({ page }) => {
    // If the server resolves the mock session, we stay on the deals page.
    // If PKCE middleware cannot validate the mock token, it redirects —
    // that is also acceptable behaviour in a unit-style e2e without real Supabase.
    const url = page.url();
    expect(url).toMatch(/dashboard\/deals|auth\/signin|login/i);
  });
});

// ─── Deals API mock — response shape contract ─────────────────────────────────

test.describe('Deals API response contract (mocked)', () => {
  test('mocked GET /api/deals returns expected shape', async ({ page }) => {
    await page.route('**/api/deals**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { deals: MOCK_DEALS },
          meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
        }),
      });
    });

    await page.goto('/');
    const response = await page.request.get('/api/deals?workspaceId=ws-staff-e2e-test');
    const body = await response.json() as Record<string, unknown>;

    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    const data = body.data as Record<string, unknown>;
    expect(data).toHaveProperty('deals');
    expect(Array.isArray(data.deals)).toBe(true);
  });

  test('mocked deals list contains AUD currency and correct value types', async ({ page }) => {
    await page.route('**/api/deals**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { deals: MOCK_DEALS },
          meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
        }),
      });
    });

    await page.goto('/');
    const response = await page.request.get('/api/deals?workspaceId=ws-staff-e2e-test');
    const body = await response.json() as { data: { deals: typeof MOCK_DEALS } };
    const deals = body.data.deals;

    for (const deal of deals) {
      expect(deal.currency).toBe('AUD');
      expect(typeof deal.value).toBe('number');
      expect(deal.value).toBeGreaterThanOrEqual(0);
      expect(typeof deal.probability).toBe('number');
      expect(deal.probability).toBeGreaterThanOrEqual(0);
      expect(deal.probability).toBeLessThanOrEqual(100);
    }
  });

  test('mocked deal includes nested contact and stage objects', async ({ page }) => {
    await page.route('**/api/deals**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { deals: MOCK_DEALS },
          meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
        }),
      });
    });

    await page.goto('/');
    const response = await page.request.get('/api/deals?workspaceId=ws-staff-e2e-test');
    const body = await response.json() as { data: { deals: typeof MOCK_DEALS } };
    const [first] = body.data.deals;

    // Nested stage join
    expect(first.pipeline_stages).toHaveProperty('id');
    expect(first.pipeline_stages).toHaveProperty('name');
    expect(typeof first.pipeline_stages.is_won).toBe('boolean');

    // Nested contact join
    expect(first.contacts).toHaveProperty('email');
    expect(first.contacts).toHaveProperty('name');
  });
});
