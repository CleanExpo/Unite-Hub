#!/usr/bin/env node

/**
 * Blue-Green Deployment Orchestrator
 *
 * Orchestrates zero-downtime blue-green deployments:
 * 1. Detects current active deployment
 * 2. Builds Docker image with version tag
 * 3. Deploys to standby environment
 * 4. Runs health checks with exponential backoff
 * 5. Switches traffic via Nginx
 * 6. Monitors post-switch for 2 minutes
 *
 * Usage:
 *   node blue-green-deploy.mjs --version 1.2.3 --env production
 *   node blue-green-deploy.mjs --version 1.2.3 --target green
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const version = getArg('--version', null);
const environment = getArg('--env', 'production');
const targetOverride = getArg('--target', null);

// Configuration
const STATE_FILE = '.deployment-state.json';
const DOCKER_IMAGE = 'unite-hub';
const HEALTH_CHECK_MAX_WAIT = 3 * 60 * 1000; // 3 minutes in ms
const POST_SWITCH_MONITOR_DURATION = 2 * 60 * 1000; // 2 minutes in ms

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
 * Validate command-line arguments
 */
function validateArgs() {
  if (!version) {
    console.error(`${colors.red}❌ Error: Version is required. Use --version 1.2.3${colors.reset}`);
    process.exit(1);
  }

  if (targetOverride && targetOverride !== 'blue' && targetOverride !== 'green') {
    console.error(`${colors.red}❌ Error: Invalid target. Use --target blue or --target green${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Read deployment state from file
 * @returns {{active: string, standby: string, lastSwitch: string, version: string}}
 */
function readDeploymentState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      const defaultState = {
        active: 'blue',
        standby: 'green',
        lastSwitch: new Date().toISOString(),
        version: '0.0.0',
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2));
      return defaultState;
    }

    const content = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`${colors.red}❌ Error reading state file: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Update deployment state version
 * @param {string} newVersion - New version string
 */
function updateDeploymentVersion(newVersion) {
  try {
    const state = readDeploymentState();
    state.version = newVersion;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error(`${colors.red}❌ Error updating version: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Build Docker image with version tag
 * @param {string} versionTag - Version tag for Docker image
 */
function buildDockerImage(versionTag) {
  console.log(`${colors.blue}🐳 Building Docker image...${colors.reset}`);
  console.log(`${colors.blue}Image: ${DOCKER_IMAGE}:${versionTag}${colors.reset}\n`);

  try {
    // Build image with version tag and latest tag
    execSync(
      `docker build -t ${DOCKER_IMAGE}:${versionTag} -t ${DOCKER_IMAGE}:latest .`,
      { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') }
    );
    console.log(`${colors.green}✅ Docker image built successfully${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}❌ Docker build failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Stop Docker container
 * @param {string} containerName - Container name
 */
function stopContainer(containerName) {
  try {
    console.log(`${colors.blue}🛑 Stopping container: ${containerName}${colors.reset}`);
    execSync(`docker stop ${containerName}`, { stdio: 'inherit' });
    execSync(`docker rm ${containerName}`, { stdio: 'inherit' });
    console.log(`${colors.green}✅ Container stopped${colors.reset}\n`);
  } catch (err) {
    // Container might not exist, which is fine
    console.log(`${colors.yellow}⚠️  Container not running or doesn't exist${colors.reset}\n`);
  }
}

/**
 * Deploy to target environment
 * @param {string} targetEnv - Target environment (blue/green)
 * @param {string} versionTag - Version tag for Docker image
 */
function deployToEnvironment(targetEnv, versionTag) {
  console.log(`${colors.blue}🚀 Deploying to ${targetEnv} environment...${colors.reset}\n`);

  const containerName = `unite-hub-${targetEnv}`;
  const port = targetEnv === 'blue' ? 3008 : 3009;

  // Stop existing container
  stopContainer(containerName);

  // Start new container
  try {
    console.log(`${colors.blue}▶️  Starting container: ${containerName}${colors.reset}`);
    console.log(`${colors.blue}Port: ${port}${colors.reset}`);
    console.log(`${colors.blue}Image: ${DOCKER_IMAGE}:${versionTag}${colors.reset}\n`);

    const envFile = path.resolve(__dirname, '../../.env.local');
    const envFlag = fs.existsSync(envFile) ? `--env-file ${envFile}` : '';

    execSync(
      `docker run -d --name ${containerName} -p ${port}:3008 ${envFlag} ${DOCKER_IMAGE}:${versionTag}`,
      { stdio: 'inherit' }
    );

    console.log(`${colors.green}✅ Container started successfully${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}❌ Container start failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Wait for health checks with exponential backoff
 * @param {string} targetEnv - Target environment (blue/green)
 * @returns {Promise<boolean>} Success status
 */
async function waitForHealthChecks(targetEnv) {
  console.log(`${colors.blue}🏥 Waiting for health checks...${colors.reset}`);
  console.log(`${colors.blue}Max wait time: ${HEALTH_CHECK_MAX_WAIT / 1000}s${colors.reset}\n`);

  const port = targetEnv === 'blue' ? 3008 : 3009;
  const healthCheckScript = path.resolve(__dirname, 'health-check.mjs');

  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < HEALTH_CHECK_MAX_WAIT) {
    attempt++;
    console.log(`${colors.blue}Health check attempt ${attempt}...${colors.reset}`);

    try {
      execSync(`node ${healthCheckScript} --url http://localhost:${port} --timeout 10 --retries 1`, {
        stdio: 'inherit',
      });
      console.log(`${colors.green}✅ Health checks passed!${colors.reset}\n`);
      return true;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = HEALTH_CHECK_MAX_WAIT - elapsed;

      if (remaining <= 0) {
        console.error(`${colors.red}❌ Health checks failed: Timeout after ${HEALTH_CHECK_MAX_WAIT / 1000}s${colors.reset}\n`);
        return false;
      }

      // Exponential backoff: 5s, 10s, 20s, 40s
      const backoff = Math.min(5000 * Math.pow(2, attempt - 1), 40000);
      const waitTime = Math.min(backoff, remaining);

      console.log(`${colors.yellow}⚠️  Health check failed. Retrying in ${waitTime / 1000}s...${colors.reset}\n`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return false;
}

/**
 * Switch traffic to target environment
 * @param {string} targetEnv - Target environment (blue/green)
 */
function switchTraffic(targetEnv) {
  console.log(`${colors.blue}🔀 Switching traffic to ${targetEnv}...${colors.reset}\n`);

  const switchScript = path.resolve(__dirname, 'switch-traffic.mjs');

  try {
    execSync(`node ${switchScript} --target ${targetEnv}`, { stdio: 'inherit' });
    console.log(`${colors.green}✅ Traffic switched successfully${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}❌ Traffic switch failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Monitor deployment post-switch
 * @param {string} targetEnv - Target environment (blue/green)
 * @returns {Promise<boolean>} Success status
 */
async function monitorPostSwitch(targetEnv) {
  console.log(`${colors.blue}📊 Monitoring post-switch for ${POST_SWITCH_MONITOR_DURATION / 1000}s...${colors.reset}\n`);

  const monitorScript = path.resolve(__dirname, 'monitor-deployment.mjs');
  const port = targetEnv === 'blue' ? 3008 : 3009;

  try {
    execSync(
      `node ${monitorScript} --url http://localhost:${port} --duration ${POST_SWITCH_MONITOR_DURATION / 1000}`,
      { stdio: 'inherit' }
    );
    console.log(`${colors.green}✅ Monitoring completed successfully${colors.reset}\n`);
    return true;
  } catch (err) {
    console.error(`${colors.red}❌ Monitoring detected issues: ${err.message}${colors.reset}\n`);
    return false;
  }
}

/**
 * Log deployment details
 * @param {Object} details - Deployment details
 */
function logDeploymentDetails(details) {
  const logFile = 'deployment.log';
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${JSON.stringify(details)}\n`;

  try {
    fs.appendFileSync(logFile, logEntry);
    console.log(`${colors.blue}📝 Deployment logged to ${logFile}${colors.reset}`);
  } catch (err) {
    console.error(`${colors.yellow}⚠️  Failed to write log: ${err.message}${colors.reset}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  Blue-Green Deployment Orchestrator    ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

  // Validate arguments
  validateArgs();

  console.log(`${colors.blue}Version: ${version}${colors.reset}`);
  console.log(`${colors.blue}Environment: ${environment}${colors.reset}\n`);

  // Detect current deployment state
  console.log(`${colors.blue}📖 Reading deployment state...${colors.reset}`);
  const state = readDeploymentState();

  const currentActive = state.active;
  const targetEnv = targetOverride || state.standby;

  console.log(`${colors.blue}Current active: ${currentActive}${colors.reset}`);
  console.log(`${colors.blue}Current version: ${state.version}${colors.reset}`);
  console.log(`${colors.blue}Target deployment: ${targetEnv}${colors.reset}\n`);

  // Build Docker image
  buildDockerImage(version);

  // Deploy to standby environment
  deployToEnvironment(targetEnv, version);

  // Wait for health checks
  const healthPassed = await waitForHealthChecks(targetEnv);
  if (!healthPassed) {
    console.error(`${colors.red}❌ Deployment failed: Health checks did not pass${colors.reset}`);
    logDeploymentDetails({
      version,
      environment,
      target: targetEnv,
      status: 'failed',
      reason: 'Health checks failed',
      duration: (Date.now() - startTime) / 1000,
    });
    process.exit(1);
  }

  // Switch traffic
  switchTraffic(targetEnv);

  // Update version in state
  updateDeploymentVersion(version);

  // Monitor post-switch
  const monitorPassed = await monitorPostSwitch(targetEnv);

  const duration = (Date.now() - startTime) / 1000;

  console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  Deployment Summary                    ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}`);
  console.log(`Status: ${monitorPassed ? colors.green + '✅ SUCCESS' : colors.yellow + '⚠️  WARNING'}${colors.reset}`);
  console.log(`Version: ${version}`);
  console.log(`Environment: ${environment}`);
  console.log(`Previous active: ${currentActive}`);
  console.log(`New active: ${targetEnv}`);
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`${colors.magenta}════════════════════════════════════════${colors.reset}\n`);

  // Log deployment details
  logDeploymentDetails({
    version,
    environment,
    previousActive: currentActive,
    newActive: targetEnv,
    status: monitorPassed ? 'success' : 'warning',
    duration,
  });

  process.exit(monitorPassed ? 0 : 1);
}

// Run main function
main().catch((err) => {
  console.error(`${colors.red}❌ Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
