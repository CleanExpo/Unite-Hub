/**
 * synthex auth logout Command
 *
 * Clears authentication and optionally revokes service credentials
 *
 * Usage:
 *   synthex auth logout
 *   synthex auth logout --revoke --service shopify --tenant-id "SMB_CLIENT_001"
 */

import { Command } from 'commander';
import { configManager } from '../../utils/config-manager.js';
import { logger } from '../../utils/logger.js';
import { jwtManager } from '../../services/auth/jwt-manager.js';
import { secretManager } from '../../services/secrets/secret-manager.js';
import { shopifyOAuth } from '../../services/auth/shopify-oauth.js';
import { googleOAuth } from '../../services/auth/google-oauth.js';

export function createLogoutCommand(): Command {
  const command = new Command('logout');

  command
    .description('Clear authentication and optionally revoke service credentials')
    .option('--revoke', 'Revoke service credentials (deletes from Secret Manager)')
    .option('-s, --service <service>', 'Service to revoke (shopify, google-merchant)')
    .option('-t, --tenant-id <id>', 'Tenant ID (for Shopify)')
    .option('-c, --client-id <id>', 'Client ID (for Google Merchant Center)')
    .action(async (options) => {
      try {
        await runLogout(options);
      } catch (error) {
        await logger.error('Logout failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runLogout(options: {
  revoke?: boolean;
  service?: string;
  tenantId?: string;
  clientId?: string;
}): Promise<void> {
  // Check if initialized
  if (!configManager.isInitialized()) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Logout');

  // Clear JWT token
  const hadToken = jwtManager.getCurrentToken() !== null;

  if (hadToken) {
    jwtManager.clearToken();
    await logger.success('JWT token cleared');
  } else {
    await logger.info('No JWT token found');
  }

  // Handle service credential revocation
  if (options.revoke) {
    if (!options.service) {
      await logger.error('Service is required when using --revoke flag');
      await logger.example('synthex auth logout --revoke --service shopify --tenant-id "CLIENT_001"');
      process.exit(1);
    }

    const service = options.service.toLowerCase();

    if (service === 'shopify') {
      if (!options.tenantId) {
        await logger.error('Tenant ID is required for Shopify');
        process.exit(1);
      }

      await logger.info(`Revoking Shopify credentials for ${options.tenantId}...`);

      try {
        await shopifyOAuth.revokeAccess(options.tenantId);
        await logger.success(`Shopify credentials revoked for ${options.tenantId}`);
      } catch (error) {
        await logger.warn('Failed to revoke Shopify credentials (may not exist)');
      }
    } else if (service === 'google-merchant') {
      if (!options.clientId) {
        await logger.error('Client ID is required for Google Merchant Center');
        process.exit(1);
      }

      await logger.info(`Revoking Google Merchant Center credentials for ${options.clientId}...`);

      try {
        await googleOAuth.revokeAccess(options.clientId);
        await logger.success(`Google Merchant Center credentials revoked for ${options.clientId}`);
      } catch (error) {
        await logger.warn('Failed to revoke Google credentials (may not exist)');
      }
    } else {
      await logger.error(`Unknown service: ${options.service}`);
      process.exit(1);
    }
  }

  await logger.divider();

  if (hadToken || options.revoke) {
    await logger.success('Logged out successfully');
  } else {
    await logger.info('Already logged out');
  }
}
