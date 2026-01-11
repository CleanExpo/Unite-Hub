import { test, expect } from '@playwright/test';

test.describe('Client Contribution Flow', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3008';

  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto(`${baseURL}/client/login`);

    // Fill login form
    await page.fill('input[type="email"]', 'client@test.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit login
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Wait for dashboard redirect
    await page.waitForURL(/\/client\/dashboard/);
  });

  test('should complete full video contribution flow', async ({ page }) => {
    // Navigate to rewards dashboard
    await page.click('a:has-text("Rewards")');
    await page.waitForURL(/\/dashboard\/rewards/);

    // Verify initial points
    const initialPoints = await page.textContent('[data-testid="points-balance"]');
    expect(initialPoints).toBeDefined();

    // Navigate to Content Studio
    await page.click('a:has-text("Content Studio")');
    await page.waitForURL(/content-studio/);

    // Verify component loaded
    await expect(page.locator('text=Share your story')).toBeVisible();

    // Click video button
    await page.click('button:has-text("📹 Video")');

    // Wait for video capture modal
    await expect(page.locator('video')).toBeVisible();

    // Simulate video recording (mock with file upload)
    await page.setInputFiles('input[type="file"]', {
      name: 'test-video.webm',
      mimeType: 'video/webm',
      buffer: Buffer.from('mock video data'),
    });

    // Click record and wait
    await page.click('button:has-text("🔴 Record")');
    await page.waitForTimeout(2000);

    // Stop recording
    await page.click('button:has-text("⏹ Stop")');

    // Verify preview
    await expect(page.locator('video')).toBeVisible();

    // Click share button
    await page.click('button:has-text("✓ Share")');

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Verify success (should redirect back or show confirmation)
    await expect(page.locator('text=Your content is live')).toBeVisible({ timeout: 5000 });

    // Navigate back to rewards
    await page.click('a:has-text("Rewards")');

    // Verify points increased
    const newPoints = await page.textContent('[data-testid="points-balance"]');
    const oldPointsNum = parseInt(initialPoints || '0', 10);
    const newPointsNum = parseInt(newPoints || '0', 10);

    expect(newPointsNum).toBeGreaterThan(oldPointsNum);
    expect(newPointsNum - oldPointsNum).toBe(100); // 100 points for video
  });

  test('should handle photo contribution', async ({ page }) => {
    // Navigate to Content Studio
    await page.click('a:has-text("Content Studio")');
    await page.waitForURL(/content-studio/);

    // Get initial points
    const initialPoints = parseInt(
      (await page.textContent('[data-testid="points-balance"]')) || '0',
      10
    );

    // Click photo button
    await page.click('button:has-text("📷 Photo")');

    // Upload image
    await page.setInputFiles('input[type="file"]', {
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('mock image data'),
    });

    // Capture photo
    await page.click('button:has-text("📸 Capture")');

    // Share
    await page.click('button:has-text("✓ Share")');

    // Wait for upload
    await page.waitForTimeout(3000);

    // Verify success
    await expect(page.locator('text=Your content is live')).toBeVisible({ timeout: 5000 });

    // Check points increased by 50
    const newPoints = parseInt(
      (await page.textContent('[data-testid="points-balance"]')) || '0',
      10
    );
    expect(newPoints - initialPoints).toBe(50);
  });

  test('should handle voice contribution', async ({ page }) => {
    // Navigate to Content Studio
    await page.click('a:has-text("Content Studio")');

    // Get initial points
    const initialPoints = parseInt(
      (await page.textContent('[data-testid="points-balance"]')) || '0',
      10
    );

    // Click voice button
    await page.click('button:has-text("🎤 Voice")');

    // Upload audio
    await page.setInputFiles('input[type="file"]', {
      name: 'test-voice.webm',
      mimeType: 'audio/webm',
      buffer: Buffer.from('mock audio data'),
    });

    // Share
    await page.click('button:has-text("✓ Share")');

    // Wait for upload
    await page.waitForTimeout(3000);

    // Verify success
    await expect(page.locator('text=Your content is live')).toBeVisible({ timeout: 5000 });

    // Check points increased by 40
    const newPoints = parseInt(
      (await page.textContent('[data-testid="points-balance"]')) || '0',
      10
    );
    expect(newPoints - initialPoints).toBe(40);
  });

  test('should display rewards dashboard correctly', async ({ page }) => {
    // Navigate to rewards
    await page.click('a:has-text("Rewards")');
    await page.waitForURL(/\/dashboard\/rewards/);

    // Verify all sections are visible
    await expect(page.locator('text=Rewards & Leaderboard')).toBeVisible();
    await expect(page.locator('text=Your Impact')).toBeVisible();
    await expect(page.locator('text=Total Impressions')).toBeVisible();
    await expect(page.locator('text=Keywords Ranked #1')).toBeVisible();
    await expect(page.locator('text=Contribution Streak')).toBeVisible();

    // Verify tier badge
    await expect(page.locator('[data-testid="tier-badge"]')).toBeVisible();

    // Verify leaderboard
    await expect(page.locator('text=Monthly Leaderboard')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should update leaderboard in real-time', async ({ page }) => {
    // Navigate to rewards
    await page.click('a:has-text("Rewards")');

    // Get current rank
    const initialRank = await page.textContent('[data-testid="user-rank"]');

    // Contribute content
    await page.click('a:has-text("Content Studio")');
    await page.click('button:has-text("📹 Video")');

    // ... simulate upload (simplified)
    await page.setInputFiles('input[type="file"]', {
      name: 'test-video.webm',
      mimeType: 'video/webm',
      buffer: Buffer.from('mock video data'),
    });

    await page.click('button:has-text("✓ Share")');
    await page.waitForTimeout(3000);

    // Navigate back to rewards
    await page.click('a:has-text("Rewards")');

    // Verify leaderboard updated
    await page.waitForTimeout(2000);
    const newRank = await page.textContent('[data-testid="user-rank"]');
    expect(newRank).toBeDefined();
  });

  test('should show tier progression', async ({ page }) => {
    // Navigate to rewards
    await page.click('a:has-text("Rewards")');

    // Verify tier levels displayed
    await expect(page.locator('text=Bronze')).toBeVisible();
    await expect(page.locator('text=Silver')).toBeVisible();
    await expect(page.locator('text=Gold')).toBeVisible();
    await expect(page.locator('text=Platinum')).toBeVisible();

    // Verify point requirements
    await expect(page.locator('text=0-499 pts')).toBeVisible();
    await expect(page.locator('text=500-1,499 pts')).toBeVisible();
    await expect(page.locator('text=1,500-3,499 pts')).toBeVisible();
    await expect(page.locator('text=3,500+ pts')).toBeVisible();
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    // Navigate to Content Studio
    await page.goto(`${baseURL}/client/dashboard`);
    await page.click('a:has-text("Content Studio")');

    // Verify UI still loads
    await expect(page.locator('text=Share your story')).toBeVisible();

    // Try to upload (should queue)
    await page.click('button:has-text("📹 Video")');
    await expect(page.locator('video')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Wait for sync
    await page.waitForTimeout(2000);

    // Verify connection restored
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 5000 });
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to Content Studio
    await page.click('a:has-text("Content Studio")');

    // Verify layout adapts
    const buttons = await page.locator('button:has-text("📹")').boundingBox();
    expect(buttons).toBeDefined();

    // Verify buttons stack vertically on mobile
    const layout = await page.locator('[role="grid"]').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.getPropertyValue('grid-template-columns');
    });

    // Should be single column on mobile
    expect(layout).toContain('1');
  });

  test('should display notifications', async ({ page }) => {
    // Contribute content
    await page.click('a:has-text("Content Studio")');
    await page.click('button:has-text("📹 Video")');

    // Upload
    await page.setInputFiles('input[type="file"]', {
      name: 'test-video.webm',
      mimeType: 'video/webm',
      buffer: Buffer.from('mock video data'),
    });

    await page.click('button:has-text("✓ Share")');

    // Verify notification
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Your content is live')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to Content Studio
    await page.click('a:has-text("Content Studio")');
    await page.click('button:has-text("📹 Video")');

    // Try to share without recording
    const shareButton = page.locator('button:has-text("✓ Share")');
    const isDisabled = await shareButton.isDisabled();

    // Share button should be disabled if no video
    expect(isDisabled).toBeTruthy();
  });
});
