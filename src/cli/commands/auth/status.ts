/**
 * synthex auth status Command
 *
 * Displays current authentication status
 *
 * Usage:
 *   synthex auth status
 *   synthex auth status --tenant-id "SMB_CLIENT_001"
 */

import { Command } from 'commander';
import { configManager } from '../../utils/config-manager.js';
import { logger } from '../../utils/logger.js';
import { jwtManager } from '../../services/auth/jwt-manager.js';
import { secretManager } from '../../services/secrets/secret-manager.js';

export function createStatusCommand(): Command {
  const command = new Command('status');

  command
    .description('Display current authentication status')
    .option('-t, --tenant-id <id>', 'Check specific tenant authentication')
    .option('-a, --all', 'Show all tenant authentications')
    .action(async (options) => {
      try {
        await runStatus(options);
      } catch (error) {
        await logger.error('Failed to get auth status');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runStatus(options: { tenantId?: string; all?: boolean }): Promise<void> {
  // Check if initialized
  if (!configManager.isInitialized()) {
    await logger.error('Synthex not initialized');
    await logger.info('Run `synthex init` first to set up your environment');
    process.exit(1);
  }

  const config = configManager.loadConfig()!;

  await logger.header('Authentication Status');

  // Check JWT token
  const jwtToken = jwtManager.getCurrentToken();

  if (jwtToken) {
    const payload = jwtManager.decodeToken(jwtToken);
    if (payload) {
      const expiresAt = new Date(payload.exp * 1000);
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));

      await logger.keyValue('JWT Token', '✓ Valid');
      await logger.keyValue('User', payload.sub);
      await logger.keyValue('Workspace', payload.workspace_id);
      if (payload.tenant_id) {
        await logger.keyValue('Tenant', payload.tenant_id);
      }
      await logger.keyValue('Scopes', payload.scopes.join(', '));
      await logger.keyValue('Expires', expiresAt.toLocaleString());
      await logger.keyValue('Time Remaining', `${hoursUntilExpiry} hours`);

      if (jwtManager.needsRefresh(jwtToken)) {
        await logger.warn('Token expires soon. Consider running `synthex auth refresh`');
      }
    }
  } else {
    await logger.keyValue('JWT Token', '✗ Not authenticated');
    await logger.info('Run `synthex auth login` to authenticate');
  }

  await logger.divider();

  // Check service credentials
  if (options.tenantId) {
    await checkTenantCredentials(options.tenantId);
  } else if (options.all) {
    await logger.info('Scanning for all tenant credentials...');
    // This would require listing all tenants from database
    // For now, show message
    await logger.warn('--all flag requires database integration (coming soon)');
  } else if (jwtToken) {
    const payload = jwtManager.decodeToken(jwtToken);
    if (payload?.tenant_id) {
      await checkTenantCredentials(payload.tenant_id);
    }
  }
}

async function checkTenantCredentials(tenantId: string): Promise<void> {
  await logger.header(`Service Credentials for ${tenantId}`);

  // Check Shopify
  await logger.info('Checking Shopify credentials...');
  const shopifyCredentials = await secretManager.retrieveSecret({
    tenantId,
    service: 'shopify',
  });

  if (shopifyCredentials) {
    const expiresAt = new Date(shopifyCredentials.expires_at);
    const isExpired = secretManager.isTokenExpired(shopifyCredentials);

    await logger.keyValue('Shopify', isExpired ? '✗ Expired' : '✓ Valid');
    await logger.keyValue('  Scopes', shopifyCredentials.scopes.join(', '));
    await logger.keyValue('  Expires', expiresAt.toLocaleString());
    if (shopifyCredentials.metadata?.shop) {
      await logger.keyValue('  Shop', shopifyCredentials.metadata.shop);
    }

    if (isExpired) {
      await logger.warn('  Shopify token expired. Run `synthex auth login --service shopify`');
    }
  } else {
    await logger.keyValue('Shopify', '✗ Not configured');
  }

  await logger.divider();

  // Check Google Merchant Center
  await logger.info('Checking Google Merchant Center credentials...');
  const googleCredentials = await secretManager.retrieveSecret({
    tenantId,
    service: 'google-merchant',
  });

  if (googleCredentials) {
    const expiresAt = new Date(googleCredentials.expires_at);
    const isExpired = secretManager.isTokenExpired(googleCredentials);
    const hasRefreshToken = !!googleCredentials.refresh_token;

    await logger.keyValue('Google Merchant Center', isExpired ? '⚠ Expired' : '✓ Valid');
    await logger.keyValue('  Scopes', googleCredentials.scopes.join(', '));
    await logger.keyValue('  Access Token Expires', expiresAt.toLocaleString());
    await logger.keyValue('  Has Refresh Token', hasRefreshToken ? 'Yes' : 'No');

    if (isExpired && hasRefreshToken) {
      await logger.info('  Token expired but has refresh token. Will auto-refresh on next use.');
    } else if (isExpired && !hasRefreshToken) {
      await logger.warn(
        '  Token expired and no refresh token. Run `synthex auth login --service google-merchant`'
      );
    }
  } else {
    await logger.keyValue('Google Merchant Center', '✗ Not configured');
  }

  await logger.divider();
}
