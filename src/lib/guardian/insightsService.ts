import { createClient } from '@/lib/supabase/server';

/**
 * Guardian Insights Service (G50)
 *
 * Provides high-level aggregations and metrics for Guardian activity.
 * Read-only service that queries existing Guardian tables.
 *
 * Metrics:
 * - Alert counts (24h, 7d)
 * - Incident counts (30d, open)
 * - Top triggering rules (7d)
 * - Latest risk score
 */

export interface GuardianInsightsSummary {
  alerts_last_24h: number;
  alerts_last_7d: number;
  incidents_last_30d: number;
  open_incidents: number;
  top_rules: { rule_id: string; count: number }[];
  risk_latest?: { date: string; score: number } | null;
}

/**
 * Get Guardian insights summary for a tenant
 *
 * @param tenantId - Tenant ID
 * @returns Aggregated metrics and insights
 */
export async function getGuardianInsightsSummary(
  tenantId: string
): Promise<GuardianInsightsSummary> {
  const supabase = await createClient();

  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const d24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all metrics in parallel
  const [alerts24, alerts7, incidents30, openIncidents, topRulesData, latestRisk] =
    await Promise.all([
      // Alerts in last 24 hours
      supabase
        .from('guardian_alert_events')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', iso(d24)),

      // Alerts in last 7 days
      supabase
        .from('guardian_alert_events')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', iso(d7)),

      // Incidents in last 30 days
      supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', iso(d30)),

      // Open incidents
      supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .neq('status', 'resolved'),

      // Top rules by alert count (last 7 days)
      supabase
        .from('guardian_alert_events')
        .select('rule_id')
        .eq('tenant_id', tenantId)
        .gte('created_at', iso(d7))
        .then((res) => {
          if (res.error) throw res.error;
          const counts = new Map<string, number>();
          for (const row of res.data ?? []) {
            const id = (row as any).rule_id as string | null;
            if (!id) continue;
            counts.set(id, (counts.get(id) ?? 0) + 1);
          }
          return Array.from(counts.entries())
            .map(([rule_id, count]) => ({ rule_id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }),

      // Latest risk score
      supabase
        .from('guardian_risk_scores')
        .select('date, score')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(1),
    ]);

  if (alerts24.error) throw alerts24.error;
  if (alerts7.error) throw alerts7.error;
  if (incidents30.error) throw incidents30.error;
  if (openIncidents.error) throw openIncidents.error;
  if (latestRisk.error) throw latestRisk.error;

  return {
    alerts_last_24h: alerts24.count ?? 0,
    alerts_last_7d: alerts7.count ?? 0,
    incidents_last_30d: incidents30.count ?? 0,
    open_incidents: openIncidents.count ?? 0,
    top_rules: topRulesData,
    risk_latest: latestRisk.data?.[0]
      ? {
          date: (latestRisk.data[0] as any).date,
          score: Number((latestRisk.data[0] as any).score),
        }
      : null,
  };
}
