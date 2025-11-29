/**
 * E2E Test Authentication Helpers
 *
 * Provides reusable authentication utilities for Playwright tests.
 */

import { Page, BrowserContext } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: 'FOUNDER' | 'STAFF' | 'CLIENT' | 'ADMIN';
  workspaceId: string;
  organizationId?: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  staff: {
    email: 'staff@test.unite-hub.com',
    password: 'Test123!@#Staff',
    role: 'STAFF',
    workspaceId: 'ws-staff-e2e-test',
    organizationId: 'org-staff-e2e-test',
  },
  client: {
    email: 'client@test.unite-hub.com',
    password: 'Test123!@#Client',
    role: 'CLIENT',
    workspaceId: 'ws-client-e2e-test',
    organizationId: 'org-client-e2e-test',
  },
  founder: {
    email: 'founder@test.unite-hub.com',
    password: 'Test123!@#Founder',
    role: 'FOUNDER',
    workspaceId: 'ws-founder-e2e-test',
    organizationId: 'org-founder-e2e-test',
  },
  admin: {
    email: 'admin@test.unite-hub.com',
    password: 'Test123!@#Admin',
    role: 'ADMIN',
    workspaceId: 'ws-admin-e2e-test',
    organizationId: 'org-admin-e2e-test',
  },
};

/**
 * Login as a specific user role
 */
export async function loginAs(
  page: Page,
  userType: keyof typeof TEST_USERS,
  baseUrl: string = 'http://localhost:3008'
): Promise<void> {
  const user = TEST_USERS[userType];

  await page.goto(`${baseUrl}/auth/signin`);

  // Check authentication method
  const hasGoogleButton = await page
    .locator('button:has-text("Continue with Google")')
    .isVisible()
    .catch(() => false);

  if (hasGoogleButton) {
    await handleGoogleOAuth(page, user, baseUrl);
  } else {
    await handleEmailPasswordLogin(page, user);
  }

  // Wait for redirect to complete
  await page.waitForURL(/\/(dashboard|client|founder)/, { timeout: 30000 });

  // Inject mock session data
  await injectMockSession(page, user);
}

/**
 * Handle Google OAuth flow (mocked for testing)
 */
async function handleGoogleOAuth(
  page: Page,
  user: TestUser,
  baseUrl: string
): Promise<void> {
  // Mock OAuth callback
  await page.route('**/auth/callback**', async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        Location: '/auth/implicit-callback#access_token=mock_token&refresh_token=mock_refresh',
        'Set-Cookie': 'sb-access-token=mock_token; Path=/; HttpOnly; Secure; SameSite=Lax',
      },
    });
  });

  // Mock user initialization
  await page.route('**/api/auth/initialize-user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: {
          id: `user-${user.role.toLowerCase()}`,
          email: user.email,
          role: user.role,
        },
        profile: {
          id: `profile-${user.role.toLowerCase()}`,
          user_id: `user-${user.role.toLowerCase()}`,
          role: user.role,
        },
        organization: {
          id: user.organizationId,
          name: `${user.role} Test Organization`,
        },
      }),
    });
  });

  await page.click('button:has-text("Continue with Google")');
}

/**
 * Handle email/password login
 */
async function handleEmailPasswordLogin(page: Page, user: TestUser): Promise<void> {
  // Fill login form
  await page.fill('input[type="email"], input[name="email"]', user.email);
  await page.fill('input[type="password"], input[name="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');
}

/**
 * Inject mock session data into browser storage
 */
async function injectMockSession(page: Page, user: TestUser): Promise<void> {
  await page.evaluate((userData) => {
    // Mock Supabase session
    localStorage.setItem(
      'supabase.auth.token',
      JSON.stringify({
        access_token: `mock_access_token_${userData.role.toLowerCase()}`,
        refresh_token: `mock_refresh_token_${userData.role.toLowerCase()}`,
        expires_at: Date.now() + 3600000, // 1 hour
        user: {
          id: `user-${userData.role.toLowerCase()}`,
          email: userData.email,
          role: userData.role,
          user_metadata: {
            role: userData.role,
            workspace_id: userData.workspaceId,
            organization_id: userData.organizationId,
          },
        },
      })
    );

    // Mock workspace context
    localStorage.setItem(
      'current_workspace',
      JSON.stringify({
        id: userData.workspaceId,
        organization_id: userData.organizationId,
        name: `${userData.role} Workspace`,
      })
    );

    // Mock organization context
    localStorage.setItem(
      'current_organization',
      JSON.stringify({
        id: userData.organizationId,
        name: `${userData.role} Organization`,
      })
    );
  }, user);
}

/**
 * Clear all authentication state
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.context().clearCookies();
}

/**
 * Get current user from session
 */
export async function getCurrentUser(page: Page): Promise<TestUser | null> {
  return page.evaluate(() => {
    const authData = localStorage.getItem('supabase.auth.token');
    if (!authData) return null;

    try {
      const parsed = JSON.parse(authData);
      return parsed.user;
    } catch {
      return null;
    }
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const authData = localStorage.getItem('supabase.auth.token');
    if (!authData) return false;

    try {
      const parsed = JSON.parse(authData);
      return !!parsed.access_token && parsed.expires_at > Date.now();
    } catch {
      return false;
    }
  });
}

/**
 * Get auth token from session
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const authData = localStorage.getItem('supabase.auth.token');
    if (!authData) return null;

    try {
      const parsed = JSON.parse(authData);
      return parsed.access_token;
    } catch {
      return null;
    }
  });
}

/**
 * Mock API authentication middleware
 */
export async function mockAuthMiddleware(
  page: Page,
  allowedRoles: TestUser['role'][] = []
): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const authHeader = route.request().headers()['authorization'];

    if (!authHeader) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    // Extract role from token (mocked)
    const token = authHeader.replace('Bearer ', '');
    const userRole = Object.values(TEST_USERS).find((u) =>
      token.includes(u.role.toLowerCase())
    )?.role;

    if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden' }),
      });
      return;
    }

    await route.continue();
  });
}
