#!/usr/bin/env node

/**
 * Monitor Deployment Script
 *
 * Post-deployment monitoring:
 * - Polls health endpoint every 2 seconds
 * - Tracks response times and error rates
 * - Alerts on degradation
 * - Provides rollback option if metrics exceed thresholds
 * - Logs metrics to file for analysis
 *
 * Usage:
 *   node monitor-deployment.mjs --url http://localhost:3008
 *   node monitor-deployment.mjs --url http://localhost:3008 --duration 120 --interval 2
 */

import fs from 'fs';
import http from 'http';
import https from 'https';

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const targetUrl = getArg('--url', 'http://localhost:3008');
const duration = parseInt(getArg('--duration', '120'), 10); // seconds
const interval = parseInt(getArg('--interval', '2'), 10); // seconds

// Configuration
const METRICS_FILE = 'deployment-metrics.json';
const ERROR_RATE_THRESHOLD = 0.1; // 10%
const RESPONSE_TIME_THRESHOLD = 2000; // 2 seconds

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

/**
 * Metrics tracking structure
 */
class MetricsTracker {
  constructor() {
    this.checks = [];
    this.startTime = Date.now();
  }

  addCheck(success, responseTime, statusCode, error = null) {
    this.checks.push({
      timestamp: Date.now(),
      success,
      responseTime,
      statusCode,
      error,
    });
  }

  getStats() {
    const totalChecks = this.checks.length;
    const successfulChecks = this.checks.filter((c) => c.success).length;
    const failedChecks = totalChecks - successfulChecks;
    const errorRate = totalChecks > 0 ? failedChecks / totalChecks : 0;

    const responseTimes = this.checks.filter((c) => c.success).map((c) => c.responseTime);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    const p95ResponseTime =
      responseTimes.length > 0
        ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
        : 0;

    const p99ResponseTime =
      responseTimes.length > 0
        ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)]
        : 0;

    return {
      totalChecks,
      successfulChecks,
      failedChecks,
      errorRate,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      duration: (Date.now() - this.startTime) / 1000,
    };
  }

  saveToFile() {
    try {
      const stats = this.getStats();
      const data = {
        timestamp: new Date().toISOString(),
        url: targetUrl,
        stats,
        checks: this.checks,
      };

      fs.writeFileSync(METRICS_FILE, JSON.stringify(data, null, 2));
      console.log(`${colors.blue}📊 Metrics saved to ${METRICS_FILE}${colors.reset}`);
    } catch (err) {
      console.error(`${colors.red}❌ Failed to save metrics: ${err.message}${colors.reset}`);
    }
  }
}

/**
 * Make HTTP/HTTPS GET request and measure response time
 * @param {string} url - Target URL
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<{statusCode: number, responseTime: number, success: boolean}>}
 */
function makeTimedRequest(url, timeout) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    const healthUrl = `${url}/api/health`;

    const req = protocol.get(healthUrl, { timeout }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          responseTime,
          success: res.statusCode === 200,
          body,
        });
      });
    });

    req.on('error', (err) => {
      const responseTime = Date.now() - startTime;
      resolve({
        statusCode: 0,
        responseTime,
        success: false,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        statusCode: 0,
        responseTime,
        success: false,
        error: 'Request timeout',
      });
    });
  });
}

/**
 * Check if metrics exceed thresholds
 * @param {Object} stats - Current statistics
 * @returns {{degraded: boolean, reasons: string[]}}
 */
function checkThresholds(stats) {
  const reasons = [];
  let degraded = false;

  if (stats.errorRate > ERROR_RATE_THRESHOLD) {
    reasons.push(`Error rate ${(stats.errorRate * 100).toFixed(1)}% exceeds ${ERROR_RATE_THRESHOLD * 100}% threshold`);
    degraded = true;
  }

  if (stats.avgResponseTime > RESPONSE_TIME_THRESHOLD) {
    reasons.push(`Avg response time ${stats.avgResponseTime.toFixed(0)}ms exceeds ${RESPONSE_TIME_THRESHOLD}ms threshold`);
    degraded = true;
  }

  return { degraded, reasons };
}

/**
 * Print progress bar
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {number} barWidth - Width of progress bar
 */
