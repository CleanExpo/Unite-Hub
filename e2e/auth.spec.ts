import { test, expect } from '@playwright/test'

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/founder/dashboard')
  await expect(page).toHaveURL(/auth\/login/)
})

test('health endpoint returns 200', async ({ page }) => {
  const res = await page.request.get('/api/health')
  expect(res.status()).toBe(200)
})
