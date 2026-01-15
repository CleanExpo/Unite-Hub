/**
 * synthex analytics Commands
 *
 * Usage analytics and reporting
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { UsageAnalyticsService } from '../services/monitoring/usage-analytics.js';
import { ConfigManager } from '../utils/config-manager.js';

export function createAnalyticsCommand(): Command {
  const command = new Command('analytics');

  command.description('Usage analytics and reporting');

  // synthex analytics report [--period 7d] [--workspace-id ID]
  command
    .command('report')
    .description('Generate usage report')
    .option('--period <period>', 'Time period (7d, 30d, 90d)', '7d')
    .option('--workspace-id <id>', 'Workspace ID (default: current)')
    .action(async (options) => {
      try {
        await runAnalyticsReport(options);
      } catch (error) {
        await logger.error('Failed to generate report');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex analytics commands [--top N]
  command
    .command('commands')
    .description('Show top commands by usage')
    .option('--top <number>', 'Number of top commands to show', '10')
    .action(async (options) => {
      try {
        await runAnalyticsCommands(options);
      } catch (error) {
        await logger.error('Failed to get command usage');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex analytics errors [--period 7d]
  command
    .command('errors')
    .description('Show error statistics')
    .option('--period <period>', 'Time period (7d, 30d, 90d)', '7d')
    .action(async (options) => {
      try {
        await runAnalyticsErrors(options);
      } catch (error) {
        await logger.error('Failed to get error statistics');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runAnalyticsReport(options: {
  period?: string;
  workspaceId?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  const workspaceId = options.workspaceId || config.workspace_id;

  await logger.header('Usage Analytics Report');

  const spinner = await logger.spinner('Generating report...');

  try {
    const service = new UsageAnalyticsService();

    // Parse period
    const days = parseInt(options.period?.replace('d', '') || '7', 10);
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const report = await service.getReport(workspaceId, { start, end: now });

    spinner.stop();

    await logger.divider();
    await logger.info(`Period: ${report.period.start.split('T')[0]} to ${report.period.end.split('T')[0]}`);
    await logger.divider();

    await logger.header('Summary');
    await logger.keyValue('Total Commands', report.totalCommands.toString());
    await logger.keyValue('Total API Calls', report.totalApiCalls.toString());
    await logger.keyValue('Total Credential Ops', report.totalCredentialOps.toString());
    await logger.keyValue('Total Tenant Ops', report.totalTenantOps.toString());
    await logger.keyValue('Total Errors', report.totalErrors.toString());

    if (Object.keys(report.byCommand).length > 0) {
      await logger.divider();
      await logger.header('Top Commands');

      const topCommands = Object.entries(report.byCommand)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      for (const [command, count] of topCommands) {
        await logger.info(`  ${command}: ${count} executions`);
      }
    }

    if (Object.keys(report.byService).length > 0) {
      await logger.divider();
      await logger.header('API Calls by Service');

      for (const [service, count] of Object.entries(report.byService)) {
        await logger.info(`  ${service}: ${count} calls`);
      }
    }

    if (report.topErrors.length > 0) {
      await logger.divider();
      await logger.header('Top Errors');

      for (const error of report.topErrors.slice(0, 5)) {
        await logger.warn(`  ${error.error} (${error.count} occurrences)`);
      }
    }

    await logger.divider();
    await logger.header('Performance');
    await logger.keyValue('Avg Execution Time', `${report.performanceMetrics.avgExecutionTime}ms`);
    await logger.keyValue('p50', `${report.performanceMetrics.p50ExecutionTime}ms`);
    await logger.keyValue('p95', `${report.performanceMetrics.p95ExecutionTime}ms`);
    await logger.keyValue('p99', `${report.performanceMetrics.p99ExecutionTime}ms`);
  } catch (error) {
    spinner.fail('Failed to generate report');
    throw error;
  }
}

async function runAnalyticsCommands(options: { top?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Top Commands');

  const spinner = await logger.spinner('Fetching command usage...');

  try {
    const service = new UsageAnalyticsService();
    const limit = parseInt(options.top || '10', 10);

    const commands = await service.getTopCommands(config.workspace_id, limit);

    spinner.stop();

    if (commands.length === 0) {
      await logger.info('No command usage data found');
      return;
    }

    await logger.divider();

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      await logger.info(`${i + 1}. ${cmd.command}`);
      await logger.info(`   Executions: ${cmd.count} | Avg Time: ${Math.round(cmd.avgExecutionTime)}ms`);
      await logger.info(`   Error Rate: ${(cmd.errorRate * 100).toFixed(1)}% | Last Used: ${new Date(cmd.lastUsed).toLocaleString()}`);
      await logger.divider();
    }
  } catch (error) {
    spinner.fail('Failed to fetch commands');
    throw error;
  }
}

async function runAnalyticsErrors(options: { period?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Error Statistics');

  const spinner = await logger.spinner('Analyzing errors...');

  try {
    const service = new UsageAnalyticsService();

    // Parse period
    const days = parseInt(options.period?.replace('d', '') || '7', 10);
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const errorRate = await service.getErrorRate(config.workspace_id, { start, end: now });
    const report = await service.getReport(config.workspace_id, { start, end: now });

    spinner.stop();

    await logger.divider();
    await logger.keyValue('Error Rate', `${(errorRate * 100).toFixed(2)}%`);
    await logger.keyValue('Total Errors', report.totalErrors.toString());
    await logger.keyValue('Total Operations', (report.totalCommands + report.totalApiCalls + report.totalCredentialOps + report.totalTenantOps).toString());

    if (report.topErrors.length > 0) {
      await logger.divider();
      await logger.header('Top Errors');

      for (const error of report.topErrors.slice(0, 10)) {
        await logger.warn(`  ${error.error} (${error.count} occurrences)`);
      }
    } else {
      await logger.divider();
      await logger.info('No errors found in this period ✓');
    }
  } catch (error) {
    spinner.fail('Failed to analyze errors');
    throw error;
  }
}
