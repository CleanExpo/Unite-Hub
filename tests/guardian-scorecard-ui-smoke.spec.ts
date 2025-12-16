"use strict";

import { test, expect } from "@playwright/test";

test.describe.skip("Guardian Scorecard UI smoke", () => {
  // QUARANTINED: Requires live Next.js server + Supabase connectivity
  // E2E Playwright test - cannot run in unit test environment
  test("loads /guardian/meta/scorecard", async ({ page }) => {
    await page.goto("/guardian/meta/scorecard");
    await expect(page).toHaveURL("/guardian/meta/scorecard");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /guardian/i })).toBeVisible();
  });
});
