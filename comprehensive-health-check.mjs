import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Comprehensive health check for Unite-Hub application
const BASE_URL = 'http://localhost:3008';
const REPORT_DIR = './health-check-reports';

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function addResult(category, test, status, message, details = {}) {
  results.tests.push({
    category,
    test,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  });

  results.summary.total++;
  if (status === 'PASS') results.summary.passed++;
  if (status === 'FAIL') results.summary.failed++;
  if (status === 'WARN') results.summary.warnings++;

  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${category}] ${test}: ${message}`);
}

async function testHomepage(page) {
  console.log('\n🏠 Testing Homepage...');

  try {
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    if (response.status() === 200) {
      addResult('Homepage', 'Load Status', 'PASS', 'Homepage loaded successfully', { statusCode: 200 });
    } else {
      addResult('Homepage', 'Load Status', 'FAIL', `HTTP ${response.status()}`, { statusCode: response.status() });
    }

    // Check title
    const title = await page.title();
    addResult('Homepage', 'Page Title', title ? 'PASS' : 'FAIL', title || 'No title found', { title });

    // Check for critical elements
    const hasLogo = await page.locator('img, svg').first().isVisible();
    addResult('Homepage', 'Logo/Brand', hasLogo ? 'PASS' : 'WARN', hasLogo ? 'Logo visible' : 'Logo not found');

    const hasNavigation = await page.locator('nav, header').count() > 0;
    addResult('Homepage', 'Navigation', hasNavigation ? 'PASS' : 'FAIL', hasNavigation ? 'Navigation present' : 'Navigation missing');

    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length === 0) {
      addResult('Homepage', 'Console Errors', 'PASS', 'No console errors');
    } else {
      addResult('Homepage', 'Console Errors', 'WARN', `${consoleErrors.length} errors found`, { errors: consoleErrors.slice(0, 5) });
    }

    // Take screenshot
    await page.screenshot({ path: `${REPORT_DIR}/homepage.png`, fullPage: true });
    addResult('Homepage', 'Screenshot', 'PASS', 'Screenshot captured');

  } catch (error) {
    addResult('Homepage', 'Test Execution', 'FAIL', error.message, { error: error.stack });
  }
}

async function testLandingPage(page) {
  console.log('\n🎯 Testing Landing Page...');

  try {
    await page.goto(`${BASE_URL}/landing`, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for CTA buttons
    const ctaButtons = await page.locator('button, a').filter({ hasText: /get started|sign up|try|demo/i }).count();
    addResult('Landing', 'CTA Buttons', ctaButtons > 0 ? 'PASS' : 'WARN', `Found ${ctaButtons} CTA buttons`);

    // Check for features section
    const hasFeatures = await page.locator('section').count() > 2;
    addResult('Landing', 'Features Section', hasFeatures ? 'PASS' : 'WARN', hasFeatures ? 'Features section found' : 'Limited content');

    await page.screenshot({ path: `${REPORT_DIR}/landing.png`, fullPage: true });

  } catch (error) {
    addResult('Landing', 'Test Execution', 'FAIL', error.message);
  }
}

async function testPricingPage(page) {
  console.log('\n💰 Testing Pricing Page...');

  try {
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for pricing cards
    const pricingCards = await page.locator('[class*="card"], [class*="pricing"]').count();
    addResult('Pricing', 'Pricing Cards', pricingCards >= 2 ? 'PASS' : 'FAIL', `Found ${pricingCards} pricing options`);

    // Check for prices (should be $249 and $549)
    const pageContent = await page.content();
    const has249 = pageContent.includes('249') || pageContent.includes('$249');
    const has549 = pageContent.includes('549') || pageContent.includes('$549');

    if (has249 && has549) {
      addResult('Pricing', 'Price Display', 'PASS', 'Correct pricing ($249/$549) displayed');
    } else {
      addResult('Pricing', 'Price Display', 'WARN', 'Verify pricing values', { has249, has549 });
    }

    await page.screenshot({ path: `${REPORT_DIR}/pricing.png`, fullPage: true });

  } catch (error) {
    addResult('Pricing', 'Test Execution', 'FAIL', error.message);
  }
}

async function testAuthPage(page) {
  console.log('\n🔐 Testing Authentication...');

  try {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for Google OAuth button
    const googleButton = await page.locator('button, a').filter({ hasText: /google/i }).count();
    addResult('Auth', 'Google OAuth Button', googleButton > 0 ? 'PASS' : 'FAIL', googleButton > 0 ? 'Google sign-in available' : 'No Google button');

    // Check for secure connection
    const url = page.url();
    if (url.startsWith('https://') || url.includes('localhost')) {
      addResult('Auth', 'Secure Connection', 'PASS', 'Connection is secure');
    } else {
      addResult('Auth', 'Secure Connection', 'WARN', 'Not using HTTPS in production');
    }

    await page.screenshot({ path: `${REPORT_DIR}/auth-signin.png`, fullPage: true });

  } catch (error) {
    addResult('Auth', 'Test Execution', 'FAIL', error.message);
  }
}

async function testDashboardAccess(page) {
  console.log('\n📊 Testing Dashboard Access...');

  try {
    // Try to access dashboard without auth
    await page.goto(`${BASE_URL}/dashboard/overview`, { waitUntil: 'networkidle', timeout: 30000 });

    const currentUrl = page.url();

    if (currentUrl.includes('/auth/signin') || currentUrl.includes('/api/auth')) {
      addResult('Dashboard', 'Auth Protection', 'PASS', 'Dashboard is protected - redirects to sign-in');
    } else if (currentUrl.includes('/dashboard')) {
      addResult('Dashboard', 'Auth Protection', 'WARN', 'Dashboard accessible without auth (might be demo mode)');

      // Check dashboard content
      const hasStats = await page.locator('[class*="stat"], [class*="metric"], [class*="card"]').count() > 0;
      addResult('Dashboard', 'Dashboard Content', hasStats ? 'PASS' : 'FAIL', hasStats ? 'Stats/metrics visible' : 'No dashboard content');

      await page.screenshot({ path: `${REPORT_DIR}/dashboard-overview.png`, fullPage: true });
    } else {
      addResult('Dashboard', 'Auth Protection', 'WARN', 'Unexpected redirect behavior', { url: currentUrl });
    }

  } catch (error) {
    addResult('Dashboard', 'Test Execution', 'FAIL', error.message);
  }
}

async function testContactsPage(page) {
  console.log('\n👥 Testing Contacts Page...');

  try {
    await page.goto(`${BASE_URL}/dashboard/contacts`, { waitUntil: 'networkidle', timeout: 30000 });

    // Check if contacts table/list exists
    const hasTable = await page.locator('table, [role="table"]').count() > 0;
    const hasCards = await page.locator('[class*="contact"], [class*="card"]').count() > 0;

    if (hasTable || hasCards) {
      addResult('Contacts', 'Contacts Display', 'PASS', 'Contacts UI is present');
    } else {
      addResult('Contacts', 'Contacts Display', 'WARN', 'No contacts UI found (might be empty state)');
    }

    await page.screenshot({ path: `${REPORT_DIR}/contacts.png`, fullPage: true });

  } catch (error) {
    addResult('Contacts', 'Test Execution', 'FAIL', error.message);
  }
}

async function testResponsiveDesign(page) {
  console.log('\n📱 Testing Responsive Design...');

  try {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    await page.screenshot({ path: `${REPORT_DIR}/mobile-view.png`, fullPage: true });
    addResult('Responsive', 'Mobile Viewport', 'PASS', 'Mobile view captured');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${REPORT_DIR}/tablet-view.png`, fullPage: true });
    addResult('Responsive', 'Tablet Viewport', 'PASS', 'Tablet view captured');

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

  } catch (error) {
    addResult('Responsive', 'Test Execution', 'FAIL', error.message);
  }
}

