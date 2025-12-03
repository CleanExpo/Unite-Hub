#!/usr/bin/env node

/**
 * Initialize Key Rotation Log - Unite-Hub
 *
 * Creates a new key-rotation-log.json with all keys set to
 * "never rotated" status. Use this for initial setup or after
 * accidentally deleting the log file.
 *
 * Usage:
 *   node scripts/init-key-rotation-log.mjs
 *   node scripts/init-key-rotation-log.mjs --force (overwrite existing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE_PATH = path.join(__dirname, '..', 'key-rotation-log.json');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

/**
 * Default key rotation log template
 */
function createDefaultLog() {
  const today = new Date().toISOString().split('T')[0];

  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    description: 'API Key Rotation Tracking for Unite-Hub - DO NOT COMMIT ACTUAL KEYS',
    keys: {
      ANTHROPIC_API_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'HIGH',
        provider: 'Anthropic',
        rotationHistory: [],
      },
      OPENROUTER_API_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'HIGH',
        provider: 'OpenRouter',
        rotationHistory: [],
      },
      GEMINI_API_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'MEDIUM',
        provider: 'Google AI',
        rotationHistory: [],
      },
      OPENAI_API_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'MEDIUM',
        provider: 'OpenAI',
        rotationHistory: [],
      },
      STRIPE_SECRET_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'CRITICAL',
        provider: 'Stripe',
        rotationHistory: [],
      },
      STRIPE_WEBHOOK_SECRET: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'HIGH',
        provider: 'Stripe',
        rotationHistory: [],
      },
      RESEND_API_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'MEDIUM',
        provider: 'Resend',
        rotationHistory: [],
      },
      SENDGRID_API_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'MEDIUM',
        provider: 'SendGrid',
        rotationHistory: [],
      },
      PERPLEXITY_API_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'LOW',
        provider: 'Perplexity',
        rotationHistory: [],
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 30),
        rotationFrequencyDays: 30,
        riskLevel: 'CRITICAL',
        provider: 'Supabase',
        rotationHistory: [],
      },
      SUPABASE_ANON_KEY: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 180),
        rotationFrequencyDays: 180,
        riskLevel: 'MEDIUM',
        provider: 'Supabase',
        rotationHistory: [],
      },
      CRON_SECRET: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'HIGH',
        provider: 'Vercel',
        rotationHistory: [],
      },
      NEXTAUTH_SECRET: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 90),
        rotationFrequencyDays: 90,
        riskLevel: 'CRITICAL',
        provider: 'NextAuth',
        rotationHistory: [],
      },
      GOOGLE_CLIENT_SECRET: {
        lastRotated: today,
        nextRotation: calculateNextRotation(today, 180),
        rotationFrequencyDays: 180,
        riskLevel: 'HIGH',
        provider: 'Google Cloud',
        rotationHistory: [],
      },
    },
  };
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
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  console.log(`\n${COLORS.bold}${COLORS.blue}═══════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.bold}  Initialize Key Rotation Log${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}═══════════════════════════════════════════════════════${COLORS.reset}\n`);

  // Check if file already exists
  if (fs.existsSync(LOG_FILE_PATH) && !force) {
    console.log(`${COLORS.yellow}⚠️  Key rotation log already exists at:${COLORS.reset}`);
    console.log(`   ${LOG_FILE_PATH}\n`);

    const confirmed = await promptConfirmation(
      `${COLORS.yellow}Overwrite existing log? This will erase all rotation history${COLORS.reset}`
    );

    if (!confirmed) {
      console.log(`${COLORS.green}✅ Keeping existing log file${COLORS.reset}\n`);
      process.exit(0);
    }
  }

  // Create default log
  const defaultLog = createDefaultLog();

  // Save to file
  try {
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(defaultLog, null, 2) + '\n', 'utf-8');

    console.log(`${COLORS.green}${COLORS.bold}✅ Key rotation log created successfully${COLORS.reset}\n`);
    console.log(`${COLORS.bold}Location:${COLORS.reset} ${LOG_FILE_PATH}\n`);

    console.log(`${COLORS.bold}Initialized keys:${COLORS.reset}`);
    for (const [keyName, keyData] of Object.entries(defaultLog.keys)) {
      console.log(`  - ${keyName} (${keyData.riskLevel} risk, rotate every ${keyData.rotationFrequencyDays} days)`);
    }

    console.log('');
    console.log(`${COLORS.yellow}⚠️  IMPORTANT:${COLORS.reset}`);
    console.log(`  1. All keys are set to "never rotated" status`);
    console.log(`  2. Next rotation dates are calculated from today`);
    console.log(`  3. Update actual last rotation dates using:`);
    console.log(`     ${COLORS.blue}node scripts/update-key-rotation.mjs <KEY_NAME>${COLORS.reset}`);
    console.log('');
    console.log(`${COLORS.bold}Next steps:${COLORS.reset}`);
    console.log(`  1. Review the log file and update last rotation dates`);
    console.log(`  2. Run: ${COLORS.blue}node scripts/check-key-age.mjs${COLORS.reset}`);
    console.log(`  3. Schedule daily cron job for key age checks`);
    console.log(`  4. See: ${COLORS.blue}docs/SECURITY_KEY_ROTATION.md${COLORS.reset} for rotation procedures`);
    console.log('');
  } catch (error) {
    console.error(`${COLORS.red}Error creating log file: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error(`${COLORS.red}Fatal error: ${error.message}${COLORS.reset}`);
  process.exit(1);
});
