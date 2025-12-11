import { createClient } from '@/lib/supabase/server';

/**
 * Guardian Alert → Incident Bridge (G38)
 *
 * Automatically creates incidents from high/critical Guardian alert events.
 * This bridge is called by both manual evaluation (G36) and scheduled evaluation (G37).
 *
 * Design Principles:
 * - Only high/critical severity alerts create incidents
 * - Best-effort: errors are logged but do not throw (never break alert evaluation)
 * - Incidents created with status 'open' and generic summary
 * - Reuses existing incidents table from Phase E21
 */

export interface GuardianFiredAlert {
  ruleId: string;
  message: string;
  payload: unknown;
  severity: string;
  source: string;
}

/**
 * Bridge fired Guardian alerts into incidents table
 *
 * @param tenantId - Tenant ID
 * @param alerts - Fired alerts from evaluation engine
 * @param createdBy - User ID or 'guardian_scheduler' for system-created incidents
 */
export async function bridgeAlertsToIncidents(
  tenantId: string,
  alerts: GuardianFiredAlert[],
  createdBy: string | null
): Promise<void> {
  if (!alerts || alerts.length === 0) return;

  const supabase = await createClient();

  for (const alert of alerts) {
    // Only bridge high/critical severity alerts
    if (alert.severity !== 'high' && alert.severity !== 'critical') {
      continue;
    }

    // Create incident title and summary
    const title = `Guardian alert: ${alert.message}`;
    const payloadSnippet = JSON.stringify(alert.payload).slice(0, 400);
    const summary = `Guardian generated an alert from source '${alert.source}'.\n\nRule ID: ${alert.ruleId}\nSeverity: ${alert.severity}\n\nPayload snippet:\n${payloadSnippet}...`;

    try {
      const { error } = await supabase.from('incidents').insert({
        tenant_id: tenantId,
        severity: alert.severity,
        status: 'open',
        title,
        summary,
        created_by: createdBy,
      });

      if (error) {
        console.error(
          `[Guardian G38] Failed to bridge alert to incident (tenant: ${tenantId}, rule: ${alert.ruleId}):`,
          error
        );
        // Don't throw - best-effort only
      } else {
        console.log(
          `[Guardian G38] Bridged ${alert.severity} alert to incident (tenant: ${tenantId}, rule: ${alert.ruleId})`
        );
      }
    } catch (err) {
      console.error(
        `[Guardian G38] Unexpected error bridging alert to incident (tenant: ${tenantId}, rule: ${alert.ruleId}):`,
        err
      );
      // Don't throw - best-effort only
    }
  }
}
