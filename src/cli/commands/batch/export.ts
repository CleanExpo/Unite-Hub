/**
 * synthex batch export Commands
 *
 * Export tenant data to CSV/JSON
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { BatchOperationsService } from '../../services/advanced/batch-operations.js';
import { ConfigManager } from '../../utils/config-manager.js';

export function createExportCommand(): Command {
  const command = new Command('export');

  command.description('Export tenant data');

  // synthex batch export csv --output <file>
  command
    .command('csv')
    .description('Export tenants to CSV file')
    .option('--output <file>', 'Output CSV file path (required)')
    .action(async (options) => {
      try {
        await runExportCSV(options);
      } catch (error) {
        await logger.error('Failed to export tenants to CSV');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex batch export json --output <file> [--pretty]
  command
    .command('json')
    .description('Export tenants to JSON file')
    .option('--output <file>', 'Output JSON file path (required)')
    .option('--pretty', 'Pretty-print JSON (default: true)')
    .action(async (options) => {
      try {
        await runExportJSON(options);
      } catch (error) {
        await logger.error('Failed to export tenants to JSON');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runExportCSV(options: { output?: string }): Promise<void> {
  if (!options.output) {
    await logger.error('--output is required');
    await logger.example('synthex batch export csv --output tenants.csv');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Export Tenants to CSV');

  const spinner = await logger.spinner('Fetching tenants...');

  try {
    const service = new BatchOperationsService();
    const count = await service.exportTenantsToCSV(options.output);

    spinner.succeed(`Exported ${count} tenant(s)`);

    await logger.divider();
    await logger.info(`Output file: ${options.output}`);
  } catch (error) {
    spinner.fail('Export failed');
    throw error;
  }
}

async function runExportJSON(options: {
  output?: string;
  pretty?: boolean;
}): Promise<void> {
  if (!options.output) {
    await logger.error('--output is required');
    await logger.example('synthex batch export json --output tenants.json');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Export Tenants to JSON');

  const spinner = await logger.spinner('Fetching tenants...');

  try {
    const service = new BatchOperationsService();
    const count = await service.exportTenantsToJSON(
      options.output,
      options.pretty !== false
    );

    spinner.succeed(`Exported ${count} tenant(s)`);

    await logger.divider();
    await logger.info(`Output file: ${options.output}`);
  } catch (error) {
    spinner.fail('Export failed');
    throw error;
  }
}
