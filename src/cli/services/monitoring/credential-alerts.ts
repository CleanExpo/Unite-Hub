/**
 * Credential Alert Service
 *
 * Automated notifications for expiring credentials:
 * - 30-day warning
 * - 7-day warning
 * - 1-day critical alert
 * - Expired alert
 * - Multi-channel notifications (email, Slack, webhook)
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';
import { CredentialManager, type CredentialInfo } from '../tenant/credential-manager.js';

export interface Alert {
  id: string;
  workspaceId: string;
  tenantId: string;
  service: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'expiring_30d' | 'expiring_7d' | 'expiring_1d' | 'expired';
  message: string;
  expiresAt: string;
  daysUntilExpiry: number;
  sentAt: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface AlertRule {
  id: string;
  workspaceId: string;
  enabled: boolean;
  alertType: Alert['type'];
  channels: Array<'email' | 'slack' | 'webhook'>;
  emailRecipients?: string[];
  slackWebhookUrl?: string;
  customWebhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRuleInput {
  workspaceId: string;
  enabled?: boolean;
  alertType: Alert['type'];
  channels: Array<'email' | 'slack' | 'webhook'>;
  emailRecipients?: string[];
  slackWebhookUrl?: string;
  customWebhookUrl?: string;
}

export class CredentialAlertService {
  private supabase: any;
  private configManager: ConfigManager;
  private credentialManager: CredentialManager;
  private workspaceId: string;

  constructor() {
    this.configManager = new ConfigManager();

    const config = this.configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run: synthex init');
    }

    this.workspaceId = config.workspace_id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error('Supabase credentials not configured');
    }

    this.credentialManager = new CredentialManager();
  }

  /**
   * Check credentials and send alerts
   */
  async checkAndSendAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get all credentials for workspace
    const credentials = await this.credentialManager.getWorkspaceCredentials(this.workspaceId);

    for (const cred of credentials) {
      // Skip if no expiration date
      if (!cred.expiresAt || !cred.daysUntilExpiry) {
        continue;
      }

      const days = cred.daysUntilExpiry;
      let alertType: Alert['type'] | null = null;
      let severity: Alert['severity'] = 'info';

      // Determine alert type based on days until expiry
      if (days < 0) {
        alertType = 'expired';
        severity = 'critical';
      } else if (days <= 1) {
        alertType = 'expiring_1d';
        severity = 'critical';
      } else if (days <= 7) {
        alertType = 'expiring_7d';
        severity = 'warning';
      } else if (days <= 30) {
        alertType = 'expiring_30d';
        severity = 'info';
      }

      if (alertType) {
        // Check if alert already sent for this credential + type
        const existingAlert = await this.findExistingAlert(
          cred.tenantId,
          cred.service,
          alertType
        );

        if (!existingAlert) {
          // Create and send alert
          const alert = await this.createAlert(cred, alertType, severity);
          await this.sendAlert(alert);
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  /**
   * Get alerts for workspace
   */
  async getAlerts(workspaceId: string, acknowledged?: boolean): Promise<Alert[]> {
    let query = this.supabase
      .from('alerts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (acknowledged !== undefined) {
      query = query.eq('acknowledged', acknowledged);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get alerts: ${error.message}`);
    }

    return (data || []).map((a: any) => this.mapAlert(a));
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  /**
   * Configure alert rule
   */
  async configureAlertRule(input: CreateAlertRuleInput): Promise<AlertRule> {
    const { data, error } = await this.supabase
      .from('alert_rules')
      .insert({
        workspace_id: input.workspaceId,
        enabled: input.enabled !== false,
        alert_type: input.alertType,
        channels: input.channels,
        email_recipients: input.emailRecipients || [],
        slack_webhook_url: input.slackWebhookUrl || null,
        custom_webhook_url: input.customWebhookUrl || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert rule: ${error.message}`);
    }

    return this.mapAlertRule(data);
  }

  /**
   * Get alert rules for workspace
   */
  async getAlertRules(workspaceId: string): Promise<AlertRule[]> {
    const { data, error } = await this.supabase
      .from('alert_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get alert rules: ${error.message}`);
    }

    return (data || []).map((r: any) => this.mapAlertRule(r));
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('alert_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      throw new Error(`Failed to delete alert rule: ${error.message}`);
    }
  }

  /**
   * Create alert
   */
  private async createAlert(
    cred: CredentialInfo,
    type: Alert['type'],
    severity: Alert['severity']
  ): Promise<Alert> {
    const message = this.getAlertMessage(cred, type);

    const { data, error } = await this.supabase
      .from('alerts')
      .insert({
        workspace_id: this.workspaceId,
        tenant_id: cred.tenantId,
        service: cred.service,
        severity,
        type,
        message,
        expires_at: cred.expiresAt,
        days_until_expiry: cred.daysUntilExpiry,
        sent_at: new Date().toISOString(),
        acknowledged: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }

    return this.mapAlert(data);
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    // Get alert rules for this type
    const rules = await this.supabase
      .from('alert_rules')
      .select('*')
      .eq('workspace_id', alert.workspaceId)
      .eq('alert_type', alert.type)
      .eq('enabled', true);

    if (!rules.data || rules.data.length === 0) {
      // No rules configured, skip sending
      return;
    }

    for (const rule of rules.data) {
      for (const channel of rule.channels) {
        try {
          switch (channel) {
            case 'email':
              if (rule.email_recipients && rule.email_recipients.length > 0) {
                await this.sendEmailAlert(alert, rule.email_recipients);
              }
              break;

            case 'slack':
              if (rule.slack_webhook_url) {
                await this.sendSlackAlert(alert, rule.slack_webhook_url);
              }
              break;

            case 'webhook':
              if (rule.custom_webhook_url) {
                await this.sendWebhookAlert(alert, rule.custom_webhook_url);
              }
              break;
          }
        } catch (error: unknown) {
          console.error(`Failed to send alert via ${channel}:`, error.message);
        }
      }
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, recipients: string[]): Promise<void> {
    // TODO: Integrate with email service from Unite-Hub
    // For now, log the alert
    console.log(`Email alert to ${recipients.join(', ')}:`, alert.message);
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: Alert, webhookUrl: string): Promise<void> {
    const color = alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'good';

    const payload = {
      attachments: [
        {
          color,
          title: `🔐 Credential Alert: ${alert.type.replace('_', ' ')}`,
          text: alert.message,
          fields: [
            {
              title: 'Tenant',
              value: alert.tenantId,
              short: true,
            },
            {
              title: 'Service',
              value: alert.service,
              short: true,
            },
            {
              title: 'Days Until Expiry',
              value: alert.daysUntilExpiry.toString(),
              short: true,
            },
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
          ],
          timestamp: Math.floor(new Date(alert.sentAt).getTime() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, webhookUrl: string): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      throw new Error(`Custom webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Find existing alert
   */
  private async findExistingAlert(
    tenantId: string,
    service: string,
    type: Alert['type']
  ): Promise<Alert | null> {
    // Check if alert sent in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data } = await this.supabase
      .from('alerts')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('tenant_id', tenantId)
      .eq('service', service)
      .eq('type', type)
      .gte('sent_at', oneDayAgo.toISOString())
      .single();

    return data ? this.mapAlert(data) : null;
  }

  /**
   * Get alert message
   */
  private getAlertMessage(cred: CredentialInfo, type: Alert['type']): string {
    const days = cred.daysUntilExpiry || 0;

    switch (type) {
      case 'expired':
        return `Credential for ${cred.service} (tenant: ${cred.tenantId}) has EXPIRED. Please renew immediately.`;

      case 'expiring_1d':
        return `CRITICAL: Credential for ${cred.service} (tenant: ${cred.tenantId}) expires in ${days} day(s). Renew urgently!`;

      case 'expiring_7d':
        return `WARNING: Credential for ${cred.service} (tenant: ${cred.tenantId}) expires in ${days} day(s). Please renew soon.`;

      case 'expiring_30d':
        return `INFO: Credential for ${cred.service} (tenant: ${cred.tenantId}) expires in ${days} day(s). Consider renewing.`;

      default:
        return `Credential alert for ${cred.service} (tenant: ${cred.tenantId})`;
    }
  }

  /**
   * Map database record to Alert interface
   */
  private mapAlert(data: any): Alert {
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      tenantId: data.tenant_id,
      service: data.service,
      severity: data.severity,
      type: data.type,
      message: data.message,
      expiresAt: data.expires_at,
      daysUntilExpiry: data.days_until_expiry,
      sentAt: data.sent_at,
      acknowledged: data.acknowledged,
      createdAt: data.created_at,
    };
  }

  /**
   * Map database record to AlertRule interface
   */
  private mapAlertRule(data: any): AlertRule {
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      enabled: data.enabled,
      alertType: data.alert_type,
      channels: data.channels,
      emailRecipients: data.email_recipients,
      slackWebhookUrl: data.slack_webhook_url,
      customWebhookUrl: data.custom_webhook_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
