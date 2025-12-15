"use strict";

import { test, expect } from "@playwright/test";

test.describe("Guardian Scorecard UI smoke", () => {
  test("loads /guardian/meta/scorecard", async ({ page }) => {
    await page.goto("/guardian/meta/scorecard");
    await expect(page).toHaveURL("/guardian/meta/scorecard");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /guardian/i })).toBeVisible();
  });
});
