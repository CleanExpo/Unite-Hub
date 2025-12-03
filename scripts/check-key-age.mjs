#!/usr/bin/env node

/**
 * Key Age Checker - Unite-Hub
 *
 * Monitors API key rotation status and alerts on:
 * - Keys approaching rotation deadline (80% of rotation period)
 * - Keys past rotation deadline (100%+)
 * - Missing rotation history
 * - Keys never rotated
 *
 * Usage:
 *   node scripts/check-key-age.mjs
 *   node scripts/check-key-age.mjs --json
 *   node scripts/check-key-age.mjs --slack
 *
 * Exit codes:
 *   0 - All keys within rotation policy
 *   1 - One or more keys need attention
 *   2 - Critical: One or more keys overdue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOG_FILE_PATH = path.join(__dirname, '..', 'key-rotation-log.json');
const WARNING_THRESHOLD = 0.8; // Warn at 80% of rotation period
const CRITICAL_THRESHOLD = 1.0; // Critical at 100% (overdue)

// Color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// Risk level styling
const RISK_STYLES = {
  CRITICAL: `${COLORS.red}${COLORS.bold}`,
  HIGH: `${COLORS.red}`,
  MEDIUM: `${COLORS.yellow}`,
  LOW: `${COLORS.green}`,
};

/**
 * Load key rotation log from file
 */
function loadRotationLog() {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      console.error(`${COLORS.red}Error: Key rotation log not found at ${LOG_FILE_PATH}${COLORS.reset}`);
      console.error(`${COLORS.gray}Create the file using: npm run init-key-log${COLORS.reset}`);
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
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  return Math.round((date2 - date1) / oneDay);
}

/**
 * Calculate key status
 */
function analyzeKeyStatus(keyName, keyData) {
  const now = new Date();
  const lastRotated = new Date(keyData.lastRotated);
  const nextRotation = new Date(keyData.nextRotation);
  const rotationFrequency = keyData.rotationFrequencyDays;

  const daysSinceRotation = daysBetween(lastRotated, now);
  const daysUntilRotation = daysBetween(now, nextRotation);
  const rotationProgress = daysSinceRotation / rotationFrequency;

  // Determine status
  let status = 'OK';
  let severity = 'info';
  let message = 'Within rotation policy';

  if (rotationProgress >= CRITICAL_THRESHOLD) {
    status = 'OVERDUE';
    severity = 'critical';
    message = `🚨 OVERDUE by ${Math.abs(daysUntilRotation)} days - ROTATE IMMEDIATELY`;
  } else if (rotationProgress >= WARNING_THRESHOLD) {
    status = 'WARNING';
    severity = 'warning';
    message = `⚠️  Approaching rotation deadline (${daysUntilRotation} days remaining)`;
  } else {
    message = `✅ OK (${daysUntilRotation} days until rotation)`;
  }

  // Check if never rotated
  if (!keyData.rotationHistory || keyData.rotationHistory.length === 0) {
    status = 'NEVER_ROTATED';
    severity = 'warning';
    message = '⚠️  Never rotated - schedule initial rotation';
  }

  return {
    keyName,
    status,
    severity,
    message,
    riskLevel: keyData.riskLevel,
    daysSinceRotation,
    daysUntilRotation,
    rotationProgress: Math.round(rotationProgress * 100),
    lastRotated: keyData.lastRotated,
    nextRotation: keyData.nextRotation,
    rotationFrequency,
    rotationCount: keyData.rotationHistory?.length || 0,
  };
}

/**
 * Format output as table
 */
function printTable(results) {
  console.log(`\n${COLORS.bold}${COLORS.blue}═══════════════════════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}  API Key Rotation Status Report${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}═══════════════════════════════════════════════════════════════════════════════════${COLORS.reset}\n`);

  // Summary statistics
  const total = results.length;
  const ok = results.filter(r => r.status === 'OK').length;
  const warning = results.filter(r => r.status === 'WARNING').length;
  const overdue = results.filter(r => r.status === 'OVERDUE').length;
  const neverRotated = results.filter(r => r.status === 'NEVER_ROTATED').length;

  console.log(`${COLORS.bold}Summary:${COLORS.reset}`);
  console.log(`  Total Keys:      ${total}`);
  console.log(`  ${COLORS.green}✅ OK:${COLORS.reset}            ${ok}`);
  console.log(`  ${COLORS.yellow}⚠️  Warning:${COLORS.reset}      ${warning}`);
  console.log(`  ${COLORS.red}🚨 Overdue:${COLORS.reset}       ${overdue}`);
  console.log(`  ${COLORS.yellow}⚠️  Never Rotated:${COLORS.reset} ${neverRotated}`);
  console.log('');

  // Sort by severity: overdue → warning → never rotated → ok
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sortedResults = results.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.daysUntilRotation - b.daysUntilRotation;
  });

  // Print detailed status for each key
  console.log(`${COLORS.bold}Key Details:${COLORS.reset}\n`);

  for (const result of sortedResults) {
    const riskColor = RISK_STYLES[result.riskLevel] || COLORS.reset;
    const progressBar = createProgressBar(result.rotationProgress);

    console.log(`${COLORS.bold}${result.keyName}${COLORS.reset}`);
    console.log(`  Risk Level:      ${riskColor}${result.riskLevel}${COLORS.reset}`);
    console.log(`  Status:          ${result.message}`);
    console.log(`  Progress:        ${progressBar} ${result.rotationProgress}%`);
    console.log(`  Last Rotated:    ${result.lastRotated} (${result.daysSinceRotation} days ago)`);
    console.log(`  Next Rotation:   ${result.nextRotation} (${result.daysUntilRotation} days)`);
    console.log(`  Rotation Count:  ${result.rotationCount} times`);
    console.log(`  Frequency:       Every ${result.rotationFrequency} days`);
    console.log('');
  }

  console.log(`${COLORS.bold}${COLORS.blue}═══════════════════════════════════════════════════════════════════════════════════${COLORS.reset}\n`);
}