function printProgressBar(current, total, barWidth = 40) {
  const progress = current / total;
  const filled = Math.round(barWidth * progress);
  const empty = barWidth - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percent = (progress * 100).toFixed(1);

  process.stdout.write(`\r${colors.cyan}[${bar}] ${percent}% (${current}/${total}s)${colors.reset}`);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main monitoring loop
 * @param {MetricsTracker} tracker - Metrics tracker instance
 * @returns {Promise<boolean>} Success status
 */
async function monitorLoop(tracker) {
  console.log(`${colors.blue}📊 Starting monitoring...${colors.reset}`);
  console.log(`${colors.blue}Duration: ${duration}s${colors.reset}`);
  console.log(`${colors.blue}Interval: ${interval}s${colors.reset}`);
  console.log(`${colors.blue}URL: ${targetUrl}${colors.reset}\n`);

  const startTime = Date.now();
  const endTime = startTime + duration * 1000;
  let checkCount = 0;

  while (Date.now() < endTime) {
    checkCount++;
    const elapsed = (Date.now() - startTime) / 1000;

    // Make health check request
    const result = await makeTimedRequest(targetUrl, 5000);
    tracker.addCheck(result.success, result.responseTime, result.statusCode, result.error);

    // Get current stats
    const stats = tracker.getStats();

    // Print progress
    printProgressBar(Math.floor(elapsed), duration);

    // Check if metrics are degraded
    const { degraded, reasons } = checkThresholds(stats);

    if (degraded) {
      console.log(`\n${colors.red}⚠️  DEGRADATION DETECTED!${colors.reset}`);
      reasons.forEach((reason) => {
        console.log(`${colors.red}  - ${reason}${colors.reset}`);
      });

      console.log(`\n${colors.yellow}Current Stats:${colors.reset}`);
      console.log(`  Success Rate: ${((1 - stats.errorRate) * 100).toFixed(1)}%`);
      console.log(`  Avg Response: ${stats.avgResponseTime.toFixed(0)}ms`);
      console.log(`  P95 Response: ${stats.p95ResponseTime.toFixed(0)}ms`);

      console.log(`\n${colors.red}❌ Monitoring detected performance issues${colors.reset}`);
      console.log(`${colors.yellow}Consider rolling back the deployment${colors.reset}`);

      tracker.saveToFile();
      return false;
    }

    // Wait for next interval
    await sleep(interval * 1000);
  }

  console.log('\n'); // New line after progress bar
  return true;
}

/**
 * Print final statistics
 * @param {MetricsTracker} tracker - Metrics tracker instance
 */
function printFinalStats(tracker) {
  const stats = tracker.getStats();

  console.log(`${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  Monitoring Summary                    ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}`);

  const successRate = ((1 - stats.errorRate) * 100).toFixed(1);
  const successColor = stats.errorRate < ERROR_RATE_THRESHOLD ? colors.green : colors.red;

  console.log(`Total Checks: ${stats.totalChecks}`);
  console.log(`${successColor}Success Rate: ${successRate}%${colors.reset}`);
  console.log(`Failed Checks: ${stats.failedChecks}`);
  console.log();

  const avgColor = stats.avgResponseTime < RESPONSE_TIME_THRESHOLD ? colors.green : colors.red;
  console.log(`${avgColor}Avg Response Time: ${stats.avgResponseTime.toFixed(0)}ms${colors.reset}`);
  console.log(`P95 Response Time: ${stats.p95ResponseTime.toFixed(0)}ms`);
  console.log(`P99 Response Time: ${stats.p99ResponseTime.toFixed(0)}ms`);
  console.log();

  console.log(`Duration: ${stats.duration.toFixed(1)}s`);
  console.log(`${colors.magenta}════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  Post-Deployment Monitoring            ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

  const tracker = new MetricsTracker();

  // Run monitoring loop
  const success = await monitorLoop(tracker);

  // Print final statistics
  printFinalStats(tracker);

  // Save metrics to file
  tracker.saveToFile();

  // Exit with appropriate code
  if (success) {
    console.log(`${colors.green}✅ Monitoring completed successfully. No issues detected.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Monitoring detected performance degradation.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run main function
main().catch((err) => {
  console.error(`${colors.red}❌ Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
