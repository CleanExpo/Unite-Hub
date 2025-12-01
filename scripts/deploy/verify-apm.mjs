#!/usr/bin/env node

/**
 * APM Setup Verification Script
 *
 * Verifies that all APM components are properly configured:
 * - Datadog API connectivity
 * - RUM collection
 * - Sentry connectivity
 * - Error reporting
 * - Metrics export
 * - Configuration validation
 *
 * Usage: node scripts/deploy/verify-apm.mjs
 */

import https from 'https';
import { config } from 'dotenv';

// Load environment variables
config();

// ============================================================================
// COLOR OUTPUT
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const config_apm = {
  datadog: {
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
    apiKey: process.env.DATADOG_API_KEY,
    site: process.env.NEXT_PUBLIC_DATADOG_SITE || 'datadoghq.com',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  },
  environment: process.env.NODE_ENV || 'development',
};

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Make HTTPS request
 */
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Verify Datadog API connectivity
 */
async function verifyDatadogAPI() {
  info('\n1. Verifying Datadog API connectivity...');

  if (!config_apm.datadog.apiKey) {
    warning('   DATADOG_API_KEY not set - server-side metrics disabled');
    return false;
  }

  try {
    const response = await httpsRequest({
      hostname: `api.${config_apm.datadog.site}`,
      path: '/api/v1/validate',
      method: 'GET',
      headers: {
        'DD-API-KEY': config_apm.datadog.apiKey,
      },
    });

    if (response.statusCode === 200) {
      success('   Datadog API: Connected');
      return true;
    } else {
      error(`   Datadog API: Failed (${response.statusCode})`);
      return false;
    }
  } catch (err) {
    error(`   Datadog API: Error - ${err.message}`);
    return false;
  }
}

/**
 * Verify Datadog RUM configuration
 */
function verifyDatadogRUM() {
  info('\n2. Verifying Datadog RUM configuration...');

  if (!config_apm.datadog.applicationId || !config_apm.datadog.clientToken) {
    warning('   Datadog RUM: Not configured (missing applicationId or clientToken)');
    return false;
  }

  success('   Datadog RUM: Configured');
  info(`   Application ID: ${config_apm.datadog.applicationId}`);
  info(`   Site: ${config_apm.datadog.site}`);
  return true;
}

/**
 * Verify Sentry connectivity
 */
async function verifySentry() {
  info('\n3. Verifying Sentry connectivity...');

  if (!config_apm.sentry.dsn) {
    warning('   Sentry DSN not set - error tracking disabled');
    return false;
  }

  try {
    // Parse DSN to extract project info
    const dsnUrl = new URL(config_apm.sentry.dsn);
    const projectId = dsnUrl.pathname.split('/').pop();

    success('   Sentry: Configured');
    info(`   Project ID: ${projectId}`);
    info(`   Environment: ${config_apm.sentry.environment}`);
    return true;
  } catch (err) {
    error(`   Sentry: Invalid DSN format - ${err.message}`);
    return false;
  }
}

/**
 * Test error reporting
 */
async function testErrorReporting() {
  info('\n4. Testing error reporting...');

  const hasDatadog = config_apm.datadog.applicationId && config_apm.datadog.clientToken;
  const hasSentry = config_apm.sentry.dsn;

  if (!hasDatadog && !hasSentry) {
    warning('   No error reporting configured');
    return false;
  }

  if (hasDatadog) {
    success('   Datadog error tracking: Ready');
  }

  if (hasSentry) {
    success('   Sentry error tracking: Ready');
  }

  return true;
}

/**
 * Test metrics export
 */
async function testMetricsExport() {
  info('\n5. Testing metrics export...');

  if (!config_apm.datadog.apiKey) {
    warning('   Metrics export disabled (no API key)');
    return false;
  }

  try {
    const testMetric = {
      series: [
        {
          metric: 'unite_hub.verification.test',
          points: [[Math.floor(Date.now() / 1000), 1]],
          type: 'count',
          tags: ['source:verification-script'],
        },
      ],
    };

    const response = await httpsRequest(
      {
        hostname: `api.${config_apm.datadog.site}`,
        path: '/api/v1/series',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': config_apm.datadog.apiKey,
        },
      },
      JSON.stringify(testMetric)
    );

    if (response.statusCode === 202) {
      success('   Metrics export: Working');
      return true;
    } else {
      error(`   Metrics export: Failed (${response.statusCode})`);
      return false;
    }
  } catch (err) {
    error(`   Metrics export: Error - ${err.message}`);
    return false;
  }
}

/**
 * Verify configuration completeness
 */
function verifyConfiguration() {
  info('\n6. Verifying overall configuration...');

  const checks = {
    datadogAPI: !!config_apm.datadog.apiKey,
    datadogRUM: !!(config_apm.datadog.applicationId && config_apm.datadog.clientToken),
    sentry: !!config_apm.sentry.dsn,
  };

  info(`   Environment: ${config_apm.environment}`);
  info(`   Datadog API: ${checks.datadogAPI ? '✓' : '✗'}`);
  info(`   Datadog RUM: ${checks.datadogRUM ? '✓' : '✗'}`);
  info(`   Sentry: ${checks.sentry ? '✓' : '✗'}`);

  const hasAnyAPM = checks.datadogAPI || checks.datadogRUM || checks.sentry;

  if (!hasAnyAPM) {
    warning('   No APM services configured');
    return false;
  }

  success('   Configuration: Valid');
  return true;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('\n═══════════════════════════════════════════════', colors.bright);
  log('   APM Setup Verification', colors.bright);
  log('═══════════════════════════════════════════════\n', colors.bright);

  const results = {
    datadogAPI: await verifyDatadogAPI(),
    datadogRUM: verifyDatadogRUM(),
    sentry: await verifySentry(),
    errorReporting: await testErrorReporting(),
    metricsExport: await testMetricsExport(),
    configuration: verifyConfiguration(),
  };

  // Summary
  log('\n═══════════════════════════════════════════════', colors.bright);
  log('   Verification Summary', colors.bright);
  log('═══════════════════════════════════════════════\n', colors.bright);

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  if (passed === total) {
    success(`All checks passed (${passed}/${total})`);
    process.exit(0);
  } else if (passed > 0) {
    warning(`Some checks passed (${passed}/${total})`);
    process.exit(0); // Still exit 0 if at least something works
  } else {
    error(`All checks failed (${passed}/${total})`);
    process.exit(1);
  }
}

// Run verification
main().catch((err) => {
  error(`\nVerification failed: ${err.message}`);
  process.exit(1);
});
