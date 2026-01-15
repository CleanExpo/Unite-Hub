/**
 * synthex audit Commands
 *
 * Citation gap analysis and competitive intelligence
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { AuditService } from '../services/seo-intelligence/audit-service.js';
import { ConfigManager } from '../utils/config-manager.js';

export function createAuditCommand(): Command {
  const command = new Command('audit');

  command.description('Citation gap analysis and competitive intelligence');

  // synthex audit citation-gap --client "ClientName" --competitor-limit 10
  command
    .command('citation-gap')
    .description('Analyze citation gaps between client and competitors')
    .requiredOption('--client <domain>', 'Client domain (e.g., example.com)')
    .option('--competitor-limit <number>', 'Number of competitors to analyze', '10')
    .action(async (options) => {
      try {
        await runCitationGapAnalysis(options);
      } catch (error) {
        await logger.error('Citation gap analysis failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex audit history [--limit N]
  command
    .command('history')
    .description('Show recent audit runs')
    .option('--limit <number>', 'Number of audits to show', '10')
    .action(async (options) => {
      try {
        await showAuditHistory(options);
      } catch (error) {
        await logger.error('Failed to fetch audit history');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runCitationGapAnalysis(options: {
  client: string;
  competitorLimit?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized. Run: synthex init');
    process.exit(1);
  }

  await logger.header('Audit: Citation Gap Analysis');
  await logger.divider();

  const clientDomain = options.client;
  const competitorLimit = parseInt(options.competitorLimit || '10', 10);

  await logger.info(`Client Domain: ${clientDomain}`);
  await logger.info(`Competitor Limit: ${competitorLimit}`);
  await logger.divider();

  const spinner = await logger.spinner('Analyzing citation gaps...');

  try {
    const service = new AuditService();
    const analysis = await service.analyzeCitationGap(clientDomain, competitorLimit);

    spinner.stop();

    await logger.success('Analysis complete!');
    await logger.divider();

    // Executive Summary
    await logger.header('Executive Summary');
    await logger.keyValue('Client Domain', analysis.clientDomain);
    await logger.keyValue('Competitors Analyzed', analysis.competitors.length.toString());
    await logger.keyValue('Total Gaps Identified', analysis.summary.totalGaps.toString());
    await logger.keyValue('High Priority Gaps', analysis.summary.highPriorityGaps.toString());
    await logger.keyValue('Quick Win Opportunities', analysis.summary.quickWinOpportunities.toString());
    await logger.keyValue('Opportunity Score', `${analysis.summary.opportunityScore}/100`);
    await logger.keyValue('Est. Catch-Up Time', analysis.summary.estimatedCatchUpTime);

    // Competitor Breakdown
    if (analysis.competitors.length > 0) {
      await logger.divider();
      await logger.header('Competitor Analysis');

      const topCompetitors = analysis.competitors.slice(0, 5);
      for (const comp of topCompetitors) {
        await logger.info(`  ${comp.domain}`);
        await logger.info(`    Authority: ${comp.authority} | Citations: ${comp.totalCitations}`);
        await logger.info(`    AI Overview: ${comp.aiOverviewCitations} | Advantage: ${comp.citationAdvantage}`);
        await logger.divider();
      }
    }

    // Top Gaps
    if (analysis.gaps.length > 0) {
      await logger.divider();
      await logger.header('Top Citation Gaps');

      const topGaps = analysis.gaps.slice(0, 5);
      for (let i = 0; i < topGaps.length; i++) {
        const gap = topGaps[i];
        await logger.info(`${i + 1}. ${gap.source.domain} [${gap.priority.toUpperCase()}]`);
        await logger.info(`   Authority: ${gap.source.authority} | Impact: ${gap.estimatedImpact}%`);
        await logger.info(`   Type: ${gap.source.citationType}`);
        await logger.info(`   Present in: ${gap.presentInCompetitors.join(', ')}`);

        if (gap.actionableSteps.length > 0) {
          await logger.info('   Action Steps:');
          for (const step of gap.actionableSteps.slice(0, 2)) {
            await logger.info(`     • ${step}`);
          }
        }
        await logger.divider();
      }

      if (analysis.gaps.length > 5) {
        await logger.info(`  ... and ${analysis.gaps.length - 5} more gaps`);
        await logger.divider();
      }
    }

    // Top Opportunities
    if (analysis.opportunities.length > 0) {
      await logger.divider();
      await logger.header('Top Opportunities');

      const topOpps = analysis.opportunities.slice(0, 3);
      for (let i = 0; i < topOpps.length; i++) {
        const opp = topOpps[i];
        await logger.info(`${i + 1}. [${opp.type.toUpperCase().replace('_', ' ')}]`);
        await logger.info(`   ${opp.recommendedAction}`);
        await logger.info(`   Difficulty: ${opp.difficulty} | Timeframe: ${opp.estimatedTimeframe}`);
        await logger.info(`   Potential Impact: ${opp.potentialImpact}%`);
        await logger.divider();
      }
    }

    await logger.info('');
    await logger.success(`Analysis saved to database for workspace: ${config.workspace_id}`);
    await logger.info('');
    await logger.example('Next steps:');
    await logger.example('  synthex export gap-report --format json --output ./audits/report.json');
    await logger.example('  synthex export gap-report --format html --output ./audits/report.html');
    await logger.example('  synthex audit history');
  } catch (error) {
    spinner.fail('Analysis failed');
    throw error;
  }
}

async function showAuditHistory(options: { limit?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Audit History');

  const spinner = await logger.spinner('Fetching history...');

  try {
    const service = new AuditService();
    const limit = parseInt(options.limit || '10', 10);
    const audits = await service.getRecentAudits(limit);

    spinner.stop();

    if (audits.length === 0) {
      await logger.info('No audits found');
      return;
    }

    await logger.divider();

    for (let i = 0; i < audits.length; i++) {
      const audit = audits[i];

      await logger.info(`${i + 1}. ${audit.client_domain} - ${audit.created_at.split('T')[0]}`);
      await logger.info(`   Competitors: ${audit.competitors_analyzed}`);
      await logger.info(`   Total Gaps: ${audit.total_gaps} | High Priority: ${audit.high_priority_gaps}`);
      await logger.info(`   Opportunity Score: ${audit.opportunity_score}/100`);
      await logger.divider();
    }

    await logger.info('');
    await logger.example('Re-run analysis: synthex audit citation-gap --client "YourDomain.com"');
  } catch (error) {
    spinner.fail('Failed to fetch history');
    throw error;
  }
}
