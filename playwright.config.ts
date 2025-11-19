import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Unite-Hub
 * Phase 2 Step 8 - Testing & QA Foundation
 *
 * This config is safe and minimal - does not affect runtime app.
 * Only used when running `npx playwright test` or `npm run test:e2e`.
 */

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Simple list reporter for CI/local development
  reporter: [['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3008',
    trace: 'on-first-retry',
    video: 'off', // Save bandwidth/storage
    screenshot: 'only-on-failure',
  },

  // Start with Chromium only (expand to Firefox/Safari later)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start dev server if not already running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3008',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
