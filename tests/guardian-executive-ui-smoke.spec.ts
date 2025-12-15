"use strict";

import { test, expect } from "@playwright/test";

test.describe("Guardian Executive UI smoke", () => {
  test("renders /guardian/executive without crash", async ({ page }) => {
    await page.goto("/guardian/executive");
    await expect(page).toHaveURL("/guardian/executive");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveTitle(/Guardian/i);
  });
});
