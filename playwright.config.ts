import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration — Unite-Group Nexus 2.0
 *
 * E2E tests live in `e2e/` directory.
 * Unit/integration tests use Vitest (vitest.config.ts).
 *
 * Run tests:
 *   pnpm playwright test              # All E2E tests
 *   pnpm playwright test --headed     # With browser UI
 *   pnpm playwright show-report       # View HTML report
 */

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  timeout: 30000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev --port 3003',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
