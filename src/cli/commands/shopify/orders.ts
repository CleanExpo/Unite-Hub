/**
 * synthex shopify orders Commands
 *
 * Manage Shopify order synchronization
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { ConfigManager } from '../../utils/config-manager.js';
import { OrderSyncService } from '../../services/shopify/order-sync.js';

export function createOrdersCommand(): Command {
  const command = new Command('orders');

  command.description('Manage Shopify orders');

  // synthex shopify orders import
  command
    .command('import')
    .description('Import orders from Shopify to local database')
    .option('-l, --limit <number>', 'Maximum number of orders to import', '250')
    .option('-s, --status <status>', 'Filter by financial status (pending, paid, refunded, etc.)')
    .option('--after <date>', 'Import orders created after this date (YYYY-MM-DD)')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .action(async (options) => {
      try {
        await runOrderImport(options);
      } catch (error) {
        await logger.error('Order import failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex shopify orders list
  command
    .command('list')
    .description('List orders from Shopify')
    .option('-l, --limit <number>', 'Number of orders to list', '10')
    .option('-s, --status <status>', 'Filter by financial status')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .action(async (options) => {
      try {
        await runOrderList(options);
      } catch (error) {
        await logger.error('Failed to list orders');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex shopify orders get
  command
    .command('get')
    .description('Get order details by Shopify ID')
    .option('--id <shopifyId>', 'Shopify order ID (gid://shopify/Order/...)')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .action(async (options) => {
      try {
        await runOrderGet(options);
      } catch (error) {
        await logger.error('Failed to get order');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex shopify orders sync-status
  command
    .command('sync-status')
    .description('Sync order status updates from Shopify')
    .option('--id <shopifyId>', 'Shopify order ID to sync')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--shop <domain>', 'Shopify shop domain (mystore.myshopify.com)')
    .action(async (options) => {
      try {
        await runOrderStatusSync(options);
      } catch (error) {
        await logger.error('Status sync failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runOrderImport(options: {
  limit?: string;
  status?: string;
  after?: string;
  tenantId?: string;
  shop?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  if (!options.tenantId || !options.shop) {
    await logger.error('Tenant ID and shop domain are required');
    await logger.example('synthex shopify orders import --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com"');
    process.exit(1);
  }

  await logger.header('Shopify Order Import');
  await logger.info(`Tenant: ${options.tenantId}`);
  await logger.info(`Shop: ${options.shop}`);
  if (options.status) {
    await logger.info(`Status Filter: ${options.status}`);
  }
  if (options.after) {
    await logger.info(`After Date: ${options.after}`);
  }
  await logger.info(`Limit: ${options.limit}`);
  await logger.divider();

  const spinner = await logger.spinner('Importing orders from Shopify...');

  try {
    const orderSync = new OrderSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const importOptions: any = {
      limit: parseInt(options.limit || '250', 10),
    };

    if (options.status) {
      importOptions.status = options.status;
    }

    if (options.after) {
      importOptions.createdAfter = new Date(options.after);
    }

    const result = await orderSync.importOrders(importOptions);

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

    spinner.succeed(`Imported ${result.ordersImported} orders`);

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

async function runOrderList(options: {
  limit?: string;
  status?: string;
  tenantId?: string;
  shop?: string;
}): Promise<void> {
  if (!options.tenantId || !options.shop) {
    await logger.error('Tenant ID and shop domain are required');
    await logger.example('synthex shopify orders list --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  await logger.header('Shopify Orders');

  const spinner = await logger.spinner('Fetching orders...');

  try {
    const orderSync = new OrderSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const result = await orderSync.importOrders({
      limit: parseInt(options.limit || '10', 10),
      status: options.status,
    });

    spinner.stop();

    if (!result.success) {
      await logger.error('Failed to fetch orders');
      if (result.errors) {
        for (const error of result.errors) {
          await logger.error(`  ${error}`);
        }
      }
      process.exit(1);
    }

    await logger.info(`Found ${result.ordersImported} orders`);
    await logger.info('(Orders have been imported to local database)');
  } catch (error) {
    spinner.fail('Failed to fetch orders');
    throw error;
  }
}

async function runOrderGet(options: { id?: string; tenantId?: string; shop?: string }): Promise<void> {
  if (!options.id || !options.tenantId || !options.shop) {
    await logger.error('Order ID, tenant ID, and shop domain are required');
    await logger.example('synthex shopify orders get --id "gid://shopify/Order/12345" --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  await logger.header('Shopify Order Details');

  const spinner = await logger.spinner('Fetching order...');

  try {
    const orderSync = new OrderSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const order = await orderSync.getOrder(options.id);

    spinner.stop();

    if (!order) {
      await logger.error('Order not found');
      process.exit(1);
    }

    await logger.divider();
    await logger.keyValue('Order Number', `#${order.orderNumber}`);
    await logger.keyValue('Email', order.email);
    await logger.keyValue('Financial Status', order.financialStatus);
    await logger.keyValue('Fulfillment Status', order.fulfillmentStatus || 'unfulfilled');
    await logger.keyValue('Total Price', `${order.currency} ${order.totalPrice.toFixed(2)}`);
    await logger.keyValue('Subtotal', `${order.currency} ${order.subtotalPrice.toFixed(2)}`);
    await logger.keyValue('Tax', `${order.currency} ${order.totalTax.toFixed(2)}`);
    await logger.keyValue('Shipping', `${order.currency} ${order.totalShipping.toFixed(2)}`);
    await logger.keyValue('Items', order.lineItems.length.toString());
    await logger.keyValue('Created', new Date(order.createdAt).toLocaleString());

    if (order.customer) {
      await logger.divider();
      await logger.header('Customer');
      await logger.keyValue('Name', `${order.customer.firstName || ''} ${order.customer.lastName || ''}`);
      await logger.keyValue('Email', order.customer.email);
      if (order.customer.ordersCount) {
        await logger.keyValue('Total Orders', order.customer.ordersCount.toString());
      }
      if (order.customer.totalSpent) {
        await logger.keyValue('Total Spent', `${order.currency} ${order.customer.totalSpent.toFixed(2)}`);
      }
    }

    if (order.shippingAddress) {
      await logger.divider();
      await logger.header('Shipping Address');
      await logger.keyValue('Name', `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`);
      if (order.shippingAddress.address1) {
        await logger.keyValue('Address', order.shippingAddress.address1);
      }
      if (order.shippingAddress.address2) {
        await logger.info(`         ${order.shippingAddress.address2}`);
      }
      await logger.keyValue('City', `${order.shippingAddress.city || ''}, ${order.shippingAddress.province || ''} ${order.shippingAddress.zip || ''}`);
      await logger.keyValue('Country', order.shippingAddress.country || '');
    }

    await logger.divider();
    await logger.header('Line Items');
    for (const item of order.lineItems) {
      await logger.info(`${item.quantity}x ${item.title} - ${order.currency} ${item.price.toFixed(2)}`);
      if (item.sku) {
        await logger.info(`   SKU: ${item.sku}`);
      }
    }
  } catch (error) {
    spinner.fail('Failed to fetch order');
    throw error;
  }
}

async function runOrderStatusSync(options: { id?: string; tenantId?: string; shop?: string }): Promise<void> {
  if (!options.id || !options.tenantId || !options.shop) {
    await logger.error('Order ID, tenant ID, and shop domain are required');
    await logger.example('synthex shopify orders sync-status --id "gid://shopify/Order/12345" --tenant-id "SMB_CLIENT_001" --shop "mystore.myshopify.com"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  await logger.header('Order Status Sync');

  const spinner = await logger.spinner('Syncing order status...');

  try {
    const orderSync = new OrderSyncService({
      shop: options.shop,
      tenantId: options.tenantId,
      workspaceId: config.workspace_id,
    });

    const result = await orderSync.syncOrderStatus(options.id);

    if (!result.success) {
      spinner.fail('Sync failed');
      if (result.errors) {
        await logger.divider();
        await logger.error('Errors:');
        for (const error of result.errors) {
          await logger.error(`  ${error}`);
        }
      }
      process.exit(1);
    }

    spinner.succeed('Order status synced successfully');
  } catch (error) {
    spinner.fail('Sync error');
    throw error;
  }
}
