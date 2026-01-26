/**
 * Playwright Auth Setup for E2E Tests
 *
 * Creates authenticated sessions for each role:
 * - STAFF
 * - CLIENT
 * - FOUNDER
 *
 * These sessions are saved and reused across tests.
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authDir = path.join(process.cwd(), 'playwright', '.auth');

// Test user credentials - these should match users in your test Supabase project
const TEST_USERS = {
  staff: {
    email: 'staff@test.unite-hub.com',
    password: process.env.TEST_STAFF_PASSWORD || 'Test123!@#Staff',
    role: 'STAFF',
    workspace_id: 'workspace-staff-test-001',
    authFile: path.join(authDir, 'staff.json'),
  },
  client: {
    email: 'client@test.unite-hub.com',
    password: process.env.TEST_CLIENT_PASSWORD || 'Test123!@#Client',
    role: 'CLIENT',
    workspace_id: 'workspace-client-test-001',
    authFile: path.join(authDir, 'client.json'),
  },
  founder: {
    email: 'founder@test.unite-hub.com',
    password: process.env.TEST_FOUNDER_PASSWORD || 'Test123!@#Founder',
    role: 'FOUNDER',
    workspace_id: 'workspace-founder-test-001',
    authFile: path.join(authDir, 'founder.json'),
  },
};

/**
 * Helper: Authenticate user and save session
 */
async function authenticateUser(
  page: any,
  userType: keyof typeof TEST_USERS
) {
  const user = TEST_USERS[userType];

  console.log(`\n🔐 Authenticating ${userType.toUpperCase()} user...`);

  // Always use test mode bypass for E2E tests
  // This bypasses real Supabase auth using cookies that the middleware recognizes
  const useTestMode = true; // Force test mode for all E2E tests

  if (useTestMode) {
    console.log(`  ✓ Using test mode bypass for ${userType}`);

    // Navigate to home page first to establish domain
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Set test mode cookies directly
    await page.context().addCookies([
      {
        name: 'playwright-test-mode',
        value: 'true',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'playwright-test-role',
        value: user.role,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'playwright-test-workspace',
        value: user.workspace_id,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
      {
        name: 'playwright-test-email',
        value: user.email,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    // Verify cookies were set
    const cookies = await page.context().cookies();
    console.log(`  → Cookies set: ${cookies.length}`);

    const testModeCookie = cookies.find(c => c.name === 'playwright-test-mode');
    if (!testModeCookie) {
      throw new Error(`Test mode cookie not set for ${userType}`);
    }

    console.log(`  ✓ Test mode: ${testModeCookie.value}`);

    // Wait a moment for cookies to be set
    await page.waitForTimeout(500);

    // Verify we can access protected routes
    const expectedRoute = user.role === 'STAFF' ? '/staff/dashboard' :
                         user.role === 'FOUNDER' ? '/founder' : '/client';

    console.log(`  → Navigating to ${expectedRoute}...`);
    await page.goto(expectedRoute);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check we didn't get redirected to login
    const currentUrl = page.url();
    console.log(`  → Final URL: ${currentUrl}`);

    if (currentUrl.includes('/auth/signin') || currentUrl.includes('/login')) {
      console.error(`  ✗ Expected: ${expectedRoute}, Got: ${currentUrl}`);
      throw new Error(`Test mode bypass failed - redirected to login for ${userType}`);
    }

    console.log(`  ✓ ${userType.toUpperCase()} authenticated successfully`);

  } else {
    // Option 2: Real authentication with Supabase
    console.log(`  → Using real Supabase authentication for ${userType}`);

    await page.goto('/auth/signin');

    // Wait for signin page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check if email/password form exists
    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;

    if (hasEmailInput) {
      // Fill in credentials
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL(/\/(staff\/dashboard|client|founder)/, {
        timeout: 15000
      });

      console.log(`  ✓ ${userType.toUpperCase()} authenticated via email/password`);
    } else {
      // Only Google OAuth available
      console.warn(`  ⚠️ Only Google OAuth available - cannot authenticate ${userType} in tests`);
      throw new Error(`Cannot authenticate ${userType} - only OAuth available. Use test mode or configure email/password auth.`);
    }
  }

  // Save authenticated state
  await page.context().storageState({ path: user.authFile });
  console.log(`  ✓ Auth state saved to ${path.basename(user.authFile)}`);
}

/**
 * Setup: Authenticate STAFF user
 */
setup('authenticate as STAFF', async ({ page }) => {
  await authenticateUser(page, 'staff');
});

/**
 * Setup: Authenticate CLIENT user
 */
setup('authenticate as CLIENT', async ({ page }) => {
  await authenticateUser(page, 'client');
});

/**
 * Setup: Authenticate FOUNDER user
 */
setup('authenticate as FOUNDER', async ({ page }) => {
  await authenticateUser(page, 'founder');
});
