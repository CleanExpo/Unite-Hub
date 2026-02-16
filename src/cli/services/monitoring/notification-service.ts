/**
 * Notification Service
 *
 * Unified notification delivery across multiple channels:
 * - Email (via SendGrid/Resend/SMTP)
 * - Slack (via webhook)
 * - Custom webhooks
 * - Console output
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';

export interface Notification {
  id: string;
  workspaceId: string;
  type: 'credential_expiry' | 'health_alert' | 'usage_threshold' | 'system_error';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  channels: Array<'email' | 'slack' | 'webhook' | 'console'>;
  sentAt: string;
  deliveryStatus: Record<string, 'pending' | 'sent' | 'failed'>;
  createdAt: string;
}

export interface CreateNotificationInput {
  workspaceId: string;
  type: Notification['type'];
  severity: Notification['severity'];
  title: string;
  message: string;
  metadata?: Record<string, any>;
  channels: Array<'email' | 'slack' | 'webhook' | 'console'>;
}

export interface NotificationConfig {
  emailEnabled: boolean;
  emailRecipients?: string[];
  slackEnabled: boolean;
  slackWebhookUrl?: string;
  webhookEnabled: boolean;
  customWebhookUrl?: string;
}

export class NotificationService {
  private supabase: any;
  private configManager: ConfigManager;
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
  }

  /**
   * Send notification through configured channels
   */
  async send(input: CreateNotificationInput): Promise<Notification> {
    // Initialize delivery status
    const deliveryStatus: Record<string, 'pending' | 'sent' | 'failed'> = {};
    for (const channel of input.channels) {
      deliveryStatus[channel] = 'pending';
    }

    // Create notification record
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        workspace_id: input.workspaceId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        message: input.message,
        metadata: input.metadata || {},
        channels: input.channels,
        sent_at: new Date().toISOString(),
        delivery_status: deliveryStatus,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    const notification = this.mapNotification(data);

    // Send through each channel
    for (const channel of input.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(notification);
            deliveryStatus[channel] = 'sent';
            break;

          case 'slack':
            await this.sendSlack(notification);
            deliveryStatus[channel] = 'sent';
            break;

          case 'webhook':
            await this.sendWebhook(notification);
            deliveryStatus[channel] = 'sent';
            break;

          case 'console':
            await this.sendConsole(notification);
            deliveryStatus[channel] = 'sent';
            break;
        }
      } catch (error: unknown) {
        console.error(`Failed to send via ${channel}:`, error.message);
        deliveryStatus[channel] = 'failed';
      }
    }

    // Update delivery status
    await this.supabase
      .from('notifications')
      .update({ delivery_status: deliveryStatus })
      .eq('id', notification.id);

    notification.deliveryStatus = deliveryStatus;

    return notification;
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: Notification): Promise<void> {
    // Get notification config
    const config = await this.getNotificationConfig(notification.workspaceId);

    if (!config.emailEnabled || !config.emailRecipients || config.emailRecipients.length === 0) {
      throw new Error('Email not configured');
    }

    // TODO: Integrate with actual email service
    // For now, log the notification
    console.log(`📧 Email to ${config.emailRecipients.join(', ')}:`);
    console.log(`   Subject: ${notification.title}`);
    console.log(`   Message: ${notification.message}`);
  }

  /**
   * Send Slack notification
   */
  async sendSlack(notification: Notification): Promise<void> {
    // Get notification config
    const config = await this.getNotificationConfig(notification.workspaceId);

    if (!config.slackEnabled || !config.slackWebhookUrl) {
      throw new Error('Slack not configured');
    }

    const color = notification.severity === 'critical' ? 'danger' : notification.severity === 'warning' ? 'warning' : 'good';

    const emoji = this.getSeverityEmoji(notification.severity);

    const payload = {
      attachments: [
        {
          color,
          title: `${emoji} ${notification.title}`,
          text: notification.message,
          fields: [
            {
              title: 'Type',
              value: notification.type.replace('_', ' '),
              short: true,
            },
            {
              title: 'Severity',
              value: notification.severity.toUpperCase(),
              short: true,
            },
          ],
          timestamp: Math.floor(new Date(notification.sentAt).getTime() / 1000),
        },
      ],
    };

    const response = await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(notification: Notification): Promise<void> {
    // Get notification config
    const config = await this.getNotificationConfig(notification.workspaceId);

    if (!config.webhookEnabled || !config.customWebhookUrl) {
      throw new Error('Custom webhook not configured');
    }

    const response = await fetch(config.customWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Custom webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Send console notification
   */
  async sendConsole(notification: Notification): Promise<void> {
    const emoji = this.getSeverityEmoji(notification.severity);

    console.log('');
    console.log('='.repeat(60));
    console.log(`${emoji} ${notification.title}`);
    console.log('-'.repeat(60));
    console.log(notification.message);
    console.log('-'.repeat(60));
    console.log(`Type: ${notification.type} | Severity: ${notification.severity}`);
    console.log('='.repeat(60));
    console.log('');
  }

  /**
   * Get notifications for workspace
   */
  async getNotifications(workspaceId: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }

    return (data || []).map((n: any) => this.mapNotification(n));
  }

  /**
   * Retry failed notification
   */
  async retryFailedNotification(notificationId: string): Promise<Notification> {
    // Get notification
    const { data: notif } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (!notif) {
      throw new Error('Notification not found');
    }

    const notification = this.mapNotification(notif);

    // Find failed channels
    const failedChannels = Object.entries(notification.deliveryStatus)
      .filter(([_, status]) => status === 'failed')
      .map(([channel, _]) => channel as 'email' | 'slack' | 'webhook' | 'console');

    if (failedChannels.length === 0) {
      throw new Error('No failed channels to retry');
    }

    // Retry failed channels
    const deliveryStatus = { ...notification.deliveryStatus };

    for (const channel of failedChannels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(notification);
            deliveryStatus[channel] = 'sent';
            break;

          case 'slack':
            await this.sendSlack(notification);
            deliveryStatus[channel] = 'sent';
            break;

          case 'webhook':
            await this.sendWebhook(notification);
            deliveryStatus[channel] = 'sent';
            break;

          case 'console':
            await this.sendConsole(notification);
            deliveryStatus[channel] = 'sent';
            break;
        }
      } catch (error: unknown) {
        console.error(`Retry failed for ${channel}:`, error.message);
        deliveryStatus[channel] = 'failed';
      }
    }

    // Update delivery status
    await this.supabase
      .from('notifications')
      .update({ delivery_status: deliveryStatus })
      .eq('id', notificationId);

    notification.deliveryStatus = deliveryStatus;

    return notification;
  }

  /**
   * Get notification configuration
   */
  private async getNotificationConfig(workspaceId: string): Promise<NotificationConfig> {
    // TODO: Load from database table
    // For now, return default config from environment variables
    return {
      emailEnabled: !!process.env.EMAIL_FROM,
      emailRecipients: process.env.NOTIFICATION_EMAIL_RECIPIENTS?.split(','),
      slackEnabled: !!process.env.SLACK_WEBHOOK_URL,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      webhookEnabled: !!process.env.CUSTOM_WEBHOOK_URL,
      customWebhookUrl: process.env.CUSTOM_WEBHOOK_URL,
    };
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: Notification['severity']): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  /**
   * Map database record to Notification interface
   */
  private mapNotification(data: any): Notification {
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      metadata: data.metadata || {},
      channels: data.channels,
      sentAt: data.sent_at,
      deliveryStatus: data.delivery_status || {},
      createdAt: data.created_at,
    };
  }
}
