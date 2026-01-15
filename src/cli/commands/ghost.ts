/**
 * synthex ghost Commands
 *
 * Canonical fact block generation and AI signature scrubbing
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import {
  GhostService,
  type ContentStyle,
  type ScrubLevel,
} from '../services/content/ghost-service.js';

export function createGhostCommand(): Command {
  const command = new Command('ghost');

  command.description('Canonical fact block generation and AI signature scrubbing');

  // synthex ghost write --input ./audits/citation_gap_001.json --style "ANZ_Professional"
  command
    .command('write')
    .description('Generate canonical fact blocks from audit data')
    .requiredOption('--input <path>', 'Input audit JSON file')
    .option(
      '--style <style>',
      'Content style (ANZ_Professional, Technical, Executive, Marketing)',
      'ANZ_Professional'
    )
    .option('--output <path>', 'Output file path (default: input_story.md)')
    .option('--max-length <number>', 'Maximum word count', '2000')
    .option('--include-evidence', 'Include evidence in output', false)
    .action(async (options) => {
      try {
        await runGhostWrite(options);
      } catch (error) {
        await logger.error('Ghost write failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex ghost scrub --level "Aggressive" --target-file "./output/story_v1.md"
  command
    .command('scrub')
    .description('Scrub AI signatures and filler words from content')
    .requiredOption('--target-file <path>', 'File to scrub')
    .option(
      '--level <level>',
      'Scrub level (Conservative, Moderate, Aggressive)',
      'Moderate'
    )
    .option('--output <path>', 'Output file path (default: target_scrubbed.md)')
    .option('--preserve-formatting', 'Preserve markdown formatting', true)
    .action(async (options) => {
      try {
        await runGhostScrub(options);
      } catch (error) {
        await logger.error('Ghost scrub failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex ghost signatures
  command
    .command('signatures')
    .description('List AI signatures that will be detected and removed')
    .action(async () => {
      await showAISignatures();
    });

  return command;
}

async function runGhostWrite(options: {
  input: string;
  style?: string;
  output?: string;
  maxLength?: string;
  includeEvidence?: boolean;
}): Promise<void> {
  await logger.header('Ghost: Canonical Fact Block Generation');
  await logger.divider();

  // Validate style
  const validStyles = ['ANZ_Professional', 'Technical', 'Executive', 'Marketing'];
  const style = (options.style || 'ANZ_Professional') as ContentStyle;

  if (!validStyles.includes(style)) {
    await logger.error(`Invalid style: ${style}`);
    await logger.info(`Valid styles: ${validStyles.join(', ')}`);
    process.exit(1);
  }

  await logger.info(`Input: ${options.input}`);
  await logger.info(`Style: ${style}`);
  await logger.info(`Max Length: ${options.maxLength || '2000'} words`);
  await logger.info(`Include Evidence: ${options.includeEvidence ? 'Yes' : 'No'}`);
  await logger.divider();

  const spinner = await logger.spinner('Generating fact blocks...');

  try {
    const service = new GhostService();

    const result = await service.write({
      inputPath: options.input,
      outputPath: options.output,
      style,
      maxLength: parseInt(options.maxLength || '2000', 10),
      includeEvidence: options.includeEvidence,
    });

    spinner.stop();

    await logger.success('Fact blocks generated!');
    await logger.divider();

    await logger.keyValue('Style', result.style);
    await logger.keyValue('Total Blocks', result.totalBlocks.toString());
    await logger.keyValue('Word Count', result.wordCount.toString());
    await logger.keyValue('Output Path', result.outputPath);

    if (result.factBlocks.length > 0) {
      await logger.divider();
      await logger.header('Sample Fact Blocks');

      const samples = result.factBlocks.slice(0, 3);
      for (let i = 0; i < samples.length; i++) {
        const block = samples[i];
        await logger.info(`${i + 1}. ${block.category} [${block.priority.toUpperCase()}]`);
        await logger.info(`   BLUF: ${block.blufStatement.substring(0, 80)}...`);
        await logger.divider();
      }
    }

    await logger.info('');
    await logger.success(`Content saved to: ${result.outputPath}`);
    await logger.info('');
    await logger.example('Next steps:');
    await logger.example(`  synthex ghost scrub --target-file "${result.outputPath}"`);
    await logger.example(`  synthex ground local --region "VIC" --target "${result.outputPath}"`);
  } catch (error) {
    spinner.fail('Generation failed');
    throw error;
  }
}

async function runGhostScrub(options: {
  targetFile: string;
  level?: string;
  output?: string;
  preserveFormatting?: boolean;
}): Promise<void> {
  await logger.header('Ghost: AI Signature Scrubbing');
  await logger.divider();

  // Validate level
  const validLevels = ['Conservative', 'Moderate', 'Aggressive'];
  const level = (options.level || 'Moderate') as ScrubLevel;

  if (!validLevels.includes(level)) {
    await logger.error(`Invalid level: ${level}`);
    await logger.info(`Valid levels: ${validLevels.join(', ')}`);
    process.exit(1);
  }

  await logger.info(`Target File: ${options.targetFile}`);
  await logger.info(`Scrub Level: ${level}`);
  await logger.info(`Preserve Formatting: ${options.preserveFormatting ? 'Yes' : 'No'}`);
  await logger.divider();

  const spinner = await logger.spinner('Scrubbing AI signatures...');

  try {
    const service = new GhostService();

    const result = await service.scrub({
      targetFile: options.targetFile,
      level,
      preserveFormatting: options.preserveFormatting,
      outputPath: options.output,
    });

    spinner.stop();

    await logger.success('Scrubbing complete!');
    await logger.divider();

    await logger.keyValue('Original Word Count', result.originalWordCount.toString());
    await logger.keyValue('Scrubbed Word Count', result.scrubbedWordCount.toString());
    await logger.keyValue('Reduction', `${result.originalWordCount - result.scrubbedWordCount} words`);
    await logger.keyValue('AI Signatures Removed', result.signaturesRemoved.toString());
    await logger.keyValue('Filler Words Removed', result.fillerWordsRemoved.toString());
    await logger.keyValue('Improvement Score', `${result.improvementScore}/100`);
    await logger.keyValue('Output Path', result.outputPath);

    // Visual improvement indicator
    await logger.divider();
    if (result.improvementScore >= 80) {
      await logger.success('Excellent improvement! Content is significantly cleaner.');
    } else if (result.improvementScore >= 60) {
      await logger.info('Good improvement. Content is cleaner.');
    } else if (result.improvementScore >= 40) {
      await logger.info('Moderate improvement. Consider aggressive scrubbing.');
    } else {
      await logger.warn('Minimal improvement. Content may already be clean or need manual review.');
    }

    await logger.info('');
    await logger.success(`Scrubbed content saved to: ${result.outputPath}`);
    await logger.info('');
    await logger.example('Next steps:');
    await logger.example(`  synthex ground local --region "VIC" --target "${result.outputPath}"`);
    await logger.example(`  cat ${result.outputPath}`);
  } catch (error) {
    spinner.fail('Scrubbing failed');
    throw error;
  }
}

async function showAISignatures(): Promise<void> {
  await logger.header('AI Signatures (Detected & Removed)');
  await logger.divider();

  const signatures = [
    'Ultra-Common AI Overuse Words:',
    '  - delve, delved, delves, delving',
    '  - unleash, unleashed, unleashes, unleashing',
    '  - multifaceted, multi-faceted',
    '  - landscape, landscapes',
    '  - leverage, leveraged, leverages, leveraging',
    '  - tapestry, tapestries',
    '  - robust, robustness',
    '  - seamless, seamlessly',
    '  - innovative, innovatively, innovation',
    '  - cutting-edge, cutting edge',
    '  - game-changer, game changer, gamechanging',
    '  - paradigm, paradigms, paradigm shift',
    '  - synergy, synergies, synergistic',
    '  - holistic, holistically',
    '  - comprehensive, comprehensively',
    '',
    'Filler Phrases:',
    '  - it is important to note that',
    '  - in conclusion, to conclude',
    '  - furthermore, moreover',
    '  - additionally',
    '  - however',
    '  - therefore',
    '  - consequently',
    '',
    'Hedging Language:',
    '  - somewhat, fairly, rather, quite, pretty',
    '  - arguably, conceivably, potentially',
    '  - might, may, could possibly',
    '',
    'Excessive Adjectives:',
    '  - very, extremely, incredibly, exceptionally',
    '  - really',
    '  - absolutely, totally, completely',
    '',
    'Filler Words:',
    '  - just, actually, basically, literally, seriously',
    '  - honestly, obviously, clearly, simply, merely',
    '  - essentially, fundamentally, inherently, intrinsically',
  ];

  for (const line of signatures) {
    await logger.info(line);
  }

  await logger.divider();
  await logger.info('');
  await logger.example('Usage:');
  await logger.example('  synthex ghost scrub --target-file "content.md" --level "Aggressive"');
}
