/**
 * synthex init Command
 *
 * Initializes Synthex environment for a specific market and region
 *
 * Usage:
 *   synthex init --market "ANZ_SMB" --region "AU-SE1"
 */

import { Command } from 'commander';
import { configManager, ConfigManager } from '../utils/config-manager.js';
import { logger } from '../utils/logger.js';

export function createInitCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialize Synthex environment for a specific market and region')
    .option('-m, --market <market>', 'Target market segment (ANZ_SMB, ANZ_ENTERPRISE, US_SMB, UK_SMB)')
    .option('-r, --region <region>', 'Cloud region code (AU-SE1, AU-SE2, NZ-NR1, US-EA1, etc.)')
    .option('--force', 'Force re-initialization (overwrites existing config)')
    .action(async (options) => {
      try {
        await runInit(options);
      } catch (error) {
        await logger.error('Initialization failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runInit(options: {
  market?: string;
  region?: string;
  force?: boolean;
}): Promise<void> {
  // Check if already initialized
  if (configManager.isInitialized() && !options.force) {
    const existingConfig = configManager.loadConfig();

    await logger.warn('Synthex is already initialized');
    await logger.info(`Current market: ${existingConfig?.market}`);
    await logger.info(`Current region: ${existingConfig?.region}`);
    await logger.info('Use --force to re-initialize');

    process.exit(0);
  }

  // Get market from options or environment
  const market = options.market || process.env.SYNTHEX_MARKET;
  if (!market) {
    await logger.error('Market is required');
    await logger.info('Available markets:');
    ConfigManager.getValidMarkets().forEach((m) => {
      logger.log(`  - ${m}`);
    });
    await logger.divider();
    await logger.example('synthex init --market "ANZ_SMB" --region "AU-SE1"');
    process.exit(1);
  }

  // Get region from options or environment
  const region = options.region || process.env.SYNTHEX_REGION;
  if (!region) {
    await logger.error('Region is required');
    await logger.info('Available regions:');
    ConfigManager.getValidRegions().forEach((r) => {
      const name = ConfigManager.getRegionName(r);
      logger.log(`  - ${r} (${name})`);
    });
    await logger.divider();
    await logger.example('synthex init --market "ANZ_SMB" --region "AU-SE1"');
    process.exit(1);
  }

  // Start initialization
  const spinner = await logger.spinner('Initializing Synthex...');

  try {
    // Initialize configuration
    const config = await configManager.initialize(market, region);

    spinner.succeed('Synthex initialized successfully');

    // Print configuration summary
    await logger.divider();
    await logger.header('Configuration');

    const marketSettings = ConfigManager.getMarketSettings(market);
    const regionName = ConfigManager.getRegionName(region);

    await logger.keyValue('Market', `${market} (${getMarketDescription(market)})`);
    await logger.keyValue('Region', `${region} (${regionName})`);
    await logger.keyValue('Workspace', config.workspace_id);
    await logger.keyValue('Project ID', config.project_id);

    await logger.divider();
    await logger.header('Settings');

    await logger.keyValue('Currency', marketSettings?.currency || 'N/A');
    await logger.keyValue('Timezone', marketSettings?.timezone || 'N/A');
    await logger.keyValue('Tax Mode', marketSettings?.tax_mode || 'N/A');
    await logger.keyValue('Locale', marketSettings?.locale || 'N/A');

    await logger.divider();
    await logger.header('Next Steps');

    await logger.info('1. Validate business ID:');
    await logger.example('  synthex check business-id --country AU --id "12345678901"');

    await logger.info('2. Authenticate with Shopify:');
    await logger.example('  synthex auth login --service shopify --tenant-id "YOUR_CLIENT_ID"');

    await logger.info('3. Authenticate with Google Merchant Center:');
    await logger.example('  synthex auth login --service google-merchant --client-id "YOUR_AGENCY_ID"');

    await logger.divider();
    await logger.info(`Config saved: ${configManager.getConfigPath()}`);
  } catch (error) {
    spinner.fail('Initialization failed');
    throw error;
  }
}

/**
 * Get human-readable market description
 */
function getMarketDescription(market: string): string {
  const descriptions: Record<string, string> = {
    ANZ_SMB: 'Australia/New Zealand Small Business',
    ANZ_ENTERPRISE: 'Australia/New Zealand Enterprise',
    US_SMB: 'United States Small Business',
    US_ENTERPRISE: 'United States Enterprise',
    UK_SMB: 'United Kingdom Small Business',
    UK_ENTERPRISE: 'United Kingdom Enterprise',
  };

  return descriptions[market] || market;
}
