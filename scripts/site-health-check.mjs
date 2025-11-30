#!/usr/bin/env node
/**
 * Comprehensive Site Health Check
 *
 * Monitors: Deployment status, Health API, Memory, Errors
 * Run: npm run health:check
 */
import https from 'https';
import zlib from 'zlib';

const APP_URL = 'hammerhead-app-zr38x.ondigitalocean.app';
const APP_ID = 'dbaa4c4e-c69c-4b20-ae2c-22b366986dbc';
const DO_TOKEN = process.env.DIGITALOCEAN_API_TOKEN;

const CHECKS = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

function log(emoji, message) {
  console.log(`${emoji}  ${message}`);
}

function pass(message) {
  CHECKS.passed++;
  log('✅', message);
}

function fail(message) {
  CHECKS.failed++;
  CHECKS.issues.push(message);
  log('❌', message);
}

function warn(message) {
  CHECKS.warnings++;
  log('⚠️', message);
}

function info(message) {
  log('ℹ️', message);
}

function httpGet(url, headers = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers,
      timeout: 15000
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });

    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'Request timeout (15s)' });
    });
  });
}

function doApiGet(path) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'api.digitalocean.com',
      path,
      headers: { 'Authorization': 'Bearer ' + DO_TOKEN },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Parse error' });
        }
      });
    }).on('error', (e) => resolve({ error: e.message }));
  });
}

// ============================================
// CHECK 1: Homepage Availability
// ============================================
async function checkHomepage() {
  console.log('\n📍 CHECK 1: Homepage Availability');
  console.log('-'.repeat(40));

  const start = Date.now();
  const res = await httpGet(`https://${APP_URL}/`);
  const latency = Date.now() - start;

  if (res.status === 200) {
    pass(`Homepage: ${res.status} OK (${latency}ms)`);
    if (latency > 3000) warn(`Slow response time: ${latency}ms`);
  } else if (res.status === 504) {
    fail(`Homepage: 504 Gateway Timeout - App may be crashing`);
  } else if (res.error) {
    fail(`Homepage: ${res.error}`);
  } else {
    fail(`Homepage: Unexpected status ${res.status}`);
  }
}

// ============================================
// CHECK 2: Health API
// ============================================
async function checkHealthAPI() {
  console.log('\n📍 CHECK 2: Health API');
  console.log('-'.repeat(40));

  const start = Date.now();
  const res = await httpGet(`https://${APP_URL}/api/health`);
  const latency = Date.now() - start;

  if (res.status === 200) {
    pass(`Health API: ${res.status} OK (${latency}ms)`);

    try {
      const health = JSON.parse(res.data);
      info(`Status: ${health.status}`);
      info(`Uptime: ${Math.round(health.uptime)}s`);

      // Check individual services
      if (health.checks) {
        for (const [service, check] of Object.entries(health.checks)) {
          if (check.status === 'healthy') {
            pass(`  ${service}: healthy`);
          } else if (check.status === 'unhealthy') {
            warn(`  ${service}: unhealthy - ${check.error || 'unknown'}`);
          }
        }
      }

      if (health.status === 'degraded') {
        warn('System is degraded but operational');
      } else if (health.status === 'critical') {
        fail('System health is critical');
      }
    } catch (e) {
      warn('Could not parse health response');
    }
  } else if (res.status === 504) {
    fail(`Health API: 504 - Likely infinite loop or crash`);
  } else if (res.error) {
    fail(`Health API: ${res.error}`);
  } else {
    fail(`Health API: Unexpected status ${res.status}`);
  }
}

// ============================================
// CHECK 3: Deployment Status
// ============================================
async function checkDeployment() {
  console.log('\n📍 CHECK 3: Deployment Status');
  console.log('-'.repeat(40));

  if (!DO_TOKEN) {
    warn('DIGITALOCEAN_API_TOKEN not set - skipping deployment check');
    return;
  }

  const deployRes = await doApiGet(`/v2/apps/${APP_ID}/deployments?page=1&per_page=1`);

  if (deployRes.error || !deployRes.deployments) {
    warn('Could not fetch deployment status');
    return;
  }

  const deploy = deployRes.deployments[0];
  info(`Latest: ${deploy.id.slice(0, 8)}`);

  if (deploy.phase === 'ACTIVE') {
    pass(`Deployment: ACTIVE`);
  } else if (deploy.phase === 'BUILDING') {
    info(`Deployment: BUILDING (in progress)`);
  } else if (deploy.phase === 'DEPLOYING') {
    info(`Deployment: DEPLOYING (in progress)`);
  } else if (deploy.phase === 'ERROR') {
    fail(`Deployment: ERROR - Latest build failed`);

    // Get error details from progress
    if (deploy.progress?.steps) {
      for (const step of deploy.progress.steps) {
        if (step.status === 'ERROR') {
          info(`  ${step.name}: ${step.reason || 'failed'}`);
        }
      }
    }
  } else {
    warn(`Deployment: ${deploy.phase}`);
  }
}

