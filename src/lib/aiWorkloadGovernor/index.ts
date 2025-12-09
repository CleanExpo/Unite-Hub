/**
 * AI Workload Governor
 * Phase 116: Controls AI spend and workload
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface WorkloadPolicy {
  id: string;
  tenantId: string | null;
  regionId: string | null;
  monthlyBudgetUnits: number;
  priorityRules: { engine: string; priority: number }[];
  createdAt: string;
}

export interface WorkloadSnapshot {
  id: string;
  tenantId: string | null;
  regionId: string | null;
  usageBreakdown: Record<string, number>;
  remainingBudgetUnits: number;
  recommendations: string[];
  createdAt: string;
}

export async function getPolicies(tenantId: string): Promise<WorkloadPolicy[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('ai_workload_policies')
    .select('*')
    .eq('tenant_id', tenantId);

  if (!data) {
return [];
}

  return data.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    regionId: row.region_id,
    monthlyBudgetUnits: row.monthly_budget_units,
    priorityRules: row.priority_rules,
    createdAt: row.created_at,
  }));
}

export async function getSnapshots(tenantId: string): Promise<WorkloadSnapshot[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('ai_workload_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data) {
return [];
}

  return data.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    regionId: row.region_id,
    usageBreakdown: row.usage_breakdown,
    remainingBudgetUnits: row.remaining_budget_units,
    recommendations: row.recommendations,
    createdAt: row.created_at,
  }));
}

export async function createPolicy(
  tenantId: string,
  monthlyBudgetUnits: number,
  priorityRules: WorkloadPolicy['priorityRules'],
  regionId?: string
): Promise<WorkloadPolicy | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('ai_workload_policies')
    .insert({
      tenant_id: tenantId,
      region_id: regionId,
      monthly_budget_units: monthlyBudgetUnits,
      priority_rules: priorityRules,
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
    monthlyBudgetUnits: data.monthly_budget_units,
    priorityRules: data.priority_rules,
    createdAt: data.created_at,
  };
}
