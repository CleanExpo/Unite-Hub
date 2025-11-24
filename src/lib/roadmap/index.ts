import { getSupabaseServer } from '@/lib/supabase';

export interface Roadmap {
  id: string;
  tenantId: string;
  name: string;
  horizonMonths: number;
  startDate: string;
  endDate: string;
  milestones: Array<{ date: string; title: string; description: string }>;
  trendsConsidered: string[];
  constraintsApplied: string[];
  budgetLimits?: Record<string, number>;
  workloadLimits?: Record<string, number>;
  confidence: number;
  uncertaintyNotes?: string;
  isAdvisory: boolean;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export async function getRoadmaps(tenantId: string): Promise<Roadmap[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('long_horizon_roadmaps')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to get roadmaps:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    horizonMonths: row.horizon_months,
    startDate: row.start_date,
    endDate: row.end_date,
    milestones: row.milestones,
    trendsConsidered: row.trends_considered,
    constraintsApplied: row.constraints_applied,
    budgetLimits: row.budget_limits,
    workloadLimits: row.workload_limits,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    isAdvisory: row.is_advisory,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function generateRoadmap(
  tenantId: string,
  name: string,
  horizonMonths: number
): Promise<Roadmap | null> {
  const supabase = await getSupabaseServer();

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + horizonMonths);

  // Confidence decreases with horizon length
  const confidence = Math.max(0.4, 0.85 - (horizonMonths * 0.03));

  const { data, error } = await supabase
    .from('long_horizon_roadmaps')
    .insert({
      tenant_id: tenantId,
      name,
      horizon_months: horizonMonths,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      milestones: [],
      trends_considered: [],
      constraints_applied: [],
      confidence,
      uncertainty_notes: `Advisory roadmap; uncertainty increases with ${horizonMonths}-month horizon`,
      is_advisory: true
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to generate roadmap:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    horizonMonths: data.horizon_months,
    startDate: data.start_date,
    endDate: data.end_date,
    milestones: data.milestones,
    trendsConsidered: data.trends_considered,
    constraintsApplied: data.constraints_applied,
    budgetLimits: data.budget_limits,
    workloadLimits: data.workload_limits,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    isAdvisory: data.is_advisory,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
