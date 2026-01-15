/**
 * synthex scout Commands
 *
 * Deep research and citation discovery
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { ScoutService, type ScoutTarget } from '../services/seo-intelligence/scout-service.js';
import { ConfigManager } from '../utils/config-manager.js';

export function createScoutCommand(): Command {
  const command = new Command('scout');

  command.description('Deep research and citation discovery');

  // synthex scout run --sector "ProfessionalServices" --depth "Recursive_3"
  command
    .command('run')
    .description('Run deep research on a sector')
    .requiredOption('--sector <sector>', 'Target sector (e.g., ProfessionalServices)')
    .option(
      '--depth <depth>',
      'Research depth (Recursive_1, Recursive_2, Recursive_3)',
      'Recursive_1'
    )
    .option('--keywords <keywords>', 'Comma-separated keywords')
    .option('--competitors <competitors>', 'Comma-separated competitor domains')
    .action(async (options) => {
      try {
        await runScout(options);
      } catch (error) {
        await logger.error('Scout research failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex scout history [--limit N]
  command
    .command('history')
    .description('Show recent scout runs')
    .option('--limit <number>', 'Number of runs to show', '10')
    .action(async (options) => {
      try {
        await showScoutHistory(options);
      } catch (error) {
        await logger.error('Failed to fetch scout history');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runScout(options: {
  sector: string;
  depth?: string;
  keywords?: string;
  competitors?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  await logger.header('Scout: Deep Citation Research');
  await logger.divider();

  // Parse options
  const target: ScoutTarget = {
    sector: options.sector,
    depth: (options.depth as 'Recursive_1' | 'Recursive_2' | 'Recursive_3') || 'Recursive_1',
    keywords: options.keywords?.split(',').map((k) => k.trim()),
    competitors: options.competitors?.split(',').map((c) => c.trim()),
  };

  await logger.info(`Sector: ${target.sector}`);
  await logger.info(`Depth: ${target.depth}`);
  if (target.keywords) {
    await logger.info(`Keywords: ${target.keywords.join(', ')}`);
  }
  if (target.competitors) {
    await logger.info(`Competitors: ${target.competitors.join(', ')}`);
  }
  await logger.divider();

  const spinner = await logger.spinner('Running deep research...');

  try {
    const service = new ScoutService();
    const result = await service.runScout(target);

    spinner.stop();

    await logger.success('Research complete!');
    await logger.divider();

    await logger.header('Results');
    await logger.keyValue('Sector', result.sector);
    await logger.keyValue('Depth Level', result.depth.toString());
    await logger.keyValue('Total Sources Found', result.totalSourcesFound.toString());
    await logger.keyValue('High Authority Sources (DA 70+)', result.highAuthoritySources.length.toString());
    await logger.keyValue('AI Overview Sources', result.aiOverviewSources.length.toString());
    await logger.keyValue('Opportunity Score', `${result.opportunityScore}/100`);

    if (result.recommendations.length > 0) {
      await logger.divider();
      await logger.header('Recommendations');
      for (const rec of result.recommendations) {
        await logger.info(`  • ${rec}`);
      }
    }

    if (result.highAuthoritySources.length > 0) {
      await logger.divider();
      await logger.header('Top High-Authority Sources');

      const topSources = result.highAuthoritySources.slice(0, 5);
      for (const source of topSources) {
        await logger.info(`  ${source.domain} (DA ${source.authority})`);
        await logger.info(`    Type: ${source.citationType}`);
        await logger.info(`    URL: ${source.url}`);
        await logger.divider();
      }
    }

    if (result.aiOverviewSources.length > 0) {
      await logger.divider();
      await logger.header('AI Overview Sources');

      for (const source of result.aiOverviewSources) {
        await logger.info(`  ${source.domain} (DA ${source.authority})`);
        await logger.info(`    URL: ${source.url}`);
        await logger.divider();
      }
    }

    await logger.info('');
    await logger.success(`Results stored in database for workspace: ${config.workspace_id}`);
    await logger.info('');
    await logger.example('Next steps:');
    await logger.example('  synthex audit citation-gap --client "YourDomain.com"');
    await logger.example('  synthex scout history');
  } catch (error) {
    spinner.fail('Research failed');
    throw error;
  }
}

async function showScoutHistory(options: { limit?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Scout Run History');

  const spinner = await logger.spinner('Fetching history...');

  try {
    const service = new ScoutService();
    const limit = parseInt(options.limit || '10', 10);
    const runs = await service.getScoutRuns(limit);

    spinner.stop();

    if (runs.length === 0) {
      await logger.info('No scout runs found');
      return;
    }

    await logger.divider();

    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const data = run.analysis_data || {};

      await logger.info(`${i + 1}. ${run.sector} - ${run.created_at.split('T')[0]}`);
      await logger.info(`   Depth: Recursive_${run.depth} | Sources: ${run.total_sources || 0}`);
      await logger.info(`   High Authority: ${run.high_authority_sources || 0} | AI Overview: ${run.ai_overview_sources || 0}`);
      await logger.info(`   Opportunity Score: ${run.opportunity_score || 0}/100`);
      await logger.divider();
    }

    await logger.info('');
    await logger.example('View full details: synthex scout run --sector "YourSector"');
  } catch (error) {
    spinner.fail('Failed to fetch history');
    throw error;
  }
}
