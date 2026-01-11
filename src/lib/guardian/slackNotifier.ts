import { createClient } from '@/lib/supabase/server';
import {
  markGuardianNotificationFailed,
  markGuardianNotificationSent,
} from '@/lib/guardian/notificationService';

/**
 * Guardian Slack Notifier (G42)
 *
 * Sends Guardian alert notifications to Slack via incoming webhooks.
 * Requires per-tenant Slack configuration in guardian_slack_config table.
 *
 * Design Principles:
 * - Tenant-scoped configuration (one webhook URL per tenant)
 * - Best-effort delivery (failures logged to notification record)
 * - Simple text messages (formatted for Slack)
 * - No external NPM dependencies (built-in fetch only)
 */

interface GuardianSlackConfig {
  tenant_id: string;
  webhook_url: string;
  channel: string | null;
  is_active: boolean;
}

/**
 * Send Guardian Slack notification
 *
 * @param args - Slack notification parameters
 */
export async function sendGuardianSlackNotification(args: {
  tenantId: string;
  notificationId: string;
  text: string;
}): Promise<void> {
  const supabase = await createClient();

  // Fetch Slack configuration for tenant
  const { data, error } = await supabase
    .from('guardian_slack_config')
    .select('*')
    .eq('tenant_id', args.tenantId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[Guardian G42] Failed to load Slack configuration:', error);
    await markGuardianNotificationFailed(
      args.notificationId,
      'Slack configuration query failed.'
    );
    return;
  }

  if (!data) {
    console.warn(
      '[Guardian G42] Slack configuration missing or inactive for tenant:',
      args.tenantId
    );
    await markGuardianNotificationFailed(
      args.notificationId,
      'Slack configuration missing or inactive.'
    );
    return;
  }

  const cfg = data as GuardianSlackConfig;

  try {
    console.log('[Guardian G42] Sending Slack notification:', {
      notificationId: args.notificationId,
      tenantId: args.tenantId,
      hasChannel: !!cfg.channel,
    });

    // Build Slack message payload
    const payload: any = {
      text: args.text,
    };

    // Optional channel override
    if (cfg.channel) {
      payload.channel = cfg.channel;
    }

    // Send to Slack webhook
    const res = await fetch(cfg.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error('[Guardian G42] Slack webhook responded with error:', {
        status: res.status,
        statusText: res.statusText,
        body: errorText,
      });
      await markGuardianNotificationFailed(
        args.notificationId,
        `Slack responded with ${res.status}: ${errorText.slice(0, 200)}`
      );
      return;
    }

    console.log('[Guardian G42] Slack notification sent successfully:', {
      notificationId: args.notificationId,
      tenantId: args.tenantId,
    });

    await markGuardianNotificationSent(args.notificationId);
  } catch (err) {
    console.error('[Guardian G42] Slack send failed:', err);
    await markGuardianNotificationFailed(
      args.notificationId,
      `Slack send failed: ${String(err)}`
    );
  }
}
