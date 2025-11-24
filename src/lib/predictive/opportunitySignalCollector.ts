/**
 * Opportunity Signal Collector
 * Phase 95: Collect signals from GIM, scaling, performance, compliance engines
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { CollectedSignal, SignalCollection } from './predictiveTypes';

/**
 * Collect signals for a tenant
 */
export async function collectForTenant(tenantId: string): Promise<SignalCollection> {
  const supabase = await getSupabaseServer();
  const signals: CollectedSignal[] = [];
  const sourceEngines: string[] = [];

  // Collect from intelligence mesh
  const { data: meshNodes } = await supabase
    .from('intelligence_nodes')
    .select('id, node_type, weight, confidence, payload')
    .eq('tenant_id', tenantId)
    .gte('confidence', 0.3)
    .order('weight', { ascending: false })
    .limit(50);

  if (meshNodes && meshNodes.length > 0) {
    sourceEngines.push('intelligence_mesh');
    for (const node of meshNodes) {
      signals.push({
        type: `mesh_${node.node_type}`,
        value: node.weight * node.confidence,
        label: `${node.node_type} signal`,
        sourceNodeId: node.id,
        weight: node.weight,
      });
    }
  }

  // Collect from region scaling
  const { data: scalingData } = await supabase
    .from('region_snapshots')
    .select('id, pressure_posting, pressure_orchestration, pressure_creative, pressure_intel')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (scalingData && scalingData.length > 0) {
    sourceEngines.push('region_scaling');
    const avgPressure = scalingData.reduce((sum, s) => {
      return sum + (s.pressure_posting + s.pressure_orchestration + s.pressure_creative + s.pressure_intel) / 4;
    }, 0) / scalingData.length;

    signals.push({
      type: 'scaling_pressure',
      value: avgPressure,
      label: 'Average pressure score',
      weight: 0.8,
    });
  }

  // Collect from performance reality
  const { data: performanceData } = await supabase
    .from('performance_reality_snapshots')
    .select('id, metrics')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (performanceData && performanceData.length > 0) {
    sourceEngines.push('performance_reality');
    for (const perf of performanceData) {
      if (perf.metrics?.engagement_rate) {
        signals.push({
          type: 'performance_engagement',
          value: perf.metrics.engagement_rate,
          label: 'Engagement rate',
          weight: 1.0,
        });
      }
      if (perf.metrics?.growth_rate) {
        signals.push({
          type: 'performance_growth',
          value: perf.metrics.growth_rate,
          label: 'Growth rate',
          weight: 1.2,
        });
      }
    }
  }

  // Collect from compliance
  const { data: complianceData } = await supabase
    .from('compliance_incidents')
    .select('id, severity, confidence')
    .eq('tenant_id', tenantId)
    .eq('resolution_status', 'open')
    .limit(20);

  if (complianceData && complianceData.length > 0) {
    sourceEngines.push('compliance');
    const riskScore = complianceData.reduce((sum, c) => {
      const severityWeight = c.severity === 'critical' ? 1.0 : c.severity === 'high' ? 0.7 : 0.3;
      return sum + severityWeight * c.confidence;
    }, 0) / complianceData.length;

    signals.push({
      type: 'compliance_risk',
      value: 1 - riskScore, // Invert: lower risk = higher opportunity
      label: 'Compliance clearance',
      weight: 0.9,
    });
  }

  // Calculate data completeness
  const expectedEngines = ['intelligence_mesh', 'region_scaling', 'performance_reality', 'compliance'];
  const dataCompleteness = sourceEngines.length / expectedEngines.length;

  return {
    signals,
    dataCompleteness,
    sourceEngines,
  };
}

/**
 * Collect signals for a region
 */
export async function collectForRegion(regionId: string): Promise<SignalCollection> {
  const supabase = await getSupabaseServer();
  const signals: CollectedSignal[] = [];
  const sourceEngines: string[] = [];

  // Region mesh nodes
  const { data: meshNodes } = await supabase
    .from('intelligence_nodes')
    .select('id, node_type, weight, confidence')
    .eq('region_id', regionId)
    .gte('confidence', 0.3)
    .order('weight', { ascending: false })
    .limit(30);

  if (meshNodes && meshNodes.length > 0) {
    sourceEngines.push('intelligence_mesh');
    for (const node of meshNodes) {
      signals.push({
        type: `mesh_${node.node_type}`,
        value: node.weight * node.confidence,
        sourceNodeId: node.id,
        weight: node.weight,
      });
    }
  }

  // Region scaling status
  const { data: regionData } = await supabase
    .from('regions')
    .select('id, scaling_mode, ai_budget_allocated_cents, ai_budget_spent_cents')
    .eq('id', regionId)
    .single();

  if (regionData) {
    sourceEngines.push('region_scaling');
    const budgetUtilization = regionData.ai_budget_allocated_cents > 0
      ? regionData.ai_budget_spent_cents / regionData.ai_budget_allocated_cents
      : 0;

    signals.push({
      type: 'budget_headroom',
      value: 1 - budgetUtilization,
      label: 'Budget headroom',
      weight: 0.7,
    });

    const modeScore = regionData.scaling_mode === 'normal' ? 1.0 :
                      regionData.scaling_mode === 'cautious' ? 0.7 :
                      regionData.scaling_mode === 'throttled' ? 0.3 : 0.1;
    signals.push({
      type: 'scaling_mode_score',
      value: modeScore,
      label: `Scaling: ${regionData.scaling_mode}`,
      weight: 0.8,
    });
  }

  const expectedEngines = ['intelligence_mesh', 'region_scaling'];
  const dataCompleteness = sourceEngines.length / expectedEngines.length;

  return {
    signals,
    dataCompleteness,
    sourceEngines,
  };
}

/**
 * Collect signals for a client
 */
export async function collectForClient(clientId: string): Promise<SignalCollection> {
  const supabase = await getSupabaseServer();
  const signals: CollectedSignal[] = [];
  const sourceEngines: string[] = [];

  // Client mesh nodes
  const { data: meshNodes } = await supabase
    .from('intelligence_nodes')
    .select('id, node_type, weight, confidence')
    .eq('source_table', 'clients')
    .eq('source_id', clientId)
    .gte('confidence', 0.3)
    .limit(20);

  if (meshNodes && meshNodes.length > 0) {
    sourceEngines.push('intelligence_mesh');
    for (const node of meshNodes) {
      signals.push({
        type: `mesh_${node.node_type}`,
        value: node.weight * node.confidence,
        sourceNodeId: node.id,
        weight: node.weight,
      });
    }
  }

  // Client engagement history
  const { data: clientData } = await supabase
    .from('contacts')
    .select('id, ai_score, status, last_contact_at')
    .eq('id', clientId)
    .single();

  if (clientData) {
    sourceEngines.push('client_data');

    if (clientData.ai_score) {
      signals.push({
        type: 'client_score',
        value: clientData.ai_score / 100,
        label: 'AI engagement score',
        weight: 1.0,
      });
    }

    // Recency signal
    if (clientData.last_contact_at) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(clientData.last_contact_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyScore = Math.max(0, 1 - daysSinceContact / 30);
      signals.push({
        type: 'contact_recency',
        value: recencyScore,
        label: `Last contact: ${daysSinceContact} days ago`,
        weight: 0.8,
      });
    }
  }

  const expectedEngines = ['intelligence_mesh', 'client_data'];
  const dataCompleteness = sourceEngines.length / expectedEngines.length;

  return {
    signals,
    dataCompleteness,
    sourceEngines,
  };
}
