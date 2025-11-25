import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Unite-Hub Hierarchical Strategy System
 *
 * Test Framework: Playwright Test (TypeScript)
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Coverage: 6 test suites for complete strategy dashboard workflows
 * - strategy-create.spec.ts: Strategy creation and L1-L4 decomposition
 * - strategy-hierarchy.spec.ts: Hierarchy rendering and expansion
 * - strategy-validation.spec.ts: Validation pipeline and agent scores
 * - strategy-synergy.spec.ts: Synergy metrics and analysis
 * - strategy-history.spec.ts: Timeline and historical patterns
 * - strategy-realtime.spec.ts: Real-time updates and polling
 *
 * Run tests:
 *   npx playwright test                     # Run all tests
 *   npx playwright test --headed            # Run in headed mode
 *   npx playwright test strategy-create     # Run specific test
 *   npx playwright show-report              # View HTML report
 */

export default defineConfig({
  // Test discovery settings
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/*.skip.ts',

  // Parallel execution settings
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  // Reporters for different output formats
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Default test configuration
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3008',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    acceptDownloads: true,
  },

  // Global test timeout
  timeout: 60000,

  // Global setup and teardown hooks
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  // Browser configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Development server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3008',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
