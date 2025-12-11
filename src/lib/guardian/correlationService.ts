import { createClient } from '@/lib/supabase/server';

/**
 * Guardian Correlation Engine (G46)
 *
 * Correlates recent Guardian alerts and incidents into clusters.
 * Uses simple time-window + severity bucketing for pattern detection.
 *
 * Algorithm:
 * 1. Fetch alerts + incidents from last hour
 * 2. Bucket by correlation key (severity + hour)
 * 3. Create cluster if 2+ events in bucket
 * 4. Link alerts/incidents to cluster
 *
 * Design Principles:
 * - Time-based correlation (hourly buckets)
 * - Severity-based correlation (group same severity)
 * - Idempotent (safe to run multiple times)
 * - Best-effort (errors logged but don't break)
 */

interface AlertEventRow {
  id: string;
  rule_id: string;
  severity: string;
  message: string;
  created_at: string;
}

interface IncidentRow {
  id: string;
  severity: string;
  status: string;
  title: string;
  created_at: string;
}

/**
 * Correlate recent Guardian events into clusters
 *
 * @param tenantId - Tenant ID
 * @returns Number of clusters created
 */
export async function correlateRecentGuardianEvents(
  tenantId: string
): Promise<{ clustersCreated: number }> {
  const supabase = await createClient();
  const windowMinutes = 60; // Last hour

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  // Fetch recent alerts and incidents in parallel
  const [alertsResult, incidentsResult] = await Promise.all([
    supabase
      .from('guardian_alert_events')
      .select('id, rule_id, severity, message, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', since),
    supabase
      .from('incidents')
      .select('id, severity, status, title, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', since),
  ]);

  if (alertsResult.error) throw alertsResult.error;
  if (incidentsResult.error) throw incidentsResult.error;

  const alertsData = (alertsResult.data ?? []) as AlertEventRow[];
  const incidentsData = (incidentsResult.data ?? []) as IncidentRow[];

  let clustersCreated = 0;

  // Bucket by correlation key: severity + rounded hour
  const buckets = new Map<string, { alerts: AlertEventRow[]; incidents: IncidentRow[] }>();

  const bucketKey = (severity: string, createdAt: string) => {
    const d = new Date(createdAt);
    const hour = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours()
    ).toISOString();
    return `${severity || 'unknown'}::${hour}`;
  };

  // Group alerts by bucket
  for (const alert of alertsData) {
    const key = bucketKey(alert.severity || 'medium', alert.created_at);
    const bucket = buckets.get(key) ?? { alerts: [], incidents: [] };
    bucket.alerts.push(alert);
    buckets.set(key, bucket);
  }

  // Group incidents by bucket
  for (const incident of incidentsData) {
    const key = bucketKey(incident.severity || 'medium', incident.created_at);
    const bucket = buckets.get(key) ?? { alerts: [], incidents: [] };
    bucket.incidents.push(incident);
    buckets.set(key, bucket);
  }

  // Create clusters for buckets with 2+ events
  for (const [key, bucket] of buckets) {
    const totalEvents = bucket.alerts.length + bucket.incidents.length;
    if (totalEvents < 2) continue; // Require at least 2 events to form cluster

    const severity = (bucket.alerts[0]?.severity ||
      bucket.incidents[0]?.severity ||
      'medium') as any;

    // Check if cluster already exists
    const { data: existing, error: existingErr } = await supabase
      .from('guardian_correlation_clusters')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('key', key)
      .maybeSingle();

    if (existingErr) throw existingErr;

    let clusterId = existing?.id as string | undefined;

    if (!clusterId) {
      // Create new cluster
      const { data: created, error: createErr } = await supabase
        .from('guardian_correlation_clusters')
        .insert({ tenant_id: tenantId, key, severity })
        .select('id')
        .single();

      if (createErr) throw createErr;
      clusterId = created.id;
      clustersCreated += 1;

      console.log('[Guardian G46] Created correlation cluster:', {
        clusterId,
        key,
        alertCount: bucket.alerts.length,
        incidentCount: bucket.incidents.length,
      });
    } else {
      // Update existing cluster's last_seen
      await supabase
        .from('guardian_correlation_clusters')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', clusterId);
    }

    // Link alerts to cluster (idempotent - skip if already linked)
    for (const alert of bucket.alerts) {
      await supabase
        .from('guardian_correlation_links')
        .insert({ cluster_id: clusterId, kind: 'alert', ref_id: alert.id })
        .select('id')
        .maybeSingle()
        .then(() => {}) // Ignore duplicate errors
        .catch(() => {}); // Idempotent
    }

    // Link incidents to cluster (idempotent - skip if already linked)
    for (const incident of bucket.incidents) {
      await supabase
        .from('guardian_correlation_links')
        .insert({ cluster_id: clusterId, kind: 'incident', ref_id: incident.id })
        .select('id')
        .maybeSingle()
        .then(() => {}) // Ignore duplicate errors
        .catch(() => {}); // Idempotent
    }
  }

  return { clustersCreated };
}
