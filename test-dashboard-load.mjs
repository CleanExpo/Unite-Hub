#!/usr/bin/env node

/**
 * Test Dashboard Load with Real User Session
 */

import { chromium } from 'playwright';

async function testDashboard() {
  console.log('🧪 Testing Dashboard Load\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console logs
  page.on('console', msg => {
    const text = msg.text();
    console.log(`📝 ${text}`);
  });

  try {
    console.log('Step 1: Navigate to login page');
    await page.goto('http://localhost:3008/login');
    await page.waitForLoadState('networkidle');

    console.log('\nStep 2: Waiting for you to sign in...');
    console.log('⚠️  Please sign in with Google in the browser that just opened');
    console.log('⏳ Waiting up to 120 seconds for sign-in to complete\n');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 120000 });

    console.log('\n✅ Redirected to dashboard!');
    console.log(`   Current URL: ${page.url()}\n`);

    // Wait a moment for React to hydrate
    await page.waitForTimeout(3000);

    // Check what's on the page
    const bodyText = await page.textContent('body');

    if (bodyText.includes('Loading organization')) {
      console.log('❌ STUCK on "Loading organization..."');

      // Check localStorage
      const localStorageData = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('supabase')) {
            data[key] = '...(present)';
          }
        }
        return data;
      });
      console.log('\n📦 LocalStorage:', JSON.stringify(localStorageData, null, 2));

    } else if (bodyText.includes('Dashboard')) {
      console.log('✅ SUCCESS! Dashboard loaded');
    } else {
      console.log('⚠️  Unknown state');
      console.log(`   Page text preview: ${bodyText.substring(0, 200)}...`);
    }

    console.log('\n⏸️  Keeping browser open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete');
  }
}

testDashboard();
