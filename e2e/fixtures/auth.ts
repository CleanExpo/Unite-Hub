import { test as base, Page } from '@playwright/test'

export async function loginAsFounder(page: Page) {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  if (!email || !password) {
    throw new Error('PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD must be set to run authenticated tests')
  }
  await page.goto('/auth/login')
  await page.fill('[type=email]', email)
  await page.fill('[type=password]', password)
  await page.click('[type=submit]')
  await page.waitForURL('/founder/dashboard')
}

export const test = base
export { expect } from '@playwright/test'
