/**
 * synthex auth refresh Command
 *
 * Refreshes JWT token or service credentials
 *
 * Usage:
 *   synthex auth refresh
 *   synthex auth refresh --service google-merchant --client-id "AGENCY_ID"
 */

import { Command } from 'commander';
import { configManager } from '../../utils/config-manager.js';
import { logger } from '../../utils/logger.js';
import { jwtManager } from '../../services/auth/jwt-manager.js';
import { googleOAuth } from '../../services/auth/google-oauth.js';
import { secretManager } from '../../services/secrets/secret-manager.js';

export function createRefreshCommand(): Command {
  const command = new Command('refresh');

  command
    .description('Refresh JWT token or service credentials')
    .option('-s, --service <service>', 'Service to refresh (google-merchant)')
    .option('-c, --client-id <id>', 'Client ID (for Google Merchant Center)')
    .action(async (options) => {
      try {
        await runRefresh(options);
      } catch (error) {
        await logger.error('Refresh failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runRefresh(options: { service?: string; clientId?: string }): Promise<void> {
  // Check if initialized
  if (!configManager.isInitialized()) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  const config = configManager.loadConfig()!;

  await logger.header('Refresh Authentication');

  // If service specified, refresh service credentials
  if (options.service) {
    const service = options.service.toLowerCase();

    if (service === 'google-merchant') {
      if (!options.clientId) {
        await logger.error('Client ID is required for Google Merchant Center');
        await logger.example('synthex auth refresh --service google-merchant --client-id "AGENCY_ID"');
        process.exit(1);
      }

      await refreshGoogleCredentials(options.clientId);
    } else if (service === 'shopify') {
      await logger.warn('Shopify tokens do not support refresh (they last 30 days)');
      await logger.info('Re-authenticate when the token expires:');
      await logger.example('synthex auth login --service shopify --tenant-id "YOUR_TENANT"');
    } else {
      await logger.error(`Unknown service: ${options.service}`);
      process.exit(1);
    }
  } else {
    // Refresh JWT token
    await refreshJwtToken();
  }
}

async function refreshJwtToken(): Promise<void> {
  const spinner = await logger.spinner('Refreshing JWT token...');

  try {
    const { token, expiresAt } = jwtManager.refreshToken();
    jwtManager.saveToken(token, expiresAt);

    spinner.succeed('JWT token refreshed successfully');

    await logger.divider();
    await logger.keyValue('New Expiry', expiresAt.toLocaleString());
    await logger.keyValue('Path', configManager.getJwtPath());

    const payload = jwtManager.decodeToken(token);
    if (payload) {
      await logger.divider();
      await logger.keyValue('User', payload.sub);
      await logger.keyValue('Workspace', payload.workspace_id);
      if (payload.tenant_id) {
        await logger.keyValue('Tenant', payload.tenant_id);
      }
      await logger.keyValue('Scopes', payload.scopes.join(', '));
    }
  } catch (error) {
    spinner.fail('Failed to refresh JWT token');
    throw error;
  }
}

async function refreshGoogleCredentials(clientId: string): Promise<void> {
  const spinner = await logger.spinner('Refreshing Google Merchant Center credentials...');

  try {
    // Get existing credentials
    const credentials = await secretManager.retrieveSecret({
      tenantId: clientId,
      service: 'google-merchant',
    });

    if (!credentials) {
      spinner.fail('No Google credentials found');
      await logger.info('Authenticate first:');
      await logger.example(`synthex auth login --service google-merchant --client-id "${clientId}"`);
      process.exit(1);
    }

    if (!credentials.refresh_token) {
      spinner.fail('No refresh token available');
      await logger.warn('Re-authenticate to get a refresh token:');
      await logger.example(`synthex auth login --service google-merchant --client-id "${clientId}"`);
      process.exit(1);
    }

    // Refresh token
    const newTokens = await googleOAuth.refreshToken(credentials.refresh_token);

    // Update Secret Manager
    const updatedCredentials = {
      access_token: newTokens.access_token,
      refresh_token: credentials.refresh_token, // Keep existing refresh token
      expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      scopes: newTokens.scope.split(' '),
      metadata: credentials.metadata,
    };

    await secretManager.storeSecret({
      tenantId: clientId,
      service: 'google-merchant',
      value: updatedCredentials,
    });

    spinner.succeed('Google Merchant Center credentials refreshed successfully');

    await logger.divider();
    await logger.keyValue('Client ID', clientId);
    await logger.keyValue('New Access Token Expires', new Date(updatedCredentials.expires_at).toLocaleString());
    await logger.keyValue('Scopes', updatedCredentials.scopes.join(', '));
  } catch (error) {
    spinner.fail('Failed to refresh Google credentials');
    throw error;
  }
}
