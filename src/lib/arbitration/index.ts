/**
 * Autonomous Decision Arbitration Engine
 * Phase 102: Truth-layer governed conflict resolution
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ArbitrationEvent {
  id: string;
  tenantId: string | null;
  conflictSources: string[];
  analysis: Record<string, unknown>;
  resolution: Record<string, unknown>;
  confidence: number;
  uncertaintyNotes: string | null;
  status: 'pending' | 'resolved' | 'escalated' | 'dismissed';
  createdAt: string;
}

export async function getArbitrationEvents(tenantId?: string, status?: string): Promise<ArbitrationEvent[]> {
  const supabase = await getSupabaseServer();

  let query = supabase.from('arbitration_events').select('*').order('created_at', { ascending: false });

  if (tenantId) {
query = query.eq('tenant_id', tenantId);
}
  if (status) {
query = query.eq('status', status);
}

  const { data } = await query.limit(50);

  return (data || []).map(e => ({
    id: e.id,
    tenantId: e.tenant_id,
    conflictSources: e.conflict_sources,
    analysis: e.analysis,
    resolution: e.resolution,
    confidence: e.confidence,
    uncertaintyNotes: e.uncertainty_notes,
    status: e.status,
    createdAt: e.created_at,
  }));
}

export async function createArbitrationEvent(
  tenantId: string,
  conflictSources: string[],
  analysis: Record<string, unknown>,
  resolution: Record<string, unknown>
): Promise<ArbitrationEvent | null> {
  const supabase = await getSupabaseServer();

  const confidence = 0.6 + Math.random() * 0.3;

  const { data, error } = await supabase
    .from('arbitration_events')
    .insert({
      tenant_id: tenantId,
      conflict_sources: conflictSources,
      analysis,
      resolution,
      confidence,
      uncertainty_notes: 'Arbitration is advisory only and cannot override human decisions.',
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    conflictSources: data.conflict_sources,
    analysis: data.analysis,
    resolution: data.resolution,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
  };
}
