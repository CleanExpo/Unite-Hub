#!/usr/bin/env node

/**
 * Outlook Integration Verification Script
 *
 * Verifies that all Outlook integration files are in place and properly configured.
 * Run this script to check if the Outlook integration is ready for testing.
 *
 * Usage:
 *   node scripts/verify-outlook-integration.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const { green, red, yellow, blue, cyan, reset } = colors;

console.log(`${cyan}╔════════════════════════════════════════════════════════════════╗${reset}`);
console.log(`${cyan}║                                                                ║${reset}`);
console.log(`${cyan}║         Outlook Integration Verification Script               ║${reset}`);
console.log(`${cyan}║                                                                ║${reset}`);
console.log(`${cyan}╚════════════════════════════════════════════════════════════════╝${reset}\n`);

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

// Helper functions
function checkFile(filePath, description) {
  totalChecks++;
  const fullPath = path.join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    console.log(`${green}✓${reset} ${description}: ${filePath}`);
    passedChecks++;
    return true;
  } else {
    console.log(`${red}✗${reset} ${description}: ${filePath}`);
    failedChecks++;
    return false;
  }
}

function checkEnvVar(varName, description, required = true) {
  totalChecks++;

  // Read .env.local file
  const envPath = path.join(projectRoot, '.env.local');
  if (!fs.existsSync(envPath)) {
    if (required) {
      console.log(`${red}✗${reset} ${description}: .env.local not found`);
      failedChecks++;
    } else {
      console.log(`${yellow}⚠${reset} ${description}: .env.local not found (optional)`);
      warnings++;
    }
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasVar = envContent.includes(varName);
  const hasValue = new RegExp(`${varName}=.+`).test(envContent);

  if (hasValue) {
    console.log(`${green}✓${reset} ${description}: ${varName} is set`);
    passedChecks++;
    return true;
  } else if (hasVar) {
    console.log(`${yellow}⚠${reset} ${description}: ${varName} exists but is empty`);
    warnings++;
    return false;
  } else {
    if (required) {
      console.log(`${red}✗${reset} ${description}: ${varName} not found`);
      failedChecks++;
    } else {
      console.log(`${yellow}⚠${reset} ${description}: ${varName} not set (optional)`);
      warnings++;
    }
    return false;
  }
}

function checkDependency(packageName, description) {
  totalChecks++;
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  const inDeps = packageJson.dependencies?.[packageName];
  const inDevDeps = packageJson.devDependencies?.[packageName];

  if (inDeps || inDevDeps) {
    const version = inDeps || inDevDeps;
    console.log(`${green}✓${reset} ${description}: ${packageName}@${version}`);
    passedChecks++;
    return true;
  } else {
    console.log(`${red}✗${reset} ${description}: ${packageName} not found`);
    failedChecks++;
    return false;
  }
}

function section(title) {
  console.log(`\n${blue}▶${reset} ${title}`);
  console.log('─'.repeat(60));
}

// Run checks
section('Core Integration Files');
checkFile('src/lib/integrations/outlook.ts', 'Outlook integration library');
checkFile('src/lib/services/outlook-sync.ts', 'Multi-account service layer');

section('API Route Files');
checkFile('src/app/api/integrations/outlook/connect/route.ts', 'Connect endpoint');
checkFile('src/app/api/integrations/outlook/callback/route.ts', 'Callback endpoint');
checkFile('src/app/api/integrations/outlook/sync/route.ts', 'Sync endpoint');
checkFile('src/app/api/integrations/outlook/send/route.ts', 'Send endpoint');
checkFile('src/app/api/integrations/outlook/disconnect/route.ts', 'Disconnect endpoint');
checkFile('src/app/api/integrations/outlook/accounts/route.ts', 'Accounts endpoint');
checkFile('src/app/api/integrations/outlook/calendar/events/route.ts', 'Calendar events endpoint');
checkFile('src/app/api/integrations/outlook/calendar/create/route.ts', 'Calendar create endpoint');

section('Documentation Files');
checkFile('docs/OUTLOOK_SETUP_GUIDE.md', 'Setup guide');
checkFile('docs/OUTLOOK_API_REFERENCE.md', 'API reference');
checkFile('docs/OUTLOOK_QUICKSTART.md', 'Quick start guide');
checkFile('OUTLOOK_INTEGRATION_SUMMARY.md', 'Implementation summary');
checkFile('OUTLOOK_FILE_TREE.md', 'File tree documentation');

section('Dependencies');
checkDependency('@microsoft/microsoft-graph-client', 'Microsoft Graph Client SDK');
checkDependency('@microsoft/microsoft-graph-types', 'Microsoft Graph TypeScript types');

section('Environment Configuration');
checkEnvVar('MICROSOFT_CLIENT_ID', 'Microsoft Client ID', false);
checkEnvVar('MICROSOFT_CLIENT_SECRET', 'Microsoft Client Secret', false);
checkEnvVar('NEXT_PUBLIC_URL', 'Next.js public URL', true);

// Summary
console.log(`\n${cyan}╔════════════════════════════════════════════════════════════════╗${reset}`);
console.log(`${cyan}║                        SUMMARY                                 ║${reset}`);
console.log(`${cyan}╚════════════════════════════════════════════════════════════════╝${reset}\n`);

console.log(`Total checks: ${totalChecks}`);
console.log(`${green}Passed: ${passedChecks}${reset}`);
console.log(`${red}Failed: ${failedChecks}${reset}`);
console.log(`${yellow}Warnings: ${warnings}${reset}\n`);

// Detailed feedback
if (failedChecks === 0 && warnings === 0) {
  console.log(`${green}✓ All checks passed! Outlook integration is fully set up.${reset}\n`);
  console.log(`${cyan}Next steps:${reset}`);
  console.log(`  1. Register Azure AD application (see docs/OUTLOOK_SETUP_GUIDE.md)`);
  console.log(`  2. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to .env.local`);
  console.log(`  3. Restart your development server`);
  console.log(`  4. Test the OAuth flow\n`);
  process.exit(0);
} else if (failedChecks === 0) {
  console.log(`${yellow}⚠ All required files present, but some warnings detected.${reset}\n`);
  console.log(`${cyan}Action required:${reset}`);
  console.log(`  - Review warnings above`);
  console.log(`  - Add missing environment variables to .env.local`);
  console.log(`  - See docs/OUTLOOK_SETUP_GUIDE.md for configuration details\n`);
  process.exit(0);
} else {
  console.log(`${red}✗ Some checks failed. Please fix the issues above.${reset}\n`);
  console.log(`${cyan}Troubleshooting:${reset}`);
  console.log(`  - Ensure all files were created correctly`);
  console.log(`  - Run: npm install @microsoft/microsoft-graph-client @microsoft/microsoft-graph-types`);
  console.log(`  - Check file paths and naming`);
  console.log(`  - See OUTLOOK_FILE_TREE.md for complete file structure\n`);
  process.exit(1);
}
