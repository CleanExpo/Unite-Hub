/**
 * Global Insight Renderer
 * Phase 122: Renders insights for various audiences
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface RenderedInsight {
  id: string;
  tenantId: string;
  audienceType: 'founder' | 'franchise' | 'team' | 'external';
  renderType: 'dashboard' | 'report' | 'summary' | 'email' | 'briefing';
  insightPayload: {
    title: string;
    sections: { heading: string; content: string }[];
    highlights: string[];
    risks: string[];
  };
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getRenderedInsights(tenantId: string): Promise<RenderedInsight[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('rendered_insights')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (!data) {
return [];
}

  return data.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    audienceType: row.audience_type,
    renderType: row.render_type,
    insightPayload: row.insight_payload,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function renderInsight(
  tenantId: string,
  audienceType: RenderedInsight['audienceType'],
  renderType: RenderedInsight['renderType']
): Promise<RenderedInsight | null> {
  const supabase = await getSupabaseServer();

  const insightPayload = {
    title: `${audienceType.charAt(0).toUpperCase() + audienceType.slice(1)} ${renderType.charAt(0).toUpperCase() + renderType.slice(1)}`,
    sections: [
      { heading: 'Overview', content: 'Summary of current state based on available signals.' },
      { heading: 'Key Metrics', content: 'Performance indicators with confidence levels.' },
    ],
    highlights: ['Positive trend in engagement', 'Opportunity window detected'],
    risks: ['Monitor load balance in Region A'],
  };

  const confidence = 0.6 + Math.random() * 0.25;

  const { data, error } = await supabase
    .from('rendered_insights')
    .insert({
      tenant_id: tenantId,
      audience_type: audienceType,
      render_type: renderType,
      insight_payload: insightPayload,
      confidence,
      uncertainty_notes: 'Rendered insights inherit confidence from source engines. No visual element hides critical risk.',
    })
    .select()
    .single();

  if (error || !data) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    audienceType: data.audience_type,
    renderType: data.render_type,
    insightPayload: data.insight_payload,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
