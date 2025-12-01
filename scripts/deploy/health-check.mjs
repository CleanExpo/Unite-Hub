#!/usr/bin/env node

/**
 * Health Check Script
 *
 * Polls the /api/health endpoint to verify deployment health.
 * Returns exit code 0 (healthy) or 1 (unhealthy).
 * Implements exponential backoff retry logic.
 *
 * Usage:
 *   node health-check.mjs --url http://localhost:3008
 *   node health-check.mjs --url http://localhost:3008 --timeout 30 --retries 5
 */

import http from 'http';
import https from 'https';

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const targetUrl = getArg('--url', 'http://localhost:3008');
const timeout = parseInt(getArg('--timeout', '30'), 10) * 1000; // Convert to ms
const maxRetries = parseInt(getArg('--retries', '5'), 10);

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

/**
 * Make HTTP/HTTPS GET request with timeout
 * @param {string} url - Target URL
 * @param {number} timeoutMs - Request timeout in milliseconds
 * @returns {Promise<{statusCode: number, body: string}>}
 */
function makeRequest(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const healthUrl = `${url}/api/health`;

    const req = protocol.get(healthUrl, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
function getBackoffDelay(attempt) {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  const baseDelay = 1000;
  const maxDelay = 16000;
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return delay;
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
 * Check if health response is valid
 * @param {number} statusCode - HTTP status code
 * @param {string} body - Response body
 * @returns {{healthy: boolean, reason: string}}
 */
function validateHealthResponse(statusCode, body) {
  if (statusCode !== 200) {
    return { healthy: false, reason: `Non-200 status code: ${statusCode}` };
  }

  try {
    const data = JSON.parse(body);
    if (!data.status) {
      return { healthy: false, reason: 'Missing status field in response' };
    }

    if (data.status !== 'ok' && data.status !== 'healthy') {
      return { healthy: false, reason: `Unhealthy status: ${data.status}` };
    }

    return { healthy: true, reason: 'All checks passed' };
  } catch (err) {
    return { healthy: false, reason: `Invalid JSON response: ${err.message}` };
  }
}

/**
 * Perform health check with retries
 * @returns {Promise<{success: boolean, attempts: number, reason: string}>}
 */
async function performHealthCheck() {
  console.log(`${colors.blue}🔍 Starting health check...${colors.reset}`);
  console.log(`${colors.blue}Target URL: ${targetUrl}${colors.reset}`);
  console.log(`${colors.blue}Timeout: ${timeout / 1000}s, Max Retries: ${maxRetries}${colors.reset}\n`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`${colors.blue}Attempt ${attempt + 1}/${maxRetries}...${colors.reset}`);

      const { statusCode, body } = await makeRequest(targetUrl, timeout);
      const validation = validateHealthResponse(statusCode, body);

      if (validation.healthy) {
        console.log(`${colors.green}✅ Health check passed!${colors.reset}`);
        console.log(`${colors.green}Response: ${body}${colors.reset}`);
        return { success: true, attempts: attempt + 1, reason: validation.reason };
      }

      console.log(`${colors.yellow}⚠️  Health check failed: ${validation.reason}${colors.reset}`);

      // If not last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = getBackoffDelay(attempt);
        console.log(`${colors.yellow}Retrying in ${delay / 1000}s...${colors.reset}\n`);
        await sleep(delay);
      }
    } catch (err) {
      console.log(`${colors.red}❌ Request failed: ${err.message}${colors.reset}`);

      // If not last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = getBackoffDelay(attempt);
        console.log(`${colors.yellow}Retrying in ${delay / 1000}s...${colors.reset}\n`);
        await sleep(delay);
      }
    }
  }

  return { success: false, attempts: maxRetries, reason: 'Max retries exceeded' };
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  const result = await performHealthCheck();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Health Check Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`Status: ${result.success ? colors.green + '✅ HEALTHY' : colors.red + '❌ UNHEALTHY'}${colors.reset}`);
  console.log(`Attempts: ${result.attempts}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Reason: ${result.reason}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// Run main function
main().catch((err) => {
  console.error(`${colors.red}❌ Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
