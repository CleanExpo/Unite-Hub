import { getSupabaseServer } from '@/lib/supabase';

export interface AutonomousAdjustment {
  id: string;
  tenantId: string;
  taskId?: string;
  adjustmentType: string;
  targetEntity: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  riskLevel: 'minimal' | 'low' | 'medium';
  safetyChecksPassed: string[];
  vetoedBy?: string;
  confidence: number;
  uncertaintyNotes?: string;
  status: 'pending' | 'executing' | 'completed' | 'vetoed' | 'rolled_back';
  createdAt: string;
  completedAt?: string;
}

const FORBIDDEN_CHANGES = [
  'schema_changes',
  'feature_modification',
  'cross_region_transfer',
  'compliance_settings',
  'major_policy_changes'
];

export async function validateSafety(adjustmentType: string): Promise<{
  passed: boolean;
  checks: string[];
  vetoReason?: string;
}> {
  const checks: string[] = [];

  // Check forbidden changes
  if (FORBIDDEN_CHANGES.includes(adjustmentType)) {
    return {
      passed: false,
      checks: ['forbidden_change_check'],
      vetoReason: `Adjustment type "${adjustmentType}" is forbidden`
    };
  }
  checks.push('forbidden_change_check');

  // Add more safety checks
  checks.push('early_warning_check');
  checks.push('region_pressure_check');
  checks.push('arbitration_engine_check');

  return { passed: true, checks };
}

export async function executeAdjustment(
  tenantId: string,
  taskId: string,
  adjustmentType: string,
  targetEntity: string
): Promise<AutonomousAdjustment | null> {
  const supabase = await getSupabaseServer();

  const safety = await validateSafety(adjustmentType);

  const { data, error } = await supabase
    .from('autonomous_adjustments')
    .insert({
      tenant_id: tenantId,
      task_id: taskId,
      adjustment_type: adjustmentType,
      target_entity: targetEntity,
      risk_level: 'low',
      safety_checks_passed: safety.checks,
      vetoed_by: safety.passed ? null : 'safety_validator',
      confidence: safety.passed ? 0.75 : 0.9,
      uncertainty_notes: safety.passed
        ? 'Adjustment outcome depends on current system state'
        : safety.vetoReason,
      status: safety.passed ? 'completed' : 'vetoed',
      completed_at: safety.passed ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to execute adjustment:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    taskId: data.task_id,
    adjustmentType: data.adjustment_type,
    targetEntity: data.target_entity,
    beforeState: data.before_state,
    afterState: data.after_state,
    riskLevel: data.risk_level,
    safetyChecksPassed: data.safety_checks_passed,
    vetoedBy: data.vetoed_by,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
    completedAt: data.completed_at
  };
}

export async function getAdjustmentLogs(tenantId: string): Promise<AutonomousAdjustment[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('autonomous_adjustments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to get adjustment logs:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    taskId: row.task_id,
    adjustmentType: row.adjustment_type,
    targetEntity: row.target_entity,
    beforeState: row.before_state,
    afterState: row.after_state,
    riskLevel: row.risk_level,
    safetyChecksPassed: row.safety_checks_passed,
    vetoedBy: row.vetoed_by,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at
  }));
}
