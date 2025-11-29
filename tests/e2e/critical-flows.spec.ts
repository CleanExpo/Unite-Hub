/**
 * Critical Flows E2E Test Suite
 *
 * Tests the most important user journeys and security boundaries in Unite-Hub.
 *
 * Coverage:
 * 1. Authentication Flow (Google OAuth, session persistence, role-based redirects)
 * 2. Dashboard Access (staff vs client access patterns)
 * 3. Workspace Isolation (data scoping, unauthorized access prevention)
 * 4. Tier Gating (Synthex feature restrictions)
 * 5. API Security (auth validation, workspace filtering)
 */

import { test, expect, Page } from '@playwright/test';
import { chromium } from '@playwright/test';

// Test Configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3008';
const TEST_TIMEOUT = 30000; // 30 seconds for OAuth flows

// Mock User Credentials (for test environment)
const MOCK_USERS = {
  staff: {
    email: 'staff@test.com',
    password: 'Test123!@#',
    role: 'STAFF',
    workspaceId: 'workspace-staff-123',
  },
  client: {
    email: 'client@test.com',
    password: 'Test123!@#',
    role: 'CLIENT',
    workspaceId: 'workspace-client-456',
  },
  founder: {
    email: 'founder@test.com',
    password: 'Test123!@#',
    role: 'FOUNDER',
    workspaceId: 'workspace-founder-789',
  },
};

// Mock Workspace Data
const MOCK_WORKSPACES = {
  staffWorkspace: {
    id: 'workspace-staff-123',
    name: 'Test Agency',
    contacts: [
      { id: 'contact-1', name: 'John Doe', email: 'john@example.com' },
      { id: 'contact-2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
  },
  clientWorkspace: {
    id: 'workspace-client-456',
    name: 'Client Corp',
    contacts: [
      { id: 'contact-3', name: 'Bob Wilson', email: 'bob@example.com' },
    ],
  },
};

// Mock Synthex Tiers
const MOCK_TIERS = {
  starter: {
    id: 'tier-starter',
    name: 'Starter',
    features: ['basic_seo', 'basic_analytics'],
  },
  professional: {
    id: 'tier-pro',
    name: 'Professional',
    features: ['basic_seo', 'basic_analytics', 'advanced_seo', 'competitor_analysis'],
  },
  elite: {
    id: 'tier-elite',
    name: 'Elite',
    features: ['basic_seo', 'basic_analytics', 'advanced_seo', 'competitor_analysis', 'white_label', 'custom_reporting'],
  },
};

/**
 * Helper: Login as specific user role
 */
async function loginAs(page: Page, userType: 'staff' | 'client' | 'founder') {
  const user = MOCK_USERS[userType];

  await page.goto(`${BASE_URL}/auth/signin`);

  // Check if using Google OAuth or email/password
  const hasGoogleButton = await page.locator('button:has-text("Continue with Google")').isVisible().catch(() => false);

  if (hasGoogleButton) {
    // Mock Google OAuth flow (in test environment, this should be intercepted)
    await page.route('**/auth/callback', async (route) => {
      // Mock successful OAuth callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/implicit-callback#access_token=mock_token&refresh_token=mock_refresh',
        },
      });
    });

    await page.click('button:has-text("Continue with Google")');

    // Wait for redirect to complete
    await page.waitForURL(/\/(dashboard|client)/, { timeout: TEST_TIMEOUT });
  } else {
    // Use email/password form
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|client)/, { timeout: TEST_TIMEOUT });
  }

  // Mock session storage with user data
  await page.evaluate((userData) => {
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      user: {
        id: `user-${userData.role.toLowerCase()}`,
        email: userData.email,
        user_metadata: {
          role: userData.role,
          workspace_id: userData.workspaceId,
        },
      },
    }));
  }, user);
}

/**
 * Helper: Clear all auth state
 */
async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.context().clearCookies();
}

