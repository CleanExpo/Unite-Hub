/**
 * synthex tenant credentials Commands
 *
 * Manage credential lifecycle
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { CredentialManager } from '../../services/tenant/credential-manager.js';
import { ConfigManager } from '../../utils/config-manager.js';

export function createCredentialsCommand(): Command {
  const command = new Command('credentials');

  command.description('Manage credential lifecycle');

  // synthex tenant credentials list
  command
    .command('list')
    .description('List credentials')
    .option('--tenant-id <id>', 'Filter by tenant ID')
    .action(async (options) => {
      try {
        await runCredentialsList(options);
      } catch (error) {
        await logger.error('Failed to list credentials');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant credentials expiring
  command
    .command('expiring')
    .description('Show credentials expiring soon (<7 days)')
    .action(async () => {
      try {
        await runCredentialsExpiring();
      } catch (error) {
        await logger.error('Failed to get expiring credentials');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant credentials cleanup
  command
    .command('cleanup')
    .description('Clean up expired credentials')
    .action(async () => {
      try {
        await runCredentialsCleanup();
      } catch (error) {
        await logger.error('Failed to cleanup credentials');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant credentials revoke
  command
    .command('revoke')
    .description('Revoke credential manually')
    .option('--service <service>', 'Service (shopify, google-merchant)')
    .option('--tenant-id <id>', 'Tenant ID')
    .action(async (options) => {
      try {
        await runCredentialsRevoke(options);
      } catch (error) {
        await logger.error('Failed to revoke credential');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant credentials health
  command
    .command('health')
    .description('Get credential health report')
    .action(async () => {
      try {
        await runCredentialsHealth();
      } catch (error) {
        await logger.error('Failed to get health report');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runCredentialsList(options: { tenantId?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Credentials');

  const spinner = await logger.spinner('Fetching credentials...');

  try {
    const manager = new CredentialManager();

    const credentials = options.tenantId
      ? await manager.getTenantCredentials(config.workspace_id, options.tenantId)
      : await manager.getWorkspaceCredentials(config.workspace_id);

    spinner.stop();

    if (credentials.length === 0) {
      await logger.info('No credentials found');
      await logger.divider();
      await logger.info('Authenticate a service:');
      await logger.example('synthex auth login --service shopify --tenant-id "TENANT_ID"');
      return;
    }

    await logger.info(`Found ${credentials.length} credential(s)`);
    await logger.divider();

    for (const cred of credentials) {
      const statusIcon =
        cred.status === 'active' ? '✓' : cred.status === 'expiring_soon' ? '⚠' : '✗';
      await logger.info(`${statusIcon} ${cred.service} (${cred.tenantId})`);

      if (cred.expiresAt) {
        const expiresDate = new Date(cred.expiresAt).toLocaleString();
        if (cred.status === 'expired') {
          await logger.warn(`   Expired: ${expiresDate}`);
        } else if (cred.status === 'expiring_soon') {
          await logger.warn(`   Expires: ${expiresDate} (${cred.daysUntilExpiry} days)`);
        } else {
          await logger.info(`   Expires: ${expiresDate}`);
        }
      } else {
        await logger.info('   Expires: Never (perpetual refresh token)');
      }

      await logger.divider();
    }
  } catch (error) {
    spinner.fail('Failed to list credentials');
    throw error;
  }
}

async function runCredentialsExpiring(): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Expiring Credentials');

  const spinner = await logger.spinner('Fetching expiring credentials...');

  try {
    const manager = new CredentialManager();
    const credentials = await manager.getExpiringSoonCredentials(config.workspace_id);

    spinner.stop();

    if (credentials.length === 0) {
      await logger.info('No credentials expiring soon');
      await logger.info('All credentials are healthy!');
      return;
    }

    await logger.warn(`Found ${credentials.length} credential(s) expiring soon:`);
    await logger.divider();

    for (const cred of credentials) {
      await logger.warn(`⚠ ${cred.service} (${cred.tenantId})`);
      await logger.info(`   Expires: ${new Date(cred.expiresAt!).toLocaleString()}`);
      await logger.info(`   Days left: ${cred.daysUntilExpiry}`);
      await logger.info(`   Renew: ${manager.getRenewalInstructions(cred.service, cred.tenantId)}`);
      await logger.divider();
    }

    await logger.info('Renew credentials before they expire to avoid service interruption');
  } catch (error) {
    spinner.fail('Failed to get expiring credentials');
    throw error;
  }
}

async function runCredentialsCleanup(): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Cleanup Expired Credentials');

  const spinner = await logger.spinner('Cleaning up expired credentials...');

  try {
    const manager = new CredentialManager();
    const result = await manager.cleanupExpiredCredentials(config.workspace_id);

    spinner.stop();

    if (result.deleted === 0) {
      await logger.info('No expired credentials to clean up');
      return;
    }

    await logger.warn(`Deleted ${result.deleted} expired credential(s):`);
    await logger.divider();

    for (const cred of result.credentials) {
      await logger.info(`✗ ${cred.service} (${cred.tenantId})`);
      await logger.info(`   Expired: ${new Date(cred.expiresAt!).toLocaleString()}`);
    }

    await logger.divider();
    await logger.info('Re-authenticate affected services:');
    const services = new Set(result.credentials.map((c) => c.service));
    for (const service of services) {
      await logger.example(manager.getRenewalInstructions(service, 'TENANT_ID'));
    }
  } catch (error) {
    spinner.fail('Failed to cleanup credentials');
    throw error;
  }
}

async function runCredentialsRevoke(options: { service?: string; tenantId?: string }): Promise<void> {
  if (!options.service || !options.tenantId) {
    await logger.error('Service and tenant ID are required');
    await logger.example(
      'synthex tenant credentials revoke --service shopify --tenant-id "SMB_CLIENT_001"'
    );
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Revoke Credential');
  await logger.warn('⚠ WARNING: This will immediately revoke the credential!');
  await logger.divider();

  const spinner = await logger.spinner('Revoking credential...');

  try {
    const manager = new CredentialManager();
    await manager.revokeCredential(config.workspace_id, options.service, options.tenantId);

    spinner.succeed('Credential revoked successfully');

    await logger.divider();
    await logger.info(`Revoked: ${options.service} (${options.tenantId})`);
    await logger.info('To re-authenticate:');
    await logger.example(manager.getRenewalInstructions(options.service, options.tenantId));
  } catch (error) {
    spinner.fail('Failed to revoke credential');
    throw error;
  }
}

async function runCredentialsHealth(): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Credential Health Report');

  const spinner = await logger.spinner('Generating health report...');

  try {
    const manager = new CredentialManager();
    const report = await manager.getHealthReport(config.workspace_id);

    spinner.stop();

    await logger.divider();
    await logger.keyValue('Total Credentials', report.totalCredentials.toString());
    await logger.keyValue('Active', report.activeCredentials.toString());
    await logger.keyValue('Expiring Soon (<7 days)', report.expiringSoonCredentials.toString());
    await logger.keyValue('Expired', report.expiredCredentials.toString());

    if (Object.keys(report.byService).length > 0) {
      await logger.divider();
      await logger.header('By Service');
      for (const [service, stats] of Object.entries(report.byService)) {
        await logger.info(`${service}:`);
        await logger.info(`  Total: ${stats.total} | Active: ${stats.active} | Expired: ${stats.expired}`);
      }
    }

    await logger.divider();
    await logger.header('Recommendations');
    for (const recommendation of report.recommendations) {
      if (recommendation.includes('healthy')) {
        await logger.info(`✓ ${recommendation}`);
      } else {
        await logger.warn(`⚠ ${recommendation}`);
      }
    }
  } catch (error) {
    spinner.fail('Failed to generate health report');
    throw error;
  }
}
