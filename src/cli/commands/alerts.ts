/**
 * synthex alerts Commands
 *
 * Manage credential expiry alerts
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { CredentialAlertService } from '../services/monitoring/credential-alerts.js';
import { ConfigManager } from '../utils/config-manager.js';

export function createAlertsCommand(): Command {
  const command = new Command('alerts');

  command.description('Manage credential expiry alerts');

  // synthex alerts list [--acknowledged]
  command
    .command('list')
    .description('List all alerts')
    .option('--acknowledged', 'Show only acknowledged alerts')
    .option('--unacknowledged', 'Show only unacknowledged alerts')
    .action(async (options) => {
      try {
        await runAlertsList(options);
      } catch (error) {
        await logger.error('Failed to list alerts');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex alerts acknowledge --alert-id <id>
  command
    .command('acknowledge')
    .description('Acknowledge an alert')
    .option('--alert-id <id>', 'Alert ID')
    .action(async (options) => {
      try {
        await runAlertsAcknowledge(options);
      } catch (error) {
        await logger.error('Failed to acknowledge alert');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex alerts rules list
  command
    .command('rules')
    .description('Manage alert rules')
    .action(async () => {
      try {
        await runAlertsRulesList();
      } catch (error) {
        await logger.error('Failed to list alert rules');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex alerts rules create
  command
    .command('create-rule')
    .description('Create alert rule')
    .option('--type <type>', 'Alert type (expiring_30d, expiring_7d, expiring_1d, expired)')
    .option('--channel <channel>', 'Channel (email, slack, webhook)')
    .option('--recipients <emails>', 'Email recipients (comma-separated)')
    .option('--webhook-url <url>', 'Slack/custom webhook URL')
    .action(async (options) => {
      try {
        await runAlertsRulesCreate(options);
      } catch (error) {
        await logger.error('Failed to create alert rule');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex alerts check-now
  command
    .command('check-now')
    .description('Check credentials and send alerts immediately')
    .action(async () => {
      try {
        await runAlertsCheckNow();
      } catch (error) {
        await logger.error('Failed to check alerts');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runAlertsList(options: {
  acknowledged?: boolean;
  unacknowledged?: boolean;
}): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Credential Alerts');

  const spinner = await logger.spinner('Fetching alerts...');

  try {
    const service = new CredentialAlertService();

    let acknowledgedFilter: boolean | undefined;
    if (options.acknowledged) {
      acknowledgedFilter = true;
    } else if (options.unacknowledged) {
      acknowledgedFilter = false;
    }

    const alerts = await service.getAlerts(config.workspace_id, acknowledgedFilter);

    spinner.stop();

    if (alerts.length === 0) {
      await logger.info('No alerts found');
      return;
    }

    await logger.info(`Found ${alerts.length} alert(s)`);
    await logger.divider();

    for (const alert of alerts) {
      const severityIcon =
        alert.severity === 'critical' ? '🚨' :
        alert.severity === 'warning' ? '⚠️' : 'ℹ️';

      const ackIcon = alert.acknowledged ? '✓' : '○';

      await logger.info(`${ackIcon} ${severityIcon} ${alert.type.replace('_', ' ').toUpperCase()}`);
      await logger.info(`   ${alert.message}`);
      await logger.info(`   Tenant: ${alert.tenantId} | Service: ${alert.service}`);
      await logger.info(`   Days Until Expiry: ${alert.daysUntilExpiry}`);
      await logger.info(`   Sent: ${new Date(alert.sentAt).toLocaleString()}`);

      if (!alert.acknowledged) {
        await logger.info(`   To acknowledge: synthex alerts acknowledge --alert-id ${alert.id}`);
      }

      await logger.divider();
    }
  } catch (error) {
    spinner.fail('Failed to fetch alerts');
    throw error;
  }
}

async function runAlertsAcknowledge(options: { alertId?: string }): Promise<void> {
  if (!options.alertId) {
    await logger.error('--alert-id is required');
    await logger.example('synthex alerts acknowledge --alert-id ALERT_ID');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Acknowledge Alert');

  const spinner = await logger.spinner('Acknowledging alert...');

  try {
    const service = new CredentialAlertService();
    await service.acknowledgeAlert(options.alertId);

    spinner.succeed('Alert acknowledged');

    await logger.divider();
    await logger.info(`Alert ${options.alertId} has been acknowledged`);
  } catch (error) {
    spinner.fail('Failed to acknowledge alert');
    throw error;
  }
}

async function runAlertsRulesList(): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Alert Rules');

  const spinner = await logger.spinner('Fetching alert rules...');

  try {
    const service = new CredentialAlertService();
    const rules = await service.getAlertRules(config.workspace_id);

    spinner.stop();

    if (rules.length === 0) {
      await logger.info('No alert rules configured');
      await logger.divider();
      await logger.info('Create alert rule:');
      await logger.example('synthex alerts create-rule --type expiring_7d --channel email --recipients "admin@example.com"');
      return;
    }

    await logger.info(`Found ${rules.length} rule(s)`);
    await logger.divider();

    for (const rule of rules) {
      const enabledIcon = rule.enabled ? '✓' : '✗';

      await logger.info(`${enabledIcon} ${rule.alertType.replace('_', ' ').toUpperCase()}`);
      await logger.info(`   Channels: ${rule.channels.join(', ')}`);

      if (rule.emailRecipients && rule.emailRecipients.length > 0) {
        await logger.info(`   Email Recipients: ${rule.emailRecipients.join(', ')}`);
      }

      if (rule.slackWebhookUrl) {
        await logger.info(`   Slack Webhook: ${rule.slackWebhookUrl}`);
      }

      if (rule.customWebhookUrl) {
        await logger.info(`   Custom Webhook: ${rule.customWebhookUrl}`);
      }

      await logger.info(`   Created: ${new Date(rule.createdAt).toLocaleString()}`);
      await logger.divider();
    }
  } catch (error) {
    spinner.fail('Failed to fetch alert rules');
    throw error;
  }
}

async function runAlertsRulesCreate(options: {
  type?: string;
  channel?: string;
  recipients?: string;
  webhookUrl?: string;
}): Promise<void> {
  if (!options.type || !options.channel) {
    await logger.error('--type and --channel are required');
    await logger.example('synthex alerts create-rule --type expiring_7d --channel email --recipients "admin@example.com"');
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Create Alert Rule');

  const spinner = await logger.spinner('Creating alert rule...');

  try {
    const service = new CredentialAlertService();

    const emailRecipients = options.recipients ? options.recipients.split(',').map((r) => r.trim()) : undefined;

    const rule = await service.configureAlertRule({
      workspaceId: config.workspace_id,
      alertType: options.type as any,
      channels: [options.channel as any],
      emailRecipients,
      slackWebhookUrl: options.channel === 'slack' ? options.webhookUrl : undefined,
      customWebhookUrl: options.channel === 'webhook' ? options.webhookUrl : undefined,
    });

    spinner.succeed('Alert rule created');

    await logger.divider();
    await logger.keyValue('Rule ID', rule.id);
    await logger.keyValue('Alert Type', rule.alertType);
    await logger.keyValue('Channels', rule.channels.join(', '));

    if (rule.emailRecipients && rule.emailRecipients.length > 0) {
      await logger.keyValue('Recipients', rule.emailRecipients.join(', '));
    }
  } catch (error) {
    spinner.fail('Failed to create alert rule');
    throw error;
  }
}

async function runAlertsCheckNow(): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();

  if (!config) {
    await logger.error('Synthex not initialized');
    process.exit(1);
  }

  await logger.header('Check Credentials for Alerts');

  const spinner = await logger.spinner('Checking credentials...');

  try {
    const service = new CredentialAlertService();
    const alerts = await service.checkAndSendAlerts();

    spinner.stop();

    await logger.divider();

    if (alerts.length === 0) {
      await logger.info('No alerts generated - all credentials OK ✓');
      return;
    }

    await logger.warn(`Generated ${alerts.length} alert(s)`);
    await logger.divider();

    for (const alert of alerts) {
      const severityIcon =
        alert.severity === 'critical' ? '🚨' :
        alert.severity === 'warning' ? '⚠️' : 'ℹ️';

      await logger.info(`${severityIcon} ${alert.type.replace('_', ' ').toUpperCase()}`);
      await logger.info(`   ${alert.message}`);
      await logger.divider();
    }
  } catch (error) {
    spinner.fail('Failed to check alerts');
    throw error;
  }
}
