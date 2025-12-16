"use strict";

import { test, expect } from "@playwright/test";

const routes = [
  { path: "/guardian", marker: "Guardian" },
  { path: "/guardian/meta/readiness", marker: "readiness" },
  { path: "/guardian/meta/playbooks", marker: "Playbooks" },
];

test.describe.skip("Guardian UI smoke", () => {
  // QUARANTINED: Requires live Next.js server + Supabase connectivity
  // These are E2E Playwright tests that cannot run in unit test environment
  // Re-enable when:
  // 1. Integration test environment with live server is available
  // 2. Supabase test database is provisioned and seeded
  // 3. End-to-end test runner is configured separate from unit tests
  for (const route of routes) {
    test(`${route.path} renders without crash`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(route.path);
      await expect(page.locator("body")).toBeVisible();
      await expect(page).toHaveTitle(/Guardian/i);
      await expect(page.getByText(new RegExp(route.marker, "i"))).toBeVisible();
    });
  }
});
