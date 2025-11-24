/**
 * Founder Intel Alert Service
 * Phase 80: Create and manage founder alerts
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  FounderIntelAlert,
  AlertFilters,
  IntelSignal,
  AlertStatus,
  AlertMetadata,
  RiskLevel,
  AlertType,
  SourceEngine,
} from './founderIntelTypes';

/**
 * Raise an alert from a signal
 */
export async function raiseAlertFromSignal(
  signal: IntelSignal,
  context: {
    client_id?: string;
    alert_type: AlertType;
    severity: RiskLevel;
    title: string;
    description: string;
    metadata?: Partial<AlertMetadata>;
  }
): Promise<FounderIntelAlert | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_alerts')
    .insert({
      client_id: context.client_id,
      source_engine: signal.engine,
      alert_type: context.alert_type,
      severity: context.severity,
      title: context.title,
      description_markdown: context.description,
      metadata: {
        signal_key: signal.key,
        signal_value: signal.value,
        confidence: signal.confidence,
        ...context.metadata,
      },
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to raise alert:', error);
    return null;
  }

  return data as FounderIntelAlert;
}

/**
 * Create an alert directly
 */
export async function createAlert(
  params: {
    client_id?: string;
    source_engine: SourceEngine;
    alert_type: AlertType;
    severity: RiskLevel;
    title: string;
    description_markdown: string;
    metadata?: AlertMetadata;
  }
): Promise<FounderIntelAlert | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_alerts')
    .insert({
      ...params,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create alert:', error);
    return null;
  }

  return data as FounderIntelAlert;
}

/**
 * List alerts with filters
 */
export async function listAlerts(
  filters: AlertFilters
): Promise<FounderIntelAlert[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_intel_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.severity && filters.severity.length > 0) {
    query = query.in('severity', filters.severity);
  }

  if (filters.source_engine && filters.source_engine.length > 0) {
    query = query.in('source_engine', filters.source_engine);
  }

  if (filters.client_id) {
    query = query.eq('client_id', filters.client_id);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list alerts:', error);
    return [];
  }

  return data as FounderIntelAlert[];
}

/**
 * Get a single alert by ID
 */
export async function getAlertById(
  id: string
): Promise<FounderIntelAlert | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_alerts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to get alert:', error);
    return null;
  }

  return data as FounderIntelAlert;
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
  resolvedByUserId?: string
): Promise<FounderIntelAlert | null> {
  const supabase = await getSupabaseServer();

  const updates: Record<string, any> = { status };

  if (status === 'resolved' || status === 'dismissed') {
    updates.resolved_at = new Date().toISOString();
    if (resolvedByUserId) {
      updates.resolved_by_user_id = resolvedByUserId;
    }
  }

  const { data, error } = await supabase
    .from('founder_intel_alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update alert status:', error);
    return null;
  }

  return data as FounderIntelAlert;
}

/**
 * Get alert counts by status
 */
export async function getAlertCountsByStatus(): Promise<Record<AlertStatus, number>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_alerts')
    .select('status');

  if (error || !data) {
    return {
      open: 0,
      acknowledged: 0,
      in_progress: 0,
      resolved: 0,
      dismissed: 0,
    };
  }

  const counts: Record<string, number> = {
    open: 0,
    acknowledged: 0,
    in_progress: 0,
    resolved: 0,
    dismissed: 0,
  };

  data.forEach(item => {
    counts[item.status] = (counts[item.status] || 0) + 1;
  });

  return counts as Record<AlertStatus, number>;
}

/**
 * Get recent open alerts count
 */
export async function getOpenAlertsCount(): Promise<number> {
  const supabase = await getSupabaseServer();

  const { count, error } = await supabase
    .from('founder_intel_alerts')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'acknowledged', 'in_progress']);

  if (error) {
    return 0;
  }

  return count || 0;
}

/**
 * Get critical alerts that need attention
 */
export async function getCriticalAlerts(): Promise<FounderIntelAlert[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_alerts')
    .select('*')
    .eq('severity', 'critical')
    .in('status', ['open', 'acknowledged'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return [];
  }

  return data as FounderIntelAlert[];
}
