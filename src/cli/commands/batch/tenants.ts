/**
 * synthex batch tenants Commands
 *
 * Bulk tenant operations
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { BatchOperationsService } from '../../services/advanced/batch-operations.js';
import { ConfigManager } from '../../utils/config-manager.js';
import type { UpdateTenantInput } from '../../services/tenant/tenant-manager.js';

export function createTenantsCommand(): Command {
  const command = new Command('tenants');

  command.description('Bulk tenant operations');

  // synthex batch tenants create --from-csv <file> [--dry-run]
  command
    .command('create')
    .description('Create multiple tenants from CSV or JSON file')
    .option('--from-csv <file>', 'CSV file path')
    .option('--from-json <file>', 'JSON file path')
    .option('--dry-run', 'Validate without creating (default: false)')
    .action(async (options) => {
      try {
        await runBatchCreate(options);
      } catch (error) {
        await logger.error('Failed to create tenants in batch');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex batch tenants update --tenant-ids <ids> [--name <name>] [--status <status>] [--dry-run]
  command
    .command('update')
    .description('Update multiple tenants at once')
    .option('--tenant-ids <ids>', 'Comma-separated tenant IDs')
    .option('--name <name>', 'New name for all tenants')
    .option('--status <status>', 'New status (active, inactive, suspended)')
    .option('--dry-run', 'Validate without updating (default: false)')
    .action(async (options) => {
      try {
        await runBatchUpdate(options);
      } catch (error) {
        await logger.error('Failed to update tenants in batch');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex batch tenants delete --tenant-ids <ids> [--permanent] [--dry-run]
  command
    .command('delete')
    .description('Delete multiple tenants at once')
    .option('--tenant-ids <ids>', 'Comma-separated tenant IDs')
    .option('--permanent', 'Permanently delete (default: soft delete)')
    .option('--dry-run', 'Validate without deleting (default: false)')
    .action(async (options) => {
      try {
        await runBatchDelete(options);
      } catch (error) {
        await logger.error('Failed to delete tenants in batch');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runBatchCreate(options: {
  fromCsv?: string;
  fromJson?: string;
  dryRun?: boolean;
}): Promise<void> {
  if (!options.fromCsv && !options.fromJson) {
    await logger.error('Either --from-csv or --from-json is required');
    await logger.example('synthex batch tenants create --from-csv tenants.csv');
    await logger.example('synthex batch tenants create --from-json tenants.json');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Batch Tenant Creation');

  if (options.dryRun) {
    await logger.warn('🔍 DRY RUN MODE - No changes will be made');
  }

  await logger.divider();

  const service = new BatchOperationsService();
  let currentProgress = 0;
  let totalCount = 0;

  const spinner = await logger.spinner('Processing tenants...');

  try {
    const result = options.fromCsv
      ? await service.createTenantsFromCSV(options.fromCsv, options.dryRun || false, (current, total, item, status) => {
          currentProgress = current;
          totalCount = total;
          spinner.text = `Processing tenants... (${current}/${total})`;
        })
      : await service.createTenantsFromJSON(options.fromJson!, options.dryRun || false, (current, total, item, status) => {
          currentProgress = current;
          totalCount = total;
          spinner.text = `Processing tenants... (${current}/${total})`;
        });

    spinner.stop();

    await logger.divider();
    await logger.info(`Processed ${result.total} tenant(s) in ${(result.duration / 1000).toFixed(2)}s`);
    await logger.divider();

    await logger.info(`✓ Successful: ${result.successCount}`);
    if (result.failureCount > 0) {
      await logger.warn(`✗ Failed: ${result.failureCount}`);

      await logger.divider();
      await logger.header('Failures');

      for (const failure of result.failed) {
        await logger.warn(`  ${failure.item.tenantId || failure.item}: ${failure.error}`);
      }
    }

    if (options.dryRun) {
      await logger.divider();
      await logger.info('To actually create tenants, remove --dry-run flag');
    }
  } catch (error) {
    spinner.fail('Batch operation failed');
    throw error;
  }
}

async function runBatchUpdate(options: {
  tenantIds?: string;
  name?: string;
  status?: string;
  dryRun?: boolean;
}): Promise<void> {
  if (!options.tenantIds) {
    await logger.error('--tenant-ids is required');
    await logger.example('synthex batch tenants update --tenant-ids "ID1,ID2,ID3" --status inactive');
    process.exit(1);
  }

  if (!options.name && !options.status) {
    await logger.error('At least one update field is required (--name or --status)');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Batch Tenant Update');

  if (options.dryRun) {
    await logger.warn('🔍 DRY RUN MODE - No changes will be made');
  }

  await logger.divider();

  const tenantIds = options.tenantIds.split(',').map((id) => id.trim());
  const updates: UpdateTenantInput = {};

  if (options.name) {
    updates.name = options.name;
  }

  if (options.status) {
    updates.status = options.status as any;
  }

  await logger.info(`Updating ${tenantIds.length} tenant(s):`);
  if (updates.name) {
    await logger.info(`  Name: ${updates.name}`);
  }
  if (updates.status) {
    await logger.info(`  Status: ${updates.status}`);
  }

  await logger.divider();

  const service = new BatchOperationsService();
  const spinner = await logger.spinner('Updating tenants...');

  try {
    const result = await service.updateTenantsBulk(
      tenantIds,
      updates,
      options.dryRun || false,
      (current, total) => {
        spinner.text = `Updating tenants... (${current}/${total})`;
      }
    );

    spinner.stop();

    await logger.divider();
    await logger.info(`Processed ${result.total} tenant(s) in ${(result.duration / 1000).toFixed(2)}s`);
    await logger.divider();

    await logger.info(`✓ Successful: ${result.successCount}`);
    if (result.failureCount > 0) {
      await logger.warn(`✗ Failed: ${result.failureCount}`);

      await logger.divider();
      await logger.header('Failures');

      for (const failure of result.failed) {
        await logger.warn(`  ${failure.item}: ${failure.error}`);
      }
    }

    if (options.dryRun) {
      await logger.divider();
      await logger.info('To actually update tenants, remove --dry-run flag');
    }
  } catch (error) {
    spinner.fail('Batch operation failed');
    throw error;
  }
}

async function runBatchDelete(options: {
  tenantIds?: string;
  permanent?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  if (!options.tenantIds) {
    await logger.error('--tenant-ids is required');
    await logger.example('synthex batch tenants delete --tenant-ids "ID1,ID2,ID3"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Batch Tenant Deletion');

  if (options.permanent) {
    await logger.warn('⚠ WARNING: Permanent deletion cannot be undone!');
  }

  if (options.dryRun) {
    await logger.warn('🔍 DRY RUN MODE - No changes will be made');
  }

  await logger.divider();

  const tenantIds = options.tenantIds.split(',').map((id) => id.trim());

  await logger.info(`Deleting ${tenantIds.length} tenant(s)`);
  await logger.info(`Mode: ${options.permanent ? 'PERMANENT' : 'Soft delete'}`);

  await logger.divider();

  const service = new BatchOperationsService();
  const spinner = await logger.spinner('Deleting tenants...');

  try {
    const result = await service.deleteTenantsBulk(
      tenantIds,
      options.permanent || false,
      options.dryRun || false,
      (current, total) => {
        spinner.text = `Deleting tenants... (${current}/${total})`;
      }
    );

    spinner.stop();

    await logger.divider();
    await logger.info(`Processed ${result.total} tenant(s) in ${(result.duration / 1000).toFixed(2)}s`);
    await logger.divider();

    await logger.info(`✓ Successful: ${result.successCount}`);
    if (result.failureCount > 0) {
      await logger.warn(`✗ Failed: ${result.failureCount}`);

      await logger.divider();
      await logger.header('Failures');

      for (const failure of result.failed) {
        await logger.warn(`  ${failure.item}: ${failure.error}`);
      }
    }

    if (options.dryRun) {
      await logger.divider();
      await logger.info('To actually delete tenants, remove --dry-run flag');
    }
  } catch (error) {
    spinner.fail('Batch operation failed');
    throw error;
  }
}
