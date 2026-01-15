/**
 * synthex batch credentials Commands
 *
 * Bulk credential operations
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { BatchOperationsService } from '../../services/advanced/batch-operations.js';
import { ConfigManager } from '../../utils/config-manager.js';

export function createCredentialsCommand(): Command {
  const command = new Command('credentials');

  command.description('Bulk credential operations');

  // synthex batch credentials cleanup --workspace-ids <ids> [--dry-run]
  command
    .command('cleanup')
    .description('Cleanup expired credentials across multiple workspaces')
    .option('--workspace-ids <ids>', 'Comma-separated workspace IDs')
    .option('--dry-run', 'Count without deleting (default: false)')
    .action(async (options) => {
      try {
        await runBatchCredentialCleanup(options);
      } catch (error) {
        await logger.error('Failed to cleanup credentials in batch');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runBatchCredentialCleanup(options: {
  workspaceIds?: string;
  dryRun?: boolean;
}): Promise<void> {
  if (!options.workspaceIds) {
    await logger.error('--workspace-ids is required');
    await logger.example('synthex batch credentials cleanup --workspace-ids "WS1,WS2,WS3"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Batch Credential Cleanup');

  if (options.dryRun) {
    await logger.warn('🔍 DRY RUN MODE - No changes will be made');
  }

  await logger.divider();

  const workspaceIds = options.workspaceIds.split(',').map((id) => id.trim());

  await logger.info(`Cleaning up credentials across ${workspaceIds.length} workspace(s)`);

  await logger.divider();

  const service = new BatchOperationsService();
  const spinner = await logger.spinner('Cleaning up credentials...');

  try {
    const result = await service.cleanupExpiredCredentialsBulk(
      workspaceIds,
      options.dryRun || false,
      (current, total) => {
        spinner.text = `Cleaning up credentials... (${current}/${total})`;
      }
    );

    spinner.stop();

    await logger.divider();
    await logger.info(`Processed ${result.total} workspace(s) in ${(result.duration / 1000).toFixed(2)}s`);
    await logger.divider();

    let totalDeleted = 0;

    for (const success of result.successful) {
      totalDeleted += success.deleted;
      if (success.deleted > 0) {
        await logger.info(`  ${success.workspaceId}: ${success.deleted} credential(s) deleted`);
      }
    }

    await logger.divider();
    await logger.info(`Total deleted: ${totalDeleted} credential(s)`);

    if (result.failureCount > 0) {
      await logger.warn(`Failed workspaces: ${result.failureCount}`);

      await logger.divider();
      await logger.header('Failures');

      for (const failure of result.failed) {
        await logger.warn(`  ${failure.item}: ${failure.error}`);
      }
    }

    if (options.dryRun) {
      await logger.divider();
      await logger.info('To actually delete credentials, remove --dry-run flag');
    }
  } catch (error) {
    spinner.fail('Batch operation failed');
    throw error;
  }
}
