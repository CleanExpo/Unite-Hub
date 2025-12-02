#!/usr/bin/env node

/**
 * Update Key Rotation Log - Unite-Hub
 *
 * Records key rotation in key-rotation-log.json
 *
 * Usage:
 *   node scripts/update-key-rotation.mjs <KEY_NAME>
 *   node scripts/update-key-rotation.mjs <KEY_NAME> --reason emergency
 *   node scripts/update-key-rotation.mjs <KEY_NAME> --notes "Rotated due to suspected compromise"
 *
 * Examples:
 *   node scripts/update-key-rotation.mjs ANTHROPIC_API_KEY
 *   node scripts/update-key-rotation.mjs STRIPE_SECRET_KEY --reason emergency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE_PATH = path.join(__dirname, '..', 'key-rotation-log.json');

// Color codes
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`${COLORS.red}Error: Key name required${COLORS.reset}`);
    console.log(`\nUsage: node scripts/update-key-rotation.mjs <KEY_NAME> [options]`);
    console.log(`\nOptions:`);
    console.log(`  --reason <reason>    Rotation reason (scheduled|emergency|policy|other)`);
    console.log(`  --notes "<notes>"    Additional notes about the rotation`);
    console.log(`  --rotated-by <email> Email of person who rotated (default: reads from git config)`);
    process.exit(1);
  }

  const keyName = args[0];
  const options = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--reason' && args[i + 1]) {
      options.reason = args[i + 1];
      i++;
    } else if (args[i] === '--notes' && args[i + 1]) {
      options.notes = args[i + 1];
      i++;
    } else if (args[i] === '--rotated-by' && args[i + 1]) {
      options.rotatedBy = args[i + 1];
      i++;
    }
  }

  return { keyName, options };
}

/**
 * Load rotation log
 */
function loadRotationLog() {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      console.error(`${COLORS.red}Error: Key rotation log not found at ${LOG_FILE_PATH}${COLORS.reset}`);
      process.exit(1);
    }

    const logData = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    return JSON.parse(logData);
  } catch (error) {
    console.error(`${COLORS.red}Error loading rotation log: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

/**
 * Save rotation log
 */
function saveRotationLog(log) {
  try {
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(log, null, 2) + '\n', 'utf-8');
    console.log(`${COLORS.green}✅ Rotation log updated successfully${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}Error saving rotation log: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

/**
 * Get git user email
 */
function getGitUserEmail() {
  try {
    const { execSync } = require('child_process');
    const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
    return email || 'unknown@unite-hub.com';
  } catch (error) {
    return 'unknown@unite-hub.com';
  }
}

/**
 * Calculate next rotation date
 */
function calculateNextRotation(lastRotated, frequencyDays) {
  const date = new Date(lastRotated);
  date.setDate(date.getDate() + frequencyDays);
  return date.toISOString().split('T')[0];
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  const { keyName, options } = parseArgs();

  console.log(`\n${COLORS.bold}${COLORS.blue}═══════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.bold}  Key Rotation Log Update${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}═══════════════════════════════════════════════════════${COLORS.reset}\n`);

  // Load rotation log
  const rotationLog = loadRotationLog();

  // Check if key exists
  if (!rotationLog.keys[keyName]) {
    console.error(`${COLORS.red}Error: Key "${keyName}" not found in rotation log${COLORS.reset}`);
    console.log(`\nAvailable keys:`);
    for (const key of Object.keys(rotationLog.keys)) {
      console.log(`  - ${key}`);
    }
    process.exit(1);
  }

  const keyData = rotationLog.keys[keyName];

  // Display current key info
  console.log(`${COLORS.bold}Key:${COLORS.reset} ${keyName}`);
  console.log(`${COLORS.bold}Provider:${COLORS.reset} ${keyData.provider}`);
  console.log(`${COLORS.bold}Risk Level:${COLORS.reset} ${keyData.riskLevel}`);
  console.log(`${COLORS.bold}Current Last Rotated:${COLORS.reset} ${keyData.lastRotated}`);
  console.log(`${COLORS.bold}Current Next Rotation:${COLORS.reset} ${keyData.nextRotation}`);
  console.log(`${COLORS.bold}Rotation Frequency:${COLORS.reset} ${keyData.rotationFrequencyDays} days`);
  console.log('');

  // Get rotation details
  const today = new Date().toISOString().split('T')[0];
  const rotatedBy = options.rotatedBy || getGitUserEmail();
  const reason = options.reason || 'scheduled';
  const notes = options.notes || '';

  // Calculate next rotation date
  const nextRotation = calculateNextRotation(today, keyData.rotationFrequencyDays);

  // Display new values
  console.log(`${COLORS.bold}${COLORS.green}New values:${COLORS.reset}`);
  console.log(`${COLORS.bold}Last Rotated:${COLORS.reset} ${today}`);
  console.log(`${COLORS.bold}Next Rotation:${COLORS.reset} ${nextRotation}`);
  console.log(`${COLORS.bold}Rotated By:${COLORS.reset} ${rotatedBy}`);
  console.log(`${COLORS.bold}Reason:${COLORS.reset} ${reason}`);
  if (notes) {
    console.log(`${COLORS.bold}Notes:${COLORS.reset} ${notes}`);
  }
  console.log('');

  // Confirm update
  const confirmed = await promptConfirmation(`${COLORS.yellow}Update rotation log with these values?${COLORS.reset}`);

  if (!confirmed) {
    console.log(`${COLORS.yellow}❌ Update cancelled${COLORS.reset}`);
    process.exit(0);
  }

  // Update rotation log
  keyData.lastRotated = today;
  keyData.nextRotation = nextRotation;

  // Add to rotation history
  if (!keyData.rotationHistory) {
    keyData.rotationHistory = [];
  }

  keyData.rotationHistory.unshift({
    date: today,
    rotatedBy,
    reason,
    notes,
  });

  // Keep only last 10 rotation history entries
  if (keyData.rotationHistory.length > 10) {
    keyData.rotationHistory = keyData.rotationHistory.slice(0, 10);
  }

  // Update lastUpdated timestamp
  rotationLog.lastUpdated = new Date().toISOString();

  // Save log
  saveRotationLog(rotationLog);

  // Display success message
  console.log('');
  console.log(`${COLORS.green}${COLORS.bold}✅ Key rotation recorded successfully${COLORS.reset}`);
  console.log('');
  console.log(`${COLORS.bold}Next steps:${COLORS.reset}`);
  console.log(`  1. Verify the new key is working in production`);
  console.log(`  2. Monitor for API errors over the next 24 hours`);
  console.log(`  3. Deactivate the old key at the provider after 24h grace period`);
  console.log('');
  console.log(`${COLORS.blue}See docs/SECURITY_KEY_ROTATION.md for detailed procedures${COLORS.reset}`);
  console.log('');
}

// Run main function
main().catch((error) => {
  console.error(`${COLORS.red}Fatal error: ${error.message}${COLORS.reset}`);
  process.exit(1);
});
