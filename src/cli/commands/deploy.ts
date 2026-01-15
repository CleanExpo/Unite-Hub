/**
 * synthex deploy Commands
 *
 * Deploy to Google Knowledge Graph and other platforms
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { DeployService, type DeployTarget } from '../services/distribution/deploy-service.js';

export function createDeployCommand(): Command {
  const command = new Command('deploy');

  command.description('Deploy structured data to Knowledge Graph platforms');

  // synthex deploy graph --target "Google_Search_AI_Mode"
  command
    .command('graph')
    .description('Deploy to Google Knowledge Graph (AEO injection)')
    .requiredOption(
      '--target <target>',
      'Deployment target (Google_Search_AI_Mode, Bing_Copilot, Perplexity, ChatGPT_Search)'
    )
    .option('--content <path>', 'Content file path (markdown)')
    .option('--entity-type <type>', 'Schema.org entity type', 'Article')
    .option('--validate', 'Validate structured data before deployment', true)
    .option('--dry-run', 'Simulate deployment without submitting', false)
    .action(async (options) => {
      try {
        await runGraphDeployment(options);
      } catch (error) {
        await logger.error('Graph deployment failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex deploy history
  command
    .command('history')
    .description('Show deployment history')
    .option('--limit <number>', 'Number of deployments to show', '10')
    .action(async (options) => {
      try {
        await showDeploymentHistory(options);
      } catch (error) {
        await logger.error('Failed to fetch history');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runGraphDeployment(options: {
  target: string;
  content?: string;
  entityType?: string;
  validate?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  await logger.header('Deploy: Google Knowledge Graph (AEO)');
  await logger.divider();

  // Validate target
  const validTargets = ['Google_Search_AI_Mode', 'Bing_Copilot', 'Perplexity', 'ChatGPT_Search'];
  if (!validTargets.includes(options.target)) {
    await logger.error(`Invalid target: ${options.target}`);
    await logger.info(`Valid targets: ${validTargets.join(', ')}`);
    process.exit(1);
  }

  const target = options.target as DeployTarget;

  await logger.info(`Target: ${target}`);
  if (options.content) {
    await logger.info(`Content: ${options.content}`);
  }
  await logger.info(`Entity Type: ${options.entityType || 'Article'}`);
  await logger.info(`Validate: ${options.validate ? 'Yes' : 'No'}`);
  await logger.info(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
  await logger.divider();

  const spinner = await logger.spinner('Generating structured data...');

  try {
    const service = new DeployService();

    const result = await service.deployToGraph({
      target,
      contentPath: options.content,
      entityType: options.entityType,
      validate: options.validate,
      dryRun: options.dryRun,
    });

    spinner.stop();

    // Show validation results
    if (result.validationStatus === 'passed') {
      await logger.success('✓ Validation passed');
    } else if (result.validationStatus === 'warning') {
      await logger.warn('⚠ Validation passed with warnings');
    } else {
      await logger.error('✗ Validation failed');
    }

    if (result.validationIssues.length > 0) {
      await logger.divider();
      await logger.warn(`Validation Issues (${result.validationIssues.length}):`);
      for (const issue of result.validationIssues) {
        await logger.warn(`  - ${issue}`);
      }
    }

    await logger.divider();

    // Show deployment status
    if (options.dryRun) {
      await logger.info('Deployment simulated (dry run mode)');
    } else {
      await logger.success('Deployment complete!');
    }

    await logger.divider();
    await logger.header('Structured Data');

    // Show entity
    await logger.info('Main Entity:');
    await logger.info(`  Type: ${result.structuredData.entity['@type']}`);
    await logger.info(`  Name: ${result.structuredData.entity.name}`);
    await logger.info(`  Description: ${result.structuredData.entity.description.substring(0, 100)}...`);

    // Show FAQs
    if (result.structuredData.faqs && result.structuredData.faqs.length > 0) {
      await logger.divider();
      await logger.info(`FAQs: ${result.structuredData.faqs.length} questions`);
      for (let i = 0; i < Math.min(3, result.structuredData.faqs.length); i++) {
        const faq = result.structuredData.faqs[i];
        await logger.info(`  ${i + 1}. ${faq.name}`);
      }
    }

    // Show HowTo
    if (result.structuredData.howTo) {
      await logger.divider();
      await logger.info(`HowTo Guide: ${result.structuredData.howTo.name}`);
      await logger.info(`  Steps: ${result.structuredData.howTo.step.length}`);
    }

    await logger.divider();
    await logger.header('Deployment Info');
    await logger.keyValue('Target Platform', result.target);
    if (result.deploymentUrl) {
      await logger.keyValue('Submission URL', result.deploymentUrl);
    }
    await logger.keyValue('Est. Index Time', result.estimatedIndexTime);
    await logger.keyValue('Deployed At', new Date(result.deployedAt).toLocaleString());

    await logger.info('');

    if (!options.dryRun) {
      await logger.success('Your content is now optimized for AI search!');
      await logger.info('');
      await logger.example('Monitor performance:');
      await logger.example('  synthex monitor citations --watch --interval 60s');
      await logger.example('  synthex deploy history');
    } else {
      await logger.info('Run without --dry-run to submit to platform');
    }
  } catch (error) {
    spinner.fail('Deployment failed');
    throw error;
  }
}

async function showDeploymentHistory(options: { limit?: string }): Promise<void> {
  await logger.header('Deployment History');
  await logger.divider();

  const spinner = await logger.spinner('Fetching deployments...');

  try {
    const service = new DeployService();
    const limit = parseInt(options.limit || '10', 10);
    const deployments = await service.getDeployments(limit);

    spinner.stop();

    if (deployments.length === 0) {
      await logger.info('No deployments found');
      await logger.info('');
      await logger.example('Deploy to Knowledge Graph:');
      await logger.example('  synthex deploy graph --target "Google_Search_AI_Mode"');
      return;
    }

    for (let i = 0; i < deployments.length; i++) {
      const dep = deployments[i];
      const status =
        dep.validation_status === 'passed'
          ? '✓'
          : dep.validation_status === 'warning'
          ? '⚠'
          : '✗';

      await logger.info(`${i + 1}. ${status} ${dep.target}`);
      await logger.info(`   Entity: ${dep.structured_data?.entity?.['@type'] || 'Unknown'} - ${dep.structured_data?.entity?.name || 'N/A'}`);
      await logger.info(`   Deployed: ${new Date(dep.deployed_at).toLocaleString()}`);
      await logger.divider();
    }

    await logger.info('');
    await logger.example('Deploy new content:');
    await logger.example('  synthex deploy graph --target "Google_Search_AI_Mode" --content "./output/story.md"');
  } catch (error) {
    spinner.fail('Failed to fetch history');
    throw error;
  }
}
