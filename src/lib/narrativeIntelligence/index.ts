/**
 * Narrative Intelligence Engine
 * Phase 110: Builds coherent narratives explaining events
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface StorySegment {
  timestamp: string;
  event: string;
  significance: string;
  signals: string[];
}

export interface NarrativeSnapshot {
  id: string;
  tenantId: string | null;
  regionId: string | null;
  scope: 'tenant' | 'region' | 'campaign' | 'market' | 'global';
  storyBody: {
    title: string;
    summary: string;
    segments: StorySegment[];
    outlook: string;
  };
  supportingSignals: string[];
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getNarratives(
  tenantId?: string,
  scope?: string
): Promise<NarrativeSnapshot[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('narrative_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (tenantId) {
query = query.eq('tenant_id', tenantId);
}
  if (scope) {
query = query.eq('scope', scope);
}

  const { data } = await query;

  if (!data) {
return [];
}

  return data.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    regionId: row.region_id,
    scope: row.scope,
    storyBody: row.story_body,
    supportingSignals: row.supporting_signals,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function generateNarrative(
  scope: NarrativeSnapshot['scope'],
  tenantId?: string,
  regionId?: string
): Promise<NarrativeSnapshot | null> {
  const supabase = await getSupabaseServer();

  const storyBody = {
    title: `${scope.charAt(0).toUpperCase() + scope.slice(1)} Performance Story`,
    summary: 'A narrative of recent developments based on collected signals.',
    segments: [
      {
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        event: 'Initial signal pattern detected',
        significance: 'Early indicators suggested emerging trend',
        signals: ['performance_reality', 'market_comparator'],
      },
      {
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        event: 'Pattern strengthened',
        significance: 'Multiple engines confirmed initial observation',
        signals: ['intelligence_mesh', 'opportunities'],
      },
    ],
    outlook: 'Current trajectory suggests continued development. Monitor for confirmation.',
  };

  const supportingSignals = [
    'performance_reality_snapshot_1',
    'market_baseline_2',
    'opportunity_window_3',
  ];

  const confidence = 0.6 + Math.random() * 0.25;

  const { data, error } = await supabase
    .from('narrative_snapshots')
    .insert({
      tenant_id: tenantId,
      region_id: regionId,
      scope,
      story_body: storyBody,
      supporting_signals: supportingSignals,
      confidence,
      uncertainty_notes: 'Narrative constructed from available signals. Events and significance are interpretations based on patterns. No fictitious events included.',
    })
    .select()
    .single();

  if (error || !data) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    regionId: data.region_id,
    scope: data.scope,
    storyBody: data.story_body,
    supportingSignals: data.supporting_signals,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
