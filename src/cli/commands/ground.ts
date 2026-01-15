/**
 * synthex ground Commands
 *
 * ANZ geospatial grounding with local regulations and landmarks
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { GroundService, type ANZRegion } from '../services/content/ground-service.js';

export function createGroundCommand(): Command {
  const command = new Command('ground');

  command.description('ANZ geospatial grounding with local context');

  // synthex ground local --region "VIC" --target "./output/story_v1.md"
  command
    .command('local')
    .description('Add ANZ geospatial grounding to content')
    .requiredOption('--region <region>', 'ANZ region (VIC, NSW, QLD, SA, WA, TAS, ACT, NT, NZ_North, NZ_South)')
    .requiredOption('--target <path>', 'Target file to ground')
    .option('--output <path>', 'Output file path (default: target_grounded.md)')
    .option('--include-regulations', 'Include regulatory references', true)
    .option('--include-landmarks', 'Include landmark references', true)
    .option('--industry-context <industry>', 'Industry context (e.g., "professional services", "retail")')
    .action(async (options) => {
      try {
        await runGroundLocal(options);
      } catch (error) {
        await logger.error('Grounding failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex ground regions
  command
    .command('regions')
    .description('List available ANZ regions')
    .action(async () => {
      await showAvailableRegions();
    });

  // synthex ground context --region "VIC"
  command
    .command('context')
    .description('Show regional context details')
    .requiredOption('--region <region>', 'ANZ region')
    .action(async (options) => {
      await showRegionalContext(options);
    });

  return command;
}

async function runGroundLocal(options: {
  region: string;
  target: string;
  output?: string;
  includeRegulations?: boolean;
  includeLandmarks?: boolean;
  industryContext?: string;
}): Promise<void> {
  await logger.header('Ground: ANZ Geospatial Context');
  await logger.divider();

  // Validate region
  const validRegions = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT', 'NZ_North', 'NZ_South'];
  const region = options.region as ANZRegion;

  if (!validRegions.includes(region)) {
    await logger.error(`Invalid region: ${region}`);
    await logger.info(`Valid regions: ${validRegions.join(', ')}`);
    await logger.info('Run: synthex ground regions');
    process.exit(1);
  }

  await logger.info(`Region: ${region}`);
  await logger.info(`Target: ${options.target}`);
  await logger.info(`Include Regulations: ${options.includeRegulations ? 'Yes' : 'No'}`);
  await logger.info(`Include Landmarks: ${options.includeLandmarks ? 'Yes' : 'No'}`);
  if (options.industryContext) {
    await logger.info(`Industry: ${options.industryContext}`);
  }
  await logger.divider();

  const spinner = await logger.spinner('Applying geospatial grounding...');

  try {
    const service = new GroundService();

    const result = await service.groundLocal({
      region,
      targetFile: options.target,
      outputPath: options.output,
      includeRegulations: options.includeRegulations,
      includeLandmarks: options.includeLandmarks,
      industryContext: options.industryContext,
    });

    spinner.stop();

    await logger.success('Grounding complete!');
    await logger.divider();

    await logger.keyValue('Region', result.region);
    await logger.keyValue('Regulations Added', result.regulationsAdded.toString());
    await logger.keyValue('Landmarks Added', result.landmarksAdded.toString());
    await logger.keyValue('Total Context Injections', result.contextInjections.toString());
    await logger.keyValue('Output Path', result.outputPath);

    await logger.divider();

    if (result.contextInjections >= 10) {
      await logger.success('Excellent grounding! Content is well-localized.');
    } else if (result.contextInjections >= 5) {
      await logger.info('Good grounding. Content has regional context.');
    } else {
      await logger.info('Minimal grounding. Content may be too generic for localization.');
    }

    await logger.info('');
    await logger.success(`Grounded content saved to: ${result.outputPath}`);
    await logger.info('');
    await logger.example('Next steps:');
    await logger.example(`  cat ${result.outputPath}`);
    await logger.example(`  synthex ground context --region "${region}"`);
  } catch (error) {
    spinner.fail('Grounding failed');
    throw error;
  }
}

async function showAvailableRegions(): Promise<void> {
  await logger.header('Available ANZ Regions');
  await logger.divider();

  const regions = [
    { code: 'VIC', name: 'Victoria', capital: 'Melbourne' },
    { code: 'NSW', name: 'New South Wales', capital: 'Sydney' },
    { code: 'QLD', name: 'Queensland', capital: 'Brisbane' },
    { code: 'SA', name: 'South Australia', capital: 'Adelaide' },
    { code: 'WA', name: 'Western Australia', capital: 'Perth' },
    { code: 'TAS', name: 'Tasmania', capital: 'Hobart' },
    { code: 'ACT', name: 'Australian Capital Territory', capital: 'Canberra' },
    { code: 'NT', name: 'Northern Territory', capital: 'Darwin' },
    { code: 'NZ_North', name: 'New Zealand - North Island', capital: 'Auckland/Wellington' },
    { code: 'NZ_South', name: 'New Zealand - South Island', capital: 'Christchurch' },
  ];

  await logger.info('Australian States & Territories:');
  await logger.divider();

  for (const region of regions.slice(0, 8)) {
    await logger.info(`  ${region.code.padEnd(6)} - ${region.name.padEnd(30)} (${region.capital})`);
  }

  await logger.divider();
  await logger.info('New Zealand:');
  await logger.divider();

  for (const region of regions.slice(8)) {
    await logger.info(`  ${region.code.padEnd(10)} - ${region.name.padEnd(30)} (${region.capital})`);
  }

  await logger.divider();
  await logger.info('');
  await logger.example('Usage:');
  await logger.example('  synthex ground local --region "VIC" --target "content.md"');
  await logger.example('  synthex ground context --region "NSW"');
}

async function showRegionalContext(options: { region: string }): Promise<void> {
  const region = options.region as ANZRegion;
  const service = new GroundService();
  const context = service.getRegionalContext(region);

  if (!context) {
    await logger.error(`Unknown region: ${region}`);
    await logger.info('Run: synthex ground regions');
    process.exit(1);
  }

  await logger.header(`Regional Context: ${region}`);
  await logger.divider();

  // Regulations
  if (context.regulations.length > 0) {
    await logger.header('Regulations & Authorities');
    for (const reg of context.regulations) {
      await logger.info(`  ${reg.name}`);
      await logger.info(`    Authority: ${reg.authority}`);
      await logger.info(`    Relevance: ${reg.relevance.join(', ')}`);
      if (reg.url) {
        await logger.info(`    URL: ${reg.url}`);
      }
      await logger.divider();
    }
  }

  // Business Districts
  if (context.businessDistricts.length > 0) {
    await logger.header('Business Districts');
    await logger.info(`  ${context.businessDistricts.join(', ')}`);
    await logger.divider();
  }

  // Landmarks
  if (context.landmarks.length > 0) {
    await logger.header('Key Landmarks');
    for (const landmark of context.landmarks) {
      await logger.info(`  ${landmark.name} (${landmark.type})`);
      await logger.info(`    ${landmark.relevance}`);
      await logger.divider();
    }
  }

  // Local Terminology
  if (Object.keys(context.localTerminology).length > 0) {
    await logger.header('Local Terminology');
    await logger.info('Conversions from American English:');
    for (const [us, anz] of Object.entries(context.localTerminology)) {
      await logger.info(`  "${us}" → "${anz}"`);
    }
    await logger.divider();
  }

  await logger.info('');
  await logger.example('Apply this context:');
  await logger.example(`  synthex ground local --region "${region}" --target "content.md"`);
}
