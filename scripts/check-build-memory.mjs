#!/usr/bin/env node
/**
 * Build Memory Monitor
 *
 * Checks recent DigitalOcean build logs for memory warnings.
 * Run: npm run check:build-memory
 *
 * WARNING SIGNS:
 * - "JavaScript heap out of memory"
 * - "Allocation failed"
 * - "Last few GCs" appearing in logs
 * - Build hanging during "Finalizing page optimization"
 */
import https from 'https';
import zlib from 'zlib';

const appId = 'dbaa4c4e-c69c-4b20-ae2c-22b366986dbc';
const token = process.env.DIGITALOCEAN_API_TOKEN;

// Memory warning patterns
const MEMORY_WARNINGS = [
  { pattern: /heap out of memory/i, severity: 'CRITICAL', message: 'Build ran out of memory' },
  { pattern: /Allocation failed/i, severity: 'CRITICAL', message: 'Memory allocation failed' },
  { pattern: /Last few GCs/i, severity: 'WARNING', message: 'Garbage collection struggling' },
  { pattern: /FATAL ERROR/i, severity: 'CRITICAL', message: 'Fatal error occurred' },
  { pattern: /Finalizing page optimization/i, severity: 'INFO', message: 'Build reached optimization phase (memory intensive)' },
  { pattern: /Generating static pages.*\/(\d+)\)/i, severity: 'INFO', message: 'Static page generation progress' },
];

// Current memory configuration
const CURRENT_CONFIG = {
  instanceSize: 'professional-l',
  instanceRam: '8GB',
  nodeHeap: '6144MB (6GB)',
};

function request(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.digitalocean.com',
      path,
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', reject);
  });
}

function fetchLogContent(url) {
  return new Promise((resolve) => {
    const logUrl = new URL(url);
    https.get({
      hostname: logUrl.hostname,
      path: logUrl.pathname + logUrl.search
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        try {
          const decompressed = zlib.gunzipSync(buffer);
          resolve(decompressed.toString('utf8'));
        } catch (e) {
          resolve(buffer.toString('utf8'));
        }
      });
    }).on('error', () => resolve(''));
  });
}

async function analyzeDeployment(deploy) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Deployment: ${deploy.id.slice(0, 8)}`);
  console.log(`Phase: ${deploy.phase}`);
  console.log(`Cause: ${deploy.cause.slice(0, 60)}`);
  console.log(`${'='.repeat(60)}`);

  // Get build logs
  const logsRes = await request(`/v2/apps/${appId}/deployments/${deploy.id}/components/unite-hub2/logs?type=BUILD&follow=false`);

  if (!logsRes.historic_urls || logsRes.historic_urls.length === 0) {
    console.log('⚠️  No build logs available yet');
    return { warnings: [], errors: [] };
  }

  const logContent = await fetchLogContent(logsRes.historic_urls[0]);
  const lines = logContent.split('\n');

  const findings = { warnings: [], errors: [], info: [] };

  for (const line of lines) {
    for (const check of MEMORY_WARNINGS) {
      const match = line.match(check.pattern);
      if (match) {
        const finding = {
          severity: check.severity,
          message: check.message,
          line: line.slice(0, 100).replace(/\[34m│\[0m\s*/g, '').trim()
        };

        if (check.severity === 'CRITICAL') {
          findings.errors.push(finding);
        } else if (check.severity === 'WARNING') {
          findings.warnings.push(finding);
        } else {
          findings.info.push(finding);
        }
      }
    }
  }

  // Report findings
  if (findings.errors.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    findings.errors.forEach(f => console.log(`   ❌ ${f.message}`));
  }

  if (findings.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    findings.warnings.forEach(f => console.log(`   ⚡ ${f.message}`));
  }

  if (findings.info.length > 0) {
    console.log('\nℹ️  Build Progress:');
    // Just show last info item (final static page count)
    const lastInfo = findings.info[findings.info.length - 1];
    console.log(`   📊 ${lastInfo.message}`);
  }

  if (findings.errors.length === 0 && findings.warnings.length === 0) {
    console.log('\n✅ No memory issues detected');
  }

  return findings;
}

async function main() {
  if (!token) {
    console.error('❌ DIGITALOCEAN_API_TOKEN not set');
    process.exit(1);
  }

  console.log('🔍 Build Memory Monitor');
  console.log('========================\n');

  console.log('Current Configuration:');
  console.log(`  Instance: ${CURRENT_CONFIG.instanceSize} (${CURRENT_CONFIG.instanceRam})`);
  console.log(`  Node Heap: ${CURRENT_CONFIG.nodeHeap}`);
  console.log(`  Headroom: ~2GB for OS and other processes`);

  // Get last 3 deployments
  const deployRes = await request(`/v2/apps/${appId}/deployments?page=1&per_page=3`);

  if (!deployRes.deployments || deployRes.deployments.length === 0) {
    console.log('\n❌ No deployments found');
    return;
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const deploy of deployRes.deployments) {
    const findings = await analyzeDeployment(deploy);
    totalErrors += findings.errors?.length || 0;
    totalWarnings += findings.warnings?.length || 0;
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  if (totalErrors > 0) {
    console.log(`\n🚨 ${totalErrors} critical memory issues found in recent builds!`);
    console.log('\n📋 RECOMMENDED ACTION:');
    console.log('   1. Upgrade to professional-xl (16GB) in .do/app.yaml');
    console.log('   2. Update NODE_OPTIONS to --max-old-space-size=12288');
    console.log('   3. Push changes and redeploy');
  } else if (totalWarnings > 0) {
    console.log(`\n⚠️  ${totalWarnings} memory warnings found - monitor closely`);
    console.log('\n📋 RECOMMENDED ACTION:');
    console.log('   Keep an eye on builds - upgrade if warnings increase');
  } else {
    console.log('\n✅ All recent builds healthy - memory usage within limits');
  }
}

main().catch(console.error);
