/**
 * synthex shopify products Commands
 *
 * Manage Shopify product synchronization
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { ConfigManager } from '../../utils/config-manager.js';
import { ProductSyncService } from '../../services/shopify/product-sync.js';

export function createProductsCommand(): Command {
  const command = new Command('products');

  command.description('Manage Shopify products');

  // synthex shopify products import
  command
    .command('import')
    .description('Import products from Shopify to local database')
    .option('-l, --limit <number>', 'Maximum number of products to import', '250')
    .option('-s, --status <status>', 'Filter by status (active, draft, archived)')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .action(async (options) => {
      try {
        await runProductImport(options);
      } catch (error) {
        await logger.error('Product import failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex shopify products export
  command
    .command('export')
    .description('Export products from local database to Shopify')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .option('--product-ids <ids>', 'Comma-separated product IDs to export')
    .action(async (options) => {
      try {
        await runProductExport(options);
      } catch (error) {
        await logger.error('Product export failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex shopify products list
  command
    .command('list')
    .description('List products from Shopify')
    .option('-l, --limit <number>', 'Number of products to list', '10')
    .option('-s, --status <status>', 'Filter by status (active, draft, archived)')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .action(async (options) => {
      try {
        await runProductList(options);
      } catch (error) {
        await logger.error('Failed to list products');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex shopify products update-inventory
  command
    .command('update-inventory')
    .description('Update product inventory in Shopify')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .option('--sku <sku>', 'Product SKU')
    .option('--quantity <number>', 'Inventory quantity change (delta)')
    .option('--file <path>', 'CSV file with SKU,Quantity updates')
    .action(async (options) => {
      try {
        await runInventoryUpdate(options);
      } catch (error) {
        await logger.error('Inventory update failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runProductImport(options: {
  limit?: string;
  status?: string;
  tenantId?: string;
  shop?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  // Validate tenant ID
  if (!options.tenantId) {
    await logger.error('Tenant ID is required');
    await logger.example('synthex shopify products import --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com"');
    process.exit(1);
  }

  // Validate shop domain
  if (!options.shop) {
    await logger.error('Shop domain is required');
    await logger.example('synthex shopify products import --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com"');
    process.exit(1);
  }

  await logger.header('Shopify Product Import');
  await logger.info(`Tenant: ${options.tenantId}`);
  await logger.info(`Shop: ${options.shop}`);
  if (options.status) {
    await logger.info(`Status Filter: ${options.status}`);
  }
  await logger.info(`Limit: ${options.limit}`);
  await logger.divider();

  const spinner = await logger.spinner('Importing products from Shopify...');

  try {
    const productSync = new ProductSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const result = await productSync.importProducts({
      limit: parseInt(options.limit || '250', 10),
      status: options.status as any,
    });

    if (!result.success) {
      spinner.fail('Import failed');
      if (result.errors) {
        await logger.divider();
        await logger.error('Errors:');
        for (const error of result.errors) {
          await logger.error(`  ${error}`);
        }
      }
      process.exit(1);
    }

    spinner.succeed(`Imported ${result.productsImported} products`);

    if (result.errors && result.errors.length > 0) {
      await logger.divider();
      await logger.warn('Warnings:');
      for (const error of result.errors) {
        await logger.warn(`  ${error}`);
      }
    }
  } catch (error) {
    spinner.fail('Import error');
    throw error;
  }
}

async function runProductExport(options: {
  tenantId?: string;
  shop?: string;
  productIds?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  if (!options.tenantId || !options.shop) {
    await logger.error('Tenant ID and shop domain are required');
    await logger.example('synthex shopify products export --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com" --product-ids "id1,id2"');
    process.exit(1);
  }

  if (!options.productIds) {
    await logger.error('Product IDs are required');
    await logger.example('synthex shopify products export --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com" --product-ids "id1,id2"');
    process.exit(1);
  }

  const productIds = options.productIds.split(',').map((id) => id.trim());

  await logger.header('Shopify Product Export');
  await logger.info(`Products: ${productIds.length}`);
  await logger.divider();

  const spinner = await logger.spinner('Exporting products to Shopify...');

  try {
    const productSync = new ProductSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const result = await productSync.exportProducts(productIds);

    if (!result.success) {
      spinner.fail('Export failed');
      if (result.errors) {
        await logger.divider();
        await logger.error('Errors:');
        for (const error of result.errors) {
          await logger.error(`  ${error}`);
        }
      }
      process.exit(1);
    }

    spinner.succeed(`Exported ${result.productsExported} products`);

    if (result.errors && result.errors.length > 0) {
      await logger.divider();
      await logger.warn('Warnings:');
      for (const error of result.errors) {
        await logger.warn(`  ${error}`);
      }
    }
  } catch (error) {
    spinner.fail('Export error');
    throw error;
  }
}

async function runProductList(options: {
  limit?: string;
  status?: string;
  tenantId?: string;
  shop?: string;
}): Promise<void> {
  if (!options.tenantId || !options.shop) {
    await logger.error('Tenant ID and shop domain are required');
    await logger.example('synthex shopify products list --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  await logger.header('Shopify Products');

  const spinner = await logger.spinner('Fetching products...');

  try {
    const productSync = new ProductSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const result = await productSync.importProducts({
      limit: parseInt(options.limit || '10', 10),
      status: options.status as any,
    });

    spinner.stop();

    if (!result.success) {
      await logger.error('Failed to fetch products');
      if (result.errors) {
        for (const error of result.errors) {
          await logger.error(`  ${error}`);
        }
      }
      process.exit(1);
    }

    await logger.info(`Found ${result.productsImported} products`);
    await logger.info('(Products have been imported to local database)');
  } catch (error) {
    spinner.fail('Failed to fetch products');
    throw error;
  }
}

async function runInventoryUpdate(options: {
  tenantId?: string;
  shop?: string;
  sku?: string;
  quantity?: string;
  file?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  if (!options.tenantId || !options.shop) {
    await logger.error('Tenant ID and shop domain are required');
    await logger.example('synthex shopify products update-inventory --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com" --sku "ABC123" --quantity 10');
    process.exit(1);
  }

  let updates: Array<{ sku: string; quantity: number }> = [];

  if (options.file) {
    // Read from CSV file
    const fs = await import('fs');
    const csv = fs.readFileSync(options.file, 'utf-8');
    const lines = csv.split('\n').slice(1); // Skip header
    updates = lines
      .filter((line) => line.trim())
      .map((line) => {
        const [sku, quantity] = line.split(',');
        return { sku: sku.trim(), quantity: parseInt(quantity.trim(), 10) };
      });
  } else if (options.sku && options.quantity) {
    updates = [{ sku: options.sku, quantity: parseInt(options.quantity, 10) }];
  } else {
    await logger.error('Either --sku and --quantity, or --file is required');
    await logger.example('synthex shopify products update-inventory --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com" --sku "ABC123" --quantity 10');
    await logger.example('synthex shopify products update-inventory --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com" --file inventory.csv');
    process.exit(1);
  }

  await logger.header('Shopify Inventory Update');
  await logger.info(`Updates: ${updates.length}`);
  await logger.divider();

  const spinner = await logger.spinner('Updating inventory...');

  try {
    const productSync = new ProductSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const result = await productSync.updateInventory(updates);

    if (!result.success) {
      spinner.fail('Update failed');
      if (result.errors) {
        await logger.divider();
        await logger.error('Errors:');
        for (const error of result.errors) {
          await logger.error(`  ${error}`);
        }
      }
      process.exit(1);
    }

    spinner.succeed(`Updated ${result.productsUpdated} variants`);

    if (result.errors && result.errors.length > 0) {
      await logger.divider();
      await logger.warn('Warnings:');
      for (const error of result.errors) {
        await logger.warn(`  ${error}`);
      }
    }
  } catch (error) {
    spinner.fail('Update error');
    throw error;
  }
}
