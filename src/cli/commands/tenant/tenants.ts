/**
 * synthex tenant Commands
 *
 * Manage tenants and workspace context
 */

import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { TenantManager } from '../../services/tenant/tenant-manager.js';
import { WorkspaceManager } from '../../services/tenant/workspace-manager.js';
import { CredentialManager } from '../../services/tenant/credential-manager.js';

export function createTenantsCommand(): Command {
  const command = new Command('tenants');

  command.description('Manage tenants');

  // synthex tenant tenants create
  command
    .command('create')
    .description('Create a new tenant')
    .option('--tenant-id <id>', 'Tenant ID (e.g., SMB_CLIENT_001) (required)')
    .option('--name <name>', 'Tenant name (required)')
    .option('--type <type>', 'Tenant type: shopify, google-merchant, mixed (required)')
    .option('--market <market>', 'Market (ANZ_SMB, ANZ_ENTERPRISE, US_SMB, UK_SMB)')
    .option('--region <region>', 'Region (AU-SE1, NZ-NR1, US-EA1, EU-WE1)')
    .option('--shopify-shop <shop>', 'Shopify shop domain (e.g., mystore.myshopify.com)')
    .option('--gmc-merchant-id <id>', 'Google Merchant Center ID')
    .option('--industry <industry>', 'Industry')
    .option('--website <url>', 'Website URL')
    .option('--email <email>', 'Contact email')
    .option('--phone <phone>', 'Contact phone')
    .action(async (options) => {
      try {
        await runTenantCreate(options);
      } catch (error) {
        await logger.error('Failed to create tenant');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant tenants list
  command
    .command('list')
    .description('List all tenants')
    .option('--type <type>', 'Filter by type (shopify, google-merchant, mixed)')
    .option('--status <status>', 'Filter by status (active, inactive, suspended)')
    .option('--market <market>', 'Filter by market')
    .option('-l, --limit <number>', 'Limit results')
    .action(async (options) => {
      try {
        await runTenantList(options);
      } catch (error) {
        await logger.error('Failed to list tenants');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant tenants get
  command
    .command('get')
    .description('Get tenant details')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .action(async (options) => {
      try {
        await runTenantGet(options);
      } catch (error) {
        await logger.error('Failed to get tenant');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant tenants update
  command
    .command('update')
    .description('Update tenant')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--name <name>', 'New name')
    .option('--status <status>', 'New status (active, inactive, suspended)')
    .option('--shopify-shop <shop>', 'Shopify shop domain')
    .option('--gmc-merchant-id <id>', 'Google Merchant Center ID')
    .option('--industry <industry>', 'Industry')
    .option('--website <url>', 'Website URL')
    .option('--email <email>', 'Contact email')
    .option('--phone <phone>', 'Contact phone')
    .action(async (options) => {
      try {
        await runTenantUpdate(options);
      } catch (error) {
        await logger.error('Failed to update tenant');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant tenants delete
  command
    .command('delete')
    .description('Delete tenant')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .option('--permanent', 'Permanently delete (default: soft delete)')
    .action(async (options) => {
      try {
        await runTenantDelete(options);
      } catch (error) {
        await logger.error('Failed to delete tenant');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex tenant tenants stats
  command
    .command('stats')
    .description('Get tenant statistics')
    .option('--tenant-id <id>', 'Tenant ID (required)')
    .action(async (options) => {
      try {
        await runTenantStats(options);
      } catch (error) {
        await logger.error('Failed to get statistics');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runTenantCreate(options: {
  tenantId?: string;
  name?: string;
  type?: string;
  market?: string;
  region?: string;
  shopifyShop?: string;
  gmcMerchantId?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  if (!options.tenantId || !options.name || !options.type) {
    await logger.error('Tenant ID, name, and type are required');
    await logger.example(
      'synthex tenant tenants create --tenant-id "SMB_CLIENT_001" --name "Acme Corp" --type shopify --shopify-shop "acme.myshopify.com"'
    );
    process.exit(1);
  }

  if (!['shopify', 'google-merchant', 'mixed'].includes(options.type)) {
    await logger.error('Type must be: shopify, google-merchant, or mixed');
    process.exit(1);
  }

  await logger.header('Create Tenant');
  await logger.info(`Tenant ID: ${options.tenantId}`);
  await logger.info(`Name: ${options.name}`);
  await logger.info(`Type: ${options.type}`);
  await logger.divider();

  const spinner = await logger.spinner('Creating tenant...');

  try {
    const manager = new TenantManager();

    const metadata: any = {};
    if (options.shopifyShop) metadata.shopifyShop = options.shopifyShop;
    if (options.gmcMerchantId) metadata.gmcMerchantId = options.gmcMerchantId;
    if (options.industry) metadata.industry = options.industry;
    if (options.website) metadata.website = options.website;
    if (options.email) metadata.contactEmail = options.email;
    if (options.phone) metadata.contactPhone = options.phone;

    const tenant = await manager.createTenant({
      tenantId: options.tenantId,
      name: options.name,
      type: options.type as any,
      market: options.market,
      region: options.region,
      metadata,
    });

    spinner.succeed('Tenant created successfully');

    await logger.divider();
    await logger.keyValue('Tenant ID', tenant.tenantId);
    await logger.keyValue('Name', tenant.name);
    await logger.keyValue('Type', tenant.type);
    await logger.keyValue('Market', tenant.market);
    await logger.keyValue('Region', tenant.region);
    await logger.keyValue('Status', tenant.status);

    if (tenant.metadata.shopifyShop) {
      await logger.divider();
      await logger.info('Shopify Configuration:');
      await logger.keyValue('  Shop', tenant.metadata.shopifyShop);
    }

    if (tenant.metadata.gmcMerchantId) {
      await logger.divider();
      await logger.info('Google Merchant Center Configuration:');
      await logger.keyValue('  Merchant ID', tenant.metadata.gmcMerchantId);
    }

    await logger.divider();
    await logger.info('Next steps:');
    if (options.type === 'shopify' || options.type === 'mixed') {
      await logger.example(
        `synthex auth login --service shopify --tenant-id "${tenant.tenantId}"`
      );
    }
    if (options.type === 'google-merchant' || options.type === 'mixed') {
      await logger.example(
        `synthex auth login --service google-merchant --client-id "${tenant.tenantId}"`
      );
    }
  } catch (error) {
    spinner.fail('Failed to create tenant');
    throw error;
  }
}

async function runTenantList(options: {
  type?: string;
  status?: string;
  market?: string;
  limit?: string;
}): Promise<void> {
  await logger.header('Tenants');

  const spinner = await logger.spinner('Fetching tenants...');

  try {
    const manager = new TenantManager();

    const listOptions: any = {};
    if (options.type) listOptions.type = options.type as any;
    if (options.status) listOptions.status = options.status as any;
    if (options.market) listOptions.market = options.market;
    if (options.limit) listOptions.limit = parseInt(options.limit, 10);

    const tenants = await manager.listTenants(listOptions);

    spinner.stop();

    if (tenants.length === 0) {
      await logger.info('No tenants found');
      await logger.divider();
      await logger.info('Create your first tenant:');
      await logger.example(
        'synthex tenant tenants create --tenant-id "SMB_CLIENT_001" --name "Acme Corp" --type shopify'
      );
      return;
    }

    await logger.info(`Found ${tenants.length} tenant(s)`);
    await logger.divider();

    for (const tenant of tenants) {
      const statusIcon = tenant.status === 'active' ? '✓' : tenant.status === 'inactive' ? '⚠' : '✗';
      await logger.info(`${statusIcon} ${tenant.name} (${tenant.tenantId})`);
      await logger.info(`   Type: ${tenant.type} | Market: ${tenant.market} | Status: ${tenant.status}`);
      if (tenant.metadata.shopifyShop) {
        await logger.info(`   Shopify: ${tenant.metadata.shopifyShop}`);
      }
      if (tenant.metadata.gmcMerchantId) {
        await logger.info(`   GMC: ${tenant.metadata.gmcMerchantId}`);
      }
      await logger.divider();
    }
  } catch (error) {
    spinner.fail('Failed to list tenants');
    throw error;
  }
}

async function runTenantGet(options: { tenantId?: string }): Promise<void> {
  if (!options.tenantId) {
    await logger.error('Tenant ID is required');
    await logger.example('synthex tenant tenants get --tenant-id "SMB_CLIENT_001"');
    process.exit(1);
  }

  await logger.header('Tenant Details');

  const spinner = await logger.spinner('Fetching tenant...');

  try {
    const manager = new TenantManager();
    const tenant = await manager.getTenant(options.tenantId);

    spinner.stop();

    if (!tenant) {
      await logger.error(`Tenant "${options.tenantId}" not found`);
      process.exit(1);
    }

    await logger.divider();
    await logger.keyValue('Tenant ID', tenant.tenantId);
    await logger.keyValue('Name', tenant.name);
    await logger.keyValue('Type', tenant.type);
    await logger.keyValue('Market', tenant.market);
    await logger.keyValue('Region', tenant.region);
    await logger.keyValue('Status', tenant.status);
    await logger.keyValue('Created', new Date(tenant.createdAt).toLocaleString());
    await logger.keyValue('Updated', new Date(tenant.updatedAt).toLocaleString());

    if (Object.keys(tenant.metadata).length > 0) {
      await logger.divider();
      await logger.header('Metadata');
      for (const [key, value] of Object.entries(tenant.metadata)) {
        if (value) {
          await logger.keyValue(key, value.toString());
        }
      }
    }
  } catch (error) {
    spinner.fail('Failed to get tenant');
    throw error;
  }
}

async function runTenantUpdate(options: {
  tenantId?: string;
  name?: string;
  status?: string;
  shopifyShop?: string;
  gmcMerchantId?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  if (!options.tenantId) {
    await logger.error('Tenant ID is required');
    await logger.example('synthex tenant tenants update --tenant-id "SMB_CLIENT_001" --name "New Name"');
    process.exit(1);
  }

  await logger.header('Update Tenant');

  const spinner = await logger.spinner('Updating tenant...');

  try {
    const manager = new TenantManager();

    const updates: any = {};
    if (options.name) updates.name = options.name;
    if (options.status) updates.status = options.status as any;

    const metadata: any = {};
    if (options.shopifyShop) metadata.shopifyShop = options.shopifyShop;
    if (options.gmcMerchantId) metadata.gmcMerchantId = options.gmcMerchantId;
    if (options.industry) metadata.industry = options.industry;
    if (options.website) metadata.website = options.website;
    if (options.email) metadata.contactEmail = options.email;
    if (options.phone) metadata.contactPhone = options.phone;

    if (Object.keys(metadata).length > 0) {
      updates.metadata = metadata;
    }

    const tenant = await manager.updateTenant(options.tenantId, updates);

    spinner.succeed('Tenant updated successfully');

    await logger.divider();
    await logger.keyValue('Tenant ID', tenant.tenantId);
    await logger.keyValue('Name', tenant.name);
    await logger.keyValue('Status', tenant.status);
    await logger.keyValue('Updated', new Date(tenant.updatedAt).toLocaleString());
  } catch (error) {
    spinner.fail('Failed to update tenant');
    throw error;
  }
}

async function runTenantDelete(options: { tenantId?: string; permanent?: boolean }): Promise<void> {
  if (!options.tenantId) {
    await logger.error('Tenant ID is required');
    await logger.example('synthex tenant tenants delete --tenant-id "SMB_CLIENT_001"');
    process.exit(1);
  }

  await logger.header('Delete Tenant');

  if (options.permanent) {
    await logger.warn('⚠ WARNING: Permanent deletion cannot be undone!');
    await logger.divider();
  }

  const spinner = await logger.spinner(
    options.permanent ? 'Permanently deleting tenant...' : 'Deactivating tenant...'
  );

  try {
    const manager = new TenantManager();
    await manager.deleteTenant(options.tenantId, options.permanent || false);

    spinner.succeed(
      options.permanent ? 'Tenant permanently deleted' : 'Tenant deactivated'
    );

    if (!options.permanent) {
      await logger.divider();
      await logger.info('Tenant has been soft-deleted (status: inactive)');
      await logger.info('To permanently delete:');
      await logger.example(
        `synthex tenant tenants delete --tenant-id "${options.tenantId}" --permanent`
      );
    }
  } catch (error) {
    spinner.fail('Failed to delete tenant');
    throw error;
  }
}

async function runTenantStats(options: { tenantId?: string }): Promise<void> {
  if (!options.tenantId) {
    await logger.error('Tenant ID is required');
    await logger.example('synthex tenant tenants stats --tenant-id "SMB_CLIENT_001"');
    process.exit(1);
  }

  await logger.header('Tenant Statistics');

  const spinner = await logger.spinner('Fetching statistics...');

  try {
    const manager = new TenantManager();
    const stats = await manager.getTenantStats(options.tenantId);

    spinner.stop();

    await logger.divider();

    if (stats.services.shopify) {
      await logger.header('Shopify');
      await logger.keyValue('Connected', stats.services.shopify.connected ? 'Yes' : 'No');
      if (stats.services.shopify.shop) {
        await logger.keyValue('Shop', stats.services.shopify.shop);
      }
      await logger.keyValue('Products', stats.services.shopify.productsCount?.toString() || '0');
      await logger.keyValue('Orders', stats.services.shopify.ordersCount?.toString() || '0');
      await logger.divider();
    }

    if (stats.services.googleMerchant) {
      await logger.header('Google Merchant Center');
      await logger.keyValue('Connected', stats.services.googleMerchant.connected ? 'Yes' : 'No');
      if (stats.services.googleMerchant.merchantId) {
        await logger.keyValue('Merchant ID', stats.services.googleMerchant.merchantId);
      }
      await logger.keyValue('Products Synced', stats.services.googleMerchant.productsSynced?.toString() || '0');
      await logger.keyValue('Approved Products', stats.services.googleMerchant.approvedProducts?.toString() || '0');
      await logger.divider();
    }

    await logger.header('Credentials');
    await logger.keyValue('Total', stats.credentials.total.toString());
    await logger.keyValue('Active', stats.credentials.active.toString());
    await logger.keyValue('Expired', stats.credentials.expired.toString());
  } catch (error) {
    spinner.fail('Failed to get statistics');
    throw error;
  }
}
