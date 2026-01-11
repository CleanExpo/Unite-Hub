import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getDueAlertSchedules,
  markAlertScheduleRun,
} from '@/lib/guardian/alertSchedulerService';
import { listGuardianAlertRules } from '@/lib/guardian/alertRulesService';
import { evaluateGuardianAlertRules } from '@/lib/guardian/alertEvaluator';
import { bridgeAlertsToIncidents } from '@/lib/guardian/alertIncidentBridge';
import { dispatchGuardianAlertWebhooks } from '@/lib/guardian/alertWebhookDispatcher';
import { dispatchGuardianNotifications } from '@/lib/guardian/notificationDispatcher';

/**
 * Guardian Alert Scheduled Evaluation Endpoint (G37-G42)
 * POST /api/guardian/alerts/scheduled-run
 *
 * This endpoint is called by external cron jobs (Vercel Cron or Supabase Edge Scheduler).
 * It evaluates all tenants' alert rules that are due for evaluation based on their schedule configuration.
 *
 * Security: Protected by secret header (x-guardian-scheduler-secret)
 * No user authentication required - this is a system-to-system endpoint.
 *
 * Workflow:
 * 1. Verify secret header
 * 2. Fetch all tenant schedules
 * 3. Filter schedules due for evaluation (based on interval_minutes + last_run_at)
 * 4. For each due tenant:
 *    a. Fetch active alert rules
 *    b. Evaluate rules using G36 evaluation engine
 *    c. Insert fired events into guardian_alert_events
 *    d. Dispatch webhook notifications for webhook-channel rules (G39)
 *    e. Dispatch email + Slack notifications (G40-G42)
 *    f. Bridge high/critical alerts to incidents (G38)
 *    g. Mark schedule as run (update last_run_at)
 * 5. Return summary of evaluation runs
 */

export async function POST(req: NextRequest) {
  try {
    // Verify secret header
    const secret = process.env.GUARDIAN_SCHEDULER_SECRET;
    const receivedSecret = req.headers.get('x-guardian-scheduler-secret');

    if (!secret || !receivedSecret || receivedSecret !== secret) {
      console.warn('[Guardian G37] Unauthorized scheduled-run attempt');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all schedules due for evaluation
    const dueSchedules = await getDueAlertSchedules();

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tenants due for evaluation',
        evaluated: 0,
        results: [],
      });
    }

    console.log(
      `[Guardian G37] Evaluating ${dueSchedules.length} tenant(s) with due schedules`
    );

    const results: Array<{
      tenantId: string;
      rulesEvaluated: number;
      eventsFired: number;
      error?: string;
    }> = [];

    // Evaluate each tenant's alert rules
    for (const schedule of dueSchedules) {
      try {
        const { tenant_id: tenantId } = schedule;

        // Fetch active alert rules for tenant
        const rules = await listGuardianAlertRules(tenantId);
        const activeRules = rules.filter((r) => r.is_active);

        if (activeRules.length === 0) {
          results.push({
            tenantId,
            rulesEvaluated: 0,
            eventsFired: 0,
          });
          await markAlertScheduleRun(tenantId);
          continue;
        }

        // Evaluate rules using G36 evaluation engine
        const firedEvents = await evaluateGuardianAlertRules(tenantId, activeRules);

        // Insert fired events into guardian_alert_events
        if (firedEvents.length > 0) {
          for (const event of firedEvents) {
            const { error: insertError } = await supabaseAdmin
              .from('guardian_alert_events')
              .insert({
                tenant_id: tenantId,
                rule_id: event.ruleId,
                severity: event.severity,
                source: event.source,
                message: event.message,
                payload: event.payload,
              });

            if (insertError) {
              console.error(
                `[Guardian G37] Failed to insert alert event for tenant ${tenantId}:`,
                insertError
              );
            }
          }

          // Dispatch webhook notifications for webhook-channel rules (G39)
          // Best-effort: errors are logged but don't break evaluation
          await dispatchGuardianAlertWebhooks(tenantId, firedEvents, rules);

          // Dispatch email + Slack notifications (G40-G42)
          // Email: rules with channel='email'
          // Slack: high/critical alerts
          // Best-effort: errors are logged but don't break evaluation
          await dispatchGuardianNotifications(tenantId, firedEvents, rules, {
            reason: 'scheduled',
            actorId: 'guardian_scheduler',
            emailTo: process.env.GUARDIAN_EMAIL_TO_FALLBACK || undefined,
          });

          // Bridge high/critical alerts to incidents (G38)
          // Best-effort: errors are logged but don't break evaluation
          // created_by = 'guardian_scheduler' for system-created incidents
          await bridgeAlertsToIncidents(tenantId, firedEvents, 'guardian_scheduler');
        }

        // Mark schedule as run
        await markAlertScheduleRun(tenantId);

        results.push({
          tenantId,
          rulesEvaluated: activeRules.length,
          eventsFired: firedEvents.length,
        });

        console.log(
          `[Guardian G37] Evaluated tenant ${tenantId}: ${activeRules.length} rules, ${firedEvents.length} events fired`
        );
      } catch (error: unknown) {
        console.error(
          `[Guardian G37] Failed to evaluate tenant ${schedule.tenant_id}:`,
          error
        );
        results.push({
          tenantId: schedule.tenant_id,
          rulesEvaluated: 0,
          eventsFired: 0,
          error: String(error),
        });
      }
    }

    const totalEventsFired = results.reduce((sum, r) => sum + r.eventsFired, 0);

    return NextResponse.json({
      success: true,
      evaluated: dueSchedules.length,
      totalEventsFired,
      results,
    });
  } catch (error: unknown) {
    console.error('[Guardian G37] Scheduled evaluation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Scheduled evaluation failed',
        message: String(error),
      },
      { status: 500 }
    );
  }
}
