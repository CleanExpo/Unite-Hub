/**
 * synthex monitor Commands
 *
 * Real-time citation monitoring with alerts
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { MonitorService, type MonitorResult } from '../services/distribution/monitor-service.js';

export function createMonitorCommand(): Command {
  const command = new Command('monitor');

  command.description('Real-time citation monitoring and alerts');

  // synthex monitor citations --watch --interval 60s
  command
    .command('citations')
    .description('Monitor citation performance in real-time')
    .option('--watch', 'Enable watch mode for continuous monitoring', false)
    .option('--interval <seconds>', 'Check interval in seconds (watch mode)', '60')
    .option('--alert-threshold <percent>', 'Alert threshold for changes (%)', '10')
    .option('--domain <domain>', 'Domain to monitor', 'example.com.au')
    .option('--compare-with <domains>', 'Competitor domains (comma-separated)')
    .action(async (options) => {
      try {
        await runCitationMonitor(options);
      } catch (error) {
        await logger.error('Citation monitoring failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex monitor alerts
  command
    .command('alerts')
    .description('Show recent alerts')
    .option('--limit <number>', 'Number of alerts to show', '20')
    .action(async (options) => {
      try {
        await showAlerts(options);
      } catch (error) {
        await logger.error('Failed to fetch alerts');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex monitor snapshots --domain "example.com.au"
  command
    .command('snapshots')
    .description('Show historical snapshots')
    .requiredOption('--domain <domain>', 'Domain to show snapshots for')
    .option('--limit <number>', 'Number of snapshots to show', '10')
    .action(async (options) => {
      try {
        await showSnapshots(options);
      } catch (error) {
        await logger.error('Failed to fetch snapshots');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runCitationMonitor(options: {
  watch?: boolean;
  interval?: string;
  alertThreshold?: string;
  domain?: string;
  compareWith?: string;
}): Promise<void> {
  const intervalSeconds = parseInt(options.interval || '60', 10);

  if (options.watch) {
    await logger.header('Monitor: Real-time Citation Tracking');
    await logger.divider();

    await logger.info(`Domain: ${options.domain || 'example.com.au'}`);
    await logger.info(`Interval: ${intervalSeconds}s`);
    await logger.info(`Alert Threshold: ${options.alertThreshold || '10'}%`);
    if (options.compareWith) {
      await logger.info(`Competitors: ${options.compareWith}`);
    }
    await logger.divider();

    const service = new MonitorService();

    // Set up graceful shutdown
    let isShuttingDown = false;
    const shutdown = () => {
      if (!isShuttingDown) {
        isShuttingDown = true;
        console.log('\n');
        logger.warn('Stopping monitor...');
        service.stopWatching();
        process.exit(0);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start watching with callback
    await service.monitor(
      {
        watch: true,
        interval: intervalSeconds,
        alertThreshold: parseInt(options.alertThreshold || '10', 10),
        domain: options.domain,
        compareWith: options.compareWith?.split(',').map((d) => d.trim()),
      },
      (result: MonitorResult) => {
        displayMonitorResult(result);
      }
    );
  } else {
    // Single snapshot
    await logger.header('Monitor: Citation Snapshot');
    await logger.divider();

    const spinner = await logger.spinner('Fetching citation data...');

    try {
      const service = new MonitorService();

      const result = await service.monitor({
        watch: false,
        domain: options.domain,
        compareWith: options.compareWith?.split(',').map((d) => d.trim()),
        alertThreshold: parseInt(options.alertThreshold || '10', 10),
      });

      spinner.stop();

      if (result) {
        displayMonitorResult(result);
      }

      await logger.info('');
      await logger.example('Enable watch mode:');
      await logger.example('  synthex monitor citations --watch --interval 60s');
    } catch (error) {
      spinner.fail('Failed to fetch snapshot');
      throw error;
    }
  }
}

function displayMonitorResult(result: MonitorResult): void {
  const timestamp = new Date(result.metrics.timestamp);

  // Clear console for watch mode updates
  if (process.stdout.isTTY) {
    console.clear();
  }

  console.log('');
  logger.header(`Citation Metrics - ${timestamp.toLocaleTimeString()}`);
  logger.divider();

  logger.keyValue('Domain', result.domain);
  logger.keyValue('Total Citations', result.metrics.totalCitations.toString());
  logger.keyValue('AI Overview', result.metrics.aiOverviewCitations.toString());
  logger.keyValue('Organic', result.metrics.organicCitations.toString());
  logger.keyValue('Featured Snippets', result.metrics.featuredSnippets.toString());
  logger.keyValue('Knowledge Panels', result.metrics.knowledgePanels.toString());
  logger.keyValue('Avg Authority', result.metrics.averageAuthority.toString());

  // Show trends
  if (result.metrics.trends.length > 0) {
    logger.divider();
    logger.header('Trends');

    for (const trend of result.metrics.trends) {
      const icon =
        trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
      const color = trend.direction === 'up' ? '🟢' : trend.direction === 'down' ? '🔴' : '⚪';

      logger.info(
        `  ${color} ${icon} ${trend.metric}: ${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%`
      );
    }
  }

  // Show competitors
  if (result.competitors.length > 0) {
    logger.divider();
    logger.header('Competitor Comparison');

    for (let i = 0; i < result.competitors.length; i++) {
      const comp = result.competitors[i];
      const gapIcon = comp.gap > 0 ? '⚠️' : '✓';

      logger.info(`${i + 1}. ${comp.domain}`);
      logger.info(`   Citations: ${comp.citationCount} (${comp.citationShare.toFixed(1)}% share)`);
      logger.info(`   AI Overview: ${comp.aiOverviewShare.toFixed(1)}%`);
      logger.info(`   ${gapIcon} Gap: ${comp.gap > 0 ? '+' : ''}${comp.gap}`);
      logger.divider();
    }
  }

  // Show alerts
  if (result.alerts.length > 0) {
    logger.divider();
    logger.header(`Alerts (${result.alerts.length})`);

    for (const alert of result.alerts) {
      const severityIcon =
        alert.severity === 'critical'
          ? '🚨'
          : alert.severity === 'warning'
          ? '⚠️'
          : 'ℹ️';

      logger.warn(`${severityIcon} [${alert.severity.toUpperCase()}] ${alert.message}`);
    }
  }

  logger.divider();
  console.log('');
}

async function showAlerts(options: { limit?: string }): Promise<void> {
  await logger.header('Recent Alerts');
  await logger.divider();

  const spinner = await logger.spinner('Fetching alerts...');

  try {
    const service = new MonitorService();
    const limit = parseInt(options.limit || '20', 10);
    const alerts = await service.getRecentAlerts(limit);

    spinner.stop();

    if (alerts.length === 0) {
      await logger.info('No alerts found');
      await logger.info('');
      await logger.example('Start monitoring:');
      await logger.example('  synthex monitor citations --watch --interval 60s');
      return;
    }

    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      const severityIcon =
        alert.severity === 'critical'
          ? '🚨'
          : alert.severity === 'warning'
          ? '⚠️'
          : 'ℹ️';

      await logger.info(`${i + 1}. ${severityIcon} [${alert.severity.toUpperCase()}] ${alert.type}`);
      await logger.info(`   ${alert.message}`);
      await logger.info(`   Time: ${new Date(alert.timestamp).toLocaleString()}`);
      await logger.divider();
    }

    await logger.info('');
    await logger.example('View snapshots:');
    await logger.example('  synthex monitor snapshots --domain "example.com.au"');
  } catch (error) {
    spinner.fail('Failed to fetch alerts');
    throw error;
  }
}

async function showSnapshots(options: { domain: string; limit?: string }): Promise<void> {
  await logger.header('Historical Snapshots');
  await logger.divider();

  await logger.info(`Domain: ${options.domain}`);
  await logger.divider();

  const spinner = await logger.spinner('Fetching snapshots...');

  try {
    const service = new MonitorService();
    const limit = parseInt(options.limit || '10', 10);
    const snapshots = await service.getRecentSnapshots(options.domain, limit);

    spinner.stop();

    if (snapshots.length === 0) {
      await logger.info('No snapshots found for this domain');
      await logger.info('');
      await logger.example('Start monitoring:');
      await logger.example(`  synthex monitor citations --domain "${options.domain}" --watch`);
      return;
    }

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const metrics = snapshot.metrics;

      await logger.info(`${i + 1}. ${new Date(snapshot.timestamp).toLocaleString()}`);
      await logger.info(`   Citations: ${metrics.totalCitations} total`);
      await logger.info(`   AI Overview: ${metrics.aiOverviewCitations}`);
      await logger.info(`   Organic: ${metrics.organicCitations}`);
      await logger.info(`   Avg Authority: ${metrics.averageAuthority}`);
      await logger.divider();
    }

    await logger.info('');
    await logger.example('Monitor in real-time:');
    await logger.example(`  synthex monitor citations --domain "${options.domain}" --watch --interval 60s`);
  } catch (error) {
    spinner.fail('Failed to fetch snapshots');
    throw error;
  }
}