/**
 * Create visual progress bar
 */
function createProgressBar(percentage) {
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;

  let color = COLORS.green;
  if (percentage >= 100) color = COLORS.red;
  else if (percentage >= 80) color = COLORS.yellow;

  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);

  return `${color}${filled}${COLORS.gray}${empty}${COLORS.reset}`;
}

/**
 * Generate Slack message format
 */
function generateSlackMessage(results) {
  const overdue = results.filter(r => r.status === 'OVERDUE');
  const warning = results.filter(r => r.status === 'WARNING');
  const neverRotated = results.filter(r => r.status === 'NEVER_ROTATED');

  if (overdue.length === 0 && warning.length === 0 && neverRotated.length === 0) {
    return {
      text: '✅ All API keys are within rotation policy',
      color: 'good',
    };
  }

  let message = '*API Key Rotation Alert*\n\n';

  if (overdue.length > 0) {
    message += '*🚨 OVERDUE (Rotate Immediately):*\n';
    for (const key of overdue) {
      message += `• \`${key.keyName}\` - ${Math.abs(key.daysUntilRotation)} days overdue (Risk: ${key.riskLevel})\n`;
    }
    message += '\n';
  }

  if (warning.length > 0) {
    message += '*⚠️  Warning (Rotate Soon):*\n';
    for (const key of warning) {
      message += `• \`${key.keyName}\` - ${key.daysUntilRotation} days until rotation (Risk: ${key.riskLevel})\n`;
    }
    message += '\n';
  }

  if (neverRotated.length > 0) {
    message += '*⚠️  Never Rotated:*\n';
    for (const key of neverRotated) {
      message += `• \`${key.keyName}\` - Schedule initial rotation (Risk: ${key.riskLevel})\n`;
    }
    message += '\n';
  }

  message += `\nSee \`docs/SECURITY_KEY_ROTATION.md\` for rotation procedures.`;

  return {
    text: message,
    color: overdue.length > 0 ? 'danger' : 'warning',
  };
}

/**
 * Send Slack notification
 * (Requires SLACK_WEBHOOK_URL environment variable)
 */
async function sendSlackNotification(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error(`${COLORS.yellow}Warning: SLACK_WEBHOOK_URL not set. Skipping Slack notification.${COLORS.reset}`);
    console.log('\nSlack message that would be sent:');
    console.log(JSON.stringify(message, null, 2));
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            fallback: message.text,
            color: message.color,
            text: message.text,
            mrkdwn_in: ['text'],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log(`${COLORS.green}✅ Slack notification sent successfully${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}Error sending Slack notification: ${error.message}${COLORS.reset}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const outputFormat = args[0]; // --json or --slack

  try {
    // Load rotation log
    const rotationLog = loadRotationLog();

    // Analyze each key
    const results = [];
    for (const [keyName, keyData] of Object.entries(rotationLog.keys)) {
      const analysis = analyzeKeyStatus(keyName, keyData);
      results.push(analysis);
    }

    // Output based on format
    if (outputFormat === '--json') {
      console.log(JSON.stringify(results, null, 2));
    } else if (outputFormat === '--slack') {
      const slackMessage = generateSlackMessage(results);
      await sendSlackNotification(slackMessage);
    } else {
      // Default: Pretty table output
      printTable(results);
    }

    // Determine exit code
    const hasOverdue = results.some(r => r.status === 'OVERDUE');
    const hasWarning = results.some(r => r.status === 'WARNING' || r.status === 'NEVER_ROTATED');

    if (hasOverdue) {
      console.error(`${COLORS.red}${COLORS.bold}❌ CRITICAL: One or more keys are overdue for rotation${COLORS.reset}\n`);
      process.exit(2);
    } else if (hasWarning) {
      console.warn(`${COLORS.yellow}${COLORS.bold}⚠️  WARNING: One or more keys need attention${COLORS.reset}\n`);
      process.exit(1);
    } else {
      console.log(`${COLORS.green}${COLORS.bold}✅ All keys are within rotation policy${COLORS.reset}\n`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${COLORS.red}Fatal error: ${error.message}${COLORS.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run main function
main();