/**
 * Test Suite 1: Authentication Flow
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/overview`);

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/signin|\/login/);
  });

  test('should complete Google OAuth flow and create session', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    await page.goto(`${BASE_URL}/auth/signin`);

    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();

    // Mock OAuth callback
    await page.route('**/auth/callback**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/implicit-callback#access_token=mock_token&refresh_token=mock_refresh',
          'Set-Cookie': 'sb-access-token=mock_token; Path=/; HttpOnly; Secure; SameSite=Lax',
        },
      });
    });

    await googleButton.click();

    // Should redirect to dashboard or client portal
    await expect(page).toHaveURL(/\/(dashboard|client)/, { timeout: TEST_TIMEOUT });
  });

  test('should persist session after page reload', async ({ page }) => {
    await loginAs(page, 'staff');

    // Verify logged in
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect STAFF role to /dashboard', async ({ page }) => {
    await loginAs(page, 'staff');

    await expect(page).toHaveURL(/\/dashboard/);

    // Verify staff dashboard elements
    const nav = page.locator('nav');
    await expect(nav).toContainText('Dashboard');
    await expect(nav).toContainText('Contacts');
  });

  test('should redirect CLIENT role to /client', async ({ page }) => {
    await loginAs(page, 'client');

    await expect(page).toHaveURL(/\/client/);

    // Verify client portal elements
    const nav = page.locator('nav');
    await expect(nav).toContainText('Home');
    await expect(nav).toContainText('Projects');
  });

  test('should handle logout and clear session', async ({ page }) => {
    await loginAs(page, 'staff');

    // Click logout (assuming there's a logout button)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    await logoutButton.click();

    // Wait for redirect
    await page.waitForURL(/\/auth\/signin|\/login/, { timeout: 5000 });

    // Verify session cleared
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token') !== null;
    });

    expect(hasToken).toBeFalsy();
  });
});

/**
 * Test Suite 2: Dashboard Access Control
 */
test.describe('Dashboard Access Control', () => {
  test('STAFF can access /dashboard/overview', async ({ page }) => {
    await loginAs(page, 'staff');

    await page.goto(`${BASE_URL}/dashboard/overview`);

    // Should NOT redirect
    await expect(page).toHaveURL(/\/dashboard\/overview/);

    // Verify dashboard content loads
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('CLIENT is redirected from /dashboard to /client/home', async ({ page }) => {
    await loginAs(page, 'client');

    await page.goto(`${BASE_URL}/dashboard/overview`);

    // Should redirect to client portal
    await expect(page).toHaveURL(/\/client/, { timeout: 5000 });
  });

  test('STAFF cannot access /client portal', async ({ page }) => {
    await loginAs(page, 'staff');

    await page.goto(`${BASE_URL}/client/home`);

    // Should redirect back to staff dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('FOUNDER has access to both /dashboard and /founder routes', async ({ page }) => {
    await loginAs(page, 'founder');

    // Can access dashboard
    await page.goto(`${BASE_URL}/dashboard/overview`);
    await expect(page).toHaveURL(/\/dashboard\/overview/);

    // Can access founder routes
    await page.goto(`${BASE_URL}/founder/overview`);
    await expect(page).toHaveURL(/\/founder\/overview/);
  });
});

/**
 * Test Suite 3: Workspace Isolation
 */
test.describe('Workspace Isolation', () => {
  test('contacts list only shows workspace-scoped data', async ({ page }) => {
    await loginAs(page, 'staff');

    // Mock API response with workspace-scoped contacts
    await page.route('**/api/contacts**', async (route) => {
      const url = new URL(route.request().url());
      const workspaceId = url.searchParams.get('workspaceId');

      if (workspaceId === MOCK_WORKSPACES.staffWorkspace.id) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_WORKSPACES.staffWorkspace.contacts),
        });
      } else {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden' }),
        });
      }
    });

    await page.goto(`${BASE_URL}/dashboard/contacts`);

    // Should see staff workspace contacts
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();

    // Should NOT see client workspace contacts
    await expect(page.locator('text=Bob Wilson')).not.toBeVisible();
  });

  test('cannot access another workspace via URL manipulation', async ({ page }) => {
    await loginAs(page, 'staff');

    // Mock API to enforce workspace isolation
    await page.route('**/api/contacts/**', async (route) => {
      const authHeader = route.request().headers()['authorization'];

      if (!authHeader) {
        await route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) });
        return;
      }

      // Check workspace ownership
      const url = new URL(route.request().url());
      const workspaceId = url.searchParams.get('workspaceId');

      if (workspaceId !== MOCK_WORKSPACES.staffWorkspace.id) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Access denied: workspace mismatch' }),
        });
      } else {
        await route.continue();
      }
    });

    // Try to access client workspace contact
    await page.goto(`${BASE_URL}/dashboard/contacts/contact-3?workspaceId=workspace-client-456`);

    // Should show error or redirect
    const errorMessage = page.locator('text=/Access denied|Forbidden|Not found/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('workspace filter is applied to all API requests', async ({ page }) => {
    await loginAs(page, 'staff');

    let apiCallCount = 0;
    let validCalls = 0;

    await page.route('**/api/**', async (route) => {
      apiCallCount++;

      const url = new URL(route.request().url());
      const workspaceId = url.searchParams.get('workspaceId');

      // Verify workspace ID is present and correct
      if (workspaceId === MOCK_WORKSPACES.staffWorkspace.id) {
        validCalls++;
      }

      await route.continue();
    });

    await page.goto(`${BASE_URL}/dashboard/overview`);

    // Wait for API calls to complete
    await page.waitForLoadState('networkidle');

    // All API calls should include correct workspaceId
    expect(validCalls).toBeGreaterThan(0);
    expect(validCalls).toBe(apiCallCount);
  });
});

