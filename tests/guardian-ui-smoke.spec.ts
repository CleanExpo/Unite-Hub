"use strict";

import { test, expect } from "@playwright/test";

const routes = [
  { path: "/guardian", marker: "Guardian" },
  { path: "/guardian/meta/readiness", marker: "readiness" },
  { path: "/guardian/meta/playbooks", marker: "Playbooks" },
];

test.describe("Guardian UI smoke", () => {
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
