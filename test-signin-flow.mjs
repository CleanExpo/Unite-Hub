#!/usr/bin/env node

/**
 * Test Complete Sign-In Flow
 *
 * This script tests the full OAuth sign-in → dashboard flow
 */

import { chromium } from 'playwright';

async function testSignInFlow() {
  console.log('🧪 Starting Complete Sign-In Flow Test\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[AuthContext]') || text.includes('Error') || text.includes('creating organization')) {
      console.log(`📝 ${text}`);
    }
  });

  try {
    console.log('Step 1: Clearing all state (fresh user simulation)');
    await page.goto('http://localhost:3008');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('✅ State cleared\n');

    console.log('Step 2: Navigate to login page');
    await page.goto('http://localhost:3008/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded\n');

    console.log('Step 3: Click "Continue with Google"');
    console.log('⚠️  This will open Google OAuth flow in the browser');
    console.log('⚠️  Please complete the sign-in manually\n');

    // Wait for Google button
    await page.waitForSelector('button:has-text("Continue with Google")', { timeout: 5000 });
    await page.click('button:has-text("Continue with Google")');

    console.log('⏳ Waiting for OAuth redirect and dashboard load...');
    console.log('   (Will wait up to 60 seconds)\n');

    // Wait for either dashboard or error
    const result = await Promise.race([
      page.waitForURL('**/dashboard/**', { timeout: 60000 }).then(() => 'dashboard'),
      page.waitForSelector('text=Error', { timeout: 60000 }).then(() => 'error'),
      new Promise(resolve => setTimeout(() => resolve('timeout'), 60000))
    ]);

    if (result === 'dashboard') {
      console.log('\n✅ SUCCESS: Reached dashboard!');
      const currentUrl = page.url();
      console.log(`   Final URL: ${currentUrl}`);

      // Check for organization creation success
      await page.waitForTimeout(2000); // Wait for any API calls

      const pageText = await page.textContent('body');
      if (pageText.includes('Loading organization...')) {
        console.log('⚠️  Dashboard stuck on "Loading organization..."');
      } else if (pageText.includes('Dashboard')) {
        console.log('✅ Dashboard loaded successfully!');
      }

    } else if (result === 'error') {
      console.log('\n❌ FAILED: Error occurred during sign-in');
      const errorText = await page.textContent('body');
      console.log(`   Error: ${errorText}`);

    } else {
      console.log('\n⏱️  TIMEOUT: Sign-in did not complete within 60 seconds');
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
    }

    console.log('\n📊 Checking browser console for errors...');
    // Errors are already logged via page.on('console')

    console.log('\n⏸️  Browser will stay open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browser.close();
    console.log('✅ Test complete');
  }
}

testSignInFlow();
