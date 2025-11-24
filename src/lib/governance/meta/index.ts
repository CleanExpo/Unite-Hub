import { getSupabaseServer } from '@/lib/supabase';

export interface GovernanceProfile {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  truthLayerStrictness: 'strict' | 'standard' | 'relaxed';
  evolutionAggressiveness: 'conservative' | 'moderate' | 'aggressive';
  automationLevel: 'minimal' | 'standard' | 'full';
  safetyThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceChangeLog {
  id: string;
  tenantId: string;
  changedBy: string;
  changeType: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  createdAt: string;
}

export async function getProfiles(tenantId: string): Promise<GovernanceProfile[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('governance_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get governance profiles:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    truthLayerStrictness: row.truth_layer_strictness,
    evolutionAggressiveness: row.evolution_aggressiveness,
    automationLevel: row.automation_level,
    safetyThreshold: row.safety_threshold,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function getActiveProfile(tenantId: string): Promise<GovernanceProfile | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('governance_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (error) {
    // Return default profile if none active
    return {
      id: '',
      tenantId,
      name: 'Default',
      truthLayerStrictness: 'standard',
      evolutionAggressiveness: 'moderate',
      automationLevel: 'standard',
      safetyThreshold: 0.8,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    description: data.description,
    truthLayerStrictness: data.truth_layer_strictness,
    evolutionAggressiveness: data.evolution_aggressiveness,
    automationLevel: data.automation_level,
    safetyThreshold: data.safety_threshold,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateSettings(
  tenantId: string,
  profileId: string,
  settings: Partial<GovernanceProfile>,
  changedBy: string,
  reason: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  // Enforce minimum safety threshold
  if (settings.safetyThreshold && settings.safetyThreshold < 0.5) {
    console.error('Safety threshold cannot be below 0.5');
    return false;
  }

  // Cannot disable truth layer completely
  if (settings.truthLayerStrictness === 'relaxed') {
    // Still allowed but logged
  }

  const { error } = await supabase
    .from('governance_profiles')
    .update({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);

  if (error) {
    console.error('Failed to update governance settings:', error);
    return false;
  }

  // Log the change
  await supabase
    .from('governance_change_logs')
    .insert({
      tenant_id: tenantId,
      changed_by: changedBy,
      change_type: 'settings_update',
      new_value: settings,
      reason
    });

  return true;
}

export async function getChangeLogs(tenantId: string): Promise<GovernanceChangeLog[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('governance_change_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to get change logs:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    changedBy: row.changed_by,
    changeType: row.change_type,
    previousValue: row.previous_value,
    newValue: row.new_value,
    reason: row.reason,
    createdAt: row.created_at
  }));
}
