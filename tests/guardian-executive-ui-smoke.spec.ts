"use strict";

import { test, expect } from "@playwright/test";

test.describe.skip("Guardian Executive UI smoke", () => {
  // QUARANTINED: Requires live Next.js server + Supabase connectivity
  // E2E Playwright test - cannot run in unit test environment
  test("renders /guardian/executive without crash", async ({ page }) => {
    await page.goto("/guardian/executive");
    await expect(page).toHaveURL("/guardian/executive");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveTitle(/Guardian/i);
  });
});
