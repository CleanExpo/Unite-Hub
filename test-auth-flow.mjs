#!/usr/bin/env node

/**
 * Test Authentication Flow
 *
 * This script tests that unauthenticated users are redirected to login
 */

import { chromium } from 'playwright';

async function testAuthFlow() {
  console.log('🧪 Starting Authentication Flow Test\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[AuthContext]')) {
      console.log(`📝 ${text}`);
    }
  });

  try {
    console.log('Step 1: Clearing localStorage (simulating unauthenticated user)');
    await page.goto('http://localhost:3008');
    await page.evaluate(() => localStorage.clear());
    console.log('✅ LocalStorage cleared\n');

    console.log('Step 2: Navigating to /dashboard/overview without authentication');
    await page.goto('http://localhost:3008/dashboard/overview');

    // Wait for either redirect or timeout
    console.log('⏳ Waiting up to 10 seconds for redirect...\n');

    const redirected = await Promise.race([
      page.waitForURL('**/login', { timeout: 10000 }).then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 10000))
    ]);

    if (redirected) {
      console.log('\n✅ SUCCESS: User was redirected to /login');
      const currentUrl = page.url();
      console.log(`   Final URL: ${currentUrl}`);
    } else {
      console.log('\n❌ FAILED: User was NOT redirected after 10 seconds');
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);

      // Check what's on the page
      const pageText = await page.textContent('body');
      if (pageText.includes('Loading')) {
        console.log('   Page shows: "Loading..." (stuck in loading state)');
      } else if (pageText.includes('Dashboard')) {
        console.log('   Page shows: Dashboard content (no auth check!)');
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browser.close();
    console.log('✅ Test complete');
  }
}

testAuthFlow();
