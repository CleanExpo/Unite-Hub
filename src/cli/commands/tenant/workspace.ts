/**
 * synthex tenant workspace Commands
 *
 * Manage workspace context and tenant switching
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { WorkspaceManager } from '../../services/tenant/workspace-manager.js';
import { TenantManager } from '../../services/tenant/tenant-manager.js';

export function createWorkspaceCommand(): Command {
  const command = new Command('workspace');

  command.description('Manage workspace context');

  // synthex tenant workspace info
  command
    .command('info')
    .description('Show current workspace information')
    .action(async () => {
      try {
        await runWorkspaceInfo();
      } catch (error) {
        await logger.error('Failed to get workspace info');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant workspace set-active
  command
    .command('set-active')
    .description('Set active tenant for current workspace')
    .option('--tenant-id <id>', 'Tenant ID to set as active')
    .action(async (options) => {
      try {
        await runSetActiveTenant(options);
      } catch (error) {
        await logger.error('Failed to set active tenant');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant workspace clear-active
  command
    .command('clear-active')
    .description('Clear active tenant')
    .action(async () => {
      try {
        await runClearActiveTenant();
      } catch (error) {
        await logger.error('Failed to clear active tenant');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant workspace summary
  command
    .command('summary')
    .description('Get workspace summary')
    .action(async () => {
      try {
        await runWorkspaceSummary();
      } catch (error) {
        await logger.error('Failed to get workspace summary');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runWorkspaceInfo(): Promise<void> {
  await logger.header('Workspace Information');

  const spinner = await logger.spinner('Fetching workspace info...');

  try {
    const manager = new WorkspaceManager();
    const info = await manager.getWorkspaceInfo();

    spinner.stop();

    if (!info) {
      await logger.error('Synthex not initialized');
      await logger.info('Run: synthex init --market <market> --region <region>');
      process.exit(1);
    }

    await logger.divider();
    await logger.keyValue('Workspace ID', info.workspaceId);
    await logger.keyValue('Market', info.market);
    await logger.keyValue('Region', info.region);
    await logger.keyValue('Total Tenants', info.tenantsCount.toString());

    if (info.activeTenant) {
      await logger.divider();
      await logger.header('Active Tenant');
      await logger.keyValue('Tenant ID', info.activeTenant.tenantId);
      await logger.keyValue('Name', info.activeTenant.name);
      await logger.keyValue('Type', info.activeTenant.type);
    } else {
      await logger.divider();
      await logger.info('No active tenant set');
      await logger.info('Set active tenant:');
      await logger.example('synthex tenant workspace set-active --tenant-id "TENANT_ID"');
    }
  } catch (error) {
    spinner.fail('Failed to get workspace info');
    throw error;
  }
}

async function runSetActiveTenant(options: { tenantId?: string }): Promise<void> {
  if (!options.tenantId) {
    await logger.error('Tenant ID is required');
    await logger.example('synthex tenant workspace set-active --tenant-id "SMB_CLIENT_001"');
    process.exit(1);
  }

  await logger.header('Set Active Tenant');

  const spinner = await logger.spinner('Verifying tenant...');

  try {
    const manager = new WorkspaceManager();

    // Verify tenant exists and is active
    const isValid = await manager.verifyTenant(options.tenantId);

    if (!isValid) {
      spinner.fail('Tenant not found or inactive');
      await logger.error(`Tenant "${options.tenantId}" not found or inactive`);
      await logger.info('List available tenants:');
      await logger.example('synthex tenant tenants list');
      process.exit(1);
    }

    spinner.text = 'Setting active tenant...';

    manager.setActiveTenant(options.tenantId);

    spinner.succeed('Active tenant set successfully');

    await logger.divider();
    await logger.info(`Active tenant: ${options.tenantId}`);
    await logger.info('All subsequent commands will use this tenant context');
  } catch (error) {
    spinner.fail('Failed to set active tenant');
    throw error;
  }
}

async function runClearActiveTenant(): Promise<void> {
  await logger.header('Clear Active Tenant');

  const spinner = await logger.spinner('Clearing active tenant...');

  try {
    const manager = new WorkspaceManager();
    manager.clearActiveTenant();

    spinner.succeed('Active tenant cleared');

    await logger.divider();
    await logger.info('No active tenant set');
    await logger.info('Commands will require explicit --tenant-id parameter');
  } catch (error) {
    spinner.fail('Failed to clear active tenant');
    throw error;
  }
}

async function runWorkspaceSummary(): Promise<void> {
  await logger.header('Workspace Summary');

  const spinner = await logger.spinner('Fetching summary...');

  try {
    const tenantManager = new TenantManager();
    const summary = await tenantManager.getWorkspaceSummary();

    spinner.stop();

    await logger.divider();
    await logger.keyValue('Total Tenants', summary.totalTenants.toString());
    await logger.keyValue('Active', summary.activeTenants.toString());
    await logger.keyValue('Inactive', summary.inactiveTenants.toString());

    await logger.divider();
    await logger.header('By Type');
    await logger.keyValue('Shopify', summary.byType.shopify.toString());
    await logger.keyValue('Google Merchant', summary.byType.googleMerchant.toString());
    await logger.keyValue('Mixed', summary.byType.mixed.toString());

    if (Object.keys(summary.byMarket).length > 0) {
      await logger.divider();
      await logger.header('By Market');
      for (const [market, count] of Object.entries(summary.byMarket)) {
        await logger.keyValue(market, count.toString());
      }
    }
  } catch (error) {
    spinner.fail('Failed to get summary');
    throw error;
  }
}
