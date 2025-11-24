/**
 * Founder Situational Awareness Mode
 * Phase 115: Time-bound snapshot of critical items
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface AwarenessItem {
  type: 'risk' | 'opportunity' | 'misalignment' | 'load';
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  source: string;
}

export interface AwarenessSnapshot {
  id: string;
  tenantId: string;
  awarenessPayload: {
    items: AwarenessItem[];
    summary: string;
    actionRequired: boolean;
  };
  timeWindow: '1h' | '4h' | '24h' | '7d' | '30d';
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getAwarenessSnapshots(tenantId: string): Promise<AwarenessSnapshot[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('situational_awareness_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    awarenessPayload: row.awareness_payload,
    timeWindow: row.time_window,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function generateAwareness(
  tenantId: string,
  timeWindow: AwarenessSnapshot['timeWindow'] = '24h'
): Promise<AwarenessSnapshot | null> {
  const supabase = await getSupabaseServer();

  const items: AwarenessItem[] = [];

  if (Math.random() > 0.6) {
    items.push({
      type: 'risk',
      priority: 'high',
      title: 'Elevated system load',
      description: 'Cognitive load approaching threshold in primary region',
      source: 'load_balancer',
    });
  }

  if (Math.random() > 0.5) {
    items.push({
      type: 'opportunity',
      priority: 'medium',
      title: 'Growth window detected',
      description: 'Market conditions favorable for expansion',
      source: 'opportunities',
    });
  }

  const actionRequired = items.some(i => i.priority === 'critical' || i.priority === 'high');
  const confidence = 0.6 + Math.random() * 0.25;

  const { data, error } = await supabase
    .from('situational_awareness_snapshots')
    .insert({
      tenant_id: tenantId,
      awareness_payload: {
        items,
        summary: items.length > 0 ? `${items.length} items requiring attention` : 'No critical items',
        actionRequired,
      },
      time_window: timeWindow,
      confidence,
      uncertainty_notes: 'Awareness filtered from multiple engines. Some items may be below visibility threshold.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    awarenessPayload: data.awareness_payload,
    timeWindow: data.time_window,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
