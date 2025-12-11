import { createClient } from '@/lib/supabase/server';
import type { GuardianAlertRule } from '@/lib/guardian/alertRulesService';
import type { GuardianFiredAlert } from '@/lib/guardian/alertIncidentBridge';

/**
 * Guardian Alert Webhook Dispatcher (G39)
 *
 * Dispatches fired Guardian alerts to configured webhook URLs.
 * Only alerts from rules with channel='webhook' are dispatched.
 *
 * Design Principles:
 * - Best-effort only: errors are logged but never thrown
 * - Tenant-scoped: Only active webhooks for the tenant are loaded
 * - Rule-filtered: Only rules with channel='webhook' trigger webhooks
 * - No external dependencies: Uses built-in fetch API only
 */

export interface GuardianAlertWebhook {
  id: string;
  tenant_id: string;
  rule_id: string;
  url: string;
  secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Dispatch fired Guardian alerts to configured webhooks
 *
 * @param tenantId - Tenant ID
 * @param firedAlerts - Alerts that matched conditions during evaluation
 * @param rules - All alert rules (used to filter by channel='webhook')
 */
export async function dispatchGuardianAlertWebhooks(
  tenantId: string,
  firedAlerts: GuardianFiredAlert[],
  rules: GuardianAlertRule[]
): Promise<void> {
  if (!firedAlerts || firedAlerts.length === 0) return;

  try {
    const supabase = await createClient();

    // Fetch active webhooks for tenant
    const { data: webhooks, error } = await supabase
      .from('guardian_alert_webhooks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) {
      console.error('[Guardian G39] Failed to load webhooks:', error);
      return; // Best-effort: don't throw
    }

    if (!webhooks || webhooks.length === 0) {
      return; // No webhooks configured
    }

    const webhookList = webhooks as GuardianAlertWebhook[];

    // Build lookup maps for efficient filtering
    const rulesById = new Map<string, GuardianAlertRule>();
    for (const rule of rules) {
      rulesById.set(rule.id, rule);
    }

    const webhooksByRuleId = new Map<string, GuardianAlertWebhook[]>();
    for (const webhook of webhookList) {
      const list = webhooksByRuleId.get(webhook.rule_id) ?? [];
      list.push(webhook);
      webhooksByRuleId.set(webhook.rule_id, list);
    }

    // Dispatch webhooks for each fired alert
    for (const alert of firedAlerts) {
      const rule = rulesById.get(alert.ruleId);
      if (!rule) continue;

      // Only dispatch for webhook-channel rules
      if (rule.channel !== 'webhook') continue;

      const targets = webhooksByRuleId.get(rule.id);
      if (!targets || targets.length === 0) continue;

      // Build webhook payload
      const payload = {
        tenantId,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: alert.severity,
        source: alert.source,
        message: alert.message,
        payload: alert.payload,
        createdAt: new Date().toISOString(),
      };

      // Dispatch to all active webhooks for this rule
      for (const webhook of targets) {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Guardian-Tenant-Id': tenantId,
              'X-Guardian-Rule-Id': rule.id,
              ...(webhook.secret ? { 'X-Guardian-Webhook-Secret': webhook.secret } : {}),
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (!response.ok) {
            console.error('[Guardian G39] Webhook dispatch failed (non-200 response):', {
              url: webhook.url,
              ruleId: rule.id,
              status: response.status,
              statusText: response.statusText,
            });
          } else {
            console.log('[Guardian G39] Webhook dispatched successfully:', {
              url: webhook.url,
              ruleId: rule.id,
              severity: alert.severity,
            });
          }
        } catch (err) {
          console.error('[Guardian G39] Webhook dispatch error:', {
            error: String(err),
            url: webhook.url,
            ruleId: rule.id,
          });
          // Best-effort: continue dispatching to other webhooks
        }
      }
    }
  } catch (err) {
    console.error('[Guardian G39] Webhook dispatcher unexpected error:', err);
    // Best-effort: don't throw
  }
}
