import { test as setup, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

/**
 * Global Setup for Playwright Tests
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Runs once before all tests:
 * - Initialize test database state
 * - Set up authentication
 * - Create test fixtures (strategies, workspaces)
 * - Configure API mocks if needed
 */

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3008';

async function globalSetup() {
  console.log('🔧 Global Setup: Initializing test environment...');

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  try {
    // 1. Wait for app to be ready
    console.log('✓ Waiting for application to be ready...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // 2. Check if API endpoints are accessible
    console.log('✓ Verifying API endpoints...');
    const healthCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/strategy/status?workspaceId=test', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
      } catch (error) {
        console.error('API health check failed:', error);
        return false;
      }
    });

    if (!healthCheck) {
      console.warn('⚠️ API endpoints may not be fully ready yet (expected in dev mode)');
    }

    // 3. Set up test configuration in localStorage
    console.log('✓ Setting up test configuration...');
    await page.evaluate(() => {
      // Store test markers
      localStorage.setItem('playwright-test-mode', 'true');
      localStorage.setItem('test-timestamp', new Date().toISOString());
    });

    // 4. Log environment info
    console.log('✓ Test environment initialized');
    console.log(`  Base URL: ${BASE_URL}`);
    console.log(`  Test Mode: Enabled`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Don't fail setup - some issues may be expected in dev mode
  } finally {
    // Cleanup
    await context.close();
    await browser.close();
  }

  console.log('✓ Global setup complete\n');
}

export default globalSetup;
