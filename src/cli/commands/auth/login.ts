/**
 * synthex auth login Command
 *
 * Authenticates with external services using OAuth 2.0
 *
 * Usage:
 *   synthex auth login --service shopify --tenant-id "SMB_CLIENT_001"
 *   synthex auth login --service google-merchant --client-id "SYNTHEX_AGENCY_ID"
 */

import { Command } from 'commander';
import { configManager } from '../../utils/config-manager.js';
import { logger } from '../../utils/logger.js';
import { jwtManager } from '../../services/auth/jwt-manager.js';
import { shopifyOAuth } from '../../services/auth/shopify-oauth.js';
import { googleOAuth } from '../../services/auth/google-oauth.js';

export function createLoginCommand(): Command {
  const command = new Command('login');

  command
    .description('Authenticate with external services (Shopify, Google Merchant Center)')
    .option('-s, --service <service>', 'Service to authenticate (shopify, google-merchant)')
    .option('-t, --tenant-id <id>', 'Client tenant identifier (for Shopify)')
    .option('-c, --client-id <id>', 'Agency client identifier (for Google Merchant Center)')
    .option('--shop <shop>', 'Shopify shop domain (e.g., example.myshopify.com)')
    .option('--scopes <scopes>', 'Comma-separated OAuth scopes (optional)')
    .action(async (options) => {
      try {
        await runLogin(options);
      } catch (error) {
        await logger.error('Authentication failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runLogin(options: {
  service?: string;
  tenantId?: string;
  clientId?: string;
  shop?: string;
  scopes?: string;
}): Promise<void> {
  // Check if initialized
  if (!configManager.isInitialized()) {
    await logger.error('Synthex not initialized');
    await logger.info('Run `synthex init` first to set up your environment');
    process.exit(1);
  }

  const config = configManager.loadConfig()!;

  // Validate service
  if (!options.service) {
    await logger.error('Service is required');
    await logger.info('Available services: shopify, google-merchant');
    await logger.divider();
    await logger.example('synthex auth login --service shopify --tenant-id "SMB_CLIENT_001"');
    await logger.example('synthex auth login --service google-merchant --client-id "AGENCY_ID"');
    process.exit(1);
  }

  const service = options.service.toLowerCase();

  if (service !== 'shopify' && service !== 'google-merchant') {
    await logger.error(`Unknown service: ${options.service}`);
    await logger.info('Available services: shopify, google-merchant');
    process.exit(1);
  }

  // Route to appropriate auth handler
  if (service === 'shopify') {
    await handleShopifyAuth(options, config.workspace_id);
  } else if (service === 'google-merchant') {
    await handleGoogleAuth(options, config.workspace_id);
  }
}

async function handleShopifyAuth(
  options: {
    tenantId?: string;
    shop?: string;
    scopes?: string;
  },
  workspaceId: string
): Promise<void> {
  // Validate tenant ID
  if (!options.tenantId) {
    await logger.error('Tenant ID is required for Shopify authentication');
    await logger.example('synthex auth login --service shopify --tenant-id "SMB_CLIENT_001"');
    process.exit(1);
  }

  // Validate shop domain
  if (!options.shop) {
    await logger.error('Shop domain is required for Shopify authentication');
    await logger.example(
      'synthex auth login --service shopify --tenant-id "SMB_CLIENT_001" --shop "example.myshopify.com"'
    );
    process.exit(1);
  }

  await logger.header('Shopify Authentication');
  await logger.keyValue('Tenant', options.tenantId);
  await logger.keyValue('Shop', options.shop);

  const spinner = await logger.spinner('Initializing OAuth flow...');

  try {
    // Parse scopes if provided
    const scopes = options.scopes ? options.scopes.split(',').map((s) => s.trim()) : undefined;

    // Start OAuth flow
    const credentials = await shopifyOAuth.startAuthFlow({
      tenantId: options.tenantId,
      shop: options.shop,
      scopes,
    });

    spinner.succeed('Shopify authentication successful');

    // Generate JWT token
    const { token, expiresAt } = jwtManager.generateToken({
      userId: `shopify-${options.tenantId}`,
      workspaceId,
      tenantId: options.tenantId,
      scopes: credentials.scopes,
    });

    // Save JWT token
    jwtManager.saveToken(token, expiresAt);

    // Display success information
    await logger.divider();
    await logger.header('Authentication Complete');

    await logger.keyValue('Tenant', options.tenantId);
    await logger.keyValue('Shop', options.shop);
    await logger.keyValue('Scopes', credentials.scopes.join(', '));
    await logger.keyValue('Expires', new Date(credentials.expires_at).toLocaleString());
    await logger.keyValue(
      'Secret',
      `projects/${process.env.SYNTHEX_PROJECT_ID || 'synthex-prod'}/secrets/shopify-${
        options.tenantId
      }-token`
    );

    await logger.divider();
    await logger.header('JWT Token');

    await logger.keyValue('Expires', expiresAt.toLocaleString());
    await logger.keyValue('Path', configManager.getJwtPath());

    await logger.divider();
    await logger.success('You are now authenticated with Shopify!');
  } catch (error) {
    spinner.fail('Authentication failed');
    throw error;
  }
}

async function handleGoogleAuth(
  options: {
    clientId?: string;
    scopes?: string;
  },
  workspaceId: string
): Promise<void> {
  // Validate client ID
  if (!options.clientId) {
    await logger.error('Client ID is required for Google Merchant Center authentication');
    await logger.example(
      'synthex auth login --service google-merchant --client-id "SYNTHEX_AGENCY_ID"'
    );
    process.exit(1);
  }

  await logger.header('Google Merchant Center Authentication');
  await logger.keyValue('Client ID', options.clientId);

  const spinner = await logger.spinner('Initializing OAuth flow...');

  try {
    // Parse scopes if provided
    const scopes = options.scopes ? options.scopes.split(',').map((s) => s.trim()) : undefined;

    // Start OAuth flow
    const credentials = await googleOAuth.startAuthFlow({
      clientId: options.clientId,
      scopes,
    });

    spinner.succeed('Google Merchant Center authentication successful');

    // Generate JWT token
    const { token, expiresAt } = jwtManager.generateToken({
      userId: `google-${options.clientId}`,
      workspaceId,
      tenantId: options.clientId,
      scopes: credentials.scopes,
    });

    // Save JWT token
    jwtManager.saveToken(token, expiresAt);

    // Display success information
    await logger.divider();
    await logger.header('Authentication Complete');

    await logger.keyValue('Client ID', options.clientId);
    await logger.keyValue('Scopes', credentials.scopes.join(', '));
    await logger.keyValue('Access Token Expires', new Date(credentials.expires_at).toLocaleString());
    await logger.keyValue(
      'Has Refresh Token',
      credentials.refresh_token ? 'Yes' : 'No (re-authenticate to get refresh token)'
    );
    await logger.keyValue(
      'Secret',
      `projects/${process.env.SYNTHEX_PROJECT_ID || 'synthex-prod'}/secrets/google-merchant-${
        options.clientId
      }-token`
    );

    await logger.divider();
    await logger.header('JWT Token');

    await logger.keyValue('Expires', expiresAt.toLocaleString());
    await logger.keyValue('Path', configManager.getJwtPath());

    await logger.divider();
    await logger.success('You are now authenticated with Google Merchant Center!');
  } catch (error) {
    spinner.fail('Authentication failed');
    throw error;
  }
}
