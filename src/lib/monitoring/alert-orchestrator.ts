/**
 * Alert Orchestrator Service
 * Routes threats to Slack, email, and webhook channels based on preferences
 *
 * Features:
 * - Severity threshold filtering
 * - Threat type filtering
 * - Do-not-disturb schedule checking (hours + weekends)
 * - Multi-channel delivery (parallel)
 * - Delivery logging for audit trail
 * - Error handling with fallthrough
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { SEOThreat } from './seo-threat-monitor';

export interface AlertContext {
  workspaceId: string;
  threat: SEOThreat;
  dashboardUrl?: string;
}

interface AlertPreferences {
  id: string;
  workspace_id: string;
  slack_enabled: boolean;
  slack_webhook_url: string | null;
  email_enabled: boolean;
  email_recipients: string[];
  webhook_enabled: boolean;
  webhook_url: string | null;
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  threat_types: string[];
  dnd_enabled: boolean;
  dnd_start_hour: number;
  dnd_end_hour: number;
  dnd_timezone: string;
  dnd_weekends: boolean;
}

/**
 * Main orchestration function
 * Determines if alert should be sent and routes to appropriate channels
 */
export async function orchestrateAlert(context: AlertContext): Promise<void> {
  const { workspaceId, threat } = context;

  try {
    // 1. Fetch alert preferences for workspace
    const prefs = await getAlertPreferences(workspaceId);
    if (!prefs) {
      console.warn(`[AlertOrchestrator] No preferences found for workspace ${workspaceId}`);
      return;
    }

    // 2. Check severity threshold
    if (!meetsThreshold(threat.severity, prefs.severity_threshold)) {
      await logAlertDelivery(
        workspaceId,
        threat.id,
        'all',
        'skipped',
        `Below severity threshold (${threat.severity} < ${prefs.severity_threshold})`
      );
      return;
    }

    // 3. Check threat type filter
    if (!prefs.threat_types.includes(threat.type)) {
      await logAlertDelivery(
        workspaceId,
        threat.id,
        'all',
        'skipped',
        `Threat type filtered: ${threat.type}`
      );
      return;
    }

    // 4. Check do-not-disturb window
    if (isDoNotDisturb(prefs)) {
      await logAlertDelivery(
        workspaceId,
        threat.id,
        'all',
        'skipped',
        'Do-not-disturb window active'
      );
      return;
    }

    // 5. Send to enabled channels (parallel)
    const deliveryPromises: Promise<void>[] = [];

    if (prefs.slack_enabled && prefs.slack_webhook_url) {
      deliveryPromises.push(
        sendSlackAlert(threat, prefs.slack_webhook_url, context.dashboardUrl)
          .then(async () => {
            await logAlertDelivery(workspaceId, threat.id, 'slack', 'sent');
          })
          .catch(async (err) => {
            await logAlertDelivery(
              workspaceId,
              threat.id,
              'slack',
              'failed',
              err instanceof Error ? err.message : String(err)
            );
          })
      );
    }

    if (prefs.email_enabled && prefs.email_recipients.length > 0) {
      deliveryPromises.push(
        sendEmailAlert(threat, prefs.email_recipients, context.dashboardUrl)
          .then(async () => {
            await logAlertDelivery(
              workspaceId,
              threat.id,
              'email',
              'sent',
              prefs.email_recipients.join(';')
            );
          })
          .catch(async (err) => {
            await logAlertDelivery(
              workspaceId,
              threat.id,
              'email',
              'failed',
              err instanceof Error ? err.message : String(err)
            );
          })
      );
    }

    if (prefs.webhook_enabled && prefs.webhook_url) {
      deliveryPromises.push(
        sendCustomWebhook(threat, prefs.webhook_url, context.dashboardUrl)
          .then(async () => {
            await logAlertDelivery(workspaceId, threat.id, 'webhook', 'sent', prefs.webhook_url);
          })
          .catch(async (err) => {
            await logAlertDelivery(
              workspaceId,
              threat.id,
              'webhook',
              'failed',
              err instanceof Error ? err.message : String(err)
            );
          })
      );
    }

    // Wait for all deliveries (don't throw on individual failures)
    await Promise.allSettled(deliveryPromises);

    console.log(`[AlertOrchestrator] Alert orchestrated for threat ${threat.id} in workspace ${workspaceId}`);
  } catch (error) {
    console.error('[AlertOrchestrator] Fatal error:', error);
    // Don't throw - log and continue
  }
}

