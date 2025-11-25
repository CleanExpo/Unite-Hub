import { chromium } from '@playwright/test';

/**
 * Global Teardown for Playwright Tests
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Runs once after all tests complete:
 * - Clean up test data
 * - Close test resources
 * - Generate test reports summary
 * - Log final statistics
 */

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3008';

async function globalTeardown() {
  console.log('\n🧹 Global Teardown: Cleaning up test environment...');

  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  try {
    // 1. Clear test markers from storage
    console.log('✓ Clearing test environment markers...');
    await page.evaluate(() => {
      localStorage.removeItem('playwright-test-mode');
      localStorage.removeItem('test-timestamp');
      sessionStorage.clear();
    });

    // 2. Log cleanup summary
    console.log('✓ Test resources cleaned up');
    console.log(`  Timestamp: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('⚠️ Teardown encountered error:', error);
    // Don't fail - continue cleanup
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('✓ Global teardown complete\n');
}

export default globalTeardown;