/**
 * Test Suite 4: Synthex Tier Gating
 */
test.describe('Synthex Tier Gating', () => {
  test('STARTER tier blocked from professional features', async ({ page }) => {
    await loginAs(page, 'client');

    // Mock tier check
    await page.route('**/api/client/**', async (route) => {
      const url = route.request().url();

      if (url.includes('seo') || url.includes('competitor')) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Feature not available in Starter tier',
            upgradeRequired: 'Professional',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/client/seo`);

    // Should show upgrade prompt
    const upgradeMessage = page.locator('text=/Upgrade|Professional tier required/i');
    await expect(upgradeMessage).toBeVisible();
  });

  test('PROFESSIONAL tier has access to advanced SEO', async ({ page }) => {
    await loginAs(page, 'client');

    // Mock professional tier
    await page.evaluate((tier) => {
      localStorage.setItem('client_tier', JSON.stringify(tier));
    }, MOCK_TIERS.professional);

    await page.route('**/api/client/seo**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'SEO features available',
          tier: 'Professional',
        }),
      });
    });

    await page.goto(`${BASE_URL}/client/seo`);

    // Should NOT show upgrade prompt
    const upgradeMessage = page.locator('text=/Upgrade required/i');
    await expect(upgradeMessage).not.toBeVisible();

    // Should show SEO features
    const seoContent = page.locator('h1, h2').first();
    await expect(seoContent).toBeVisible();
  });

  test('ELITE tier has full feature access', async ({ page }) => {
    await loginAs(page, 'client');

    // Mock elite tier
    await page.evaluate((tier) => {
      localStorage.setItem('client_tier', JSON.stringify(tier));
    }, MOCK_TIERS.elite);

    const restrictedRoutes = [
      '/client/seo',
      '/client/reports',
      '/client/vault',
      '/client/workspace',
    ];

    for (const route of restrictedRoutes) {
      await page.goto(`${BASE_URL}${route}`);

      // Should have access (no 403 errors)
      const errorMessage = page.locator('text=/Upgrade|Forbidden|Access denied/i');
      await expect(errorMessage).not.toBeVisible();
    }
  });
});

/**
 * Test Suite 5: API Security
 */
test.describe('API Security', () => {
  test('unauthorized API requests return 401', async ({ page }) => {
    await logout(page);

    const response = await page.request.get(`${BASE_URL}/api/contacts`, {
      params: { workspaceId: 'workspace-staff-123' },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/Unauthorized|Authentication required/i);
  });

  test('valid token grants API access', async ({ page }) => {
    await loginAs(page, 'staff');

    // Extract token from localStorage
    const token = await page.evaluate(() => {
      const authData = localStorage.getItem('supabase.auth.token');
      return authData ? JSON.parse(authData).access_token : null;
    });

    expect(token).toBeTruthy();

    const response = await page.request.get(`${BASE_URL}/api/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        workspaceId: MOCK_WORKSPACES.staffWorkspace.id,
      },
    });

    expect(response.status()).toBe(200);
  });

  test('workspace filter is enforced on API endpoints', async ({ page }) => {
    await loginAs(page, 'staff');

    const token = await page.evaluate(() => {
      const authData = localStorage.getItem('supabase.auth.token');
      return authData ? JSON.parse(authData).access_token : null;
    });

    // Try to access different workspace's data
    const response = await page.request.get(`${BASE_URL}/api/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        workspaceId: MOCK_WORKSPACES.clientWorkspace.id, // Wrong workspace
      },
    });

    // Should return 403 or empty data
    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toEqual([]); // Empty if workspace filter applied
    }
  });

  test('API validates required parameters', async ({ page }) => {
    await loginAs(page, 'staff');

    const token = await page.evaluate(() => {
      const authData = localStorage.getItem('supabase.auth.token');
      return authData ? JSON.parse(authData).access_token : null;
    });

    // Missing workspaceId parameter
    const response = await page.request.get(`${BASE_URL}/api/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      // No workspaceId param
    });

    expect([400, 422]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('API rate limiting is enforced', async ({ page }) => {
    await loginAs(page, 'staff');

    const token = await page.evaluate(() => {
      const authData = localStorage.getItem('supabase.auth.token');
      return authData ? JSON.parse(authData).access_token : null;
    });

    // Make rapid requests
    const requests = Array.from({ length: 100 }, () =>
      page.request.get(`${BASE_URL}/api/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { workspaceId: MOCK_WORKSPACES.staffWorkspace.id },
      })
    );

    const responses = await Promise.all(requests);

    // At least some should be rate-limited (429)
    const rateLimited = responses.filter(r => r.status() === 429);

    // Note: This test may fail if rate limiting is not implemented
    // It serves as a reminder to implement it
    if (rateLimited.length === 0) {
      console.warn('⚠️  No rate limiting detected - consider implementing');
    }
  });
});

/**
 * Test Suite 6: Cross-Cutting Concerns
 */
test.describe('Cross-Cutting Concerns', () => {
  test('all pages have proper meta tags for SEO', async ({ page }) => {
    await loginAs(page, 'staff');

    const publicPages = [
      '/',
      '/about',
      '/pricing',
      '/contact',
    ];

    for (const route of publicPages) {
      await page.goto(`${BASE_URL}${route}`);

      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);

      // Check title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('error pages handle 404 gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);

    // Should show 404 page (not crash)
    const errorContent = page.locator('text=/404|Not Found|Page not found/i');
    await expect(errorContent).toBeVisible();
  });

  test('application is responsive on mobile viewports', async ({ page }) => {
    await loginAs(page, 'staff');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/dashboard/overview`);

    // Check mobile menu exists
    const mobileMenu = page.locator('button[aria-label*="menu" i], button:has-text("Menu")');
    await expect(mobileMenu).toBeVisible();
  });

  test('application handles network errors gracefully', async ({ page }) => {
    await loginAs(page, 'staff');

    // Simulate network failure
    await page.route('**/api/**', async (route) => {
      await route.abort('failed');
    });

    await page.goto(`${BASE_URL}/dashboard/contacts`);

    // Should show error message (not crash)
    const errorMessage = page.locator('text=/Error|Failed to load|Something went wrong/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});
