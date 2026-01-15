#!/usr/bin/env node

/**
 * Synthex CLI - Main Entry Point
 *
 * Command-line interface for Synthex Apex Architecture
 *
 * Commands:
 *   - synthex init --market "ANZ_SMB" --region "AU-SE1"
 *   - synthex auth login --service shopify --tenant-id "CLIENT_001"
 *   - synthex check business-id --country AU --id "12345678901"
 */

import { Command } from 'commander';
import { createInitCommand } from './commands/init.js';
import { createAuthCommand } from './commands/auth/index.js';
import { createCheckCommand } from './commands/check/index.js';
import { createShopifyCommand } from './commands/shopify/index.js';
import { createGoogleMerchantCommand } from './commands/google-merchant/index.js';
import { createTenantCommand } from './commands/tenant/index.js';
import { createBatchCommand } from './commands/batch/index.js';
import { createTemplatesCommand } from './commands/templates.js';
import { createAnalyticsCommand } from './commands/analytics.js';
import { createAlertsCommand } from './commands/alerts.js';
import { createHealthCommand } from './commands/health.js';
import { createScoutCommand } from './commands/scout.js';
import { createAuditCommand } from './commands/audit.js';
import { createExportCommand } from './commands/export.js';
import { createGhostCommand } from './commands/ghost.js';
import { createGroundCommand } from './commands/ground.js';
import { createUCPCommand } from './commands/ucp.js';
import { createTestCommand } from './commands/test-negotiate.js';
import { logger } from './utils/logger.js';

// Package info
const VERSION = '1.0.0';
const DESCRIPTION = 'Synthex CLI - Multi-tenant e-commerce operations for ANZ markets';

async function main() {
  const program = new Command();

  program
    .name('synthex')
    .description(DESCRIPTION)
    .version(VERSION, '-v, --version', 'Output the current version');

  // Add init command
  program.addCommand(createInitCommand());

  // Add auth command
  program.addCommand(createAuthCommand());

  // Add check command
  program.addCommand(createCheckCommand());

  // Add shopify command
  program.addCommand(createShopifyCommand());

  // Add google-merchant command
  program.addCommand(createGoogleMerchantCommand());

  // Add tenant command
  program.addCommand(createTenantCommand());

  // Add batch command
  program.addCommand(createBatchCommand());

  // Add templates command
  program.addCommand(createTemplatesCommand());

  // Add analytics command
  program.addCommand(createAnalyticsCommand());

  // Add alerts command
  program.addCommand(createAlertsCommand());

  // Add health command
  program.addCommand(createHealthCommand());

  // Add scout command
  program.addCommand(createScoutCommand());

  // Add audit command
  program.addCommand(createAuditCommand());

  // Add export command
  program.addCommand(createExportCommand());

  // Add ghost command
  program.addCommand(createGhostCommand());

  // Add ground command
  program.addCommand(createGroundCommand());

  // Add UCP command
  program.addCommand(createUCPCommand());

  // Add test command
  program.addCommand(createTestCommand());

  program
    .command('config')
    .description('Configuration management')
    .action(async () => {
      await logger.warn('Config commands coming soon!');
      await logger.example('synthex config get market');
      await logger.example('synthex config set settings.currency USD');
    });

  // Parse arguments
  program.parse(process.argv);

  // Show help if no command specified
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// Run CLI
main().catch(async (error) => {
  await logger.error('An unexpected error occurred');
  await logger.errorDetails(error);
  process.exit(1);
});
