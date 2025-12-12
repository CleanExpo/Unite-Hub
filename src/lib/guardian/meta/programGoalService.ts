import { getSupabaseServer } from '@/lib/supabase';
import type { GuardianKpiDefinition } from './kpiEvaluationService';

/**
 * Guardian Z08: Program Goal Service
 *
 * CRUD operations for program goals, OKRs, and KPIs.
 * Handles tenant-scoped persistence and retrieval with proper RLS.
 */

export interface ProgramGoal {
  id?: string;
  tenantId: string;
  goalKey: string;
  title: string;
  description: string;
  timeframeStart: Date;
  timeframeEnd: Date;
  owner?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  category: 'governance' | 'security_posture' | 'operations' | 'compliance' | 'adoption';
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProgramOkr {
  id?: string;
  tenantId: string;
  goalId: string;
  objective: string;
  objectiveKey: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  weight: number;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProgramKpi {
  id?: string;
  tenantId: string;
  okrId: string;
  kpiKey: string;
  label: string;
  description: string;
  targetValue: number;
  targetDirection: 'increase' | 'decrease' | 'maintain';
  unit: string;
  sourceMetric: string;
  sourcePath: {
    domain: 'readiness' | 'editions' | 'uplift' | 'adoption' | 'executive' | 'lifecycle';
    metric: string;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Load all program goals for a tenant
 */
export async function loadProgramGoalsForTenant(tenantId: string): Promise<ProgramGoal[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_program_goals')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    goalKey: row.goal_key,
    title: row.title,
    description: row.description,
    timeframeStart: new Date(row.timeframe_start),
    timeframeEnd: new Date(row.timeframe_end),
    owner: row.owner,
    status: row.status,
    category: row.category,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

/**
 * Load a single goal by ID with OKRs and KPIs
 */
export async function loadGoalWithOkrsAndKpis(
  goalId: string,
  tenantId: string
): Promise<
  ProgramGoal & {
    okrCount: number;
    kpiCount: number;
    okrs: Array<
      ProgramOkr & {
        kpiCount: number;
        kpis: ProgramKpi[];
      }
    >;
  }
> {
  const supabase = getSupabaseServer();

  // Load goal
  const { data: goalRow, error: goalError } = await supabase
    .from('guardian_program_goals')
    .select('*')
    .eq('id', goalId)
    .eq('tenant_id', tenantId)
    .single();

  if (goalError || !goalRow) throw goalError || new Error('Goal not found');

  const goal: ProgramGoal = {
    id: goalRow.id,
    tenantId: goalRow.tenant_id,
    goalKey: goalRow.goal_key,
    title: goalRow.title,
    description: goalRow.description,
    timeframeStart: new Date(goalRow.timeframe_start),
    timeframeEnd: new Date(goalRow.timeframe_end),
    owner: goalRow.owner,
    status: goalRow.status,
    category: goalRow.category,
    metadata: goalRow.metadata,
    createdAt: new Date(goalRow.created_at),
    updatedAt: new Date(goalRow.updated_at),
  };

  // Load OKRs
  const { data: okrsData, error: okrsError } = await supabase
    .from('guardian_program_okrs')
    .select('*')
    .eq('goal_id', goalId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (okrsError) throw okrsError;

  const okrs = await Promise.all(
    (okrsData || []).map(async (okrRow) => {
      const okr: ProgramOkr = {
        id: okrRow.id,
        tenantId: okrRow.tenant_id,
        goalId: okrRow.goal_id,
        objective: okrRow.objective,
        objectiveKey: okrRow.objective_key,
        status: okrRow.status,
        weight: parseFloat(okrRow.weight),
        metadata: okrRow.metadata,
        createdAt: new Date(okrRow.created_at),
        updatedAt: new Date(okrRow.updated_at),
      };

      // Load KPIs for this OKR
      const { data: kpisData } = await supabase
        .from('guardian_program_kpis')
        .select('*')
        .eq('okr_id', okrRow.id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      const kpis: ProgramKpi[] = (kpisData || []).map((kpiRow) => ({
        id: kpiRow.id,
        tenantId: kpiRow.tenant_id,
        okrId: kpiRow.okr_id,
        kpiKey: kpiRow.kpi_key,
        label: kpiRow.label,
        description: kpiRow.description,
        targetValue: parseFloat(kpiRow.target_value),
        targetDirection: kpiRow.target_direction,
        unit: kpiRow.unit,
        sourceMetric: kpiRow.source_metric,
        sourcePath: kpiRow.source_path,
        metadata: kpiRow.metadata,
        createdAt: new Date(kpiRow.created_at),
        updatedAt: new Date(kpiRow.updated_at),
      }));

      return {
        ...okr,
        kpiCount: kpis.length,
        kpis,
      };
    })
  );

  const totalKpis = okrs.reduce((sum, okr) => sum + okr.kpiCount, 0);

  return {
    ...goal,
    okrCount: okrs.length,
    kpiCount: totalKpis,
    okrs,
  };
}

/**
 * Persist a new program goal
 */
export async function persistProgramGoal(goal: ProgramGoal): Promise<ProgramGoal & { id: string }> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_program_goals')
    .insert([
      {
        tenant_id: goal.tenantId,
        goal_key: goal.goalKey,
        title: goal.title,
        description: goal.description,
        timeframe_start: goal.timeframeStart.toISOString().split('T')[0],
        timeframe_end: goal.timeframeEnd.toISOString().split('T')[0],
        owner: goal.owner || null,
        status: goal.status,
        category: goal.category,
        metadata: goal.metadata || {},
      },
    ])
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create goal');

  return {
    id: data.id,
    tenantId: data.tenant_id,
    goalKey: data.goal_key,
    title: data.title,
    description: data.description,
    timeframeStart: new Date(data.timeframe_start),
    timeframeEnd: new Date(data.timeframe_end),
    owner: data.owner,
    status: data.status,
    category: data.category,
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Update a program goal
 */
export async function updateProgramGoal(
  goalId: string,
  tenantId: string,
  updates: Partial<ProgramGoal>
): Promise<ProgramGoal> {
  const supabase = getSupabaseServer();

  const updateData: Record<string, unknown> = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.timeframeStart) updateData.timeframe_start = updates.timeframeStart.toISOString().split('T')[0];
  if (updates.timeframeEnd) updateData.timeframe_end = updates.timeframeEnd.toISOString().split('T')[0];
  if (updates.owner !== undefined) updateData.owner = updates.owner;
  if (updates.status) updateData.status = updates.status;
  if (updates.category) updateData.category = updates.category;
  if (updates.metadata) updateData.metadata = updates.metadata;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('guardian_program_goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Goal not found');

  return {
    id: data.id,
    tenantId: data.tenant_id,
    goalKey: data.goal_key,
    title: data.title,
    description: data.description,
    timeframeStart: new Date(data.timeframe_start),
    timeframeEnd: new Date(data.timeframe_end),
    owner: data.owner,
    status: data.status,
    category: data.category,
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Delete a program goal (cascade deletes OKRs and KPIs)
 */
export async function deleteProgramGoal(goalId: string, tenantId: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_program_goals')
    .delete()
    .eq('id', goalId)
    .eq('tenant_id', tenantId);

  if (error) throw error;
}

/**
 * Persist a new OKR under a goal
 */
export async function persistProgramOkr(okr: ProgramOkr): Promise<ProgramOkr & { id: string }> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_program_okrs')
    .insert([
      {
        tenant_id: okr.tenantId,
        goal_id: okr.goalId,
        objective: okr.objective,
        objective_key: okr.objectiveKey,
        status: okr.status,
        weight: okr.weight,
        metadata: okr.metadata || {},
      },
    ])
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create OKR');

  return {
    id: data.id,
    tenantId: data.tenant_id,
    goalId: data.goal_id,
    objective: data.objective,
    objectiveKey: data.objective_key,
    status: data.status,
    weight: parseFloat(data.weight),
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Update an OKR
 */
export async function updateProgramOkr(
  okrId: string,
  tenantId: string,
  updates: Partial<ProgramOkr>
): Promise<ProgramOkr> {
  const supabase = getSupabaseServer();

  const updateData: Record<string, unknown> = {};

  if (updates.objective) updateData.objective = updates.objective;
  if (updates.status) updateData.status = updates.status;
  if (updates.weight !== undefined) updateData.weight = updates.weight;
  if (updates.metadata) updateData.metadata = updates.metadata;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('guardian_program_okrs')
    .update(updateData)
    .eq('id', okrId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('OKR not found');

  return {
    id: data.id,
    tenantId: data.tenant_id,
    goalId: data.goal_id,
    objective: data.objective,
    objectiveKey: data.objective_key,
    status: data.status,
    weight: parseFloat(data.weight),
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Delete an OKR (cascade deletes KPIs)
 */
export async function deleteProgramOkr(okrId: string, tenantId: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_program_okrs')
    .delete()
    .eq('id', okrId)
    .eq('tenant_id', tenantId);

  if (error) throw error;
}

/**
 * Persist a new KPI under an OKR
 */
export async function persistProgramKpi(kpi: ProgramKpi): Promise<ProgramKpi & { id: string }> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_program_kpis')
    .insert([
      {
        tenant_id: kpi.tenantId,
        okr_id: kpi.okrId,
        kpi_key: kpi.kpiKey,
        label: kpi.label,
        description: kpi.description,
        target_value: kpi.targetValue,
        target_direction: kpi.targetDirection,
        unit: kpi.unit,
        source_metric: kpi.sourceMetric,
        source_path: kpi.sourcePath,
        metadata: kpi.metadata || {},
      },
    ])
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create KPI');

  return {
    id: data.id,
    tenantId: data.tenant_id,
    okrId: data.okr_id,
    kpiKey: data.kpi_key,
    label: data.label,
    description: data.description,
    targetValue: parseFloat(data.target_value),
    targetDirection: data.target_direction,
    unit: data.unit,
    sourceMetric: data.source_metric,
    sourcePath: data.source_path,
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Update a KPI
 */
export async function updateProgramKpi(
  kpiId: string,
  tenantId: string,
  updates: Partial<ProgramKpi>
): Promise<ProgramKpi> {
  const supabase = getSupabaseServer();

  const updateData: Record<string, unknown> = {};

  if (updates.label) updateData.label = updates.label;
  if (updates.description) updateData.description = updates.description;
  if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue;
  if (updates.targetDirection) updateData.target_direction = updates.targetDirection;
  if (updates.unit) updateData.unit = updates.unit;
  if (updates.sourcePath) updateData.source_path = updates.sourcePath;
  if (updates.metadata) updateData.metadata = updates.metadata;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('guardian_program_kpis')
    .update(updateData)
    .eq('id', kpiId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('KPI not found');

  return {
    id: data.id,
    tenantId: data.tenant_id,
    okrId: data.okr_id,
    kpiKey: data.kpi_key,
    label: data.label,
    description: data.description,
    targetValue: parseFloat(data.target_value),
    targetDirection: data.target_direction,
    unit: data.unit,
    sourceMetric: data.source_metric,
    sourcePath: data.source_path,
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Delete a KPI
 */
export async function deleteProgramKpi(kpiId: string, tenantId: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_program_kpis')
    .delete()
    .eq('id', kpiId)
    .eq('tenant_id', tenantId);

  if (error) throw error;
}
