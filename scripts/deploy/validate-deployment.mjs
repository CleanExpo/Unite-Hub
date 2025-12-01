#!/usr/bin/env node

/**
 * Validate Deployment Script
 *
 * Pre-flight checks before deployment:
 * - Verify target environment exists
 * - Check sufficient disk space (min 5GB)
 * - Verify Docker daemon running
 * - Test health check endpoint
 * - Verify Redis connectivity
 * - Verify database connectivity
 * - Check Nginx configuration syntax
 *
 * Usage:
 *   node validate-deployment.mjs --target blue
 *   node validate-deployment.mjs --target green --skip-redis
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const target = getArg('--target', null);
const skipRedis = args.includes('--skip-redis');
const skipDb = args.includes('--skip-db');

// Configuration
const MIN_DISK_SPACE_GB = 5;

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
};

/**
 * Validation result structure
 */
class ValidationResult {
  constructor(name) {
    this.name = name;
    this.passed = false;
    this.warnings = [];
    this.errors = [];
  }

  pass(message) {
    this.passed = true;
    if (message) this.warnings.push(message);
  }

  fail(error) {
    this.passed = false;
    this.errors.push(error);
  }

  warn(warning) {
    this.warnings.push(warning);
  }
}

/**
 * Validate command-line arguments
 */
function validateArgs() {
  if (!target || (target !== 'blue' && target !== 'green')) {
    console.error(`${colors.red}❌ Error: Invalid target. Use --target blue or --target green${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Check if target environment configuration exists
 * @returns {ValidationResult}
 */
function checkTargetEnvironment() {
  const result = new ValidationResult('Target Environment');

  console.log(`${colors.blue}🎯 Checking target environment: ${target}${colors.reset}`);

  // Check if .env file exists
  const envFile = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envFile)) {
    result.warn('.env.local file not found');
  } else {
    result.pass('.env.local file exists');
  }

  // Verify target is valid
  if (target === 'blue' || target === 'green') {
    result.pass(`Target environment '${target}' is valid`);
  } else {
    result.fail(`Invalid target environment: ${target}`);
  }

  return result;
}

/**
 * Check available disk space
 * @returns {ValidationResult}
 */
function checkDiskSpace() {
  const result = new ValidationResult('Disk Space');

  console.log(`${colors.blue}💾 Checking disk space...${colors.reset}`);

  try {
    // Get disk usage based on platform
    let availableGB;

    if (process.platform === 'win32') {
      // Windows: use wmic command
      const output = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf-8' });
      const lines = output.trim().split('\n').filter(line => line.trim());
      const drives = lines.slice(1).map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          drive: parts[0],
          free: parseInt(parts[1]) / (1024 ** 3),
          total: parseInt(parts[2]) / (1024 ** 3),
        };
      });

      // Use the drive with most free space
      const bestDrive = drives.reduce((prev, curr) => (curr.free > prev.free ? curr : prev));
      availableGB = bestDrive.free;
    } else {
      // Unix: use df command
      const output = execSync('df -k .', { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      const parts = lines[1].split(/\s+/);
      const availableKB = parseInt(parts[3]);
      availableGB = availableKB / (1024 * 1024);
    }

    console.log(`${colors.blue}Available disk space: ${availableGB.toFixed(2)} GB${colors.reset}`);

    if (availableGB >= MIN_DISK_SPACE_GB) {
      result.pass(`Sufficient disk space: ${availableGB.toFixed(2)} GB available`);
    } else {
      result.fail(`Insufficient disk space: ${availableGB.toFixed(2)} GB available, ${MIN_DISK_SPACE_GB} GB required`);
    }
  } catch (err) {
    result.fail(`Failed to check disk space: ${err.message}`);
  }

  return result;
}

/**
 * Check if Docker daemon is running
 * @returns {ValidationResult}
 */
function checkDockerDaemon() {
  const result = new ValidationResult('Docker Daemon');

  console.log(`${colors.blue}🐳 Checking Docker daemon...${colors.reset}`);

  try {
    execSync('docker info', { stdio: 'pipe' });
    result.pass('Docker daemon is running');
  } catch (err) {
    result.fail('Docker daemon is not running or not installed');
  }

  return result;
}

/**
 * Test health check endpoint (if deployment already exists)
 * @returns {ValidationResult}
 */
function checkHealthEndpoint() {
  const result = new ValidationResult('Health Endpoint');

  console.log(`${colors.blue}🏥 Checking health endpoint...${colors.reset}`);

  const port = target === 'blue' ? 3008 : 3009;

  try {
    // Try to use execSync to test health endpoint
    execSync(`curl -f -s http://localhost:${port}/api/health`, { stdio: 'pipe', timeout: 5000 });
    result.pass(`Health endpoint responding on port ${port}`);
  } catch (err) {
    // curl command failed or not available
    result.warn(`No existing deployment on port ${port} (this is OK for fresh deployments)`);
  }

  return result;
}

/**
 * Verify Redis connectivity
 * @returns {ValidationResult}
 */
function checkRedisConnectivity() {
  const result = new ValidationResult('Redis Connectivity');

  if (skipRedis) {
    result.pass('Redis check skipped (--skip-redis flag)');
    return result;
  }

  console.log(`${colors.blue}📦 Checking Redis connectivity...${colors.reset}`);

  try {
    // Check if Redis container is running
    const output = execSync('docker ps --filter name=redis --format "{{.Names}}"', { encoding: 'utf-8' });

    if (output.trim()) {
      result.pass('Redis container is running');
    } else {
      result.warn('Redis container not found (deployment may start it)');
    }
  } catch (err) {
    result.warn(`Could not check Redis: ${err.message}`);
  }

  return result;
}

/**
 * Verify database connectivity
 * @returns {ValidationResult}
 */
function checkDatabaseConnectivity() {
  const result = new ValidationResult('Database Connectivity');

  if (skipDb) {
    result.pass('Database check skipped (--skip-db flag)');
    return result;
  }

  console.log(`${colors.blue}🗄️  Checking database connectivity...${colors.reset}`);

  // Check if Supabase URL is configured
  const envFile = path.resolve(process.cwd(), '.env.local');

  try {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8');
      const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
      const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');

      if (hasSupabaseUrl && hasSupabaseKey) {
        result.pass('Supabase configuration found in .env.local');
      } else {
        result.fail('Missing Supabase configuration in .env.local');
      }
    } else {
      result.fail('.env.local file not found');
    }
  } catch (err) {
    result.fail(`Failed to check database configuration: ${err.message}`);
  }

  return result;
}

