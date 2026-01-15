/**
 * Shopify Sync Commands
 *
 * MCP-based catalog synchronization
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { MCPShopifySyncService } from '../../services/commerce/mcp-shopify-sync.js';

export function createSyncCommand(): Command {
  const command = new Command('sync-catalog');

  command
    .description('Sync Shopify catalog via MCP handshake')
    .requiredOption('--client-id <id>', 'Client/tenant ID')
    .option('--mcp-endpoint <endpoint>', 'MCP endpoint (e.g., mcp://shopify-server)', 'mcp://shopify-server')
    .action(async (options) => {
      try {
        await runSyncCatalog(options);
      } catch (error) {
        await logger.error('Catalog sync failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runSyncCatalog(options: {
  clientId: string;
  mcpEndpoint?: string;
}): Promise<void> {
  await logger.header('Shopify: MCP Catalog Sync');
  await logger.divider();

  const endpoint = options.mcpEndpoint || 'mcp://shopify-server';

  await logger.info(`Client ID: ${options.clientId}`);
  await logger.info(`MCP Endpoint: ${endpoint}`);
  await logger.divider();

  const spinner = await logger.spinner('Establishing MCP handshake...');

  try {
    const service = new MCPShopifySyncService();

    spinner.text = 'Syncing products...';
    const result = await service.syncCatalog(options.clientId, endpoint);

    spinner.stop();

    await logger.success('Catalog sync complete!');
    await logger.divider();

    await logger.keyValue('Products Found', result.productsFound.toString());
    await logger.keyValue('Products Synced', result.productsSynced.toString());
    await logger.keyValue('Products Skipped', result.productsSkipped.toString());
    await logger.keyValue('Synced At', new Date(result.syncedAt).toLocaleString());

    if (result.errors.length > 0) {
      await logger.divider();
      await logger.warn(`Errors (${result.errors.length}):`);
      for (const error of result.errors.slice(0, 5)) {
        await logger.warn(`  ${error}`);
      }
      if (result.errors.length > 5) {
        await logger.warn(`  ... and ${result.errors.length - 5} more errors`);
      }
    }

    await logger.divider();

    // Show sample products
    const products = await service.getProducts(options.clientId, 5);
    if (products.length > 0) {
      await logger.header('Sample Products');
      for (const product of products) {
        await logger.info(`  ${product.sku} - ${product.title}`);
        await logger.info(`    Price: ${product.currency} ${product.price}`);
        await logger.info(`    Inventory: ${product.inventory} units`);
        await logger.divider();
      }
    }

    await logger.info('');
    await logger.success(`Catalog data stored for client: ${options.clientId}`);
    await logger.info('');
    await logger.example('Next steps:');
    await logger.example(`  synthex ucp enable-offer --product-id "${products[0]?.sku}" --discount "10%"`);
    await logger.example(`  synthex test negotiate --agent-id "BuyerAgent_Test" --target-sku "${products[0]?.sku}"`);
  } catch (error) {
    spinner.fail('Sync failed');
    throw error;
  }
}
