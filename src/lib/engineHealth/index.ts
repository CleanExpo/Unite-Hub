/**
 * Adaptive Engine Health Monitor
 * Phase 117: Monitors health of all major engines
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface AnomalyFlag {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  detectedAt: string;
}

export interface EngineHealthSnapshot {
  id: string;
  engineName: string;
  healthStatus: 'healthy' | 'degraded' | 'critical' | 'unknown';
  metrics: Record<string, number>;
  anomalyFlags: AnomalyFlag[];
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getHealthSnapshots(engineName?: string): Promise<EngineHealthSnapshot[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('engine_health_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (engineName) query = query.eq('engine_name', engineName);

  const { data } = await query;

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    engineName: row.engine_name,
    healthStatus: row.health_status,
    metrics: row.metrics,
    anomalyFlags: row.anomaly_flags,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function recordHealth(
  engineName: string,
  metrics: Record<string, number>
): Promise<EngineHealthSnapshot | null> {
  const supabase = await getSupabaseServer();

  const anomalyFlags: AnomalyFlag[] = [];
  let healthStatus: EngineHealthSnapshot['healthStatus'] = 'healthy';

  Object.entries(metrics).forEach(([key, value]) => {
    if (value > 0.9) {
      anomalyFlags.push({
        type: 'threshold_exceeded',
        severity: 'high',
        description: `${key} at ${(value * 100).toFixed(0)}%`,
        detectedAt: new Date().toISOString(),
      });
      healthStatus = 'critical';
    } else if (value > 0.7) {
      if (healthStatus !== 'critical') healthStatus = 'degraded';
    }
  });

  const confidence = anomalyFlags.length === 0 ? 0.8 : 0.9;

  const { data, error } = await supabase
    .from('engine_health_snapshots')
    .insert({
      engine_name: engineName,
      health_status: healthStatus,
      metrics,
      anomaly_flags: anomalyFlags,
      confidence,
      uncertainty_notes: 'Health derived from measurable metrics. Unknown status if no data available.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    engineName: data.engine_name,
    healthStatus: data.health_status,
    metrics: data.metrics,
    anomalyFlags: data.anomaly_flags,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