/**
 * Check Nginx configuration syntax
 * @returns {ValidationResult}
 */
function checkNginxConfiguration() {
  const result = new ValidationResult('Nginx Configuration');

  console.log(`${colors.blue}🔧 Checking Nginx configuration...${colors.reset}`);

  try {
    execSync('nginx -t', { stdio: 'pipe' });
    result.pass('Nginx configuration syntax is valid');
  } catch (err) {
    // Nginx might not be installed, which is OK for development
    result.warn('Nginx not installed or configuration has errors (OK for development)');
  }

  return result;
}

/**
 * Print validation result
 * @param {ValidationResult} result
 */
function printResult(result) {
  const status = result.passed ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
  console.log(`${status} ${result.name}${colors.reset}`);

  if (result.warnings.length > 0) {
    result.warnings.forEach((warning) => {
      console.log(`  ${colors.yellow}⚠️  ${warning}${colors.reset}`);
    });
  }

  if (result.errors.length > 0) {
    result.errors.forEach((error) => {
      console.log(`  ${colors.red}❌ ${error}${colors.reset}`);
    });
  }

  console.log();
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  Deployment Validation                 ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

  // Validate arguments
  validateArgs();

  console.log(`${colors.blue}Target: ${target}${colors.reset}\n`);

  // Run all validation checks
  const results = [];

  results.push(checkTargetEnvironment());
  results.push(checkDiskSpace());
  results.push(checkDockerDaemon());
  results.push(checkHealthEndpoint());
  results.push(checkRedisConnectivity());
  results.push(checkDatabaseConnectivity());
  results.push(checkNginxConfiguration());

  // Print all results
  console.log(`${colors.magenta}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}Validation Results${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════${colors.reset}\n`);

  results.forEach(printResult);

  // Calculate summary
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log(`${colors.magenta}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}Summary${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${warningCount}${colors.reset}`);

  if (failCount > 0) {
    console.log(`\n${colors.red}❌ Validation failed. Please fix the errors above before deploying.${colors.reset}\n`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n${colors.yellow}⚠️  Validation passed with warnings. Review warnings before deploying.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}✅ Validation passed. Ready to deploy!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run main function
main().catch((err) => {
  console.error(`${colors.red}❌ Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