// ============================================
// CHECK 4: Build Memory
// ============================================
async function checkBuildMemory() {
  console.log('\n📍 CHECK 4: Build Memory');
  console.log('-'.repeat(40));

  if (!DO_TOKEN) {
    warn('DIGITALOCEAN_API_TOKEN not set - skipping memory check');
    return;
  }

  const deployRes = await doApiGet(`/v2/apps/${APP_ID}/deployments?page=1&per_page=1`);

  if (deployRes.error || !deployRes.deployments) {
    warn('Could not fetch deployment for memory check');
    return;
  }

  const deploy = deployRes.deployments[0];

  // Only check if deployment is complete (ACTIVE or ERROR)
  if (deploy.phase !== 'ACTIVE' && deploy.phase !== 'ERROR') {
    info('Build in progress - memory check pending');
    return;
  }

  const logsRes = await doApiGet(`/v2/apps/${APP_ID}/deployments/${deploy.id}/components/unite-hub2/logs?type=BUILD&follow=false`);

  if (!logsRes.historic_urls || logsRes.historic_urls.length === 0) {
    warn('Build logs not available');
    return;
  }

  // Fetch and check logs for memory issues
  const logUrl = new URL(logsRes.historic_urls[0]);
  const logRes = await httpGet(logsRes.historic_urls[0]);

  if (logRes.error) {
    warn('Could not fetch build logs');
    return;
  }

  let logContent;
  try {
    const buffer = Buffer.from(logRes.data, 'binary');
    logContent = zlib.gunzipSync(buffer).toString('utf8');
  } catch (e) {
    logContent = logRes.data;
  }

  const hasOOM = /heap out of memory/i.test(logContent);
  const hasAllocationFailed = /Allocation failed/i.test(logContent);
  const hasGCWarning = /Last few GCs/i.test(logContent);

  if (hasOOM || hasAllocationFailed) {
    fail('Build had memory issues (OOM)');
  } else if (hasGCWarning) {
    warn('Build showed garbage collection pressure');
  } else {
    pass('Build memory: OK');
  }
}

// ============================================
// CHECK 5: Critical Endpoints
// ============================================
async function checkCriticalEndpoints() {
  console.log('\n📍 CHECK 5: Critical Endpoints');
  console.log('-'.repeat(40));

  const endpoints = [
    { path: '/api/auth/session', name: 'Auth Session' },
    { path: '/login', name: 'Login Page' },
    { path: '/dashboard/overview', name: 'Dashboard' },
  ];

  for (const ep of endpoints) {
    const res = await httpGet(`https://${APP_URL}${ep.path}`);

    if (res.status >= 200 && res.status < 400) {
      pass(`${ep.name}: ${res.status}`);
    } else if (res.status === 401 || res.status === 403) {
      pass(`${ep.name}: ${res.status} (auth required - expected)`);
    } else if (res.status === 504) {
      fail(`${ep.name}: 504 timeout`);
    } else if (res.error) {
      fail(`${ep.name}: ${res.error}`);
    } else {
      warn(`${ep.name}: ${res.status}`);
    }
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('═'.repeat(50));
  console.log('🔍 UNITE-HUB SITE HEALTH CHECK');
  console.log(`   ${new Date().toISOString()}`);
  console.log('═'.repeat(50));

  await checkHomepage();
  await checkHealthAPI();
  await checkDeployment();
  await checkBuildMemory();
  await checkCriticalEndpoints();

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(50));
  console.log(`   ✅ Passed:   ${CHECKS.passed}`);
  console.log(`   ⚠️  Warnings: ${CHECKS.warnings}`);
  console.log(`   ❌ Failed:   ${CHECKS.failed}`);

  if (CHECKS.failed > 0) {
    console.log('\n🚨 ISSUES DETECTED:');
    CHECKS.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });

    console.log('\n📋 RECOMMENDED ACTIONS:');

    if (CHECKS.issues.some(i => i.includes('504') || i.includes('timeout'))) {
      console.log('   • Check for infinite loops in logging code');
      console.log('   • Review recent code changes');
      console.log('   • Run: npm run check:build-memory');
    }

    if (CHECKS.issues.some(i => i.includes('OOM') || i.includes('memory'))) {
      console.log('   • Upgrade instance size in .do/app.yaml');
      console.log('   • Increase NODE_OPTIONS in Dockerfile');
    }

    if (CHECKS.issues.some(i => i.includes('ERROR'))) {
      console.log('   • Check build logs: npm run check:build-memory');
      console.log('   • Review recent commits for breaking changes');
    }

    process.exit(1);
  } else if (CHECKS.warnings > 0) {
    console.log('\n⚠️  System operational with warnings - monitor closely');
    process.exit(0);
  } else {
    console.log('\n✅ All systems healthy!');
    process.exit(0);
  }
}

main().catch(e => {
  console.error('Health check failed:', e.message);
  process.exit(1);
});
