import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Visual Regression Tests Only
 *
 * Simplified config without global setup/teardown for faster execution.
 */

export default defineConfig({
  testDir: './',
  testMatch: '*.spec.ts',

  // Single worker for consistent screenshots
  fullyParallel: false,
  workers: 1,
  retries: 0,

  // Simple list reporter
  reporter: [['list']],

  // Test configuration
  use: {
    baseURL: 'http://localhost:3008',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Longer timeout for screenshot capture
  timeout: 60000,

  // Expect settings for screenshots
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  // Only Chromium for visual consistency
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  // No web server - assume it's already running
});
