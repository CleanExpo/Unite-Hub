import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { listGuardianAlertRules } from '@/lib/guardian/alertRulesService';
import { evaluateGuardianAlertRules } from '@/lib/guardian/alertEvaluator';
import { bridgeAlertsToIncidents } from '@/lib/guardian/alertIncidentBridge';
import { dispatchGuardianAlertWebhooks } from '@/lib/guardian/alertWebhookDispatcher';
import { dispatchGuardianNotifications } from '@/lib/guardian/notificationDispatcher';
import { createClient } from '@/lib/supabase/server';

// Guardian Alert Evaluation Engine (G36-G42)
// POST /api/guardian/alerts/evaluate
// Evaluates all active alert rules and generates events
// Only guardian_admin can trigger evaluation
// - Webhook-channel alerts dispatch to configured URLs (G39)
// - Email-channel alerts send email notifications (G41)
// - High/critical alerts send Slack notifications (G42)
// - High/critical alerts automatically create incidents (G38)

const ADMIN_ONLY = ['guardian_admin'];

export async function POST() {
  try {
    // Enforce admin-only access
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Fetch all active alert rules
    const rules = await listGuardianAlertRules(tenantId);
    const activeRules = rules.filter((r) => r.is_active);

    // Evaluate rules against current data
    const results = await evaluateGuardianAlertRules(tenantId, activeRules);

    // Insert fired events into guardian_alert_events
    if (results.length > 0) {
      const supabase = await createClient();

      for (const event of results) {
        const { error } = await supabase.from('guardian_alert_events').insert({
          tenant_id: tenantId,
          rule_id: event.ruleId,
          severity: event.severity,
          source: event.source,
          message: event.message,
          payload: event.payload,
        });

        if (error) {
          console.error('[Guardian G36] Failed to insert alert event:', error);
        }
      }

      // Dispatch webhook notifications for webhook-channel rules (G39)
      // Best-effort: errors are logged but don't break evaluation
      await dispatchGuardianAlertWebhooks(tenantId, results, rules);

      // Dispatch email + Slack notifications (G40-G42)
      // Email: rules with channel='email'
      // Slack: high/critical alerts
      // Best-effort: errors are logged but don't break evaluation
      await dispatchGuardianNotifications(tenantId, results, rules, {
        reason: 'manual',
        actorId: userId,
        emailTo: process.env.GUARDIAN_EMAIL_TO_FALLBACK || undefined,
      });

      // Bridge high/critical alerts to incidents (G38)
      // Best-effort: errors are logged but don't break evaluation
      await bridgeAlertsToIncidents(tenantId, results, userId);
    }

    return NextResponse.json({
      success: true,
      rulesEvaluated: activeRules.length,
      eventsFired: results.length,
      events: results,
    });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN')
      ? 403
      : message.includes('UNAUTHENTICATED')
      ? 401
      : 500;

    console.error('Guardian alert evaluation failed:', error);
    return NextResponse.json(
      { error: 'Alert evaluation unavailable.', code },
      { status: code }
    );
  }
}