async function testPerformance(page) {
  console.log('\n⚡ Testing Performance...');

  try {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    if (loadTime < 3000) {
      addResult('Performance', 'Page Load Time', 'PASS', `${loadTime}ms (excellent)`);
    } else if (loadTime < 5000) {
      addResult('Performance', 'Page Load Time', 'WARN', `${loadTime}ms (acceptable)`);
    } else {
      addResult('Performance', 'Page Load Time', 'FAIL', `${loadTime}ms (too slow)`);
    }

    // Check for large resources
    const metrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        totalResources: resources.length,
        largeImages: resources.filter(r => r.initiatorType === 'img' && r.transferSize > 500000).length,
        slowRequests: resources.filter(r => r.duration > 1000).length
      };
    });

    addResult('Performance', 'Resource Count', metrics.totalResources < 100 ? 'PASS' : 'WARN', `${metrics.totalResources} resources loaded`);
    addResult('Performance', 'Large Images', metrics.largeImages === 0 ? 'PASS' : 'WARN', `${metrics.largeImages} large images (>500KB)`);
    addResult('Performance', 'Slow Requests', metrics.slowRequests < 5 ? 'PASS' : 'WARN', `${metrics.slowRequests} slow requests (>1s)`);

  } catch (error) {
    addResult('Performance', 'Test Execution', 'FAIL', error.message);
  }
}

async function testAPIEndpoints(page) {
  console.log('\n🔌 Testing API Endpoints...');

  try {
    // Test health/status endpoint (if exists)
    const response = await page.goto(`${BASE_URL}/api/health`, { timeout: 10000 }).catch(() => null);

    if (response && response.status() === 200) {
      addResult('API', 'Health Endpoint', 'PASS', 'Health check endpoint responsive');
    } else {
      addResult('API', 'Health Endpoint', 'WARN', 'No health check endpoint found');
    }

    // Test auth session endpoint
    const authResponse = await page.goto(`${BASE_URL}/api/auth/session`, { timeout: 10000 }).catch(() => null);

    if (authResponse) {
      addResult('API', 'Auth Session', authResponse.status() === 200 ? 'PASS' : 'WARN', `Auth session returned ${authResponse.status()}`);
    }

  } catch (error) {
    addResult('API', 'Test Execution', 'FAIL', error.message);
  }
}

