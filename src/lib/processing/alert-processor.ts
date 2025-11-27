/**
 * Alert Event Processor
 * Handles real-time alert processing, deduplication, and notification
 */

import { alertQueue, notificationQueue } from '@/lib/queue/bull-queue';
import { alertWebSocketServer } from '@/lib/websocket/websocket-server';
import { cacheManager } from '@/lib/cache/redis-client';
import { getSupabaseServer } from '@/lib/supabase';

interface AlertTriggerData {
  alertRuleId: string;
  frameworkId: string;
  workspaceId: string;
  currentValue: number;
  thresholdValue: number;
  alertType: string;
  metadata?: Record<string, any>;
}

class AlertProcessor {
  private suppressionWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
  private metrics = {
    processed: 0,
    suppressed: 0,
    notified: 0,
    errors: 0,
  };

  /**
   * Process alert trigger - adds to queue
   */
  async processAlertTrigger(data: AlertTriggerData): Promise<string | null> {
    try {
      const job = await alertQueue.add(
        {
          ...data,
          timestamp: Date.now(),
        },
        {
          jobId: `alert-${data.alertRuleId}-${Date.now()}`,
          priority: this.calculatePriority(data),
        }
      );

      console.log(`[Alert Processor] Alert queued: job ${job.id}`);
      return job.id;
    } catch (error) {
      console.error('[Alert Processor] Queue error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * Handle alert trigger from queue
   */
  async handleAlertTrigger(data: AlertTriggerData): Promise<void> {
    try {
      // Check for suppression
      const isSuppressed = await this.checkSuppression(data);
      if (isSuppressed) {
        console.log(`[Alert Processor] Alert ${data.alertRuleId} suppressed (duplicate)`);
        this.metrics.suppressed++;
        return;
      }

      // Get database client
      const supabase = await getSupabaseServer();

      // Fetch alert rule
      const { data: rule, error: ruleError } = await supabase
        .from('convex_framework_alert_rules')
        .select('*')
        .eq('id', data.alertRuleId)
        .single();

      if (ruleError || !rule) {
        console.error(`[Alert Processor] Rule not found: ${data.alertRuleId}`);
        this.metrics.errors++;
        return;
      }

      // Store trigger event
      const { data: trigger, error: triggerError } = await supabase
        .from('convex_framework_alert_triggers')
        .insert([
          {
            alert_rule_id: data.alertRuleId,
            triggered_at: new Date().toISOString(),
            current_value: data.currentValue,
            threshold_value: data.thresholdValue,
            notification_sent: false,
            status: 'active',
            metadata: data.metadata,
          },
        ])
        .select()
        .single();

      if (triggerError || !trigger) {
        console.error('[Alert Processor] Failed to store trigger:', triggerError);
        this.metrics.errors++;
        return;
      }

      // Send notifications if configured
      if (rule.notification_channels && rule.notification_channels.length > 0) {
        await this.sendNotifications(rule, trigger, data);
      }

      // Broadcast via WebSocket
      const broadcastCount = await alertWebSocketServer.broadcastAlert(
        data.workspaceId,
        data.frameworkId,
        {
          id: trigger.id,
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.alert_type,
          status: 'active',
          triggeredAt: trigger.triggered_at,
          currentValue: data.currentValue,
          thresholdValue: data.thresholdValue,
        }
      );

      console.log(`[Alert Processor] Broadcast to ${broadcastCount} clients`);

      // Invalidate cache
      await this.invalidateCache(data.workspaceId, data.frameworkId);

      // Record metric
      this.metrics.processed++;
      this.metrics.notified += rule.notification_channels.length;

      console.log(`[Alert Processor] Alert processed: ${trigger.id}`);
    } catch (error) {
      console.error('[Alert Processor] Processing error:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Check if alert should be suppressed (deduplication)
   */
  private async checkSuppression(data: AlertTriggerData): Promise<boolean> {
    try {
      const supabase = await getSupabaseServer();

      // Check for recent triggers of same alert
      const cutoffTime = new Date(Date.now() - this.suppressionWindow).toISOString();

      const { data: recentTriggers, error } = await supabase
        .from('convex_framework_alert_triggers')
        .select('id')
        .eq('alert_rule_id', data.alertRuleId)
        .gt('triggered_at', cutoffTime)
        .limit(1);

      return (recentTriggers || []).length > 0;
    } catch (error) {
      console.error('[Alert Processor] Suppression check error:', error);
      return false;
    }
  }

  /**
   * Send notifications to configured channels
   */
  private async sendNotifications(rule: any, trigger: any, data: AlertTriggerData): Promise<void> {
    const channels = rule.notification_channels || [];

    for (const channel of channels) {
      const jobData = {
        triggerId: trigger.id,
        ruleId: rule.id,
        ruleName: rule.name,
        channel,
        workspaceId: data.workspaceId,
        frameworkId: data.frameworkId,
        currentValue: data.currentValue,
        thresholdValue: data.thresholdValue,
        alertType: data.alertType,
      };

      try {
        switch (channel) {
          case 'email':
            await notificationQueue.add(
              { ...jobData, type: 'email' },
              { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
            );
            break;

          case 'slack':
            await notificationQueue.add(
              { ...jobData, type: 'slack' },
              { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
            );
            break;

          case 'webhook':
            await notificationQueue.add(
              { ...jobData, type: 'webhook', url: rule.webhook_url },
              { attempts: 5, backoff: { type: 'exponential', delay: 2000 } }
            );
            break;

          case 'in-app':
            // In-app notifications don't need queue
            console.log(`[Alert Processor] In-app notification for trigger ${trigger.id}`);
            break;

          default:
            console.warn(`[Alert Processor] Unknown notification channel: ${channel}`);
        }
      } catch (error) {
        console.error(`[Alert Processor] Failed to queue ${channel} notification:`, error);
      }
    }
  }

  /**
   * Invalidate related caches
   */
  private async invalidateCache(workspaceId: string, frameworkId: string): Promise<void> {
    try {
      await cacheManager.invalidatePattern(`alerts:${workspaceId}:${frameworkId}*`);
      await cacheManager.invalidatePattern(`stats:${workspaceId}*`);
      console.log(`[Alert Processor] Cache invalidated`);
    } catch (error) {
      console.error('[Alert Processor] Cache invalidation error:', error);
    }
  }

  /**
   * Calculate job priority based on alert severity
   */
  private calculatePriority(data: AlertTriggerData): number {
    const severityMap: Record<string, number> = {
      critical: 10,
      high: 7,
      medium: 4,
      low: 1,
    };

    return severityMap[data.alertType] || 4;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(triggerId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await getSupabaseServer();

      const { error } = await supabase
        .from('convex_framework_alert_triggers')
        .update({
          acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
          status: 'acknowledged',
        })
        .eq('id', triggerId);

      if (error) {
        console.error('[Alert Processor] Acknowledge error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Alert Processor] Acknowledge error:', error);
      return false;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(triggerId: string, userId: string, notes?: string): Promise<boolean> {
    try {
      const supabase = await getSupabaseServer();

      const { error } = await supabase
        .from('convex_framework_alert_triggers')
        .update({
          resolved: true,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
          status: 'resolved',
        })
        .eq('id', triggerId);

      if (error) {
        console.error('[Alert Processor] Resolve error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Alert Processor] Resolve error:', error);
      return false;
    }
  }

  /**
   * Get processor metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      suppression_window_minutes: this.suppressionWindow / (60 * 1000),
    };
  }
}

// Singleton instance
export const alertProcessor = new AlertProcessor();

export default AlertProcessor;
