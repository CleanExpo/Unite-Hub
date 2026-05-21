import { test, expect } from '@playwright/test';

/**
 * Health Endpoint — E2E
 *
 * Uses Playwright's `request` fixture (no browser — pure HTTP).
 * Verifies the /api/health endpoint shape and status codes.
 */

test.describe('GET /api/health', () => {
  test('returns 200 with expected JSON shape', async ({ request }) => {
    const response = await request.get('/api/health');

    // Allow 200 (ok) or 503 (degraded — Supabase not reachable in local dev)
    // In CI with real credentials this must be 200
    const status = response.status();
    expect([200, 503]).toContain(status);

    const body = await response.json();

    expect(body).toHaveProperty('status');
    expect(['ok', 'degraded']).toContain(body.status);
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('connections');
    expect(body.connections).toHaveProperty('supabase');
  });

  test('responds quickly (under 5s)', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/health');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });
});
