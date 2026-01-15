/**
 * synthex health Commands
 *
 * System health monitoring
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { HealthMonitorService } from '../services/monitoring/health-monitor.js';
import { ConfigManager } from '../utils/config-manager.js';

export function createHealthCommand(): Command {
  const command = new Command('health');

  command.description('System health monitoring');

  // synthex health check [--service NAME]
  command
    .command('check')
    .description('Run health checks')
    .option('--service <name>', 'Check specific service (database, shopify, google-merchant, credentials, disk, memory)')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .action(async (options) => {
      try {
        await runHealthCheck(options);
      } catch (error) {
        await logger.error('Failed to run health check');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runHealthCheck(options: {
  service?: string;
  format?: string;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('System Health Check');

  const spinner = await logger.spinner('Running health checks...');

  try {
    const healthService = new HealthMonitorService();

    // Run specific service check or all checks
    if (options.service) {
      let check;

      switch (options.service.toLowerCase()) {
        case 'database':
          check = await healthService.checkDatabase();
          break;

        case 'shopify':
          check = await healthService.checkShopifyAPI();
          break;

        case 'google-merchant':
        case 'gmc':
          check = await healthService.checkGoogleMerchantAPI();
          break;

        case 'credentials':
          check = await healthService.checkCredentials();
          break;

        case 'disk':
          check = await healthService.checkDiskSpace();
          break;

        case 'memory':
          check = await healthService.checkMemoryUsage();
          break;

        default:
          spinner.fail(`Unknown service: ${options.service}`);
          await logger.error(`Unknown service: ${options.service}`);
          await logger.info('Available services: database, shopify, google-merchant, credentials, disk, memory');
          process.exit(1);
      }

      spinner.stop();

      if (options.format === 'json') {
        console.log(JSON.stringify(check, null, 2));
        return;
      }

      await logger.divider();
      await displayHealthCheck(check);
    } else {
      // Run all checks
      const report = await healthService.runHealthChecks();

      spinner.stop();

      if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      await logger.divider();

      // Overall status
      const overallIcon =
        report.overallStatus === 'healthy' ? '✓' :
        report.overallStatus === 'degraded' ? '⚠' : '✗';

      const overallColor =
        report.overallStatus === 'healthy' ? 'green' :
        report.overallStatus === 'degraded' ? 'yellow' : 'red';

      await logger.info(`${overallIcon} Overall Status: ${report.overallStatus.toUpperCase()}`);
      await logger.divider();

      // Individual checks
      await logger.header('Health Checks');

      for (const check of report.checks) {
        await displayHealthCheck(check);
        await logger.divider();
      }

      // Summary
      const healthyCount = report.checks.filter((c) => c.status === 'healthy').length;
      const degradedCount = report.checks.filter((c) => c.status === 'degraded').length;
      const unhealthyCount = report.checks.filter((c) => c.status === 'unhealthy').length;

      await logger.header('Summary');
      await logger.info(`✓ Healthy: ${healthyCount}`);
      if (degradedCount > 0) {
        await logger.warn(`⚠ Degraded: ${degradedCount}`);
      }
      if (unhealthyCount > 0) {
        await logger.warn(`✗ Unhealthy: ${unhealthyCount}`);
      }

      // Exit with error code if unhealthy
      if (report.overallStatus === 'unhealthy') {
        process.exit(1);
      }
    }
  } catch (error) {
    spinner.fail('Health check failed');
    throw error;
  }
}

async function displayHealthCheck(check: any): Promise<void> {
  const statusIcon =
    check.status === 'healthy' ? '✓' :
    check.status === 'degraded' ? '⚠' : '✗';

  await logger.info(`${statusIcon} ${check.name}: ${check.status.toUpperCase()}`);
  await logger.info(`   ${check.message}`);

  if (check.responseTime !== undefined) {
    await logger.info(`   Response Time: ${check.responseTime}ms`);
  }

  if (check.metadata) {
    for (const [key, value] of Object.entries(check.metadata)) {
      await logger.info(`   ${key}: ${value}`);
    }
  }

  await logger.info(`   Last Checked: ${new Date(check.lastChecked).toLocaleString()}`);
}