async function checkEnvironmentConfig() {
  console.log('\n⚙️  Checking Environment Configuration...');

  try {
    // Check if .env.local exists
    const envExists = fs.existsSync('.env.local');
    addResult('Config', 'Environment File', envExists ? 'PASS' : 'FAIL', envExists ? '.env.local found' : '.env.local missing');

    // Check if .env.example exists
    const exampleExists = fs.existsSync('.env.example');
    addResult('Config', 'Example File', exampleExists ? 'PASS' : 'WARN', exampleExists ? '.env.example found' : '.env.example missing');

    // Check package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    addResult('Config', 'Package Name', 'PASS', packageJson.name || 'No name');
    addResult('Config', 'Package Version', 'PASS', packageJson.version || 'No version');

    // Check for required dependencies
    const requiredDeps = ['next', 'react', '@supabase/supabase-js', 'next-auth'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

    if (missingDeps.length === 0) {
      addResult('Config', 'Dependencies', 'PASS', 'All core dependencies present');
    } else {
      addResult('Config', 'Dependencies', 'WARN', `Missing: ${missingDeps.join(', ')}`);
    }

  } catch (error) {
    addResult('Config', 'Configuration Check', 'FAIL', error.message);
  }
}

async function generateReport() {
  console.log('\n📝 Generating Report...');

  // Create report directory
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Save JSON report
  fs.writeFileSync(
    `${REPORT_DIR}/health-check-report.json`,
    JSON.stringify(results, null, 2)
  );

  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Unite-Hub Health Check Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #0f172a; color: #e2e8f0; }
    h1 { color: #60a5fa; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .summary-card { background: #1e293b; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #334155; }
    .summary-card h3 { margin: 0; color: #94a3b8; font-size: 14px; }
    .summary-card .number { font-size: 36px; font-weight: bold; margin: 10px 0; }
    .pass { color: #22c55e; }
    .fail { color: #ef4444; }
    .warn { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #1e293b; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #60a5fa; font-weight: bold; }
    tr:hover { background: #334155; }
    .status { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
    .status.PASS { background: #166534; color: #22c55e; }
    .status.FAIL { background: #7f1d1d; color: #ef4444; }
    .status.WARN { background: #78350f; color: #f59e0b; }
    .screenshots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .screenshot { background: #1e293b; padding: 10px; border-radius: 8px; border: 1px solid #334155; }
    .screenshot img { width: 100%; border-radius: 4px; }
    .screenshot h4 { margin: 10px 0 5px 0; color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>
  <h1>🏥 Unite-Hub Health Check Report</h1>
  <p><strong>Generated:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
  <p><strong>Base URL:</strong> ${results.baseUrl}</p>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Tests</h3>
      <div class="number">${results.summary.total}</div>
    </div>
    <div class="summary-card">
      <h3>Passed</h3>
      <div class="number pass">${results.summary.passed}</div>
    </div>
    <div class="summary-card">
      <h3>Failed</h3>
      <div class="number fail">${results.summary.failed}</div>
    </div>
    <div class="summary-card">
      <h3>Warnings</h3>
      <div class="number warn">${results.summary.warnings}</div>
    </div>
  </div>

  <h2>Test Results</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Test</th>
        <th>Status</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      ${results.tests.map(test => `
        <tr>
          <td>${test.category}</td>
          <td>${test.test}</td>
          <td><span class="status ${test.status}">${test.status}</span></td>
          <td>${test.message}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Screenshots</h2>
  <div class="screenshots">
    ${fs.readdirSync(REPORT_DIR).filter(f => f.endsWith('.png')).map(file => `
      <div class="screenshot">
        <img src="${file}" alt="${file}">
        <h4>${file}</h4>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;

  fs.writeFileSync(`${REPORT_DIR}/health-check-report.html`, htmlReport);

  console.log(`\n✅ Report generated: ${REPORT_DIR}/health-check-report.html`);
  console.log(`✅ JSON report: ${REPORT_DIR}/health-check-report.json`);
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🏥 UNITE-HUB COMPREHENSIVE HEALTH CHECK');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    // Run all tests
    await checkEnvironmentConfig();
    await testHomepage(page);
    await testLandingPage(page);
    await testPricingPage(page);
    await testAuthPage(page);
    await testDashboardAccess(page);
    await testContactsPage(page);
    await testResponsiveDesign(page);
    await testPerformance(page);
    await testAPIEndpoints(page);

    // Generate reports
    await generateReport();

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⚠️  Warnings: ${results.summary.warnings}`);
    console.log(`\n📈 Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Health check failed:', error);
  } finally {
    await browser.close();
  }
}

main();
