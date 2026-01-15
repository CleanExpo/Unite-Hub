/**
 * synthex templates Commands
 *
 * Manage and use tenant templates
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { TenantTemplatesService } from '../services/advanced/tenant-templates.js';
import { ConfigManager } from '../utils/config-manager.js';

export function createTemplatesCommand(): Command {
  const command = new Command('templates');

  command.description('Manage tenant templates');

  // synthex templates list
  command
    .command('list')
    .description('List all available templates')
    .action(async () => {
      try {
        await runTemplatesList();
      } catch (error) {
        await logger.error('Failed to list templates');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex templates show --template-id <id>
  command
    .command('show')
    .description('Show template details')
    .option('--template-id <id>', 'Template ID')
    .action(async (options) => {
      try {
        await runTemplatesShow(options);
      } catch (error) {
        await logger.error('Failed to show template');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex templates create-tenant --template-id <id> --tenant-id <id> --name <name>
  command
    .command('create-tenant')
    .description('Create tenant from template')
    .option('--template-id <id>', 'Template ID')
    .option('--tenant-id <id>', 'New tenant ID')
    .option('--name <name>', 'New tenant name')
    .option('--shopify-shop <shop>', 'Shopify shop domain')
    .option('--gmc-merchant-id <id>', 'Google Merchant Center ID')
    .action(async (options) => {
      try {
        await runTemplatesCreateTenant(options);
      } catch (error) {
        await logger.error('Failed to create tenant from template');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runTemplatesList(): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Available Templates');

  const spinner = await logger.spinner('Fetching templates...');

  try {
    const service = new TenantTemplatesService();
    const templates = await service.listTemplates();

    spinner.stop();

    if (templates.length === 0) {
      await logger.info('No templates found');
      return;
    }

    await logger.info(`Found ${templates.length} template(s)`);
    await logger.divider();

    for (const template of templates) {
      const badge = template.isBuiltin ? '[Built-in]' : '[Custom]';
      await logger.info(`${badge} ${template.name} (${template.id})`);
      await logger.info(`   ${template.description}`);
      await logger.info(`   Type: ${template.type} | Market: ${template.market} | Region: ${template.region}`);
      await logger.divider();
    }

    await logger.info('To see template details:');
    await logger.example('synthex templates show --template-id <TEMPLATE_ID>');
  } catch (error) {
    spinner.fail('Failed to list templates');
    throw error;
  }
}

async function runTemplatesShow(options: { templateId?: string }): Promise<void> {
  if (!options.templateId) {
    await logger.error('--template-id is required');
    await logger.example('synthex templates show --template-id shopify-smb-anz');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Template Details');

  const spinner = await logger.spinner('Fetching template...');

  try {
    const service = new TenantTemplatesService();
    const template = await service.getTemplate(options.templateId);

    spinner.stop();

    if (!template) {
      await logger.error(`Template "${options.templateId}" not found`);
      process.exit(1);
    }

    await logger.divider();
    await logger.keyValue('ID', template.id);
    await logger.keyValue('Name', template.name);
    await logger.keyValue('Description', template.description);
    await logger.keyValue('Type', template.type);
    await logger.keyValue('Market', template.market);
    await logger.keyValue('Region', template.region);
    await logger.keyValue('Built-in', template.isBuiltin ? 'Yes' : 'No');

    if (template.requiredFields.length > 0) {
      await logger.divider();
      await logger.header('Required Fields');
      for (const field of template.requiredFields) {
        await logger.info(`  - ${field}`);
      }
    }

    if (template.optionalFields.length > 0) {
      await logger.divider();
      await logger.header('Optional Fields');
      for (const field of template.optionalFields) {
        await logger.info(`  - ${field}`);
      }
    }

    if (template.setupSteps.length > 0) {
      await logger.divider();
      await logger.header('Setup Steps');
      for (const step of template.setupSteps) {
        await logger.info(step);
      }
    }

    await logger.divider();
    await logger.info('To create tenant from this template:');
    await logger.example(`synthex templates create-tenant --template-id ${template.id} --tenant-id "YOUR_ID" --name "Your Name"`);
  } catch (error) {
    spinner.fail('Failed to show template');
    throw error;
  }
}

async function runTemplatesCreateTenant(options: {
  templateId?: string;
  tenantId?: string;
  name?: string;
  shopifyShop?: string;
  gmcMerchantId?: string;
}): Promise<void> {
  if (!options.templateId || !options.tenantId || !options.name) {
    await logger.error('--template-id, --tenant-id, and --name are required');
    await logger.example('synthex templates create-tenant --template-id shopify-smb-anz --tenant-id "CLIENT_001" --name "Acme Corp" --shopify-shop "acme.myshopify.com"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Create Tenant from Template');

  const spinner = await logger.spinner('Creating tenant...');

  try {
    const service = new TenantTemplatesService();

    const tenant = await service.createTenantFromTemplate(options.templateId, {
      tenantId: options.tenantId,
      name: options.name,
      metadata: {
        shopifyShop: options.shopifyShop,
        gmcMerchantId: options.gmcMerchantId,
      },
    });

    spinner.succeed('Tenant created successfully');

    await logger.divider();
    await logger.keyValue('Tenant ID', tenant.tenantId);
    await logger.keyValue('Name', tenant.name);
    await logger.keyValue('Type', tenant.type);
    await logger.keyValue('Market', tenant.market);
    await logger.keyValue('Region', tenant.region);

    // Show setup steps
    const template = await service.getTemplate(options.templateId);
    if (template && template.setupSteps.length > 0) {
      await logger.divider();
      await logger.header('Next Steps');
      for (const step of template.setupSteps) {
        const replaced = step.replace(/YOUR_TENANT_ID/g, tenant.tenantId);
        await logger.info(replaced);
      }
    }
  } catch (error) {
    spinner.fail('Failed to create tenant');
    throw error;
  }
}
