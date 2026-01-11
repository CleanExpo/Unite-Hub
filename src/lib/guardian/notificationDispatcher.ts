import type { GuardianAlertRule } from '@/lib/guardian/alertRulesService';
import type { GuardianFiredAlert } from '@/lib/guardian/alertIncidentBridge';
import { createGuardianNotification } from '@/lib/guardian/notificationService';
import {
  renderGuardianAlertEmailBody,
  renderGuardianAlertEmailSubject,
} from '@/lib/guardian/emailTemplates';
import { sendGuardianEmailNotification } from '@/lib/guardian/emailSender';
import { sendGuardianSlackNotification } from '@/lib/guardian/slackNotifier';

/**
 * Guardian Notification Dispatcher (G40-G42)
 *
 * Orchestrates email and Slack notifications for Guardian alert events.
 * Called by both manual (G36) and scheduled (G37) evaluation flows.
 *
 * Notification Rules:
 * - Email: Only for rules with channel='email'
 * - Slack: For high/critical alerts (regardless of channel)
 * - Both: Best-effort (failures logged but don't break evaluation)
 *
 * Design Principles:
 * - Channel-aware (respects rule channel configuration)
 * - Severity-aware (Slack only for high/critical)
 * - Context-aware (tracks manual vs scheduled, actor ID)
 * - Best-effort (never throws to caller)
 */

interface DispatchContext {
  reason: 'manual' | 'scheduled';
  actorId: string | null;
  emailTo?: string;
}

/**
 * Dispatch Guardian notifications for fired alerts
 *
 * @param tenantId - Tenant ID
 * @param firedAlerts - Alerts that matched conditions during evaluation
 * @param rules - All alert rules (used to determine notification channels)
 * @param ctx - Dispatch context (manual/scheduled, actor, email recipient)
 */
export async function dispatchGuardianNotifications(
  tenantId: string,
  firedAlerts: GuardianFiredAlert[],
  rules: GuardianAlertRule[],
  ctx: DispatchContext
): Promise<void> {
  if (!firedAlerts || firedAlerts.length === 0) return;

  try {
    // Build lookup map for efficient rule access
    const rulesById = new Map<string, GuardianAlertRule>();
    for (const rule of rules) {
      rulesById.set(rule.id, rule);
    }

    // Dispatch notifications for each fired alert
    for (const alert of firedAlerts) {
      const rule = rulesById.get(alert.ruleId);
      if (!rule) continue;

      // Email notifications (only for rules with channel='email')
      if (rule.channel === 'email') {
        await dispatchEmailNotification(tenantId, alert, rule, ctx);
      }

      // Slack notifications (only for high/critical severity)
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await dispatchSlackNotification(tenantId, alert, rule, ctx);
      }
    }
  } catch (err) {
    console.error('[Guardian G40] Notification dispatcher unexpected error:', err);
    // Best-effort: don't throw to caller
  }
}

/**
 * Dispatch email notification for an alert
 */
async function dispatchEmailNotification(
  tenantId: string,
  alert: GuardianFiredAlert,
  rule: GuardianAlertRule,
  ctx: DispatchContext
): Promise<void> {
  try {
    const payloadSnippet = JSON.stringify(alert.payload).slice(0, 600);

    // Render email subject and body
    const subject = renderGuardianAlertEmailSubject({
      ruleName: rule.name,
      severity: alert.severity as any,
    });

    const body = renderGuardianAlertEmailBody({
      ruleName: rule.name,
      severity: alert.severity as any,
      source: alert.source,
      message: alert.message,
      payloadSnippet,
    });

    // Create notification record
    const notif = await createGuardianNotification({
      tenantId,
      type: 'alert',
      channel: 'email',
      severity: alert.severity as any,
      target: ctx.emailTo,
      context: {
        ruleId: rule.id,
        ruleName: rule.name,
        source: alert.source,
        reason: ctx.reason,
        actorId: ctx.actorId,
      },
    });

    // Send email (best-effort)
    await sendGuardianEmailNotification({
      notificationId: notif.id,
      to: ctx.emailTo,
      subject,
      html: body.html,
      text: body.text,
    });
  } catch (err) {
    console.error('[Guardian G40] Email notification dispatch failed:', err);
    // Best-effort: continue with other notifications
  }
}

/**
 * Dispatch Slack notification for an alert
 */
async function dispatchSlackNotification(
  tenantId: string,
  alert: GuardianFiredAlert,
  rule: GuardianAlertRule,
  ctx: DispatchContext
): Promise<void> {
  try {
    // Build Slack message text
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
    const text = [
      `${emoji} Guardian ${alert.severity?.toUpperCase()} alert: ${alert.message}`,
      `Rule: ${rule.name}`,
      `Source: ${alert.source}`,
      ctx.reason === 'manual' ? `Triggered by: ${ctx.actorId}` : 'Triggered by: Scheduled evaluation',
    ].join('\n');

    // Create notification record
    const notif = await createGuardianNotification({
      tenantId,
      type: 'alert',
      channel: 'slack',
      severity: alert.severity as any,
      context: {
        ruleId: rule.id,
        ruleName: rule.name,
        source: alert.source,
        reason: ctx.reason,
        actorId: ctx.actorId,
      },
    });

    // Send Slack message (best-effort)
    await sendGuardianSlackNotification({
      tenantId,
      notificationId: notif.id,
      text,
    });
  } catch (err) {
    console.error('[Guardian G40] Slack notification dispatch failed:', err);
    // Best-effort: continue with other notifications
  }
}
