/**
 * synthex google-merchant products Commands
 *
 * Manage Google Merchant Center product feeds
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { ConfigManager } from '../../utils/config-manager.js';
import { FeedService } from '../../services/google-merchant/feed-service.js';

export function createProductsCommand(): Command {
  const command = new Command('products');

  command.description('Manage Google Merchant Center product feeds');

  // synthex google-merchant products sync
  command
    .command('sync')
    .description('Sync products from local database to Google Merchant Center')
    .option('--merchant-id <id>', 'Google Merchant Center ID (required)')
    .option('--client-id <id>', 'OAuth client ID (required)')
    .option('-l, --limit <number>', 'Maximum number of products to sync')
    .option('-s, --status <status>', 'Filter by product status (active, draft, archived)')
    .option('--product-ids <ids>', 'Comma-separated product IDs to sync')
    .option('--country <country>', 'Target country (AU, NZ, US, GB)', 'AU')
    .option('--language <language>', 'Content language (en, en-AU, en-NZ)', 'en')
    .option('--currency <currency>', 'Currency code (AUD, NZD, USD, GBP)', 'AUD')
    .option('--base-url <url>', 'Website base URL for product links')
    .action(async (options) => {
      try {
        await runProductSync(options);
      } catch (error) {
        await logger.error('Product sync failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex google-merchant products list
  command
    .command('list')
    .description('List products from Google Merchant Center')
    .option('--merchant-id <id>', 'Google Merchant Center ID (required)')
    .option('--client-id <id>', 'OAuth client ID (required)')
    .option('-l, --limit <number>', 'Number of products to list', '20')
    .action(async (options) => {
      try {
        await runProductList(options);
      } catch (error) {
        await logger.error('Failed to list products');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex google-merchant products status
  command
    .command('status')
    .description('Check product status and issues in Google Merchant Center')
    .option('--merchant-id <id>', 'Google Merchant Center ID (required)')
    .option('--client-id <id>', 'OAuth client ID (required)')
    .option('--product-id <id>', 'Product ID to check (e.g., online:en:AU:SKU123)')
    .action(async (options) => {
      try {
        await runProductStatus(options);
      } catch (error) {
        await logger.error('Failed to get product status');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex google-merchant products validate
  command
    .command('validate')
    .description('Validate products before syncing to Google Merchant Center')
    .option('--merchant-id <id>', 'Google Merchant Center ID (required)')
    .option('--client-id <id>', 'OAuth client ID (required)')
    .option('--product-ids <ids>', 'Comma-separated product IDs to validate')
    .option('--country <country>', 'Target country (AU, NZ, US, GB)', 'AU')
    .option('--language <language>', 'Content language (en, en-AU, en-NZ)', 'en')
    .option('--currency <currency>', 'Currency code (AUD, NZD, USD, GBP)', 'AUD')
    .option('--base-url <url>', 'Website base URL for product links')
    .action(async (options) => {
      try {
        await runProductValidation(options);
      } catch (error) {
        await logger.error('Validation failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex google-merchant products delete
  command
    .command('delete')
    .description('Delete product from Google Merchant Center')
    .option('--merchant-id <id>', 'Google Merchant Center ID (required)')
    .option('--client-id <id>', 'OAuth client ID (required)')
    .option('--product-id <id>', 'Product ID to delete (e.g., online:en:AU:SKU123)')
    .action(async (options) => {
      try {
        await runProductDelete(options);
      } catch (error) {
        await logger.error('Failed to delete product');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex google-merchant products stats
  command
    .command('stats')
    .description('Get sync statistics for Google Merchant Center')
    .option('--merchant-id <id>', 'Google Merchant Center ID (required)')
    .option('--client-id <id>', 'OAuth client ID (required)')
    .option('--country <country>', 'Target country (AU, NZ, US, GB)', 'AU')
    .option('--language <language>', 'Content language (en, en-AU, en-NZ)', 'en')
    .option('--currency <currency>', 'Currency code (AUD, NZD, USD, GBP)', 'AUD')
    .option('--base-url <url>', 'Website base URL')
    .action(async (options) => {
      try {
        await runSyncStats(options);
      } catch (error) {
        await logger.error('Failed to get stats');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runProductSync(options: {
  merchantId?: string;
  clientId?: string;
  limit?: string;
  status?: string;
  productIds?: string;
  country?: string;
  language?: string;
  currency?: string;
  baseUrl?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  if (!options.merchantId || !options.clientId) {
    await logger.error('Merchant ID and client ID are required');
    await logger.example(
      'synthex google-merchant products sync --merchant-id "123456789" --client-id "CLIENT_001" --base-url "https://mystore.com"'
    );
    process.exit(1);
  }

  if (!options.baseUrl) {
    await logger.error('Base URL is required for product links');
    await logger.example(
      'synthex google-merchant products sync --merchant-id "123456789" --client-id "CLIENT_001" --base-url "https://mystore.com"'
    );
    process.exit(1);
  }

  await logger.header('Google Merchant Center Product Sync');
  await logger.info(`Merchant ID: ${options.merchantId}`);
  await logger.info(`Target Country: ${options.country}`);
  await logger.info(`Language: ${options.language}`);
  await logger.info(`Currency: ${options.currency}`);
  if (options.status) {
    await logger.info(`Status Filter: ${options.status}`);
  }
  if (options.limit) {
    await logger.info(`Limit: ${options.limit}`);
  }
  await logger.divider();

  const spinner = await logger.spinner('Syncing products to Google Merchant Center...');

  try {
    const feedService = new FeedService({
      merchantId: options.merchantId,
      clientId: options.clientId,
      workspaceId: config.workspace_id,
      targetCountry: options.country || 'AU',
      contentLanguage: options.language || 'en',
      currency: options.currency || 'AUD',
      baseUrl: options.baseUrl,
    });

    const syncOptions: any = {};

    if (options.limit) {
      syncOptions.limit = parseInt(options.limit, 10);
    }

    if (options.status) {
      syncOptions.status = options.status as 'active' | 'draft' | 'archived';
    }

    if (options.productIds) {
      syncOptions.productIds = options.productIds.split(',').map((id) => id.trim());
    }

    const result = await feedService.syncProductsToGMC(syncOptions);

    if (!result.success) {
      spinner.fail('Sync failed');
      if (result.errors) {
        await logger.divider();
        await logger.error('Errors:');
        for (const error of result.errors) {
          await logger.error(`  ${error.productId}: ${error.error}`);
        }
      }
      process.exit(1);
    }

    spinner.succeed(
      `Synced ${result.productsProcessed} products (${result.productsInserted} inserted, ${result.productsUpdated} updated, ${result.productsSkipped || 0} skipped)`
    );

    if (result.errors && result.errors.length > 0) {
      await logger.divider();
      await logger.warn(`Warnings (${result.errors.length} products):`);
      for (const error of result.errors.slice(0, 5)) {
        await logger.warn(`  ${error.productId}: ${error.error}`);
      }
      if (result.errors.length > 5) {
        await logger.warn(`  ... and ${result.errors.length - 5} more`);
      }
    }
  } catch (error) {
    spinner.fail('Sync error');
    throw error;
  }
}

async function runProductList(options: {
  merchantId?: string;
  clientId?: string;
  limit?: string;
}): Promise<void> {
  if (!options.merchantId || !options.clientId) {
    await logger.error('Merchant ID and client ID are required');
    await logger.example(
      'synthex google-merchant products list --merchant-id "123456789" --client-id "CLIENT_001"'
    );
    process.exit(1);
  }

  await logger.header('Google Merchant Center Products');

  const spinner = await logger.spinner('Fetching products...');

  try {
    const { GMCClient } = await import('../../services/google-merchant/gmc-client.js');
    const client = new GMCClient({
      merchantId: options.merchantId,
      clientId: options.clientId,
    });

    await client.initialize();

    const result = await client.listProducts({
      maxResults: parseInt(options.limit || '20', 10),
    });

    spinner.stop();

    if (!result.resources || result.resources.length === 0) {
      await logger.info('No products found');
      return;
    }

    await logger.info(`Found ${result.resources.length} products`);
    await logger.divider();

    for (const product of result.resources.slice(0, 10)) {
      await logger.keyValue('Offer ID', product.offerId);
      await logger.keyValue('Title', product.title);
      await logger.keyValue('Price', `${product.price.currency} ${product.price.value}`);
      await logger.keyValue('Availability', product.availability);
      await logger.divider();
    }

    if (result.resources.length > 10) {
      await logger.info(`... and ${result.resources.length - 10} more products`);
    }

    if (result.nextPageToken) {
      await logger.info('Use --page-token for next page (not yet implemented)');
    }
  } catch (error) {
    spinner.fail('Failed to fetch products');
    throw error;
  }
}

async function runProductStatus(options: {
  merchantId?: string;
  clientId?: string;
  productId?: string;
}): Promise<void> {
  if (!options.merchantId || !options.clientId || !options.productId) {
    await logger.error('Merchant ID, client ID, and product ID are required');
    await logger.example(
      'synthex google-merchant products status --merchant-id "123456789" --client-id "CLIENT_001" --product-id "online:en:AU:SKU123"'
    );
    process.exit(1);
  }

  await logger.header('Product Status');

  const spinner = await logger.spinner('Fetching product status...');

  try {
    const { GMCClient } = await import('../../services/google-merchant/gmc-client.js');
    const client = new GMCClient({
      merchantId: options.merchantId,
      clientId: options.clientId,
    });

    await client.initialize();

    const status = await client.getProductStatus(options.productId);

    spinner.stop();

    await logger.divider();
    await logger.keyValue('Product ID', status.productId);
    await logger.keyValue('Title', status.title);

    if (status.destinationStatuses && status.destinationStatuses.length > 0) {
      await logger.divider();
      await logger.header('Destination Statuses');
      for (const dest of status.destinationStatuses) {
        await logger.keyValue('Destination', dest.destination);
        await logger.keyValue('Status', dest.status);
        if (dest.approvedCountries && dest.approvedCountries.length > 0) {
          await logger.keyValue('Approved Countries', dest.approvedCountries.join(', '));
        }
        if (dest.disapprovedCountries && dest.disapprovedCountries.length > 0) {
          await logger.keyValue('Disapproved Countries', dest.disapprovedCountries.join(', '));
        }
      }
    }

    if (status.itemLevelIssues && status.itemLevelIssues.length > 0) {
      await logger.divider();
      await logger.header('Issues');
      for (const issue of status.itemLevelIssues) {
        await logger.warn(`${issue.code} (${issue.servability})`);
        await logger.info(`  ${issue.description}`);
        if (issue.resolution) {
          await logger.info(`  Resolution: ${issue.resolution}`);
        }
      }
    }
  } catch (error) {
    spinner.fail('Failed to fetch status');
    throw error;
  }
}

async function runProductValidation(options: {
  merchantId?: string;
  clientId?: string;
  productIds?: string;
  country?: string;
  language?: string;
  currency?: string;
  baseUrl?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  if (!options.merchantId || !options.clientId || !options.baseUrl) {
    await logger.error('Merchant ID, client ID, and base URL are required');
    await logger.example(
      'synthex google-merchant products validate --merchant-id "123456789" --client-id "CLIENT_001" --base-url "https://mystore.com"'
    );
    process.exit(1);
  }

  await logger.header('Product Validation');

  const spinner = await logger.spinner('Validating products...');

  try {
    const feedService = new FeedService({
      merchantId: options.merchantId,
      clientId: options.clientId,
      workspaceId: config.workspace_id,
      targetCountry: options.country || 'AU',
      contentLanguage: options.language || 'en',
      currency: options.currency || 'AUD',
      baseUrl: options.baseUrl,
    });

    // Fetch products from database (simplified for validation)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('shopify_products')
      .select('*, variants:shopify_product_variants(*), images:shopify_product_images(*)')
      .eq('workspace_id', config.workspace_id)
      .limit(10);

    if (options.productIds) {
      query = query.in('id', options.productIds.split(','));
    }

    const { data: products } = await query;

    spinner.stop();

    if (!products || products.length === 0) {
      await logger.info('No products found to validate');
      return;
    }

    let validCount = 0;
    let invalidCount = 0;

    for (const product of products) {
      if (!product.variants || product.variants.length === 0) continue;

      for (const variant of product.variants) {
        const gmcProduct = (feedService as any).transformToGMCProduct(product, variant);
        const validation = (feedService as any).validateProduct(gmcProduct);

        if (validation.valid) {
          validCount++;
          await logger.info(`✓ ${variant.sku || variant.id}: Valid`);
        } else {
          invalidCount++;
          await logger.error(`✗ ${variant.sku || variant.id}: Invalid`);
          for (const error of validation.errors) {
            await logger.error(`  - ${error.field}: ${error.message}`);
          }
        }

        if (validation.warnings.length > 0) {
          for (const warning of validation.warnings) {
            await logger.warn(`  ⚠ ${warning.field}: ${warning.message}`);
          }
        }

        await logger.divider();
      }
    }

    await logger.header('Validation Summary');
    await logger.keyValue('Valid Products', validCount.toString());
    await logger.keyValue('Invalid Products', invalidCount.toString());
  } catch (error) {
    spinner.fail('Validation error');
    throw error;
  }
}

async function runProductDelete(options: {
  merchantId?: string;
  clientId?: string;
  productId?: string;
}): Promise<void> {
  if (!options.merchantId || !options.clientId || !options.productId) {
    await logger.error('Merchant ID, client ID, and product ID are required');
    await logger.example(
      'synthex google-merchant products delete --merchant-id "123456789" --client-id "CLIENT_001" --product-id "online:en:AU:SKU123"'
    );
    process.exit(1);
  }

  await logger.header('Delete Product');

  const spinner = await logger.spinner('Deleting product from Google Merchant Center...');

  try {
    const { GMCClient } = await import('../../services/google-merchant/gmc-client.js');
    const client = new GMCClient({
      merchantId: options.merchantId,
      clientId: options.clientId,
    });

    await client.initialize();
    await client.deleteProduct(options.productId);

    spinner.succeed('Product deleted successfully');
  } catch (error) {
    spinner.fail('Failed to delete product');
    throw error;
  }
}

async function runSyncStats(options: {
  merchantId?: string;
  clientId?: string;
  country?: string;
  language?: string;
  currency?: string;
  baseUrl?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  if (!options.merchantId || !options.clientId) {
    await logger.error('Merchant ID and client ID are required');
    await logger.example(
      'synthex google-merchant products stats --merchant-id "123456789" --client-id "CLIENT_001" --base-url "https://mystore.com"'
    );
    process.exit(1);
  }

  await logger.header('Sync Statistics');

  const spinner = await logger.spinner('Fetching sync stats...');

  try {
    const feedService = new FeedService({
      merchantId: options.merchantId,
      clientId: options.clientId,
      workspaceId: config.workspace_id,
      targetCountry: options.country || 'AU',
      contentLanguage: options.language || 'en',
      currency: options.currency || 'AUD',
      baseUrl: options.baseUrl || 'https://example.com',
    });

    const stats = await feedService.getSyncStats();

    spinner.stop();

    await logger.divider();
    await logger.keyValue('Total Synced', stats.totalSynced.toString());
    await logger.keyValue('Pending Sync', stats.pendingSync.toString());
    if (stats.lastSyncAt) {
      await logger.keyValue('Last Sync', new Date(stats.lastSyncAt).toLocaleString());
    }
  } catch (error) {
    spinner.fail('Failed to get stats');
    throw error;
  }
}
