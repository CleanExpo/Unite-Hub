#!/usr/bin/env node

/**
 * Quick AIDO System Health Check
 *
 * Runs basic smoke tests to verify system is operational
 * Does NOT require authentication (checks public endpoints only)
 */

import https from 'https';
import http from 'http';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on('error', reject);
  });
}

async function checkServerRunning() {
  log('\n════════════════════════════════════════════════════════════════════════════════');
  log('  System Health Check', colors.blue);
  log('════════════════════════════════════════════════════════════════════════════════\n');

  try {
    logInfo(`Checking server at: ${BASE_URL}`);
    const response = await makeRequest(`${BASE_URL}/`);

    if (response.statusCode === 200 || response.statusCode === 302) {
      logSuccess('Development server is running');
      return true;
    } else {
      logError(`Server returned unexpected status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError('Development server is not running');
    logInfo('Start the server with: npm run dev');
    return false;
  }
}

async function checkDashboards() {
  log('\n════════════════════════════════════════════════════════════════════════════════');
  log('  Dashboard Availability Check', colors.blue);
  log('════════════════════════════════════════════════════════════════════════════════\n');

  const dashboards = [
    '/dashboard/aido/overview',
    '/dashboard/aido/onboarding',
    '/dashboard/aido/clients',
    '/dashboard/aido/content',
    '/dashboard/aido/analytics',
    '/dashboard/aido/settings',
  ];

  let passed = 0;
  let failed = 0;

  for (const path of dashboards) {
    try {
      const response = await makeRequest(`${BASE_URL}${path}`);

      // 200 = OK, 302 = Redirect to login (expected if not authenticated)
      if (response.statusCode === 200 || response.statusCode === 302) {
        logSuccess(`${path} - Available`);
        passed++;
      } else {
        logError(`${path} - Status ${response.statusCode}`);
        failed++;
      }
    } catch (error) {
      logError(`${path} - ${error.message}`);
      failed++;
    }
  }

  log(`\n${colors.gray}Dashboards: ${passed} available, ${failed} failed${colors.reset}`);
  return { passed, failed };
}

async function checkPublicPages() {
  log('\n════════════════════════════════════════════════════════════════════════════════');
  log('  Public Pages Check', colors.blue);
  log('════════════════════════════════════════════════════════════════════════════════\n');

  const pages = [
    '/login',
    '/',
  ];

  let passed = 0;
  let failed = 0;

  for (const path of pages) {
    try {
      const response = await makeRequest(`${BASE_URL}${path}`);

      if (response.statusCode === 200 || response.statusCode === 302) {
        logSuccess(`${path} - Available`);
        passed++;
      } else {
        logError(`${path} - Status ${response.statusCode}`);
        failed++;
      }
    } catch (error) {
      logError(`${path} - ${error.message}`);
      failed++;
    }
  }

  log(`\n${colors.gray}Public pages: ${passed} available, ${failed} failed${colors.reset}`);
  return { passed, failed };
}

async function checkEnvironment() {
  log('\n════════════════════════════════════════════════════════════════════════════════');
  log('  Environment Variables Check', colors.blue);
  log('════════════════════════════════════════════════════════════════════════════════\n');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const optionalVars = [
    'NEXT_PUBLIC_APP_URL',
    'OPENROUTER_API_KEY',
    'GOOGLE_AI_API_KEY',
  ];

  let requiredCount = 0;
  let optionalCount = 0;

  logInfo('Required variables:');
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} - Set`);
      requiredCount++;
    } else {
      logError(`${varName} - Missing`);
    }
  }

  logInfo('\nOptional variables:');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} - Set`);
      optionalCount++;
    } else {
      logWarning(`${varName} - Not set`);
    }
  }

  log(`\n${colors.gray}Environment: ${requiredCount}/${requiredVars.length} required, ${optionalCount}/${optionalVars.length} optional${colors.reset}`);

  return requiredCount === requiredVars.length;
}

async function generateSummaryReport(results) {
  log('\n════════════════════════════════════════════════════════════════════════════════');
  log('  Summary Report', colors.blue);
  log('════════════════════════════════════════════════════════════════════════════════\n');

  const totalPassed = results.dashboards.passed + results.publicPages.passed;
  const totalFailed = results.dashboards.failed + results.publicPages.failed;
  const totalTests = totalPassed + totalFailed;
  const passRate = Math.round((totalPassed / totalTests) * 100);

  log(`Server Status: ${results.serverRunning ? '✅ Running' : '❌ Not Running'}`);
  log(`Environment: ${results.environmentComplete ? '✅ Complete' : '❌ Incomplete'}`);
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${totalPassed} (${passRate}%)`);
  log(`Failed: ${totalFailed}`);

  if (passRate === 100 && results.serverRunning && results.environmentComplete) {
    log('\n🎉 All systems operational!', colors.green);
    log('Ready for manual testing.', colors.green);
  } else if (passRate >= 80) {
    log('\n⚠️  System mostly operational with some issues', colors.yellow);
    log('Review failed checks above.', colors.yellow);
  } else {
    log('\n❌ System has significant issues', colors.red);
    log('Fix critical errors before testing.', colors.red);
  }

  log('\n════════════════════════════════════════════════════════════════════════════════\n');

  logInfo('Next Steps:');
  if (!results.serverRunning) {
    log('1. Start dev server: npm run dev');
  }
  if (!results.environmentComplete) {
    log('2. Configure missing environment variables in .env.local');
  }
  if (results.serverRunning && results.environmentComplete) {
    log('1. Run full test suite: npm run test:aido');
    log('2. Follow manual testing guide: AIDO_MANUAL_TESTING_GUIDE.md');
  }
  log('');
}

async function main() {
  try {
    const serverRunning = await checkServerRunning();
    const environmentComplete = checkEnvironment();

    let dashboards = { passed: 0, failed: 0 };
    let publicPages = { passed: 0, failed: 0 };

    if (serverRunning) {
      publicPages = await checkPublicPages();
      dashboards = await checkDashboards();
    } else {
      logWarning('\nSkipping page checks (server not running)');
    }

    await generateSummaryReport({
      serverRunning,
      environmentComplete,
      dashboards,
      publicPages,
    });

    // Exit with appropriate code
    const allPassed = serverRunning &&
                     environmentComplete &&
                     dashboards.failed === 0 &&
                     publicPages.failed === 0;

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    logError(`\nUnexpected error: ${error.message}`);
    process.exit(1);
  }
}

main();
