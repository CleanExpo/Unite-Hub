/**
 * E2E Test API Mock Helpers
 *
 * Provides reusable API mocking utilities for Playwright tests.
 */

import { Page } from '@playwright/test';

export interface MockContact {
  id: string;
  name: string;
  email: string;
  workspace_id: string;
  status?: 'cold' | 'warm' | 'hot';
  ai_score?: number;
}

export interface MockWorkspace {
  id: string;
  name: string;
  organization_id: string;
  contacts: MockContact[];
}

export const MOCK_WORKSPACES: Record<string, MockWorkspace> = {
  staff: {
    id: 'ws-staff-e2e-test',
    name: 'Staff Test Workspace',
    organization_id: 'org-staff-e2e-test',
    contacts: [
      {
        id: 'contact-staff-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        workspace_id: 'ws-staff-e2e-test',
        status: 'hot',
        ai_score: 85,
      },
      {
        id: 'contact-staff-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        workspace_id: 'ws-staff-e2e-test',
        status: 'warm',
        ai_score: 72,
      },
    ],
  },
  client: {
    id: 'ws-client-e2e-test',
    name: 'Client Test Workspace',
    organization_id: 'org-client-e2e-test',
    contacts: [
      {
        id: 'contact-client-1',
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        workspace_id: 'ws-client-e2e-test',
        status: 'warm',
        ai_score: 68,
      },
    ],
  },
};

/**
 * Mock contacts API with workspace isolation
 */
export async function mockContactsAPI(page: Page): Promise<void> {
  await page.route('**/api/contacts**', async (route) => {
    const url = new URL(route.request().url());
    const workspaceId = url.searchParams.get('workspaceId');

    // Require auth
    const authHeader = route.request().headers()['authorization'];
    if (!authHeader) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    // Find workspace
    const workspace = Object.values(MOCK_WORKSPACES).find(
      (ws) => ws.id === workspaceId
    );

    if (!workspace) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Workspace not found or access denied' }),
      });
      return;
    }

    // Return workspace contacts
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(workspace.contacts),
    });
  });
}

/**
 * Mock workspace isolation enforcement
 */
export async function mockWorkspaceIsolation(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const workspaceId = url.searchParams.get('workspaceId');

    if (!workspaceId) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'workspaceId parameter required' }),
      });
      return;
    }

    // Verify workspace access based on auth token
    const authHeader = route.request().headers()['authorization'];
    if (!authHeader) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    // Extract workspace from token (mocked logic)
    const token = authHeader.replace('Bearer ', '');
    const userWorkspace = Object.values(MOCK_WORKSPACES).find((ws) =>
      token.includes(ws.id.split('-')[1]) // Extract role from workspace ID
    );

    if (!userWorkspace || userWorkspace.id !== workspaceId) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Access denied: workspace mismatch' }),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Mock Synthex tier gating
 */
export async function mockTierGating(
  page: Page,
  tier: 'starter' | 'professional' | 'elite'
): Promise<void> {
  const tierFeatures = {
    starter: ['basic_seo', 'basic_analytics'],
    professional: [
      'basic_seo',
      'basic_analytics',
      'advanced_seo',
      'competitor_analysis',
    ],
    elite: [
      'basic_seo',
      'basic_analytics',
      'advanced_seo',
      'competitor_analysis',
      'white_label',
      'custom_reporting',
    ],
  };

  const allowedFeatures = tierFeatures[tier];

  await page.route('**/api/client/**', async (route) => {
    const url = route.request().url();

    // Check if route requires premium features
    const requiresAdvancedSEO = url.includes('/seo/') && !url.includes('/basic');
    const requiresCompetitor = url.includes('/competitor');
    const requiresWhiteLabel = url.includes('/white-label');
    const requiresCustomReporting = url.includes('/custom-report');

    let requiredFeature: string | null = null;
    let upgradeRequired: string | null = null;

    if (requiresAdvancedSEO && !allowedFeatures.includes('advanced_seo')) {
      requiredFeature = 'advanced_seo';
      upgradeRequired = 'Professional';
    } else if (
      requiresCompetitor &&
      !allowedFeatures.includes('competitor_analysis')
    ) {
      requiredFeature = 'competitor_analysis';
      upgradeRequired = 'Professional';
    } else if (requiresWhiteLabel && !allowedFeatures.includes('white_label')) {
      requiredFeature = 'white_label';
      upgradeRequired = 'Elite';
    } else if (
      requiresCustomReporting &&
      !allowedFeatures.includes('custom_reporting')
    ) {
      requiredFeature = 'custom_reporting';
      upgradeRequired = 'Elite';
    }

    if (requiredFeature) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: `Feature not available in ${tier} tier`,
          requiredFeature,
          upgradeRequired,
        }),
      });
      return;
    }

    await route.continue();
  });

  // Inject tier into localStorage
  await page.evaluate((tierData) => {
    localStorage.setItem(
      'client_tier',
      JSON.stringify({
        tier: tierData.tier,
        features: tierData.features,
      })
    );
  }, { tier, features: allowedFeatures });
}

/**
 * Mock rate limiting
 */
export async function mockRateLimiting(
  page: Page,
  limit: number = 10,
  windowMs: number = 60000
): Promise<void> {
  const requestCounts = new Map<string, { count: number; resetAt: number }>();

  await page.route('**/api/**', async (route) => {
    const authHeader = route.request().headers()['authorization'];
    const identifier = authHeader || route.request().headers()['x-forwarded-for'] || 'anonymous';

    const now = Date.now();
    const record = requestCounts.get(identifier);

    if (!record || record.resetAt < now) {
      requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
      await route.continue();
      return;
    }

    if (record.count >= limit) {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'Retry-After': Math.ceil((record.resetAt - now) / 1000).toString(),
        },
        body: JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        }),
      });
      return;
    }

    record.count++;
    await route.continue();
  });
}

/**
 * Mock network errors
 */
export async function mockNetworkErrors(
  page: Page,
  errorRate: number = 0.5
): Promise<void> {
  await page.route('**/api/**', async (route) => {
    if (Math.random() < errorRate) {
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
}

/**
 * Clear all API mocks
 */
export async function clearAPIMocks(page: Page): Promise<void> {
  await page.unroute('**/api/**');
}
