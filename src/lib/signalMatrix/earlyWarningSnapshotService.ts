/**
 * Early Warning Snapshot Service
 * Phase 82: CRUD operations for early warning events
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  EarlyWarningEvent,
  WarningDetection,
  WarningStatus,
  UnifiedSignalMatrix,
} from './signalMatrixTypes';

/**
 * Create a warning event from a detection
 */
export async function createWarningEvent(
  detection: WarningDetection,
  matrixRow: UnifiedSignalMatrix
): Promise<EarlyWarningEvent | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('early_warning_events')
    .insert({
      client_id: matrixRow.client_id,
      severity: detection.severity,
      warning_type: detection.type,
      title: generateWarningTitle(detection),
      description_markdown: generateWarningDescription(detection),
      source_signals: detection.signals,
      confidence: detection.confidence,
      timeframe_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      timeframe_end: new Date().toISOString(),
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating warning event:', error);
    return null;
  }

  return data as EarlyWarningEvent;
}

/**
 * List warning events with filters
 */
export async function listWarningEvents(options: {
  status?: WarningStatus | WarningStatus[];
  severity?: string;
  warningType?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: EarlyWarningEvent[]; total: number }> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('early_warning_events')
    .select('*', { count: 'exact' });

  if (options.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', options.status);
    }
  }

  if (options.severity) {
    query = query.eq('severity', options.severity);
  }

  if (options.warningType) {
    query = query.eq('warning_type', options.warningType);
  }

  if (options.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 20) - 1
    );

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing warning events:', error);
    return { events: [], total: 0 };
  }

  return {
    events: (data || []) as EarlyWarningEvent[],
    total: count || 0,
  };
}

/**
 * Get a single warning event
 */
export async function getWarningEvent(id: string): Promise<EarlyWarningEvent | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('early_warning_events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error getting warning event:', error);
    return null;
  }

  return data as EarlyWarningEvent;
}

/**
 * Update warning status
 */
export async function updateWarningStatus(
  id: string,
  status: WarningStatus,
  userId?: string
): Promise<EarlyWarningEvent | null> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, unknown> = { status };

  if (status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
    if (userId) {
      updateData.resolved_by_user_id = userId;
    }
  }

  const { data, error } = await supabase
    .from('early_warning_events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating warning status:', error);
    return null;
  }

  return data as EarlyWarningEvent;
}

/**
 * Get open warning count
 */
export async function getOpenWarningCount(): Promise<number> {
  const supabase = await getSupabaseServer();

  const { count, error } = await supabase
    .from('early_warning_events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  if (error) {
    console.error('Error counting open warnings:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get warnings by severity
 */
export async function getWarningsBySeverity(): Promise<Record<string, number>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('early_warning_events')
    .select('severity')
    .eq('status', 'open');

  if (error || !data) {
    return { high: 0, medium: 0, low: 0 };
  }

  return {
    high: data.filter(e => e.severity === 'high').length,
    medium: data.filter(e => e.severity === 'medium').length,
    low: data.filter(e => e.severity === 'low').length,
  };
}

/**
 * Generate warning title
 */
function generateWarningTitle(detection: WarningDetection): string {
  const titles: Record<string, string> = {
    trend_shift: 'Significant Trend Shift Detected',
    collapse_risk: 'Performance Collapse Risk',
    fatigue: 'Creative/Audience Fatigue Detected',
    operational_stress: 'Operational Stress Warning',
    story_stall: 'Narrative Momentum Stalled',
    creative_drift: 'Creative Brand Drift Detected',
    scaling_pressure: 'Scaling Capacity Pressure',
    performance_conflict: 'Performance vs Reality Conflict',
    data_gap: 'Data Completeness Gap',
    blindspot: 'Visibility Blindspot Detected',
  };

  return titles[detection.type] || 'Warning Detected';
}

/**
 * Generate warning description
 */
function generateWarningDescription(detection: WarningDetection): string {
  let description = `## ${generateWarningTitle(detection)}\n\n`;
  description += `**Severity**: ${detection.severity.toUpperCase()}\n\n`;
  description += `**Score**: ${Math.round(detection.score * 100)}%\n\n`;
  description += `**Confidence**: ${Math.round(detection.confidence * 100)}%\n\n`;
  description += `### Analysis\n\n${detection.reason}\n\n`;

  if (detection.signals.length > 0) {
    description += '### Contributing Signals\n\n';
    for (const signal of detection.signals.slice(0, 5)) {
      description += `- **${signal.engine}/${signal.metric}**: ${Math.round(signal.normalised * 100)}% (${signal.trend})\n`;
    }
  }

  return description;
}
