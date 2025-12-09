/**
 * Navigator Input Collector
 * Phase 96: Collect signals from all engines
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { CollectedInput } from './navigatorTypes';

export async function collectAllInputs(tenantId: string, regionId?: string): Promise<CollectedInput[]> {
  const inputs: CollectedInput[] = [];

  // Collect from intelligence mesh
  const meshInput = await collectFromMesh(tenantId, regionId);
  if (meshInput) {
inputs.push(meshInput);
}

  // Collect from opportunity engine
  const oppInput = await collectFromOpportunities(tenantId);
  if (oppInput) {
inputs.push(oppInput);
}

  // Collect from performance reality
  const perfInput = await collectFromPerformance(tenantId);
  if (perfInput) {
inputs.push(perfInput);
}

  // Collect from early warning
  const warningInput = await collectFromEarlyWarning(tenantId);
  if (warningInput) {
inputs.push(warningInput);
}

  // Collect from scaling
  const scalingInput = await collectFromScaling(regionId);
  if (scalingInput) {
inputs.push(scalingInput);
}

  // Collect from compliance
  const complianceInput = await collectFromCompliance(tenantId);
  if (complianceInput) {
inputs.push(complianceInput);
}

  return inputs;
}

async function collectFromMesh(tenantId: string, regionId?: string): Promise<CollectedInput | null> {
  const supabase = await getSupabaseServer();

  const query = supabase
    .from('intelligence_nodes')
    .select('node_type, weight, confidence')
    .eq('tenant_id', tenantId);

  if (regionId) {
    query.eq('region_id', regionId);
  }

  const { data } = await query.limit(100);

  if (!data || data.length === 0) {
return null;
}

  const avgConfidence = data.reduce((sum, n) => sum + n.confidence, 0) / data.length;
  const nodesByType: Record<string, number> = {};
  data.forEach(n => {
    nodesByType[n.node_type] = (nodesByType[n.node_type] || 0) + 1;
  });

  return {
    source: 'intelligence_mesh',
    data: {
      totalNodes: data.length,
      avgConfidence,
      nodesByType,
      topWeight: Math.max(...data.map(n => n.weight)),
    },
    confidence: avgConfidence,
    timestamp: new Date().toISOString(),
  };
}

async function collectFromOpportunities(tenantId: string): Promise<CollectedInput | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('opportunity_windows')
    .select('opportunity_category, confidence, window_type')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (!data || data.length === 0) {
return null;
}

  const avgConfidence = data.reduce((sum, o) => sum + o.confidence, 0) / data.length;
  const byCategory: Record<string, number> = {};
  const byWindow: Record<string, number> = {};

  data.forEach(o => {
    byCategory[o.opportunity_category] = (byCategory[o.opportunity_category] || 0) + 1;
    byWindow[o.window_type] = (byWindow[o.window_type] || 0) + 1;
  });

  return {
    source: 'opportunity_engine',
    data: {
      totalOpportunities: data.length,
      avgConfidence,
      byCategory,
      byWindow,
      highConfidence: data.filter(o => o.confidence >= 0.7).length,
    },
    confidence: avgConfidence,
    timestamp: new Date().toISOString(),
  };
}

async function collectFromPerformance(tenantId: string): Promise<CollectedInput | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('performance_reality_snapshots')
    .select('metrics, confidence')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) {
return null;
}

  const latestMetrics = data[0]?.metrics || {};
  const avgConfidence = data.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / data.length;

  return {
    source: 'performance_reality',
    data: {
      latestMetrics,
      snapshotCount: data.length,
      engagementRate: latestMetrics.engagement_rate,
      growthRate: latestMetrics.growth_rate,
    },
    confidence: avgConfidence,
    timestamp: new Date().toISOString(),
  };
}

async function collectFromEarlyWarning(tenantId: string): Promise<CollectedInput | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('early_warning_events')
    .select('severity, confidence, event_type')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (!data || data.length === 0) {
    return {
      source: 'early_warning',
      data: { activeWarnings: 0, bySeverity: {} },
      confidence: 1.0,
      timestamp: new Date().toISOString(),
    };
  }

  const bySeverity: Record<string, number> = {};
  data.forEach(w => {
    bySeverity[w.severity] = (bySeverity[w.severity] || 0) + 1;
  });

  return {
    source: 'early_warning',
    data: {
      activeWarnings: data.length,
      bySeverity,
      criticalCount: bySeverity['critical'] || 0,
      highCount: bySeverity['high'] || 0,
    },
    confidence: data.reduce((sum, w) => sum + w.confidence, 0) / data.length,
    timestamp: new Date().toISOString(),
  };
}

async function collectFromScaling(regionId?: string): Promise<CollectedInput | null> {
  if (!regionId) {
return null;
}

  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('regions')
    .select('scaling_mode, ai_budget_allocated_cents, ai_budget_spent_cents')
    .eq('id', regionId)
    .single();

  if (!data) {
return null;
}

  const budgetUtilization = data.ai_budget_allocated_cents > 0
    ? data.ai_budget_spent_cents / data.ai_budget_allocated_cents
    : 0;

  return {
    source: 'region_scaling',
    data: {
      scalingMode: data.scaling_mode,
      budgetUtilization,
      budgetRemaining: data.ai_budget_allocated_cents - data.ai_budget_spent_cents,
    },
    confidence: 0.9,
    timestamp: new Date().toISOString(),
  };
}

async function collectFromCompliance(tenantId: string): Promise<CollectedInput | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('compliance_incidents')
    .select('severity, resolution_status')
    .eq('tenant_id', tenantId);

  const open = (data || []).filter(c => c.resolution_status === 'open');
  const bySeverity: Record<string, number> = {};
  open.forEach(c => {
    bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
  });

  return {
    source: 'compliance_engine',
    data: {
      openIncidents: open.length,
      bySeverity,
      complianceHealth: open.length === 0 ? 1.0 : Math.max(0, 1 - open.length * 0.1),
    },
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  };
}