/**
 * Check if alert severity meets threshold
 * Thresholds: low (1) < medium (2) < high (3) < critical (4)
 */
function meetsThreshold(severity: string, threshold: string): boolean {
  const levels: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  const severityLevel = levels[severity.toLowerCase()] ?? 0;
  const thresholdLevel = levels[threshold.toLowerCase()] ?? 3;

  return severityLevel >= thresholdLevel;
}

/**
 * Check if currently in do-not-disturb window
 * Supports hour ranges (e.g., 22:00-08:00) and weekend suppression
 */
function isDoNotDisturb(prefs: AlertPreferences): boolean {
  if (!prefs.dnd_enabled) {
    return false;
  }

  const now = new Date();

  // Weekend check
  if (prefs.dnd_weekends) {
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 0 = Sunday, 6 = Saturday
      return true;
    }
  }

  // Hour range check
  const currentHour = now.getUTCHours();
  const { dnd_start_hour, dnd_end_hour } = prefs;

  if (dnd_start_hour < dnd_end_hour) {
    // Normal range (e.g., 9:00-17:00)
    return currentHour >= dnd_start_hour && currentHour < dnd_end_hour;
  } else {
    // Wraps midnight (e.g., 22:00-08:00)
    return currentHour >= dnd_start_hour || currentHour < dnd_end_hour;
  }
}

/**
 * Fetch alert preferences for workspace
 */
async function getAlertPreferences(workspaceId: string): Promise<AlertPreferences | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    console.warn(`[AlertOrchestrator] Failed to fetch preferences:`, error);
    return null;
  }

  return data as AlertPreferences;
}

/**
 * Log alert delivery attempt for audit trail
 */
async function logAlertDelivery(
  workspaceId: string,
  threatId: string,
  channel: string,
  status: 'sent' | 'failed' | 'skipped',
  details?: string
): Promise<void> {
  try {
    const supabase = getSupabaseServer();

    await supabase.from('alert_delivery_log').insert({
      workspace_id: workspaceId,
      threat_id: threatId,
      channel,
      recipient: details || null,
      status,
      error_message: status === 'failed' ? details : null,
    });
  } catch (error) {
    console.error('[AlertOrchestrator] Failed to log delivery:', error);
  }
}

/**
 * Send alert via Slack webhook
 * (Implementation delegated to separate module)
 */
async function sendSlackAlert(
  threat: SEOThreat,
  webhookUrl: string,
  dashboardUrl?: string
): Promise<void> {
  // Dynamic import to avoid circular dependencies
  const { sendSlackAlert: send } = await import('./channels/slack-notifier');
  return send(threat, webhookUrl, dashboardUrl);
}

/**
 * Send alert via email (Sendgrid or Resend)
 * (Implementation delegated to separate module)
 */
async function sendEmailAlert(
  threat: SEOThreat,
  recipients: string[],
  dashboardUrl?: string
): Promise<void> {
  // Dynamic import to avoid circular dependencies
  const { sendEmailAlert: send } = await import('./channels/email-notifier');
  return send(threat, recipients, dashboardUrl);
}

/**
 * Send alert via custom webhook
 */
async function sendCustomWebhook(
  threat: SEOThreat,
  webhookUrl: string,
  _dashboardUrl?: string
): Promise<void> {
  const payload = {
    type: 'seo_threat_alert',
    threat: {
      id: threat.id,
      type: threat.type,
      severity: threat.severity,
      domain: threat.domain,
      title: threat.title,
      description: threat.description,
      detectedAt: threat.detectedAt,
      impactEstimate: threat.impactEstimate,
      recommendedAction: threat.recommendedAction,
      data: threat.data,
    },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 10000,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Webhook failed: ${response.status} ${text}`);
  }
}
