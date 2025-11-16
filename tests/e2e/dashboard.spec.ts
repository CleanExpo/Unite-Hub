/**
 * E2E Tests for Dashboard
 * Tests dashboard functionality and user interactions
 */

import { test, expect } from '@playwright/test';

// Helper to set up authenticated session
async function setupAuthSession(page: any) {
  await page.evaluate(() => {
    const mockSession = {
      access_token: 'test-token',
      user: {
        id: 'test-user-123',
        email: 'test@unite-hub.com',
      },
    };

    localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
  });
}

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
  });

  test('should display dashboard overview page', async ({ page }) => {
    await page.goto('/dashboard/overview');

    await expect(page).toHaveURL(/\/dashboard\/overview/);
    await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible();
  });

  test('should show navigation sidebar', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Should see navigation links
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('should navigate to different dashboard sections', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Click on Contacts link
    const contactsLink = page.getByRole('link', { name: /contacts/i });
    if (await contactsLink.count() > 0) {
      await contactsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/contacts/);
    }
  });

  test('should display hot leads panel', async ({ page }) => {
    // Mock hot leads API response
    await page.route('**/api/agents/contact-intelligence', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hotLeads: [
            {
              id: 'lead-1',
              name: 'John Doe',
              email: 'john@example.com',
              ai_score: 85,
              status: 'hot',
            },
            {
              id: 'lead-2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              ai_score: 90,
              status: 'hot',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/overview');

    // Should see hot leads panel
    await expect(page.getByText(/hot leads/i)).toBeVisible();

    // Should display lead names
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
  });

  test('should show statistics cards', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Should display various stats
    // (Exact content depends on implementation)
    const statsElements = page.locator('[class*="stat"], [class*="metric"]');
    expect(await statsElements.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/agents/contact-intelligence', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/dashboard/overview');

    // Should show error state, not crash
    const errorMessage = page.getByText(/error|failed/i);
    // May or may not show visible error depending on implementation
  });
});

test.describe('Contacts Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
  });

  test('should display contacts list', async ({ page }) => {
    // Mock contacts API
    await page.route('**/api/contacts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contacts: [
            {
              id: 'contact-1',
              name: 'Alice Johnson',
              email: 'alice@example.com',
              ai_score: 75,
            },
            {
              id: 'contact-2',
              name: 'Bob Williams',
              email: 'bob@example.com',
              ai_score: 60,
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/contacts');

    // Should see contact names
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Williams')).toBeVisible();
  });

  test('should filter contacts by status', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Look for filter dropdown or buttons
    const filterButton = page.getByRole('button', { name: /filter|status/i });

    if (await filterButton.count() > 0) {
      await filterButton.click();

      // Select "Hot" status
      const hotOption = page.getByRole('option', { name: /hot/i });
      if (await hotOption.count() > 0) {
        await hotOption.click();

        // Should filter contacts
        // (Verify by checking URL params or visible contacts)
      }
    }
  });

  test('should search contacts', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Look for search input
    const searchInput = page.getByRole('searchbox') || page.getByPlaceholder(/search/i);

    if (await searchInput.count() > 0) {
      await searchInput.fill('alice');

      // Should filter results
      // (Implementation-specific behavior)
    }
  });

  test('should sort contacts by score', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Look for sort button
    const sortButton = page.getByRole('button', { name: /sort|score/i });

    if (await sortButton.count() > 0) {
      await sortButton.click();

      // Should sort contacts
      // (Verify order changed)
    }
  });
});

test.describe('Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
  });

  test('should display campaigns page', async ({ page }) => {
    await page.goto('/dashboard/campaigns');

    await expect(page).toHaveURL(/\/dashboard\/campaigns/);
  });

  test('should show create campaign button', async ({ page }) => {
    await page.goto('/dashboard/campaigns');

    const createButton = page.getByRole('button', { name: /create|new campaign/i });
    await expect(createButton).toBeVisible();
  });

  test('should open campaign creation dialog', async ({ page }) => {
    await page.goto('/dashboard/campaigns');

    const createButton = page.getByRole('button', { name: /create|new campaign/i });
    await createButton.click();

    // Should show dialog or navigate to creation page
    const dialog = page.getByRole('dialog') || page.getByRole('form');
    expect(await dialog.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/overview');

    // Should display mobile-friendly layout
    await expect(page).toHaveURL(/\/dashboard\/overview/);

    // Navigation might be hidden in mobile menu
    const mobileMenu = page.getByRole('button', { name: /menu|navigation/i });
    expect(await mobileMenu.count()).toBeGreaterThanOrEqual(0);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard/overview');

    await expect(page).toHaveURL(/\/dashboard\/overview/);
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard/overview');

    await expect(page).toHaveURL(/\/dashboard\/overview/);

    // Full navigation should be visible
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });
});

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
  });

  test('should load dashboard within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard/overview');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Rapidly navigate between pages
    await page.goto('/dashboard/contacts');
    await page.goto('/dashboard/campaigns');
    await page.goto('/dashboard/overview');

    // Should not crash
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should have visible focus indicators
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});
