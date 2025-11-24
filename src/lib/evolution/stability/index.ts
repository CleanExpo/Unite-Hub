import { getSupabaseServer } from '@/lib/supabase';

export interface StabilityEnforcementRecord {
  id: string;
  tenantId: string;
  enforcementType: 'oscillation_halt' | 'cooling_mode' | 'safe_mode' | 'region_freeze' | 'founder_lock';
  triggerReason: string;
  affectedSystems: string[];
  previousState?: Record<string, unknown>;
  enforcedState?: Record<string, unknown>;
  autoRecoveryEligible: boolean;
  founderAcknowledgementRequired: boolean;
  acknowledgedBy?: string;
  confidence: number;
  uncertaintyNotes?: string;
  status: 'active' | 'recovering' | 'resolved' | 'escalated';
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemStabilityMode {
  id: string;
  tenantId: string;
  currentMode: 'normal' | 'cooling' | 'safe' | 'emergency';
  modeReason?: string;
  oscillationCount: number;
  lastOscillationAt?: string;
  frozenRegions: string[];
  safeguardsActive: string[];
  updatedAt: string;
}

export async function getStabilityMode(tenantId: string): Promise<SystemStabilityMode | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('system_stability_mode')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    // Return default mode if not exists
    return {
      id: '',
      tenantId,
      currentMode: 'normal',
      oscillationCount: 0,
      frozenRegions: [],
      safeguardsActive: [],
      updatedAt: new Date().toISOString()
    };
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    currentMode: data.current_mode,
    modeReason: data.mode_reason,
    oscillationCount: data.oscillation_count,
    lastOscillationAt: data.last_oscillation_at,
    frozenRegions: data.frozen_regions || [],
    safeguardsActive: data.safeguards_active || [],
    updatedAt: data.updated_at
  };
}

export async function setStabilityMode(
  tenantId: string,
  mode: SystemStabilityMode['currentMode'],
  reason: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('system_stability_mode')
    .upsert({
      tenant_id: tenantId,
      current_mode: mode,
      mode_reason: reason,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' });

  if (error) {
    console.error('Failed to set stability mode:', error);
    return false;
  }

  return true;
}

export async function getEnforcementRecords(tenantId: string): Promise<StabilityEnforcementRecord[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('stability_enforcement_records')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to get enforcement records:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    enforcementType: row.enforcement_type,
    triggerReason: row.trigger_reason,
    affectedSystems: row.affected_systems,
    previousState: row.previous_state,
    enforcedState: row.enforced_state,
    autoRecoveryEligible: row.auto_recovery_eligible,
    founderAcknowledgementRequired: row.founder_acknowledgement_required,
    acknowledgedBy: row.acknowledged_by,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  }));
}

export async function createEnforcementRecord(
  tenantId: string,
  enforcementType: StabilityEnforcementRecord['enforcementType'],
  triggerReason: string,
  affectedSystems: string[]
): Promise<StabilityEnforcementRecord | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('stability_enforcement_records')
    .insert({
      tenant_id: tenantId,
      enforcement_type: enforcementType,
      trigger_reason: triggerReason,
      affected_systems: affectedSystems,
      auto_recovery_eligible: enforcementType === 'cooling_mode',
      founder_acknowledgement_required: enforcementType !== 'cooling_mode',
      confidence: 0.85,
      uncertainty_notes: 'Enforcement may require manual verification of system state'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create enforcement record:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    enforcementType: data.enforcement_type,
    triggerReason: data.trigger_reason,
    affectedSystems: data.affected_systems,
    previousState: data.previous_state,
    enforcedState: data.enforced_state,
    autoRecoveryEligible: data.auto_recovery_eligible,
    founderAcknowledgementRequired: data.founder_acknowledgement_required,
    acknowledgedBy: data.acknowledged_by,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
    resolvedAt: data.resolved_at
  };
}
