import { createClient } from '@/lib/supabase/server';

/**
 * Guardian Risk Score Service (G47)
 *
 * Standard risk scoring model:
 * - Severity-weighted alert counts (low=1, medium=2, high=4, critical=8)
 * - Severity-weighted incident counts (×2 multiplier)
 * - Open incident penalty (+5 per open incident)
 * - Time decay (older windows weighted less, up to 40% decay)
 * - Final score: 0-100 scale
 *
 * Window: Last 7 days (configurable)
 *
 * Design Principles:
 * - Standardized scoring model across all tenants
 * - Daily score computation (one score per date)
 * - Breakdown stored for transparency
 * - Idempotent (upsert by tenant_id + date)
 */

export interface GuardianRiskScoreRow {
  id: string;
  tenant_id: string;
  date: string;
  score: number;
  breakdown: {
    window_days: number;
    alerts_count: number;
    incidents_count: number;
    incident_open_count: number;
    alert_score: number;
    incident_score: number;
    decay: number;
  };
  created_at: string;
}

/**
 * Compute Guardian risk score for a tenant
 *
 * @param tenantId - Tenant ID
 * @param date - Date to compute score for (default: today)
 * @returns Computed risk score record
 */
export async function computeGuardianRiskScore(
  tenantId: string,
  date: Date = new Date()
): Promise<GuardianRiskScoreRow> {
  const supabase = await createClient();

  const end = date;
  const windowDays = 7;
  const start = new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000);

  // Fetch alerts and incidents from window
  const [alertsResult, incidentsResult] = await Promise.all([
    supabase
      .from('guardian_alert_events')
      .select('severity, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', start.toISOString()),
    supabase
      .from('incidents')
      .select('severity, status, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', start.toISOString()),
  ]);

  if (alertsResult.error) throw alertsResult.error;
  if (incidentsResult.error) throw incidentsResult.error;

  // Severity weights (standard model)
  const severityWeights: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 4,
    critical: 8,
  };

  // Compute alert score
  let alertScore = 0;
  for (const alert of alertsResult.data ?? []) {
    const severity = (alert as any).severity || 'medium';
    alertScore += severityWeights[severity] ?? 2;
  }

  // Compute incident score (incidents weigh 2× alerts)
  let incidentScore = 0;
  let incidentOpenCount = 0;
  for (const incident of incidentsResult.data ?? []) {
    const row = incident as any;
    const severity = row.severity || 'medium';
    incidentScore += (severityWeights[severity] ?? 2) * 2;
    if (row.status !== 'resolved') {
      incidentOpenCount += 1;
    }
  }

  // Raw score: alerts + incidents + open incident penalty
  const rawScore = alertScore + incidentScore + incidentOpenCount * 5;

  // Time decay: Older windows get lower weight (up to 40% decay over 7 days)
  const daysSinceStart = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
  const decay = 1 - Math.min(0.4, daysSinceStart * 0.02);

  // Final score: 0-100 scale with decay applied
  const finalScore = Math.min(100, Math.round(rawScore * decay));

  const keyDate = end.toISOString().slice(0, 10); // YYYY-MM-DD

  // Upsert score record
  const { data, error } = await supabase
    .from('guardian_risk_scores')
    .upsert(
      {
        tenant_id: tenantId,
        date: keyDate,
        score: finalScore,
        breakdown: {
          window_days: windowDays,
          alerts_count: alertsResult.data?.length ?? 0,
          incidents_count: incidentsResult.data?.length ?? 0,
          incident_open_count: incidentOpenCount,
          alert_score: alertScore,
          incident_score: incidentScore,
          decay,
        },
      },
      { onConflict: 'tenant_id,date' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('[Guardian G47] Failed to upsert risk score:', error);
    throw error;
  }

  console.log('[Guardian G47] Risk score computed:', {
    tenantId,
    date: keyDate,
    score: finalScore,
  });

  return data as GuardianRiskScoreRow;
}

/**
 * List historical risk scores for a tenant
 *
 * @param tenantId - Tenant ID
 * @param limit - Maximum number of scores (default 30)
 * @returns List of risk scores ordered by date DESC
 */
export async function listGuardianRiskScores(
  tenantId: string,
  limit = 30
): Promise<GuardianRiskScoreRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guardian_risk_scores')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Guardian G47] Failed to list risk scores:', error);
    throw error;
  }

  return data as GuardianRiskScoreRow[];
}
